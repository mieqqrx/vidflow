namespace Youtube.DTOs
{
    public class RecommendationRequestDto
    {
        public int Count { get; set; } = 20;
        public Guid? ExcludeVideoId { get; set; }
    }
}
