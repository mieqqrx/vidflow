using Microsoft.AspNetCore.Mvc;
using Youtube.DTOs;
using Youtube.Services;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly IElasticsearchService _elasticsearchService;

    public SearchController(IElasticsearchService elasticsearchService)
    {
        _elasticsearchService = elasticsearchService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] SearchVideosDto dto)
    {
        var result = await _elasticsearchService.SearchVideosAsync(dto);
        return Ok(result);
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions([FromQuery] string query)
    {
        if (string.IsNullOrEmpty(query) || query.Length < 2)
            return Ok(Array.Empty<string>());

        var suggestions = await _elasticsearchService.GetSuggestionsAsync(query);
        return Ok(suggestions);
    }

    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    [HttpPost("reindex")]
    public async Task<IActionResult> Reindex()
    {
        await _elasticsearchService.ReindexAllAsync();
        return Ok(new { message = "Reindexing started" });
    }

    [HttpGet("channels")]
    public async Task<IActionResult> SearchChannels(
    [FromQuery] string? query,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20)
    {
        var result = await _elasticsearchService.SearchChannelsAsync(query ?? "", page, pageSize);
        return Ok(result);
    }

    [HttpGet("playlists")]
    public async Task<IActionResult> SearchPlaylists(
        [FromQuery] string? query,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _elasticsearchService.SearchPlaylistsAsync(query ?? "", page, pageSize);
        return Ok(result);
    }

    [HttpGet("shorts")]
    public async Task<IActionResult> SearchShorts([FromQuery] SearchVideosDto dto)
    {
        var result = await _elasticsearchService.SearchShortsAsync(dto);
        return Ok(result);
    }
}