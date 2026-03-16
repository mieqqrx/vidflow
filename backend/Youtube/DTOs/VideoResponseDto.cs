namespace Youtube.DTOs
{
    public class VideoResponseDto
    {
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? VideoUrl { get; set; }
        public string? VideoUrl360p { get; set; }
        public string? VideoUrl720p { get; set; }
        public string? VideoUrl1080p { get; set; }
        public string? ThumbnailUrl { get; set; }
        public int ViewsCount { get; set; }
        public int LikesCount { get; set; }
        public int DislikesCount { get; set; }
        public double DurationSeconds { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid ChannelId { get; set; }
        public string? ChannelName { get; set; }
        public string? CategoryName { get; set; }
        public bool? IsLiked { get; set; }
        public bool? IsDisliked { get; set; }
        public VideoVisibility Visibility { get; set; }
        public int CommentsCount { get; set; }
        public double? LastPositionSeconds { get; set; }
        public double? WatchedPercent { get; set; }
        public bool? IsCompleted { get; set; }
        public string[] Tags { get; set; } = Array.Empty<string>();
        public string? Language { get; set; }
        public string? ChannelAvatarUrl { get; set; }
        public bool IsShort { get; set; }
        public bool IsAdminHidden { get; set; }
    }
}
