using Microsoft.EntityFrameworkCore;
using Youtube.DTOs;
using Youtube.Models;

namespace Youtube.Services
{
    public class LiveStreamService : ILiveStreamService
    {
        private readonly AppDbContext _context;
        private readonly IS3Service _s3Service;
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;
        private readonly IServiceScopeFactory _scopeFactory;

        public LiveStreamService(
            AppDbContext context,IS3Service s3Service,
            INotificationService notificationService,IConfiguration configuration, IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _s3Service = s3Service;
            _notificationService = notificationService;
            _configuration = configuration;
            _scopeFactory = scopeFactory;
        }

        public async Task<(bool Success, string Message, LiveStreamResponseDto? Stream)> CreateStreamAsync(
            Guid userId, CreateLiveStreamDto dto)
        {
            var channel = await _context.Channels
                .Include(c => c.Owner)
                .FirstOrDefaultAsync(c => c.OwnerId == userId);

            if (channel == null)
                return (false, "You don't have a channel", null);

            var activeStream = await _context.LiveStreams
                .AnyAsync(s => s.ChannelId == channel.Id &&
                    (s.Status == LiveStreamStatus.Live || s.Status == LiveStreamStatus.Scheduled));

            if (activeStream)
                return (false, "You already have an active stream", null);

            var stream = new LiveStream
            {
                Title = dto.Title,
                Description = dto.Description,
                StreamKey = GenerateStreamKey(channel.Id),
                Status = LiveStreamStatus.Scheduled,
                SaveRecording = dto.SaveRecording,
                ChatEnabled = dto.ChatEnabled,
                ChannelId = channel.Id
            };

            _context.LiveStreams.Add(stream);
            await _context.SaveChangesAsync();

            return (true, "Stream created", MapToDto(stream, channel));
        }

        public async Task<(bool Success, string Message)> UpdateStreamAsync(
            Guid streamId, Guid userId, UpdateLiveStreamDto dto)
        {
            var stream = await _context.LiveStreams
                .Include(s => s.Channel)
                .FirstOrDefaultAsync(s => s.Id == streamId && s.Channel.OwnerId == userId);

            if (stream == null)
                return (false, "Stream not found");

            if (stream.Status == LiveStreamStatus.Ended)
                return (false, "Cannot edit ended stream");

            if (dto.Title != null) stream.Title = dto.Title;
            if (dto.Description != null) stream.Description = dto.Description;

            await _context.SaveChangesAsync();
            return (true, "Stream updated");
        }

        public async Task<(bool Success, string Message)> DeleteStreamAsync(Guid streamId, Guid userId)
        {
            var stream = await _context.LiveStreams
                .Include(s => s.Channel)
                .FirstOrDefaultAsync(s => s.Id == streamId && s.Channel.OwnerId == userId);

            if (stream == null)
                return (false, "Stream not found");

            if (stream.Status == LiveStreamStatus.Live)
                return (false, "Cannot delete active stream");

            if (!string.IsNullOrEmpty(stream.RecordingUrl))
                try { await _s3Service.DeleteFileAsync($"{streamId}/recording.mp4", "streams"); } catch { }

            if (!string.IsNullOrEmpty(stream.ThumbnailUrl))
                try { await _s3Service.DeleteFileAsync($"{streamId}/thumbnail.jpg", "streams"); } catch { }

            _context.LiveStreams.Remove(stream);
            await _context.SaveChangesAsync();
            return (true, "Stream deleted");
        }

        public async Task<LiveStreamResponseDto?> GetStreamByIdAsync(Guid streamId)
        {
            var stream = await _context.LiveStreams
                .Include(s => s.Channel)
                    .ThenInclude(c => c.Owner)
                .FirstOrDefaultAsync(s => s.Id == streamId);

            return stream == null ? null : MapToDto(stream, stream.Channel);
        }

        public async Task<LiveStreamResponseDto?> GetStreamByKeyAsync(string streamKey)
        {
            var stream = await _context.LiveStreams
                .Include(s => s.Channel)
                    .ThenInclude(c => c.Owner)
                .FirstOrDefaultAsync(s => s.StreamKey == streamKey);

            return stream == null ? null : MapToDto(stream, stream.Channel);
        }

