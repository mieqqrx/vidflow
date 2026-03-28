using Microsoft.EntityFrameworkCore;
using Xabe.FFmpeg;
using Youtube.DTOs;
using Youtube.Models;
using Youtube.Models.Search;

namespace Youtube.Services
{
    public class VideoService : IVideoService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IS3Service _s3Service;
        private readonly IConfiguration _configuration;

        public VideoService(IServiceScopeFactory scopeFactory, IS3Service s3Service, IConfiguration configuration)
        {
            _scopeFactory = scopeFactory;
            _s3Service = s3Service;
            _configuration = configuration;

            FFmpeg.SetExecutablesPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ffmpeg"));
        }

        public async Task<IEnumerable<VideoResponseDto>> GetSubscriptionVideosAsync(Guid userId, int limit = 50)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var subscribedChannelIds = await context.Subscriptions
                .Where(s => s.UserId == userId)
                .Select(s => s.ChannelId)
                .ToListAsync();

            if (!subscribedChannelIds.Any())
                return new List<VideoResponseDto>();

            var videos = await context.Videos
                .Where(v => subscribedChannelIds.Contains(v.ChannelId)
                            && !v.IsShort
                            && v.Status == VideoStatus.Ready
                            && v.Visibility == VideoVisibility.Public)
                .OrderByDescending(v => v.CreatedAt)
                .Take(limit)
                .Select(v => new VideoResponseDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description,
                    VideoUrl = v.VideoUrl,
                    VideoUrl360p = v.VideoUrl360p,
                    VideoUrl720p = v.VideoUrl720p,
                    VideoUrl1080p = v.VideoUrl1080p,
                    ThumbnailUrl = v.ThumbnailUrl,
                    ViewsCount = v.ViewsCount,
                    LikesCount = v.LikesCount,
                    DislikesCount = v.DislikesCount,
                    DurationSeconds = v.DurationSeconds,
                    CreatedAt = v.CreatedAt,
                    IsAdminHidden = v.IsAdminHidden,
                    ChannelId = v.ChannelId,
                    CommentsCount = v.CommentsCount,
                    Visibility = v.Visibility,
                    ChannelName = v.Channel.Name,
                    ChannelAvatarUrl = v.Channel.Owner.AvatarUrl,
                    Tags = v.Tags,
                    Language = v.Language,
                    CategoryName = v.Category != null ? v.Category.Name : "Без категории",
                    IsLiked = v.Likes.Any(l => l.UserId == userId),
                    IsDisliked = v.Dislikes.Any(d => d.UserId == userId)
                })
                .ToListAsync();

            if (videos.Any())
            {
                var videoIds = videos.Select(v => v.Id).ToList();
                var watchHistories = await context.WatchHistories
                    .Where(wh => wh.UserId == userId && videoIds.Contains(wh.VideoId))
                    .ToDictionaryAsync(wh => wh.VideoId);

                foreach (var video in videos)
                {
                    if (watchHistories.TryGetValue(video.Id, out var wh))
                    {
                        video.LastPositionSeconds = wh.LastPositionSeconds;
                        video.WatchedPercent = wh.WatchedPercent;
                        video.IsCompleted = wh.IsCompleted;
                    }
                    else
                    {
                        video.LastPositionSeconds = 0;
                        video.WatchedPercent = 0;
                        video.IsCompleted = false;
                    }
                }
            }

            return videos;
        }

        public async Task<(bool Success, string Message, Guid? VideoId)> UploadVideoAsync(
            IFormFile file, string title, string description,
            Guid channelId, Guid? categoryId, bool ageRestriction,
            VideoVisibility visibility = VideoVisibility.Public,
            string? customThumbnailPath = null,
            bool isShort = false)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var channel = await context.Channels.FindAsync(channelId);
            if (channel == null)
                return (false, "Channel not found", null);

            var tempPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}");
            using (var stream = File.Create(tempPath))
                await file.CopyToAsync(stream);

            var video = new Video
            {
                Title = title,
                Description = description,
                ChannelId = channelId,
                CategoryId = categoryId,
                AgeRestriction = ageRestriction,
                Visibility = visibility,
                Status = VideoStatus.Processing,
                IsShort = isShort
            };

            context.Videos.Add(video);
            await context.SaveChangesAsync();

            _ = Task.Run(() => ProcessVideoAsync(video.Id, tempPath, customThumbnailPath, isShort));

            return (true, isShort ? "Short uploaded, processing started" : "Video uploaded, processing started", video.Id);
        }

        private async Task ProcessVideoAsync(Guid videoId, string tempPath, string? customThumbnailPath = null, bool isShort = false)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            try
            {
                if (isShort)
                {
                    var info = await FFmpeg.GetMediaInfo(tempPath);
                    if (info.Duration.TotalSeconds > 60)
                    {
                        var v = await context.Videos.FindAsync(videoId);
                        if (v != null) { v.Status = VideoStatus.Failed; await context.SaveChangesAsync(); }
                        Console.WriteLine("❌ Short exceeds 60 seconds");
                        return;
                    }
                    var vs = info.VideoStreams.FirstOrDefault();
                    if (vs != null && vs.Width > vs.Height)
                    {
                        var v = await context.Videos.FindAsync(videoId);
                        if (v != null) { v.Status = VideoStatus.Failed; await context.SaveChangesAsync(); }
                        Console.WriteLine("❌ Short must be vertical");
                        return;
                    }
                }

                string? thumbnailUrl;
                if (customThumbnailPath != null && File.Exists(customThumbnailPath))
                {
                    using var thumbStream = File.OpenRead(customThumbnailPath);
                    thumbnailUrl = await _s3Service.UploadFileAsync(
                        thumbStream, $"{videoId}/thumbnail.jpg", "thumbnails", "image/jpeg");
                }
                else
                {
                    thumbnailUrl = await GenerateThumbnailAsync(tempPath, videoId);
                }

                var mediaInfo = await FFmpeg.GetMediaInfo(tempPath);
                var durationSeconds = mediaInfo.Duration.TotalSeconds;

                var video = await context.Videos
                    .Include(v => v.Channel)
                    .ThenInclude(c => c.Owner)
                    .FirstOrDefaultAsync(v => v.Id == videoId);

                if (video == null) return;

                if (isShort)
                {
                    using var originalStream = File.OpenRead(tempPath);
                    var shortUrl = await _s3Service.UploadFileAsync(
                        originalStream, $"{videoId}/short.mp4", "videos", "video/mp4");

                    video.VideoUrl = shortUrl;
                    video.Resolutions = new[] { "original" };
                }
                else
                {
                    var outputDir = Path.Combine(Path.GetTempPath(), videoId.ToString());
                    Directory.CreateDirectory(outputDir);

                    using (var originalStream = File.OpenRead(tempPath))
                        await _s3Service.UploadFileAsync(originalStream, $"{videoId}/original.mp4", "videos", "video/mp4");

                    var resolutions = new[] { "360", "720", "1080" };
                    var processedResolutions = new List<string>();

                    foreach (var resolution in resolutions)
                    {
                        var outputPath = Path.Combine(outputDir, $"{resolution}p.m3u8");
                        var conversion = FFmpeg.Conversions.New();
                        conversion.AddParameter($"-i \"{tempPath}\"");
                        conversion.AddParameter($"-vf scale=-2:{resolution}");
                        conversion.AddParameter("-codec:v libx264 -codec:a aac -async 1");
                        conversion.AddParameter("-hls_time 6 -hls_playlist_type vod");
                        conversion.SetOutput(outputPath);
                        Console.WriteLine($"🎬 Starting FFmpeg for {resolution}p...");
                        await conversion.Start();

                        foreach (var segmentFile in Directory.GetFiles(outputDir, $"*{resolution}*"))
                        {
                            var fileName = $"{videoId}/{Path.GetFileName(segmentFile)}";
                            using var segmentStream = File.OpenRead(segmentFile);
                            var contentType = segmentFile.EndsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T";
                            await _s3Service.UploadFileAsync(segmentStream, fileName, "videos", contentType);
                        }
                        processedResolutions.Add($"{resolution}p");
                    }

                    var masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n" +
                        "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n" +
                        _s3Service.GetFileUrl($"{videoId}/360p.m3u8", "videos") + "\n" +
                        "#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n" +
                        _s3Service.GetFileUrl($"{videoId}/720p.m3u8", "videos") + "\n" +
                        "#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\n" +
                        _s3Service.GetFileUrl($"{videoId}/1080p.m3u8", "videos");

                    var masterPath = Path.Combine(outputDir, "master.m3u8");
                    await File.WriteAllTextAsync(masterPath, masterPlaylist);
                    using var masterStream = File.OpenRead(masterPath);
                    await _s3Service.UploadFileAsync(masterStream, $"{videoId}/master.m3u8", "videos", "application/x-mpegURL");

                    video.VideoUrl = _s3Service.GetFileUrl($"{videoId}/master.m3u8", "videos");
                    video.VideoUrl360p = _s3Service.GetFileUrl($"{videoId}/360p.m3u8", "videos");
                    video.VideoUrl720p = _s3Service.GetFileUrl($"{videoId}/720p.m3u8", "videos");
                    video.VideoUrl1080p = _s3Service.GetFileUrl($"{videoId}/1080p.m3u8", "videos");
                    video.Resolutions = processedResolutions.ToArray();

                    if (Directory.Exists(outputDir)) Directory.Delete(outputDir, true);
                }

                video.DurationSeconds = durationSeconds;
                video.Status = VideoStatus.Ready;
                video.ThumbnailUrl = thumbnailUrl;

                await context.SaveChangesAsync();

                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notificationService.NotifyNewVideoAsync(video, video.Channel);
                await notificationService.NotifyVideoReadyAsync(video.Channel.OwnerId, video);

                string? categoryName = null;
                if (video.CategoryId.HasValue)
                {
                    var category = await context.Categories.FindAsync(video.CategoryId.Value);
                    categoryName = category?.Name;
                }

                var esService = scope.ServiceProvider.GetRequiredService<IElasticsearchService>();
                await esService.IndexVideoAsync(BuildVideoDocument(video, video.Channel.Name, categoryName));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Video processing failed: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                var video = await context.Videos.FindAsync(videoId);
                if (video != null) { video.Status = VideoStatus.Failed; await context.SaveChangesAsync(); }
            }
            finally
            {
                if (File.Exists(tempPath)) File.Delete(tempPath);
                if (customThumbnailPath != null && File.Exists(customThumbnailPath))
                    File.Delete(customThumbnailPath);
            }
        }

        private async Task<string?> GenerateThumbnailAsync(string videoPath, Guid videoId)
        {
            try
            {
                var mediaInfo = await FFmpeg.GetMediaInfo(videoPath);
                var middlePoint = TimeSpan.FromSeconds(mediaInfo.Duration.TotalSeconds / 2);
                var thumbnailPath = Path.Combine(Path.GetTempPath(), $"{videoId}_thumbnail.jpg");

                await FFmpeg.Conversions.New()
                    .AddParameter($"-i \"{videoPath}\"")
                    .AddParameter($"-ss {middlePoint}")
                    .AddParameter("-vframes 1")
                    .AddParameter("-q:v 2")
                    .SetOutput(thumbnailPath)
                    .Start();

                using var stream = File.OpenRead(thumbnailPath);
                var url = await _s3Service.UploadFileAsync(
                    stream, $"{videoId}/thumbnail.jpg", "thumbnails", "image/jpeg");

                if (File.Exists(thumbnailPath)) File.Delete(thumbnailPath);
                return url;
            }
            catch
            {
                return null;
            }
        }

        public async Task<(bool Success, string Message)> UpdateVideoAsync(
            Guid videoId, Guid userId, UpdateVideoDto dto)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var video = await context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.Owner)
                .Include(v => v.Category)
                .FirstOrDefaultAsync(v => v.Id == videoId);

            if (video == null)
                return (false, "Video not found");

            if (video.Channel.OwnerId != userId)
                return (false, "You don't have permission to edit this video");

            if (dto.Title != null) video.Title = dto.Title;
            if (dto.Description != null) video.Description = dto.Description;
            if (dto.CategoryId.HasValue) video.CategoryId = dto.CategoryId;
            if (dto.AgeRestriction.HasValue) video.AgeRestriction = dto.AgeRestriction.Value;
            if (dto.Visibility.HasValue)
            {
                if (video.IsAdminHidden && dto.Visibility.Value == VideoVisibility.Public)
                    return (false, "This video has been hidden by an administrator and cannot be made public");

                video.Visibility = dto.Visibility.Value;
            }
            if (dto.Tags != null) video.Tags = dto.Tags;
            if (dto.Language != null) video.Language = dto.Language;

            if (dto.CustomThumbnail != null)
            {
                try { await _s3Service.DeleteFileAsync($"{videoId}/thumbnail.jpg", "thumbnails"); } catch { }

                using var stream = dto.CustomThumbnail.OpenReadStream();
                var uniqueFileName = $"thumbnail_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}.jpg";
                video.ThumbnailUrl = await _s3Service.UploadFileAsync(
                    stream, $"{videoId}/{uniqueFileName}", "thumbnails", "image/jpeg");
            }

            await context.SaveChangesAsync();

            if (video.Status == VideoStatus.Ready)
            {
                string? categoryName = video.Category?.Name;
                if (dto.CategoryId.HasValue && dto.CategoryId != video.CategoryId)
                {
                    var newCategory = await context.Categories.FindAsync(dto.CategoryId.Value);
                    categoryName = newCategory?.Name;
                }

                var esService = scope.ServiceProvider.GetRequiredService<IElasticsearchService>();
                await esService.UpdateVideoAsync(BuildVideoDocument(video, video.Channel.Name, categoryName));
            }

            return (true, "Video updated successfully");
        }

        public async Task<(bool Success, string Message)> TrimVideoAsync(
            Guid videoId, Guid userId, TrimVideoDto dto)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var video = await context.Videos
                .Include(v => v.Channel)
                .FirstOrDefaultAsync(v => v.Id == videoId);

            if (video == null)
                return (false, "Video not found");

            if (video.Channel.OwnerId != userId)
                return (false, "You don't have permission to edit this video");

            if (dto.StartSeconds >= dto.EndSeconds)
                return (false, "Start must be less than End");

            if (dto.EndSeconds > video.DurationSeconds)
                return (false, $"End exceeds video duration ({video.DurationSeconds}s)");

            video.Status = VideoStatus.Processing;
            await context.SaveChangesAsync();

            _ = Task.Run(() => ProcessTrimAsync(videoId, dto.StartSeconds, dto.EndSeconds));

            return (true, "Trim started");
        }

        private async Task ProcessTrimAsync(Guid videoId, double startSeconds, double endSeconds)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var tempOriginal = Path.Combine(Path.GetTempPath(), $"{videoId}_original.mp4");
            var tempTrimmed = Path.Combine(Path.GetTempPath(), $"{videoId}_trimmed.mp4");
            var outputDir = Path.Combine(Path.GetTempPath(), $"{videoId}_trim");

            try
            {
                await _s3Service.DownloadFileAsync($"{videoId}/original.mp4", "videos", tempOriginal);

                var duration = endSeconds - startSeconds;

                var trimConversion = FFmpeg.Conversions.New();
                trimConversion.AddParameter($"-ss {startSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture)}");
                trimConversion.AddParameter($"-i \"{tempOriginal}\"");
                trimConversion.AddParameter($"-t {duration.ToString(System.Globalization.CultureInfo.InvariantCulture)}");
                trimConversion.AddParameter("-c copy");
                trimConversion.SetOutput(tempTrimmed);
                await trimConversion.Start();

                var oldFiles = await _s3Service.ListFilesAsync($"{videoId}/", "videos");
                foreach (var file in oldFiles)
                    if (!file.EndsWith("original.mp4"))
                        try { await _s3Service.DeleteFileAsync(file, "videos"); } catch { }

                using (var newOriginalStream = File.OpenRead(tempTrimmed))
                {
                    await _s3Service.UploadFileAsync(
                        newOriginalStream, $"{videoId}/original.mp4", "videos", "video/mp4");
                }

                Directory.CreateDirectory(outputDir);
                var resolutions = new[] { "360", "720", "1080" };
                var processedResolutions = new List<string>();

                foreach (var resolution in resolutions)
                {
                    var outputPath = Path.Combine(outputDir, $"{resolution}p.m3u8");

                    var conversion = FFmpeg.Conversions.New();
                    conversion.AddParameter($"-i \"{tempTrimmed}\"");
                    conversion.AddParameter($"-vf scale=-2:{resolution}");
                    conversion.AddParameter("-codec:v libx264 -codec:a aac");
                    conversion.AddParameter("-hls_time 6 -hls_playlist_type vod");
                    conversion.SetOutput(outputPath);
                    await conversion.Start();

                    foreach (var segmentFile in Directory.GetFiles(outputDir, $"*{resolution}*"))
                    {
                        var fileName = $"{videoId}/{Path.GetFileName(segmentFile)}";
                        using var segmentStream = File.OpenRead(segmentFile);
                        var contentType = segmentFile.EndsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T";
                        await _s3Service.UploadFileAsync(segmentStream, fileName, "videos", contentType);
                    }

                    processedResolutions.Add($"{resolution}p");
                }

                var masterPlaylist = "#EXTM3U\n" +
                    "#EXT-X-VERSION:3\n" +
                    "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n" +
                    _s3Service.GetFileUrl($"{videoId}/360p.m3u8", "videos") + "\n" +
                    "#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n" +
                    _s3Service.GetFileUrl($"{videoId}/720p.m3u8", "videos") + "\n" +
                    "#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\n" +
                    _s3Service.GetFileUrl($"{videoId}/1080p.m3u8", "videos");

                var masterPath = Path.Combine(outputDir, "master.m3u8");
                await File.WriteAllTextAsync(masterPath, masterPlaylist);
                using var masterStream = File.OpenRead(masterPath);
                await _s3Service.UploadFileAsync(masterStream, $"{videoId}/master.m3u8", "videos", "application/x-mpegURL");

                var mediaInfo = await FFmpeg.GetMediaInfo(tempTrimmed);

                var video = await context.Videos
                    .Include(v => v.Channel)
                        .ThenInclude(c => c.Owner)
                    .Include(v => v.Category)
                    .FirstOrDefaultAsync(v => v.Id == videoId);

                if (video != null)
                {
                    video.VideoUrl = _s3Service.GetFileUrl($"{videoId}/master.m3u8", "videos");
                    video.VideoUrl360p = _s3Service.GetFileUrl($"{videoId}/360p.m3u8", "videos");
                    video.VideoUrl720p = _s3Service.GetFileUrl($"{videoId}/720p.m3u8", "videos");
                    video.VideoUrl1080p = _s3Service.GetFileUrl($"{videoId}/1080p.m3u8", "videos");
                    video.DurationSeconds = mediaInfo.Duration.TotalSeconds;
                    video.Resolutions = processedResolutions.ToArray();
                    video.Status = VideoStatus.Ready;

                    await context.SaveChangesAsync();

                    var esService = scope.ServiceProvider.GetRequiredService<IElasticsearchService>();
                    await esService.UpdateVideoAsync(BuildVideoDocument(video, video.Channel.Name, video.Category?.Name));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Trim failed: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");

                var video = await context.Videos.FindAsync(videoId);
                if (video != null)
                {
                    video.Status = VideoStatus.Failed;
                    await context.SaveChangesAsync();
                }
            }
            finally
            {
                if (File.Exists(tempOriginal)) File.Delete(tempOriginal);
                if (File.Exists(tempTrimmed)) File.Delete(tempTrimmed);
                if (Directory.Exists(outputDir)) Directory.Delete(outputDir, true);
            }
        }

        public async Task<(bool Success, string Message)> DeleteVideoAsync(Guid videoId, Guid userId)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var video = await context.Videos
                .Include(v => v.Channel)
                .FirstOrDefaultAsync(v => v.Id == videoId);

            if (video == null)
                return (false, "Video not found");

            if (video.Channel.OwnerId != userId)
                return (false, "You don't have permission to delete this video");

            try
            {
                var segments = await _s3Service.ListFilesAsync($"{videoId}/", "videos");
                foreach (var segment in segments)
                    try { await _s3Service.DeleteFileAsync(segment, "videos"); } catch { }
            }
            catch { }

            try { await _s3Service.DeleteFileAsync($"{videoId}/thumbnail.jpg", "thumbnails"); } catch { }

            try
            {
                var esService = scope.ServiceProvider.GetRequiredService<IElasticsearchService>();
                await esService.DeleteVideoAsync(videoId);
            }
            catch { }

            context.Videos.Remove(video);
            await context.SaveChangesAsync();

            return (true, "Video deleted successfully");
        }

        private static VideoDocument BuildVideoDocument(Video video, string channelName, string? categoryName) =>
            new VideoDocument
            {
                Id = video.Id,
                Title = video.Title,
                Description = video.Description,
                Tags = video.Tags ?? Array.Empty<string>(),
                CategoryName = categoryName,
                Language = video.Language,
                ChannelName = channelName,
                ChannelAvatarUrl = video.Channel?.Owner.AvatarUrl,
                ChannelId = video.ChannelId,
                ThumbnailUrl = video.ThumbnailUrl,
                DurationSeconds = video.DurationSeconds,
                ViewsCount = video.ViewsCount,
                LikesCount = video.LikesCount,
                VideoUrl = video.VideoUrl,
                CommentsCount = video.CommentsCount,
                Visibility = (int)video.Visibility,
                AgeRestriction = video.AgeRestriction,
                IsShort = video.IsShort,
                CreatedAt = video.CreatedAt
            };

        public async Task<VideoResponseDto?> GetVideoByIdAsync(Guid id, Guid? userId = null)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var video = await context.Videos
                .Where(v => v.Id == id && v.Status == VideoStatus.Ready)
                .Select(v => new VideoResponseDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description,
                    VideoUrl = v.VideoUrl,
                    VideoUrl360p = v.VideoUrl360p,
                    VideoUrl720p = v.VideoUrl720p,
                    VideoUrl1080p = v.VideoUrl1080p,
                    ThumbnailUrl = v.ThumbnailUrl,
                    ViewsCount = v.ViewsCount,
                    LikesCount = v.LikesCount,
                    DislikesCount = v.DislikesCount,
                    CommentsCount = v.CommentsCount,
                    DurationSeconds = v.DurationSeconds,
                    IsAdminHidden = v.IsAdminHidden,
                    CreatedAt = v.CreatedAt,
                    ChannelId = v.ChannelId,
                    ChannelName = v.Channel.Name,
                    ChannelAvatarUrl = v.Channel.Owner.AvatarUrl,
                    CategoryName = v.Category != null ? v.Category.Name : "Без категории",
                    Tags = v.Tags,
                    Language = v.Language,
                    Visibility = v.Visibility,
                    IsLiked = userId != null ? v.Likes.Any(l => l.UserId == userId) : (bool?)null,
                    IsDisliked = userId != null ? v.Dislikes.Any(d => d.UserId == userId) : (bool?)null
                })
                .FirstOrDefaultAsync();

            if (video == null) return null;

            if (userId.HasValue)
            {
                var watchHistory = await context.WatchHistories
                    .FirstOrDefaultAsync(wh => wh.UserId == userId && wh.VideoId == id);

                video.LastPositionSeconds = watchHistory?.LastPositionSeconds ?? 0;
                video.WatchedPercent = watchHistory?.WatchedPercent ?? 0;
                video.IsCompleted = watchHistory?.IsCompleted ?? false;
            }

            return video;
        }

        public async Task<IEnumerable<VideoResponseDto>> GetVideosByChannelAsync(Guid channelId, Guid? userId = null)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var videos = await context.Videos
                .Where(v => v.ChannelId == channelId && !v.IsShort && v.Status == VideoStatus.Ready &&
                    (v.Visibility == VideoVisibility.Public ||
                     v.Visibility == VideoVisibility.Unlisted ||
                     (v.Visibility == VideoVisibility.Private && v.Channel.OwnerId == userId)))
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new VideoResponseDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description,
                    VideoUrl = v.VideoUrl,
                    VideoUrl360p = v.VideoUrl360p,
                    VideoUrl720p = v.VideoUrl720p,
                    VideoUrl1080p = v.VideoUrl1080p,
                    ThumbnailUrl = v.ThumbnailUrl,
                    ViewsCount = v.ViewsCount,
                    LikesCount = v.LikesCount,
                    DislikesCount = v.DislikesCount,
                    DurationSeconds = v.DurationSeconds,
                    CreatedAt = v.CreatedAt,
                    IsAdminHidden = v.IsAdminHidden,
                    ChannelId = v.ChannelId,
                    CommentsCount = v.CommentsCount,
                    Visibility = v.Visibility,
                    ChannelName = v.Channel.Name,
                    ChannelAvatarUrl = v.Channel.Owner.AvatarUrl,
                    Tags = v.Tags,
                    Language = v.Language,
                    CategoryName = v.Category != null ? v.Category.Name : "Без категории",
                    IsLiked = userId != null ? v.Likes.Any(l => l.UserId == userId) : (bool?)null,
                    IsDisliked = userId != null ? v.Dislikes.Any(d => d.UserId == userId) : (bool?)null
                })
                .ToListAsync();

            if (userId.HasValue && videos.Any())
            {
                var videoIds = videos.Select(v => v.Id).ToList();
                var watchHistories = await context.WatchHistories
                    .Where(wh => wh.UserId == userId && videoIds.Contains(wh.VideoId))
                    .ToDictionaryAsync(wh => wh.VideoId);

                foreach (var video in videos)
                {
                    if (watchHistories.TryGetValue(video.Id, out var wh))
                    {
                        video.LastPositionSeconds = wh.LastPositionSeconds;
                        video.WatchedPercent = wh.WatchedPercent;
                        video.IsCompleted = wh.IsCompleted;
                    }
                    else
                    {
                        video.LastPositionSeconds = 0;
                        video.WatchedPercent = 0;
                        video.IsCompleted = false;
                    }
                }
            }

            return videos;
        }

        public async Task<IEnumerable<Category>> GetCategoriesAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            return await context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<VideoResponseDto>> GetShortsAsync(int page = 1, int pageSize = 10)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            return await context.Videos
                .Where(v => v.IsShort && v.Status == VideoStatus.Ready && v.Visibility == VideoVisibility.Public)
                .OrderByDescending(v => v.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(v => new VideoResponseDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    VideoUrl = v.VideoUrl,
                    ThumbnailUrl = v.ThumbnailUrl,
                    ViewsCount = v.ViewsCount,
                    LikesCount = v.LikesCount,
                    DislikesCount = v.DislikesCount,
                    IsAdminHidden = v.IsAdminHidden,
                    CommentsCount = v.CommentsCount,
                    DurationSeconds = v.DurationSeconds,
                    CreatedAt = v.CreatedAt,
                    ChannelId = v.ChannelId,
                    ChannelName = v.Channel.Name,
                    ChannelAvatarUrl = v.Channel.Owner.AvatarUrl,
                    IsShort = true
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<VideoResponseDto>> GetChannelShortsAsync(Guid channelId, Guid? userId = null)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            return await context.Videos
                .Where(v => v.ChannelId == channelId && v.IsShort && v.Status == VideoStatus.Ready &&
                    (v.Visibility == VideoVisibility.Public ||
                     v.Visibility == VideoVisibility.Unlisted ||
                     (v.Visibility == VideoVisibility.Private && v.Channel.OwnerId == userId)))
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new VideoResponseDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    VideoUrl = v.VideoUrl,
                    ThumbnailUrl = v.ThumbnailUrl,
                    ViewsCount = v.ViewsCount,
                    LikesCount = v.LikesCount,
                    DislikesCount = v.DislikesCount,
                    CommentsCount = v.CommentsCount,
                    IsAdminHidden = v.IsAdminHidden,
                    DurationSeconds = v.DurationSeconds,
                    CreatedAt = v.CreatedAt,
                    ChannelId = v.ChannelId,
                    ChannelName = v.Channel.Name,
                    ChannelAvatarUrl = v.Channel.Owner.AvatarUrl,
                    IsShort = true
                })
                .ToListAsync();
        }

        public async Task<(bool Success, string Message)> AdminSetVisibilityAsync(Guid videoId, VideoVisibility visibility)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var video = await context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.Owner)
                .Include(v => v.Category)
                .FirstOrDefaultAsync(v => v.Id == videoId);

            if (video == null) return (false, "Video not found");

            video.IsAdminHidden = visibility == VideoVisibility.Private;
            video.Visibility = visibility;

            await context.SaveChangesAsync();

            var esService = scope.ServiceProvider.GetRequiredService<IElasticsearchService>();
            await esService.UpdateVideoAsync(BuildVideoDocument(video, video.Channel.Name, video.Category?.Name));

            return (true, $"Video visibility set to {visibility}");
        }
    }
}