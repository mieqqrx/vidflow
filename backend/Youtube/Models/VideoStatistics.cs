namespace Youtube.Models
{
    public class VideoStatistics
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid VideoId { get; set; }
        public Video Video { get; set; } = null!;

        public double TotalWatchTimeSeconds { get; set; } = 0;
        public double AverageCompletionRate { get; set; } = 0; 
        public string? Region { get; set; } 

        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    }
}
