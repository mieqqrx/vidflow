using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class CreateChannelDto
    {
        [Required]
        [MinLength(3)]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public string? BannerUrl { get; set; }
    }
}
