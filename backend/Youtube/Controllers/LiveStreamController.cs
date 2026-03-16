using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Youtube.DTOs;
using Youtube.Services;

namespace Youtube.Controllers
{
    [ApiController]
    [Route("api/streams")]
    public class LiveStreamController : ControllerBase
    {
        private readonly ILiveStreamService _streamService;
        private readonly AppDbContext _context;

        public LiveStreamController(ILiveStreamService streamService, AppDbContext context)
        {
            _streamService = streamService;
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateStream([FromBody] CreateLiveStreamDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message, stream) = await _streamService.CreateStreamAsync(userId, dto);

            if (!success) return BadRequest(new { message });
            return Ok(stream);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStream(Guid id, [FromBody] UpdateLiveStreamDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await _streamService.UpdateStreamAsync(id, userId, dto);

            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStream(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await _streamService.DeleteStreamAsync(id, userId);

            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStream(Guid id)
        {
            var stream = await _streamService.GetStreamByIdAsync(id);
            if (stream == null) return NotFound();
            return Ok(stream);
        }

        [HttpGet("live")]
        public async Task<IActionResult> GetLiveStreams()
        {
            var streams = await _streamService.GetLiveStreamsAsync();
            return Ok(streams);
        }

        [HttpGet("channel/{channelId}")]
        public async Task<IActionResult> GetChannelStreams(Guid channelId)
        {
            var streams = await _streamService.GetChannelStreamsAsync(channelId);
            return Ok(streams);
        }

        [HttpGet("{id}/messages")]
        public async Task<IActionResult> GetMessages(Guid id, [FromQuery] int count = 50)
        {
            var messages = await _context.LiveStreamMessages
                .Where(m => m.StreamId == id)
                .Include(m => m.User)
                .OrderByDescending(m => m.SentAt)
                .Take(count)
                .OrderBy(m => m.SentAt)
                .Select(m => new LiveStreamMessageDto
                {
                    Id = m.Id,
                    Text = m.Text,
                    SentAt = m.SentAt,
                    UserId = m.UserId,
                    Username = m.User.Username,
                    AvatarUrl = m.User.AvatarUrl
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpPost("on-publish")]
        public async Task<IActionResult> OnPublish([FromForm] string name)
        {
            var allowed = await _streamService.OnPublishAsync(name);

            if (!allowed) return Unauthorized();
            return Ok();
        }

        [HttpPost("on-publish-done")]
        public async Task<IActionResult> OnPublishDone([FromForm] string name)
        {
            await _streamService.OnPublishDoneAsync(name);
            return Ok();
        }

        [HttpPost("on-record-done")]
        public async Task<IActionResult> OnRecordDone([FromForm] string name, [FromForm] string path)
        {
            await _streamService.OnRecordDoneAsync(name, path);
            return Ok();
        }

        [Authorize]
        [HttpPut("{id}/thumbnail")]
        [RequestSizeLimit(10_000_000)]
        public async Task<IActionResult> UpdateThumbnail(Guid id, IFormFile thumbnail)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await _streamService.UpdateThumbnailAsync(id, userId, thumbnail);

            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }
    }
}