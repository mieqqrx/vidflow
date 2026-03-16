using Youtube.DTOs;

namespace Youtube.Services
{
    public interface IVideoInteractionService
    {
        Task<(bool Success, string Message, bool IsLiked)> ToggleLikeAsync(Guid userId, Guid videoId);
        Task<bool> IsLikedAsync(Guid userId, Guid videoId);
        Task<IEnumerable<LikedVideoDto>> GetLikedVideosAsync(Guid userId);
        Task RecordViewAsync(Guid videoId, Guid? userId);
        Task<(bool Success, string Message, bool IsDisliked)> ToggleDislikeAsync(Guid userId, Guid videoId);
        Task<bool> IsDislikedAsync(Guid userId, Guid videoId);
    }
}
