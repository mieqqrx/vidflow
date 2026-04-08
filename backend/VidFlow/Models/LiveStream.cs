namespace VidFlow.Models
{
    public enum LiveStreamStatus
    {
        Scheduled,  
        Live,       
        Ended,      
        Failed      
    }

    public class LiveStream
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ThumbnailUrl { get; set; }

        public string StreamKey { get; set; } = string.Empty;

        public LiveStreamStatus Status { get; set; } = LiveStreamStatus.Scheduled;

        public string? PlaybackUrl { get; set; }

        public string? RecordingUrl { get; set; }

        public int ViewersCount { get; set; }
        public int PeakViewersCount { get; set; }
        public int TotalViewsCount { get; set; }

        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool SaveRecording { get; set; } = true;
        public bool ChatEnabled { get; set; } = true;

        public Guid ChannelId { get; set; }
        public Channel Channel { get; set; } = null!;

        public Guid? VideoId { get; set; }  
        public Video? Video { get; set; }

        public ICollection<LiveStreamMessage> Messages { get; set; } = new List<LiveStreamMessage>();
    }

    public class LiveStreamMessage
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public Guid StreamId { get; set; }
        public LiveStream Stream { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}