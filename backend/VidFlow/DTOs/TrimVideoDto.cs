using System.ComponentModel.DataAnnotations;

namespace VidFlow.DTOs
{
    public class TrimVideoDto
    {
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Start must be >= 0")]
        public double StartSeconds { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "End must be >= 0")]
        public double EndSeconds { get; set; }
    }
}
