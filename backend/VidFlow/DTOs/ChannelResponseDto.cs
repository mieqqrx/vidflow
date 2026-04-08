namespace VidFlow.DTOs
{
    public class ChannelResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? BannerUrl { get; set; }
        public string? OwnerAvatarUrl { get; set; }
        public int SubscribersCount { get; set; }
        public Guid OwnerId { get; set; }
        public string OwnerUsername { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public Guid? FeaturedVideoId { get; set; }
        public VideoResponseDto? FeaturedVideo { get; set; }
    }
}