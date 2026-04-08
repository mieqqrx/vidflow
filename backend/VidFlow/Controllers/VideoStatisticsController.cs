using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace VidFlow.Controllers
{
    [ApiController]
    [Route("api/videos/{videoId}/statistics")]
    public class VideoStatisticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VideoStatisticsController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetStatistics(Guid videoId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var video = await _context.Videos
                .Include(v => v.Channel)
                .FirstOrDefaultAsync(v => v.Id == videoId);

            if (video == null) return NotFound();
            if (video.Channel.OwnerId != userId) return Forbid();

            var stats = await _context.VideoStatistics
                .FirstOrDefaultAsync(vs => vs.VideoId == videoId);

            return Ok(new
            {
                videoId,
                totalWatchTimeSeconds = stats?.TotalWatchTimeSeconds ?? 0,
                averageCompletionRate = stats?.AverageCompletionRate ?? 0,
                viewsCount = video.ViewsCount,
                likesCount = video.LikesCount,
                dislikesCount = video.DislikesCount,
                commentsCount = video.CommentsCount
            });
        }
    }
}
