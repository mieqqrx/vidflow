using Youtube.DTOs;

namespace Youtube.Services
{
    public interface ISubscriptionService
    {
        Task<(bool Success, string Message)> SubscribeAsync(Guid userId, Guid channelId);
        Task<(bool Success, string Message)> UnsubscribeAsync(Guid userId, Guid channelId);
        Task<(bool Success, string Message)> ToggleNotificationAsync(Guid userId, Guid channelId);
        Task<IEnumerable<SubscriptionResponseDto>> GetUserSubscriptionsAsync(Guid userId);
        Task<bool> IsSubscribedAsync(Guid userId, Guid channelId);
    }
}
