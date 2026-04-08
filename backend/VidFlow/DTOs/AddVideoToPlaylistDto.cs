using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class AddVideoToPlaylistDto
    {
        [Required]
        public Guid VideoId { get; set; }
    }
}
