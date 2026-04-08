using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class UpdateWatchPositionDto
    {
        [Required]
        public Guid VideoId { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public double PositionSeconds { get; set; }
    }

    public class WatchHistoryResponseDto
    {
        public Guid VideoId { get; set; }
        public string VideoTitle { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? ChannelName { get; set; }
        public double DurationSeconds { get; set; }
        public double LastPositionSeconds { get; set; }
        public double WatchedPercent { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime WatchedAt { get; set; }
    }

    public class VideoPositionDto
    {
        public double LastPositionSeconds { get; set; }
        public double WatchedPercent { get; set; }
        public bool IsCompleted { get; set; }
    }
}
