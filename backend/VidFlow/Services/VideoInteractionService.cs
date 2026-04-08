using Microsoft.EntityFrameworkCore;
using VidFlow.DTOs;
using VidFlow.Models;
using VidFlow.Models.Search;

namespace VidFlow.Services
{
    public class VideoInteractionService : IVideoInteractionService
    {
        private readonly AppDbContext _context;
        private readonly IPlaylistService _playlistService;
        private readonly IElasticsearchService _elasticsearchService;

        public VideoInteractionService(AppDbContext context, IPlaylistService playlistService, IElasticsearchService elasticsearchService)
        {
            _context = context;
            _playlistService = playlistService;
            _elasticsearchService = elasticsearchService;
        }

        public async Task<(bool Success, string Message, bool IsLiked)> ToggleLikeAsync(Guid userId, Guid videoId)
        {
            var video = await _context.Videos.FindAsync(videoId);
            if (video == null)
                return (false, "Video not found", false);

            var existingDislike = await _context.VideoDisLikes
                .FirstOrDefaultAsync(vd => vd.UserId == userId && vd.VideoId == videoId);
            if (existingDislike != null)
            {
                _context.VideoDisLikes.Remove(existingDislike);
                video.DislikesCount = Math.Max(0, video.DislikesCount - 1);
            }

            var existingLike = await _context.VideoLikes
                .FirstOrDefaultAsync(vl => vl.UserId == userId && vl.VideoId == videoId);

            if (existingLike != null)
            {
                _context.VideoLikes.Remove(existingLike);
                video.LikesCount = Math.Max(0, video.LikesCount - 1);
                await _context.SaveChangesAsync();

                await _playlistService.SyncLikedPlaylistAsync(userId, videoId, false);

                return (true, "Like removed", false);
            }
            else
            {
                _context.VideoLikes.Add(new VideoLike { UserId = userId, VideoId = videoId });
                video.LikesCount++;
                await _context.SaveChangesAsync();

                await _playlistService.SyncLikedPlaylistAsync(userId, videoId, true);

                return (true, "Like added", true);
            }
        }

        public async Task<bool> IsLikedAsync(Guid userId, Guid videoId)
        {
            return await _context.VideoLikes
                .AnyAsync(vl => vl.UserId == userId && vl.VideoId == videoId);
        }

        public async Task<IEnumerable<LikedVideoDto>> GetLikedVideosAsync(Guid userId)
        {
            return await _context.VideoLikes
                .Where(vl => vl.UserId == userId)
                .Include(vl => vl.Video)
                    .ThenInclude(v => v.Channel)
                .OrderByDescending(vl => vl.LikedAt)
                .Select(vl => new LikedVideoDto
                {
                    VideoId = vl.VideoId,
                    Title = vl.Video.Title,
                    ThumbnailUrl = vl.Video.ThumbnailUrl,
                    ChannelName = vl.Video.Channel.Name,
                    ChannelId = vl.Video.ChannelId,
                    ViewsCount = vl.Video.ViewsCount,
                    LikesCount = vl.Video.LikesCount,
                    LikedAt = vl.LikedAt
                })
                .ToListAsync();
        }

        public async Task RecordViewAsync(Guid videoId, Guid? userId)
        {
            if (!userId.HasValue) return;

            var video = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.Owner)
                .Include(v => v.Category)
                .FirstOrDefaultAsync(v => v.Id == videoId);

            if (video == null) return;

            var recentView = await _context.VideoViews
                .AnyAsync(vv =>
                    vv.VideoId == videoId &&
                    vv.UserId == userId &&
                    vv.ViewedAt > DateTime.UtcNow.AddHours(-24));

            if (recentView) return;

            _context.VideoViews.Add(new VideoView { VideoId = videoId, UserId = userId });
            video.ViewsCount++;

            var channel = await _context.Channels
                .Include(c => c.Owner)
                .FirstOrDefaultAsync(c => c.Id == video.ChannelId);

            if (channel != null)
                channel.Owner.TotalViewsCount++;

            await _context.SaveChangesAsync();

            await _elasticsearchService.UpdateVideoAsync(new VideoDocument
            {
                Id = video.Id,
                Title = video.Title,
                Description = video.Description,
                Tags = video.Tags ?? Array.Empty<string>(),
                CategoryName = video.Category?.Name,
                Language = video.Language,
                ChannelName = video.Channel.Name,
                ChannelAvatarUrl = video.Channel?.Owner?.AvatarUrl,
                ChannelId = video.ChannelId,
                ThumbnailUrl = video.ThumbnailUrl,
                DurationSeconds = video.DurationSeconds,
                ViewsCount = video.ViewsCount,
                LikesCount = video.LikesCount,
                IsShort = video.IsShort,
                CommentsCount = video.CommentsCount,
                Visibility = (int)video.Visibility,
                AgeRestriction = video.AgeRestriction,
                CreatedAt = video.CreatedAt
            });
        }

        public async Task<(bool Success, string Message, bool IsDisliked)> ToggleDislikeAsync(Guid userId, Guid videoId)
        {
            var video = await _context.Videos.FindAsync(videoId);
            if (video == null)
                return (false, "Video not found", false);

            var existingLike = await _context.VideoLikes
                .FirstOrDefaultAsync(vl => vl.UserId == userId && vl.VideoId == videoId);
            if (existingLike != null)
            {
                _context.VideoLikes.Remove(existingLike);
                video.LikesCount = Math.Max(0, video.LikesCount - 1);

                await _playlistService.SyncLikedPlaylistAsync(userId, videoId, false);
            }

            var existingDislike = await _context.VideoDisLikes
                .FirstOrDefaultAsync(vd => vd.UserId == userId && vd.VideoId == videoId);

            if (existingDislike != null)
            {
                _context.VideoDisLikes.Remove(existingDislike);
                video.DislikesCount = Math.Max(0, video.DislikesCount - 1);
                await _context.SaveChangesAsync();
                return (true, "Dislike removed", false);
            }
            else
            {
                _context.VideoDisLikes.Add(new VideoDislike { UserId = userId, VideoId = videoId });
                video.DislikesCount++;
                await _context.SaveChangesAsync();
                return (true, "Dislike added", true);
            }
        }

        public async Task<bool> IsDislikedAsync(Guid userId, Guid videoId)
        {
            return await _context.VideoDisLikes
                .AnyAsync(vd => vd.UserId == userId && vd.VideoId == videoId);
        }
    }
}