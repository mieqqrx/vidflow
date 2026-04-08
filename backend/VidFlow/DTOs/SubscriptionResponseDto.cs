namespace VidFlow.DTOs
{
    public class SubscriptionResponseDto
    {
        public Guid Id { get; set; }
        public Guid ChannelId { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public string? ChannelBannerUrl { get; set; }
        public int SubscribersCount { get; set; }
        public bool NotificationEnabled { get; set; }
        public DateTime SubscribedAt { get; set; }
        public string? ChannelAvatarUrl { get; set; }
    }
}
