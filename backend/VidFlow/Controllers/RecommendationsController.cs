using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VidFlow.Services;

namespace VidFlow.Controllers
{
    [ApiController]
    [Route("api/recommendations")]
    public class RecommendationsController : ControllerBase
    {
        private readonly IRecommendationService _recommendationService;

        public RecommendationsController(IRecommendationService recommendationService)
        {
            _recommendationService = recommendationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetRecommendations(
            [FromQuery] int count = 20,
            [FromQuery] Guid? excludeVideoId = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userIdClaim, out var userId))
                return Ok(await _recommendationService.GetPersonalizedAsync(userId, count, excludeVideoId));

            return Ok(await _recommendationService.GetPopularAsync(count));
        }

        [HttpGet("similar/{videoId}")]
        public async Task<IActionResult> GetSimilar(Guid videoId, [FromQuery] int count = 20)
        {
            return Ok(await _recommendationService.GetSimilarAsync(videoId, count));
        }

        [HttpGet("popular")]
        public async Task<IActionResult> GetPopular([FromQuery] int count = 20)
        {
            return Ok(await _recommendationService.GetPopularAsync(count));
        }

        [HttpGet("shorts")]
        public async Task<IActionResult> GetShortsRecommendations(
            [FromQuery] int count = 20,
            [FromQuery] Guid? excludeVideoId = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid? userId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

            var results = await _recommendationService.GetShortsRecommendationsAsync(userId, count, excludeVideoId);
            return Ok(results);
        }
    }
}