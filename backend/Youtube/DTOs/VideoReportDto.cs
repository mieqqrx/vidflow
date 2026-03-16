using System.ComponentModel.DataAnnotations;
using Youtube.Models;

namespace Youtube.DTOs
{
    public class CreateVideoReportDto
    {
        [Required]
        public ReportReason Reason { get; set; }

        [MaxLength(500)]
        public string? Details { get; set; }
    }

    public class VideoReportResponseDto
    {
        public Guid Id { get; set; }
        public Guid VideoId { get; set; }
        public string VideoTitle { get; set; } = string.Empty;
        public ReportReason Reason { get; set; }
        public string? Details { get; set; }
        public ReportStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ReviewReportDto
    {
        [Required]
        public ReportStatus Status { get; set; }
        public string? ModeratorNote { get; set; }
    }
}
