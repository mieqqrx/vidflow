using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Youtube.Services;

namespace Youtube.Controllers
{
    [ApiController]
    [Route("api/videos")]
    public class VideoInteractionController : ControllerBase
    {
        private readonly IVideoInteractionService _interactionService;

        public VideoInteractionController(IVideoInteractionService interactionService)
        {
            _interactionService = interactionService;
        }

        [Authorize]
        [HttpPost("{id}/like")]
        public async Task<IActionResult> ToggleLike(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message, isLiked) = await _interactionService.ToggleLikeAsync(userId, id);

            if (!success)
                return NotFound(new { message });

            return Ok(new { message, isLiked });
        }

        [Authorize]
        [HttpGet("{id}/like")]
        public async Task<IActionResult> GetLikeStatus(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var isLiked = await _interactionService.IsLikedAsync(userId, id);

            return Ok(new { isLiked });
        }

        [HttpPost("{id}/view")]
        public async Task<IActionResult> RecordView(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid? userId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

            await _interactionService.RecordViewAsync(id, userId);
            return Ok();
        }

        [Authorize]
        [HttpGet("liked")]
        public async Task<IActionResult> GetLikedVideos()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var videos = await _interactionService.GetLikedVideosAsync(userId);

            return Ok(videos);
        }

        [Authorize]
        [HttpPost("{id}/dislike")]
        public async Task<IActionResult> ToggleDislike(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message, isDisliked) = await _interactionService.ToggleDislikeAsync(userId, id);

            if (!success)
                return NotFound(new { message });

            return Ok(new { message, isDisliked });
        }

        [Authorize]
        [HttpGet("{id}/dislike")]
        public async Task<IActionResult> GetDislikeStatus(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var isDisliked = await _interactionService.IsDislikedAsync(userId, id);

            return Ok(new { isDisliked });
        }
    }
}
