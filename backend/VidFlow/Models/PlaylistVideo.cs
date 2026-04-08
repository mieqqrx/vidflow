namespace VidFlow.Models
{
    public class PlaylistVideo
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid PlaylistId { get; set; }
        public Playlist Playlist { get; set; } = null!;

        public Guid? VideoId { get; set; }       
        public Video? Video { get; set; }

        public string VideoTitle { get; set; } = string.Empty;
        public string? VideoThumbnailUrl { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
        public int Order { get; set; } = 0;
        public string? VideoChannelName { get; set; }
    }
}
