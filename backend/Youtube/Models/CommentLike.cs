namespace Youtube.Models
{
    public class CommentLike
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public Guid CommentId { get; set; }
        public Comment Comment { get; set; } = null!;

        public bool IsDislike { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
