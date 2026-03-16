using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Youtube.DTOs;
using Youtube.Services;

[ApiController]
[Route("api/playlists")]
public class PlaylistController : ControllerBase
{
    private readonly IPlaylistService _playlistService;

    public PlaylistController(IPlaylistService playlistService)
    {
        _playlistService = playlistService;
    }

    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyPlaylists()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var playlists = await _playlistService.GetMyPlaylistsAsync(userId);
        return Ok(playlists);
    }

    [HttpGet("channel/{channelId}")]
    public async Task<IActionResult> GetChannelPlaylists(Guid channelId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? requesterId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

        var playlists = await _playlistService.GetPublicPlaylistsByChannelAsync(channelId, requesterId);
        return Ok(playlists);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlaylist(Guid id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? requesterId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

        var playlist = await _playlistService.GetPlaylistByIdAsync(id, requesterId);
        if (playlist == null)
            return NotFound();

        return Ok(playlist);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreatePlaylist([FromBody] CreatePlaylistDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message, playlistId) = await _playlistService.CreatePlaylistAsync(userId, dto);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message, playlistId });
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePlaylist(Guid id, [FromBody] UpdatePlaylistDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _playlistService.UpdatePlaylistAsync(userId, id, dto);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlaylist(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _playlistService.DeletePlaylistAsync(userId, id);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [Authorize]
    [HttpPost("{id}/videos")]
    public async Task<IActionResult> AddVideo(Guid id, [FromBody] AddVideoToPlaylistDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _playlistService.AddVideoAsync(userId, id, dto.VideoId);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [Authorize]
    [HttpDelete("{id}/videos/{playlistVideoId}")]
    public async Task<IActionResult> RemoveVideo(Guid id, Guid playlistVideoId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _playlistService.RemoveVideoAsync(userId, id, playlistVideoId);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }
}