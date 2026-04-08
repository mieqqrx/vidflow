using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class SetUserRoleDto
    {
        [Required]
        public UserRole Role { get; set; }
    }
}
