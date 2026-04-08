namespace VidFlow.Models
{
    public class Channel
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? BannerUrl { get; set; }
        public int SubscribersCount { get; set; } = 0;

        public Guid OwnerId { get; set; }

        public User Owner { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();

        public ICollection<Video> Videos { get; set; } = new List<Video>();

        public Guid? FeaturedVideoId { get; set; }
        public Video? FeaturedVideo { get; set; }
    }
}
