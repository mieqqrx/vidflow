using Microsoft.EntityFrameworkCore;
using Youtube.DTOs;
using Youtube.Models;
using Youtube.Models.Search;

namespace Youtube.Services
{
    public class ChannelService : IChannelService
    {
        private readonly AppDbContext _context;
        private readonly IS3Service _s3Service;
        private readonly IElasticsearchService _esService;

        public ChannelService(AppDbContext context, IS3Service s3Service, IElasticsearchService esService)
        {
            _context = context;
            _s3Service = s3Service;
            _esService = esService;
        }

        public async Task<(bool Success, string Message)> CreateChannelAsync(CreateChannelDto dto, Guid userId)
        {
            bool hasChannel = await _context.Channels.AnyAsync(c => c.OwnerId == userId);
            if (hasChannel)
                return (false, "You already have a channel");

            var user = await _context.Users.FindAsync(userId);

            var channel = new Channel
            {
                Name = dto.Name,
                Description = dto.Description,
                BannerUrl = dto.BannerUrl,
                OwnerId = userId
            };

            _context.Channels.Add(channel);
            await _context.SaveChangesAsync();

            await _esService.IndexChannelAsync(new ChannelDocument
            {
                Id = channel.Id,
                Name = channel.Name,
                Description = channel.Description,
                BannerUrl = channel.BannerUrl,
                OwnerAvatarUrl = user?.AvatarUrl,
                SubscribersCount = 0,
                VideosCount = 0,
                CreatedAt = channel.CreatedAt
            });

            return (true, "Channel created successfully");
        }

        public async Task<ChannelResponseDto?> GetChannelByIdAsync(Guid id)
        {
            var channel = await _context.Channels
                .Include(c => c.Owner)
                .Include(c => c.FeaturedVideo)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (channel == null) return null;
            return MapToDto(channel);
        }

        public async Task<ChannelResponseDto?> GetChannelByUserIdAsync(Guid userId)
        {
            var channel = await _context.Channels
                .Include(c => c.Owner)
                .Include(c => c.FeaturedVideo)
                .FirstOrDefaultAsync(c => c.OwnerId == userId);

            if (channel == null) return null;
            return MapToDto(channel);
        }

        private ChannelResponseDto MapToDto(Channel channel) => new()
        {
            Id = channel.Id,
            Name = channel.Name,
            Description = channel.Description,
            BannerUrl = channel.BannerUrl,
            SubscribersCount = channel.SubscribersCount,
            OwnerId = channel.OwnerId,
            OwnerUsername = channel.Owner.Username,
            CreatedAt = channel.CreatedAt,
            OwnerAvatarUrl = channel.Owner.AvatarUrl,
            FeaturedVideoId = channel.FeaturedVideoId,
            FeaturedVideo = channel.FeaturedVideo != null ? new VideoResponseDto
            {
                Id = channel.FeaturedVideo.Id,
                Title = channel.FeaturedVideo.Title,
                ThumbnailUrl = channel.FeaturedVideo.ThumbnailUrl,
                VideoUrl = channel.FeaturedVideo.VideoUrl,
                DurationSeconds = channel.FeaturedVideo.DurationSeconds,
                ViewsCount = channel.FeaturedVideo.ViewsCount,
                CreatedAt = channel.FeaturedVideo.CreatedAt,
            } : null
        };

        public async Task<(bool Success, string Message)> DeleteChannelAsync(Guid channelId, Guid userId)
        {
            var channel = await _context.Channels
                .Include(c => c.Videos)
                .FirstOrDefaultAsync(c => c.Id == channelId && c.OwnerId == userId);

            if (channel == null)
                return (false, "Channel not found");

            foreach (var video in channel.Videos)
            {
                try
                {
                    var files = await _s3Service.ListFilesAsync($"{video.Id}/", "videos");
                    foreach (var file in files)
                        try { await _s3Service.DeleteFileAsync(file, "videos"); } catch { }

                    try { await _s3Service.DeleteFileAsync($"{video.Id}/thumbnail.jpg", "thumbnails"); }
                    catch { }
                }
                catch { }
            }

            _context.Channels.Remove(channel);
            await _context.SaveChangesAsync();

            try { await _esService.DeleteChannelAsync(channelId); } catch { }

            return (true, "Channel deleted");
        }

