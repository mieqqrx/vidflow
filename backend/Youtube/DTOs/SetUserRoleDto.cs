using System.ComponentModel.DataAnnotations;

namespace Youtube.DTOs
{
    public class SetUserRoleDto
    {
        [Required]
        public UserRole Role { get; set; }
    }
}
