using System.ComponentModel.DataAnnotations;
using Youtube.Models;

namespace Youtube.DTOs
{
    public class CreatePlaylistDto
    {
        [Required]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;
        public bool IsPrivate { get; set; } = false;
    }

    public class UpdatePlaylistDto
    {
        [MaxLength(150)]
        public string? Title { get; set; }
        public bool? IsPrivate { get; set; }
    }

    public class PlaylistVideoDto
    {
        public Guid Id { get; set; }           
        public Guid? VideoId { get; set; }
        public string VideoTitle { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public double DurationSeconds { get; set; }
        public bool IsDeleted { get; set; }    
        public DateTime AddedAt { get; set; }
        public int Order { get; set; }
        public string? ChannelName { get; set; }
    }

    public class PlaylistResponseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsPrivate { get; set; }
        public bool IsSystem { get; set; }
        public PlaylistType Type { get; set; }
        public int VideoCount { get; set; }   
        public string? ThumbnailUrl { get; set; } 
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdatedAt { get; set; }
        public List<PlaylistVideoDto> Videos { get; set; } = new();
    }
}
