using VidFlow.DTOs;
using VidFlow.Models;

namespace VidFlow.Services
{
    public interface INotificationService
    {
        Task NotifyNewVideoAsync(Video video, Channel channel);
        Task NotifyVideoReadyAsync(Guid channelOwnerId, Video video);
        Task NotifyCommentReplyAsync(Comment reply, Comment parentComment);
        Task NotifyMentionsAsync(Comment comment, string text);
        Task<IEnumerable<NotificationResponseDto>> GetNotificationsAsync(Guid userId, int page = 1);
        Task<int> GetUnreadCountAsync(Guid userId);
        Task MarkAsReadAsync(Guid userId, Guid notificationId);
        Task MarkAllAsReadAsync(Guid userId);
        Task DeleteNotificationAsync(Guid userId, Guid notificationId);
        Task DeleteAllNotificationsAsync(Guid userId);
        Task DeleteManyNotificationsAsync(Guid userId, List<Guid> notificationIds);
        Task NotifyLiveStreamStartedAsync(Channel channel, LiveStream stream);
    }
}
