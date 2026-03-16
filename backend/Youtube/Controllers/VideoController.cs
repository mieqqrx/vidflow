using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Youtube.DTOs;
using Youtube.Services;

[ApiController]
[Route("api/videos")]
public class VideoController : ControllerBase
{
    private readonly IVideoService _videoService;
    private readonly IChannelService _channelService;

    public VideoController(IVideoService videoService, IChannelService channelService)
    {
        _videoService = videoService;
        _channelService = channelService;
    }

    [Authorize]
    [HttpPost("upload")]
    [RequestSizeLimit(500_000_000)]
    public async Task<IActionResult> Upload([FromForm] UploadVideoDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var channel = await _channelService.GetChannelByUserIdAsync(userId);
        if (channel == null)
            return BadRequest(new { message = "You don't have a channel" });

        string? customThumbnailPath = null;
        if (dto.CustomThumbnail != null)
        {
            customThumbnailPath = Path.Combine(
                Path.GetTempPath(),
                $"{Guid.NewGuid()}_thumb{Path.GetExtension(dto.CustomThumbnail.FileName)}"
            );
            using var thumbStream = System.IO.File.Create(customThumbnailPath);
            await dto.CustomThumbnail.CopyToAsync(thumbStream);
        }

        var (success, message, videoId) = await _videoService.UploadVideoAsync(
            dto.File, dto.Title, dto.Description,
            channel.Id, dto.CategoryId, dto.AgeRestriction,
            dto.Visibility,
            customThumbnailPath);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message, videoId });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetVideo(Guid id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

        var video = await _videoService.GetVideoByIdAsync(id, userId);
        if (video == null)
            return NotFound();

        return Ok(video);
    }

    [HttpGet("channel/{channelId}")]
    public async Task<IActionResult> GetChannelVideos(Guid channelId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

        var videos = await _videoService.GetVideosByChannelAsync(channelId, userId);
        return Ok(videos);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _videoService.GetCategoriesAsync();
        return Ok(categories);
    }

    [Authorize]
    [HttpPut("{id}")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UpdateVideo(Guid id, [FromForm] UpdateVideoDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _videoService.UpdateVideoAsync(id, userId, dto);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [Authorize]
    [HttpPost("{id}/trim")]
    public async Task<IActionResult> TrimVideo(Guid id, [FromBody] TrimVideoDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _videoService.TrimVideoAsync(id, userId, dto);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVideo(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _videoService.DeleteVideoAsync(id, userId);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [Authorize]
    [HttpPost("shorts/upload")]
    [RequestSizeLimit(200_000_000)]
    public async Task<IActionResult> UploadShort([FromForm] UploadVideoDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var channel = await _channelService.GetChannelByUserIdAsync(userId);
        if (channel == null)
            return BadRequest(new { message = "You don't have a channel" });

        string? customThumbnailPath = null;
        if (dto.CustomThumbnail != null)
        {
            customThumbnailPath = Path.Combine(
                Path.GetTempPath(),
                $"{Guid.NewGuid()}_thumb{Path.GetExtension(dto.CustomThumbnail.FileName)}"
            );
            using var thumbStream = System.IO.File.Create(customThumbnailPath);
            await dto.CustomThumbnail.CopyToAsync(thumbStream);
        }

        var (success, message, videoId) = await _videoService.UploadVideoAsync(
            dto.File, dto.Title, dto.Description,
            channel.Id, dto.CategoryId, dto.AgeRestriction,
            dto.Visibility, customThumbnailPath, isShort: true);

        if (!success) return BadRequest(new { message });
        return Ok(new { message, videoId });
    }

    [HttpGet("shorts")]
    public async Task<IActionResult> GetShorts([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var shorts = await _videoService.GetShortsAsync(page, pageSize);
        return Ok(shorts);
    }

    [HttpGet("shorts/channel/{channelId}")]
    public async Task<IActionResult> GetChannelShorts(Guid channelId)
    {
        var shorts = await _videoService.GetChannelShortsAsync(channelId);
        return Ok(shorts);
    }
}