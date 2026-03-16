using Youtube.Models;

namespace Youtube.DTOs
{
    public class CreateLiveStreamDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool SaveRecording { get; set; } = true;
        public bool ChatEnabled { get; set; } = true;
    }

    public class UpdateLiveStreamDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
    }

    public class LiveStreamResponseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string StreamKey { get; set; } = string.Empty;
        public LiveStreamStatus Status { get; set; }
        public string? PlaybackUrl { get; set; }
        public string? RecordingUrl { get; set; }
        public int ViewersCount { get; set; }
        public int PeakViewersCount { get; set; }
        public int TotalViewsCount { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool SaveRecording { get; set; }
        public bool ChatEnabled { get; set; }
        public Guid ChannelId { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public string? ChannelAvatarUrl { get; set; }
        public Guid? VideoId { get; set; }
    }

    public class LiveStreamMessageDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }
}