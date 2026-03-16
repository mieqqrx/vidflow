namespace Youtube.Models.Search
{
    public class PlaylistDocument
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ChannelName { get; set; } = string.Empty;
        public Guid ChannelId { get; set; }
        public string? ThumbnailUrl { get; set; }
        public int VideosCount { get; set; }
        public bool IsPrivate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
