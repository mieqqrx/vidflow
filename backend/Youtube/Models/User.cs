using System.ComponentModel.DataAnnotations;
using Youtube.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Username { get; internal set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public DateTime DateOfBirth { get; set; }
    public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

    public int TotalViewsCount { get; set; } = 0;

    public Channel? Channel { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();

    public bool NotifyOnNewVideo { get; set; } = true;
    public bool NotifyOnCommentReply { get; set; } = true;
    public bool NotifyOnMention { get; set; } = true;
    public bool NotifyOnVideoReady { get; set; } = true;

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public bool AutoplayEnabled { get; set; } = true;

    [MaxLength(300)]
    public string? Bio { get; set; }

    public UserRole Role { get; set; } = UserRole.User;
    public string? GoogleId { get; set; }
}

public enum UserRole
{
    User,
    Moderator,
    Admin
}