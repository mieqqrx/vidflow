using System.ComponentModel.DataAnnotations;

namespace VidFlow.Models
{
    public class Comment
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [MaxLength(5000)]
        public string Text { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public Guid VideoId { get; set; }
        public Video Video { get; set; } = null!;

        public Guid? ParentCommentId { get; set; }
        public Comment? ParentComment { get; set; }
        public ICollection<Comment> Replies { get; set; } = new List<Comment>();

        public int LikesCount { get; set; } = 0;
        public int DislikesCount { get; set; } = 0;
        public ICollection<CommentLike> Likes { get; set; } = new List<CommentLike>();
    }
}