        public async Task<IEnumerable<LiveStreamResponseDto>> GetLiveStreamsAsync()
        {
            var streams = await _context.LiveStreams
                .Include(s => s.Channel)
                    .ThenInclude(c => c.Owner)
                .Where(s => s.Status == LiveStreamStatus.Live)
                .OrderByDescending(s => s.ViewersCount)
                .ToListAsync();

            return streams.Select(s => MapToDto(s, s.Channel));
        }

        public async Task<IEnumerable<LiveStreamResponseDto>> GetChannelStreamsAsync(Guid channelId)
        {
            var streams = await _context.LiveStreams
                .Include(s => s.Channel)
                    .ThenInclude(c => c.Owner)
                .Where(s => s.ChannelId == channelId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return streams.Select(s => MapToDto(s, s.Channel));
        }

        public async Task<bool> OnPublishAsync(string streamKey)
        {
            var stream = await _context.LiveStreams
                .Include(s => s.Channel)
                    .ThenInclude(c => c.Owner)
                .FirstOrDefaultAsync(s => s.StreamKey == streamKey &&
                    (s.Status == LiveStreamStatus.Scheduled ||
                     s.Status == LiveStreamStatus.Live));

            if (stream == null) return false;

            var isReconnect = stream.Status == LiveStreamStatus.Live;

            var nginxUrl = _configuration["NginxRtmp:InternalUrl"];
            stream.Status = LiveStreamStatus.Live;
            stream.StartedAt = isReconnect ? stream.StartedAt : DateTime.UtcNow;

            stream.PlaybackUrl = $"http://26.192.139.137:8080/hls/{streamKey}.m3u8";

            await _context.SaveChangesAsync();

            if (!isReconnect)
                await _notificationService.NotifyLiveStreamStartedAsync(stream.Channel, stream);

            return true;
        }

        public async Task OnPublishDoneAsync(string streamKey)
        {
            var stream = await _context.LiveStreams
                .FirstOrDefaultAsync(s => s.StreamKey == streamKey &&
                    s.Status == LiveStreamStatus.Live);

            if (stream == null) return;

            stream.Status = LiveStreamStatus.Ended;
            stream.EndedAt = DateTime.UtcNow;
            stream.ViewersCount = 0;

            await _context.SaveChangesAsync();
        }

        public async Task OnRecordDoneAsync(string streamKey, string filePath)
        {
            var stream = await _context.LiveStreams
                .Include(s => s.Channel)
                .FirstOrDefaultAsync(s => s.StreamKey == streamKey);

            if (stream == null || !stream.SaveRecording) return;

            _ = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<ILiveStreamService>();
                await service.ProcessRecordingAsync(stream.Id, filePath);
            });
        }

        private async Task ProcessRecordingAsync(Guid streamId, string flvPath)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var s3 = scope.ServiceProvider.GetRequiredService<IS3Service>();

                var stream = await context.LiveStreams
                    .Include(s => s.Channel)
                        .ThenInclude(c => c.Owner)
                    .FirstOrDefaultAsync(s => s.Id == streamId);

                if (stream == null) return;

                var mp4Path = flvPath.Replace(".flv", ".mp4");

                var conversion = Xabe.FFmpeg.FFmpeg.Conversions.New();
                conversion.AddParameter($"-i \"{flvPath}\"");
                conversion.AddParameter("-c copy");
                conversion.AddParameter("-movflags +faststart");
                conversion.SetOutput(mp4Path);
                await conversion.Start();

                if (string.IsNullOrEmpty(stream.ThumbnailUrl))
                {
                    var thumbnailUrl = await GenerateStreamThumbnailAsync(mp4Path, streamId, s3);
                    if (thumbnailUrl != null)
                        stream.ThumbnailUrl = thumbnailUrl;
                }

                var recordingKey = $"{streamId}/recording.mp4";
                using var mp4Stream = File.OpenRead(mp4Path);
                var recordingUrl = await s3.UploadFileAsync(
                    mp4Stream, recordingKey, "streams", "video/mp4");

                stream.RecordingUrl = recordingUrl;
                await context.SaveChangesAsync();

