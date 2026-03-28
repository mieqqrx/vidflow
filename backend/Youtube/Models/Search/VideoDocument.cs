using System.Text.Json.Serialization;

namespace Youtube.Models.Search
{
    public class VideoDocument
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string[] Tags { get; set; } = Array.Empty<string>();
        public string? CategoryName { get; set; }
        public string? Language { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public Guid ChannelId { get; set; }
        public string? ThumbnailUrl { get; set; }
        public double DurationSeconds { get; set; }
        public int ViewsCount { get; set; }
        public double WatchedPercent { get; set; }
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }

        public int Visibility { get; set; }

        public bool AgeRestriction { get; set; }
        public DateTime CreatedAt { get; set; }

        public string? ChannelAvatarUrl { get; set; }
        public string? VideoUrl { get; set; }
        public bool IsShort { get; set; }
    }
}
