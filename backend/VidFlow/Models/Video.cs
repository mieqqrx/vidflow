using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VidFlow.Models;

public class Video
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string? VideoUrl360p { get; set; }
    public string? VideoUrl720p { get; set; }
    public string? VideoUrl1080p { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string[] Resolutions { get; set; } = Array.Empty<string>();
    public int ViewsCount { get; set; } = 0;
    public bool AgeRestriction { get; set; } = false;
    public VideoStatus Status { get; set; } = VideoStatus.Processing;
    public VideoVisibility Visibility { get; set; } = VideoVisibility.Public;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public double DurationSeconds { get; set; } = 0;
    public int LikesCount { get; set; } = 0;
    public int DislikesCount { get; set; } = 0;
    public bool IsShort { get; set; } = false;
    public Guid ChannelId { get; set; }
    public Channel Channel { get; set; } = null!;

    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }
    public ICollection<VideoLike> Likes { get; set; } = new List<VideoLike>();
    public ICollection<VideoDislike> Dislikes { get; set; } = new List<VideoDislike>();
    public ICollection<VideoView> Views { get; set; } = new List<VideoView>();

    public int CommentsCount { get; set; } = 0;

    [Column(TypeName = "jsonb")]
    public string[] Tags { get; set; } = Array.Empty<string>();

    [MaxLength(10)]
    public string? Language { get; set; } = "en";

    public bool IsAdminHidden { get; set; } = false;
}

public enum VideoStatus
{
    Processing,
    Ready,
    Failed
}

public enum VideoVisibility
{
    Public,      
    Unlisted,    
    Private      
}
