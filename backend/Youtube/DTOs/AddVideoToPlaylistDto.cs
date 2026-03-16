using System.ComponentModel.DataAnnotations;

namespace Youtube.DTOs
{
    public class AddVideoToPlaylistDto
    {
        [Required]
        public Guid VideoId { get; set; }
    }
}
