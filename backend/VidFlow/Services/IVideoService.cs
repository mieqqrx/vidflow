using VidFlow.DTOs;
using VidFlow.Models;

namespace VidFlow.Services
{
    public interface IVideoService
    {
        Task<(bool Success, string Message, Guid? VideoId)> UploadVideoAsync(
            IFormFile file, string title, string description,
            Guid channelId, Guid? categoryId, bool ageRestriction,
            VideoVisibility visibility = VideoVisibility.Public,
            string? customThumbnailPath = null, bool isShort = false);

        Task<VideoResponseDto?> GetVideoByIdAsync(Guid id, Guid? userId = null);
        Task<IEnumerable<VideoResponseDto>> GetVideosByChannelAsync(Guid channelId, Guid? userId = null);
        Task<IEnumerable<Category>> GetCategoriesAsync();
        Task<(bool Success, string Message)> DeleteVideoAsync(Guid videoId, Guid userId);
        Task<(bool Success, string Message)> UpdateVideoAsync(Guid videoId, Guid userId, UpdateVideoDto dto);
        Task<(bool Success, string Message)> TrimVideoAsync(Guid videoId, Guid userId, TrimVideoDto dto);
        Task<IEnumerable<VideoResponseDto>> GetShortsAsync(int page, int pageSize);
        Task<IEnumerable<VideoResponseDto>> GetChannelShortsAsync(Guid channelId, Guid? userId = null);
        Task<(bool Success, string Message)> AdminSetVisibilityAsync(Guid videoId, VideoVisibility visibility);
        Task<IEnumerable<VideoResponseDto>> GetSubscriptionVideosAsync(Guid userId, int limit);
    }
}