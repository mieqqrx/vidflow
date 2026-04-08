namespace VidFlow.Models.Search
{
    public class ChannelDocument
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? BannerUrl { get; set; }
        public int SubscribersCount { get; set; }
        public int VideosCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? OwnerAvatarUrl { get; set; }
    }
}
