namespace VidFlow.Models
{
    public class LiveStreamInteraction
    {
        public Guid Id { get; set; }

        public Guid StreamId { get; set; }
        public LiveStream Stream { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public bool IsLike { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
