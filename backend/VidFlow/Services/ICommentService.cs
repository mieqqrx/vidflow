using VidFlow.DTOs;

namespace VidFlow.Services
{
    public interface ICommentService
    {
        Task<(bool Success, string Message, CommentResponseDto? Comment)> CreateCommentAsync(Guid userId, CreateCommentDto dto);
        Task<(bool Success, string Message)> UpdateCommentAsync(Guid userId, Guid commentId, UpdateCommentDto dto);
        Task<(bool Success, string Message)> DeleteCommentAsync(Guid userId, Guid commentId);
        Task<(bool Success, string Message, bool IsLiked)> ToggleCommentLikeAsync(Guid userId, Guid commentId);
        Task<(bool Success, string Message, bool IsDisliked)> ToggleCommentDislikeAsync(Guid userId, Guid commentId);
        Task<IEnumerable<CommentResponseDto>> GetVideoCommentsAsync(Guid videoId, Guid? userId = null);
        Task<IEnumerable<CommentResponseDto>> GetCommentRepliesAsync(Guid commentId, Guid? userId = null);
    }
}
