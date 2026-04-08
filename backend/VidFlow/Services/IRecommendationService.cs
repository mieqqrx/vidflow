using VidFlow.Models.Search;

namespace VidFlow.Services
{
    public interface IRecommendationService
    {
        Task<IEnumerable<VideoDocument>> GetPersonalizedAsync(Guid userId, int count = 20, Guid? excludeVideoId = null);
        Task<IEnumerable<VideoDocument>> GetPopularAsync(int count = 20);
        Task<IEnumerable<VideoDocument>> GetShortsRecommendationsAsync(Guid? userId, int count = 20, Guid? excludeVideoId = null);
        Task<IEnumerable<VideoDocument>> GetSimilarAsync(Guid videoId, int count = 20, Guid? userId = null);
    }
}
