namespace Youtube.DTOs
{
    public class LikedVideoDto
    {
        public Guid VideoId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public Guid ChannelId { get; set; }
        public int ViewsCount { get; set; }
        public int LikesCount { get; set; }
        public DateTime LikedAt { get; set; }
    }
}
