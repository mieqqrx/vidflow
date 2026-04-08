namespace VidFlow.Models
{
    public class Subscription
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public Guid ChannelId { get; set; }
        public Channel Channel { get; set; } = null!;

        public bool NotificationEnabled { get; set; } = false;
        public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;
    }
}
