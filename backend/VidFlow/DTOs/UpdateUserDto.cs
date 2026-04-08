using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class UpdateAvatarDto
    {
        public IFormFile? Avatar { get; set; }
        public bool RemoveAvatar { get; set; } = false;
    }

    public class UpdateUserProfileDto
    {
        [MaxLength(50)]
        public string? Username { get; set; }

        [MaxLength(300)]
        public string? Bio { get; set; }
    }

    public class UpdateUserSettingsDto
    {
        public bool? AutoplayEnabled { get; set; }
        public bool? NotifyOnNewVideo { get; set; }
        public bool? NotifyOnCommentReply { get; set; }
        public bool? NotifyOnMention { get; set; }
        public bool? NotifyOnVideoReady { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }
}