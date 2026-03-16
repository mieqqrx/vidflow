namespace Youtube.DTOs
{
    public class CommentResponseDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }

        public Guid VideoId { get; set; }
        public Guid? ParentCommentId { get; set; }

        public int RepliesCount { get; set; }
        public List<CommentResponseDto> Replies { get; set; } = new();

        public int LikesCount { get; set; }
        public int DislikesCount { get; set; }
        public bool? IsLiked { get; set; }
        public bool? IsDisliked { get; set; }

        public Guid? ChannelId { get; set; }
    }
}
