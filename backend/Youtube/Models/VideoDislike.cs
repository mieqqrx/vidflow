namespace Youtube.Models
{
    public class VideoDislike
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public Guid VideoId { get; set; }
        public Video Video { get; set; } = null!;

        public DateTime DislikedAt { get; set; } = DateTime.UtcNow;
    }
}
