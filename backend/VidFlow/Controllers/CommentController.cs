using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VidFlow.DTOs;
using VidFlow.Services;

namespace VidFlow.Controllers
{
    [ApiController]
    [Route("api/comments")]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        [HttpGet("video/{videoId}")]
        public async Task<IActionResult> GetVideoComments(Guid videoId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid? userId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

            var comments = await _commentService.GetVideoCommentsAsync(videoId, userId);
            return Ok(comments);
        }

        [HttpGet("{id}/replies")]
        public async Task<IActionResult> GetReplies(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid? userId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

            var replies = await _commentService.GetCommentRepliesAsync(id, userId);
            return Ok(replies);
        }

        [Authorize]
        [HttpPost("{id}/like")]
        public async Task<IActionResult> ToggleLike(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message, isLiked) = await _commentService.ToggleCommentLikeAsync(userId, id);

            if (!success)
                return NotFound(new { message });

            return Ok(new { message, isLiked });
        }

        [Authorize]
        [HttpPost("{id}/dislike")]
        public async Task<IActionResult> ToggleDislike(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message, isDisliked) = await _commentService.ToggleCommentDislikeAsync(userId, id);

            if (!success)
                return NotFound(new { message });

            return Ok(new { message, isDisliked });
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateComment([FromBody] CreateCommentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message, comment) = await _commentService.CreateCommentAsync(userId, dto);

            if (!success)
                return BadRequest(new { message });

            return Ok(new { message, comment });
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateComment(Guid id, [FromBody] UpdateCommentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await _commentService.UpdateCommentAsync(userId, id, dto);

            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await _commentService.DeleteCommentAsync(userId, id);

            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }
    }
}
