using Microsoft.EntityFrameworkCore;
using Youtube.DTOs;
using Youtube.Models;

namespace Youtube.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly AppDbContext _context;

        public SubscriptionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message)> SubscribeAsync(Guid userId, Guid channelId)
        {
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null) return (false, "Channel not found");

            if (channel.OwnerId == userId) return (false, "You cannot subscribe to your own channel");

            var existingSubscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.ChannelId == channelId);

            if (existingSubscription != null) return (false, "Already subscribed");

            var subscription = new Subscription
            {
                UserId = userId,
                ChannelId = channelId,
                NotificationEnabled = false
            };

            channel.SubscribersCount++;
            _context.Subscriptions.Add(subscription);

            await _context.SaveChangesAsync();
            return (true, "Subscribed successfully");
        }

        public async Task<(bool Success, string Message)> UnsubscribeAsync(Guid userId, Guid channelId)
        {
            var subscription = await _context.Subscriptions
                .Include(s => s.Channel)
                .FirstOrDefaultAsync(s => s.UserId == userId && s.ChannelId == channelId);

            if (subscription == null) return (false, "Subscription not found");

            subscription.Channel.SubscribersCount = Math.Max(0, subscription.Channel.SubscribersCount - 1);
            _context.Subscriptions.Remove(subscription);

            await _context.SaveChangesAsync();
            return (true, "Unsubscribed successfully");
        }

        public async Task<(bool Success, string Message)> ToggleNotificationAsync(Guid userId, Guid channelId)
        {
            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.ChannelId == channelId);

            if (subscription == null) return (false, "Subscription not found");

            subscription.NotificationEnabled = !subscription.NotificationEnabled;
            await _context.SaveChangesAsync();

            return (true, $"Notifications {(subscription.NotificationEnabled ? "enabled" : "disabled")}");
        }

        public async Task<IEnumerable<SubscriptionResponseDto>> GetUserSubscriptionsAsync(Guid userId)
        {
            return await _context.Subscriptions
                .Where(s => s.UserId == userId)
                .Select(s => new SubscriptionResponseDto
                {
                    Id = s.Id,
                    ChannelId = s.ChannelId,
                    ChannelName = s.Channel.Name,
                    ChannelBannerUrl = s.Channel.BannerUrl,
                    SubscribersCount = s.Channel.SubscribersCount,
                    NotificationEnabled = s.NotificationEnabled,
                    SubscribedAt = s.SubscribedAt,
                    ChannelAvatarUrl = s.Channel.Owner.AvatarUrl
                })
                .ToListAsync();
        }

        public async Task<bool> IsSubscribedAsync(Guid userId, Guid channelId)
        {
            return await _context.Subscriptions
                .AnyAsync(s => s.UserId == userId && s.ChannelId == channelId);
        }
    }
}