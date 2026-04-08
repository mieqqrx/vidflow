using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VidFlow.DTOs;
using VidFlow.Services;

namespace VidFlow.Controllers
{
    [ApiController]
    [Route("api/channels")]
    public class ChannelController : ControllerBase
    {
        private readonly IChannelService _channelService;

        public ChannelController(IChannelService channelService)
        {
            _channelService = channelService;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateChannel([FromBody] CreateChannelDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await _channelService.CreateChannelAsync(dto, userId);

            if (!success)
                return Conflict(new { message });

            return Ok(new { message });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetChannel(Guid id)
        {
            var channel = await _channelService.GetChannelByIdAsync(id);

            if (channel == null)
                return NotFound();

            return Ok(channel);
        }

        [HttpGet("by-user/{userId}")]
        public async Task<IActionResult> GetChannelByUserId(Guid userId)
        {
            var channel = await _channelService.GetChannelByUserIdAsync(userId);
            if (channel == null)
                return NotFound();
            return Ok(channel);
        }

        [Authorize]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyChannel()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var channel = await _channelService.GetChannelByUserIdAsync(userId);

            if (channel == null)
                return NotFound(new { message = "You don't have a channel yet" });

            return Ok(channel);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChannel(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await _channelService.DeleteChannelAsync(id, userId);

            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }

        [Authorize]
        [HttpPut("{id}/featured")]
        public async Task<IActionResult> SetFeaturedVideo(Guid id, [FromBody] SetFeaturedVideoDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await _channelService.SetFeaturedVideoAsync(id, userId, dto.VideoId);

            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateChannel(Guid id, [FromForm] UpdateChannelDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await _channelService.UpdateChannelAsync(id, userId, dto);

            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }
    }
}