        public async Task<(bool Success, string Message)> SetFeaturedVideoAsync(
            Guid channelId, Guid userId, Guid? videoId)
        {
            var channel = await _context.Channels
                .FirstOrDefaultAsync(c => c.Id == channelId && c.OwnerId == userId);

            if (channel == null)
                return (false, "Channel not found");

            if (videoId.HasValue)
            {
                var video = await _context.Videos
                    .FirstOrDefaultAsync(v => v.Id == videoId && v.ChannelId == channelId);

                if (video == null)
                    return (false, "Video not found or doesn't belong to this channel");

                if (video.Status != VideoStatus.Ready)
                    return (false, "Video is not ready yet");
            }

            channel.FeaturedVideoId = videoId;
            await _context.SaveChangesAsync();

            return (true, videoId.HasValue ? "Featured video set" : "Featured video removed");
        }

        public async Task<(bool Success, string Message)> UpdateChannelAsync(
            Guid channelId, Guid userId, UpdateChannelDto dto)
        {
            var channel = await _context.Channels
                .FirstOrDefaultAsync(c => c.Id == channelId && c.OwnerId == userId);

            if (channel == null)
                return (false, "Channel not found");

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };

            if (dto.Name != null) channel.Name = dto.Name;
            if (dto.Description != null) channel.Description = dto.Description;

            if (dto.RemoveBanner && !string.IsNullOrEmpty(channel.BannerUrl))
            {
                try { await _s3Service.DeleteFileAsync($"{channelId}/banner.jpg", "channels"); } catch { }
                channel.BannerUrl = null;
            }
            else if (dto.Banner != null)
            {
                if (!allowedTypes.Contains(dto.Banner.ContentType))
                    return (false, "Only JPEG, PNG, WebP allowed");

                if (dto.Banner.Length > 10 * 1024 * 1024)
                    return (false, "Banner must be less than 10MB");

                if (!string.IsNullOrEmpty(channel.BannerUrl))
                    try { await _s3Service.DeleteFileAsync($"{channelId}/banner.jpg", "channels"); } catch { }

                using var stream = dto.Banner.OpenReadStream();
                channel.BannerUrl = await _s3Service.UploadFileAsync(
                    stream,
                    $"{channelId}/banner.jpg",
                    "channels",
                    dto.Banner.ContentType
                );
            }

            var videosCount = await _context.Videos
                .CountAsync(v => v.ChannelId == channelId && v.Status == VideoStatus.Ready);
            var user = await _context.Users.FindAsync(userId);

            await _esService.UpdateChannelAsync(new ChannelDocument
            {
                Id = channel.Id,
                Name = channel.Name,
                Description = channel.Description,
                BannerUrl = channel.BannerUrl,
                OwnerAvatarUrl = user?.AvatarUrl,
                SubscribersCount = channel.SubscribersCount,
                VideosCount = videosCount,
                CreatedAt = channel.CreatedAt
            });

            var channelVideos = await _context.Videos
            .Include(v => v.Category)
            .Include(v => v.Channel)
                .ThenInclude(c => c.Owner)
            .Where(v => v.ChannelId == channelId && v.Status == VideoStatus.Ready)
            .ToListAsync();

            foreach (var video in channelVideos)
            {
                await _esService.UpdateVideoAsync(new VideoDocument
                {
                    Id = video.Id,
                    Title = video.Title,
                    Description = video.Description,
                    Tags = video.Tags ?? Array.Empty<string>(),
                    CategoryName = video.Category?.Name,
                    Language = video.Language,
                    ChannelName = channel.Name,
                    ChannelAvatarUrl = user?.AvatarUrl,
                    ChannelId = video.ChannelId,
                    ThumbnailUrl = video.ThumbnailUrl,
                    DurationSeconds = video.DurationSeconds,
                    ViewsCount = video.ViewsCount,
                    LikesCount = video.LikesCount,
                    CommentsCount = video.CommentsCount,
                    Visibility = (int)video.Visibility,
                    AgeRestriction = video.AgeRestriction,
                    IsShort = video.IsShort,
                    CreatedAt = video.CreatedAt
                });
            }

            await _context.SaveChangesAsync();
            return (true, "Channel updated");
        }

    }
}
