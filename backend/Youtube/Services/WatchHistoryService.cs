using Microsoft.EntityFrameworkCore;
using Youtube.DTOs;
using Youtube.Models;

namespace Youtube.Services
{
    public class WatchHistoryService : IWatchHistoryService
    {
        private readonly AppDbContext _context;

        public WatchHistoryService(AppDbContext context)
        {
            _context = context;
        }

        public async Task UpdatePositionAsync(Guid userId, UpdateWatchPositionDto dto)
        {
            var video = await _context.Videos.FindAsync(dto.VideoId);
            if (video == null) return;

            var watchedPercent = video.DurationSeconds > 0
                ? (dto.PositionSeconds / video.DurationSeconds) * 100
                : 0;

            var isCompleted = watchedPercent >= 90;

            var existing = await _context.WatchHistories
                .FirstOrDefaultAsync(wh => wh.UserId == userId && wh.VideoId == dto.VideoId);

            if (existing != null)
            {
                existing.LastPositionSeconds = dto.PositionSeconds;
                existing.WatchedPercent = watchedPercent;
                existing.IsCompleted = isCompleted;
                existing.WatchedAt = DateTime.UtcNow;
            }
            else
            {
                _context.WatchHistories.Add(new WatchHistory
                {
                    UserId = userId,
                    VideoId = dto.VideoId,
                    LastPositionSeconds = dto.PositionSeconds,
                    WatchedPercent = watchedPercent,
                    IsCompleted = isCompleted
                });
            }

            var stats = await _context.VideoStatistics
                .FirstOrDefaultAsync(vs => vs.VideoId == dto.VideoId);

            if (stats == null)
            {
                _context.VideoStatistics.Add(new VideoStatistics
                {
                    VideoId = dto.VideoId,
                    TotalWatchTimeSeconds = dto.PositionSeconds,
                    AverageCompletionRate = watchedPercent
                });
            }
            else
            {
                stats.TotalWatchTimeSeconds += 5;

                stats.AverageCompletionRate = (stats.AverageCompletionRate + watchedPercent) / 2;
                stats.RecordedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<VideoPositionDto?> GetPositionAsync(Guid userId, Guid videoId)
        {
            var entry = await _context.WatchHistories
                .FirstOrDefaultAsync(wh => wh.UserId == userId && wh.VideoId == videoId);

            if (entry == null) return null;

            return new VideoPositionDto
            {
                LastPositionSeconds = entry.LastPositionSeconds,
                WatchedPercent = entry.WatchedPercent,
                IsCompleted = entry.IsCompleted
            };
        }

        public async Task<IEnumerable<WatchHistoryResponseDto>> GetHistoryAsync(
            Guid userId, int page = 1)
        {
            const int pageSize = 20;

            return await _context.WatchHistories
                .Where(wh => wh.UserId == userId)
                .Include(wh => wh.Video)
                    .ThenInclude(v => v.Channel)
                .OrderByDescending(wh => wh.WatchedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(wh => new WatchHistoryResponseDto
                {
                    VideoId = wh.VideoId,
                    VideoTitle = wh.Video.Title,
                    ThumbnailUrl = wh.Video.ThumbnailUrl,
                    ChannelName = wh.Video.Channel.Name,
                    DurationSeconds = wh.Video.DurationSeconds,
                    LastPositionSeconds = wh.LastPositionSeconds,
                    WatchedPercent = wh.WatchedPercent,
                    IsCompleted = wh.IsCompleted,
                    WatchedAt = wh.WatchedAt
                })
                .ToListAsync();
        }

        public async Task DeleteHistoryItemAsync(Guid userId, Guid videoId)
        {
            await _context.WatchHistories
                .Where(wh => wh.UserId == userId && wh.VideoId == videoId)
                .ExecuteDeleteAsync();
        }

        public async Task ClearHistoryAsync(Guid userId)
        {
            await _context.WatchHistories
                .Where(wh => wh.UserId == userId)
                .ExecuteDeleteAsync();
        }
    }
}