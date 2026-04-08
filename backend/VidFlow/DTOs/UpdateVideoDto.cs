using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class UpdateVideoDto
    {
        [MinLength(3)]
        [MaxLength(100)]
        public string? Title { get; set; }

        [MaxLength(5000)]
        public string? Description { get; set; }

        public Guid? CategoryId { get; set; }

        public bool? AgeRestriction { get; set; }

        public IFormFile? CustomThumbnail { get; set; }
        public VideoVisibility? Visibility { get; set; }

        public string[]? Tags { get; set; }
        public string? Language { get; set; }
    }
}
