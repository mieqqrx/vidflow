using Youtube.Models;

namespace Youtube.DTOs
{
    public class NotificationResponseDto
    {
        public Guid Id { get; set; }
        public NotificationType Type { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? ActorName { get; set; }
        public string? ActorAvatarUrl { get; set; }
        public Guid? VideoId { get; set; }
        public Guid? CommentId { get; set; }
        public Guid? ChannelId { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsShort { get; set; }
    }
}
