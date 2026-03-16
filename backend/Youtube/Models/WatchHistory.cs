namespace Youtube.Models
{
    public class WatchHistory
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public Guid VideoId { get; set; }
        public Video Video { get; set; } = null!;

        public double LastPositionSeconds { get; set; } = 0;
        public double WatchedPercent { get; set; } = 0;  
        public bool IsCompleted { get; set; } = false;   
        public DateTime WatchedAt { get; set; } = DateTime.UtcNow;
    }
}
