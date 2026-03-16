using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Youtube.DTOs;
using Youtube.Services;

[ApiController]
[Route("api/history")]
[Authorize]
public class WatchHistoryController : ControllerBase
{
    private readonly IWatchHistoryService _historyService;

    public WatchHistoryController(IWatchHistoryService historyService)
    {
        _historyService = historyService;
    }

    [HttpPost("position")]
    public async Task<IActionResult> UpdatePosition([FromBody] UpdateWatchPositionDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _historyService.UpdatePositionAsync(userId, dto);
        return Ok();
    }

    [HttpGet("position/{videoId}")]
    public async Task<IActionResult> GetPosition(Guid videoId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var position = await _historyService.GetPositionAsync(userId, videoId);

        if (position == null)
            return Ok(new VideoPositionDto { LastPositionSeconds = 0 });

        return Ok(position);
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory([FromQuery] int page = 1)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var history = await _historyService.GetHistoryAsync(userId, page);
        return Ok(history);
    }

    [HttpDelete("{videoId}")]
    public async Task<IActionResult> DeleteItem(Guid videoId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _historyService.DeleteHistoryItemAsync(userId, videoId);
        return Ok();
    }

    [HttpDelete]
    public async Task<IActionResult> ClearHistory()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _historyService.ClearHistoryAsync(userId);
        return Ok();
    }
}