using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class UpdateCommentDto
    {
        [Required]
        [MaxLength(5000, ErrorMessage = "Comment cannot exceed 5000 characters")]
        [MinLength(1, ErrorMessage = "Comment cannot be empty")]
        public string Text { get; set; } = string.Empty;
    }
}
