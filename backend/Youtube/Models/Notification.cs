namespace Youtube.Models
{
    public class Notification
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }        
        public User User { get; set; } = null!;

        public NotificationType Type { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Guid? VideoId { get; set; }
        public Video? Video { get; set; }

        public Guid? CommentId { get; set; }
        public Comment? Comment { get; set; }

        public Guid? ChannelId { get; set; }
        public Channel? Channel { get; set; }

        public string Message { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? ActorName { get; set; }  
        public string? ActorAvatarUrl { get; set; }
    }

    public enum NotificationType
    {
        NewVideo,           
        VideoReady,         
        CommentReply,       
        CommentMention,
        LiveStreamStarted,
        NewShort
    }

}
