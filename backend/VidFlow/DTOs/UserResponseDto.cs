namespace VidFlow.DTOs
{
    public class UserResponseDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public DateTime RegistrationDate { get; set; }
        public bool AutoplayEnabled { get; set; }
        public bool NotifyOnNewVideo { get; set; }
        public bool NotifyOnCommentReply { get; set; }
        public bool NotifyOnMention { get; set; }
        public bool NotifyOnVideoReady { get; set; }
        public UserRole Role { get; set; }
    }
}