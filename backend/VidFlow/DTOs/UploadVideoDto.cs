using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class UploadVideoDto
    {
        [Required]
        public IFormFile File { get; set; } = null!;

        [Required]
        [MinLength(3)]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public Guid? CategoryId { get; set; }

        public bool AgeRestriction { get; set; } = false;

        public IFormFile? CustomThumbnail { get; set; }
        public VideoVisibility Visibility { get; set; } = VideoVisibility.Public;
    }
}
