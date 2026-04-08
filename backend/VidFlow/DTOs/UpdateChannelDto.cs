using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class UpdateChannelDto
    {
        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(5000)]
        public string? Description { get; set; }

        public IFormFile? Banner { get; set; }
        public bool RemoveBanner { get; set; } = false;
    }
}