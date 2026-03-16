namespace Youtube.Models
{
    public class VideoView
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid VideoId { get; set; }
        public Video Video { get; set; } = null!;

        public Guid? UserId { get; set; } 
        public User? User { get; set; }

        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
}
