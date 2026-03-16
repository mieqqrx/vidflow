using System.ComponentModel.DataAnnotations;

namespace Youtube.DTOs
{
    public class CreateCommentDto
    {
        [Required]
        [MaxLength(5000, ErrorMessage = "Comment cannot exceed 5000 characters")]
        [MinLength(1, ErrorMessage = "Comment cannot be empty")]
        public string Text { get; set; } = string.Empty;

        [Required]
        public Guid VideoId { get; set; }

        public Guid? ParentCommentId { get; set; } 
    }
}