                if (File.Exists(flvPath)) File.Delete(flvPath);
                if (File.Exists(mp4Path)) File.Delete(mp4Path);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Recording processing failed: {ex.Message}");
            }
        }

        private async Task<string?> GenerateStreamThumbnailAsync(string videoPath, Guid streamId, IS3Service s3)
        {
            try
            {
                var thumbnailPath = Path.Combine(Path.GetTempPath(), $"{streamId}_thumbnail.jpg");

                await Xabe.FFmpeg.FFmpeg.Conversions.New()
                    .AddParameter($"-i \"{videoPath}\"")
                    .AddParameter("-ss 00:00:02")
                    .AddParameter("-vframes 1")
                    .AddParameter("-q:v 2")
                    .SetOutput(thumbnailPath)
                    .Start();

                using var stream = File.OpenRead(thumbnailPath);
                var url = await s3.UploadFileAsync(
                    stream, $"{streamId}/thumbnail.jpg", "streams", "image/jpeg");

                if (File.Exists(thumbnailPath)) File.Delete(thumbnailPath);
                return url;
            }
            catch
            {
                return null;
            }
        }

        public async Task<int> IncrementViewersAsync(Guid streamId)
        {
            var stream = await _context.LiveStreams.FindAsync(streamId);
            if (stream == null) return 0;

            stream.ViewersCount++;
            stream.TotalViewsCount++;

            if (stream.ViewersCount > stream.PeakViewersCount)
                stream.PeakViewersCount = stream.ViewersCount;

            await _context.SaveChangesAsync();
            return stream.ViewersCount;
        }

        public async Task<int> DecrementViewersAsync(Guid streamId)
        {
            var stream = await _context.LiveStreams.FindAsync(streamId);
            if (stream == null) return 0;

            stream.ViewersCount = Math.Max(0, stream.ViewersCount - 1);
            await _context.SaveChangesAsync();
            return stream.ViewersCount;
        }

        private static string GenerateStreamKey(Guid channelId)
        {
            var random = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                .Replace("/", "")
                .Replace("+", "")
                .Replace("=", "")
                .Substring(0, 8);

            return $"{channelId.ToString("N").Substring(0, 8)}-{random}";
        }

        public async Task<(bool Success, string Message)> UpdateThumbnailAsync(Guid streamId, Guid userId, IFormFile thumbnail)
        {
            var stream = await _context.LiveStreams
                .Include(s => s.Channel)
                .FirstOrDefaultAsync(s => s.Id == streamId && s.Channel.OwnerId == userId);

            if (stream == null)
                return (false, "Stream not found");

            try { await _s3Service.DeleteFileAsync($"{streamId}/thumbnail.jpg", "streams"); } catch { }

            using var fileStream = thumbnail.OpenReadStream();
            stream.ThumbnailUrl = await _s3Service.UploadFileAsync(
                fileStream, $"{streamId}/thumbnail.jpg", "streams", "image/jpeg");

            await _context.SaveChangesAsync();
            return (true, "Thumbnail updated");
        }

        private static LiveStreamResponseDto MapToDto(LiveStream stream, Channel channel) => new()
        {
            Id = stream.Id,
            Title = stream.Title,
            Description = stream.Description,
            ThumbnailUrl = stream.ThumbnailUrl,
            StreamKey = stream.StreamKey,
            Status = stream.Status,
            PlaybackUrl = stream.PlaybackUrl,
            RecordingUrl = stream.RecordingUrl,
            ViewersCount = stream.ViewersCount,
            PeakViewersCount = stream.PeakViewersCount,
            TotalViewsCount = stream.TotalViewsCount,
            StartedAt = stream.StartedAt,
            EndedAt = stream.EndedAt,
            CreatedAt = stream.CreatedAt,
            SaveRecording = stream.SaveRecording,
            ChatEnabled = stream.ChatEnabled,
            ChannelId = stream.ChannelId,
            ChannelName = channel.Name,
            ChannelAvatarUrl = channel.Owner?.AvatarUrl,
            VideoId = stream.VideoId
        };

        Task ILiveStreamService.ProcessRecordingAsync(Guid streamId, string filePath)
        {
            return ProcessRecordingAsync(streamId, filePath);
        }
    }
}