namespace VidFlow.Models
{
    public class VideoReport
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ReporterId { get; set; }
        public User Reporter { get; set; } = null!;

        public Guid TargetVideoId { get; set; }
        public Video TargetVideo { get; set; } = null!;

        public ReportReason Reason { get; set; }
        public string? Details { get; set; } 

        public ReportStatus Status { get; set; } = ReportStatus.Pending;
        public string? ModeratorNote { get; set; }
        public Guid? ReviewedByModeratorId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
    }

    public enum ReportReason
    {
        SexualContent,
        ViolentContent,
        HateSpeech,
        Harassment,
        Spam,
        Misinformation,
        CopyrightViolation,
        Other
    }

    public enum ReportStatus
    {
        Pending,
        Reviewed,
        Rejected,
        VideoRemoved
    }
}
