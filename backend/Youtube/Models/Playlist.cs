using System.ComponentModel.DataAnnotations;

namespace Youtube.Models
{
    public class Playlist
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        public bool IsPrivate { get; set; } = false;
        public bool IsSystem { get; set; } = false; 
        public PlaylistType Type { get; set; } = PlaylistType.Custom;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public ICollection<PlaylistVideo> PlaylistVideos { get; set; } = new List<PlaylistVideo>();
    }

    public enum PlaylistType
    {
        Custom,       
        Liked,        
        WatchLater    
    }
}
