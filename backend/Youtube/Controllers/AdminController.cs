using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Youtube.DTOs;
using Youtube.Models;
using Youtube.Services;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin,Moderator")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IVideoService _videoService;
    private readonly IChannelService _channelService;

    public AdminController(AppDbContext context, IVideoService videoService, IChannelService channelService)
    {
        _context = context;
        _videoService = videoService;
        _channelService = channelService;
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports(
        [FromQuery] ReportStatus? status = null,
        [FromQuery] int page = 1)
    {
        const int pageSize = 20;

        var query = _context.VideoReports
            .Include(vr => vr.Reporter)
            .Include(vr => vr.TargetVideo)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(vr => vr.Status == status);

        var reports = await query
            .OrderByDescending(vr => vr.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(vr => new
            {
                vr.Id,
                vr.Reason,
                vr.Details,
                vr.Status,
                vr.ModeratorNote,
                vr.CreatedAt,
                vr.ReviewedAt,
                Reporter = new { vr.Reporter.Id, vr.Reporter.Username },
                Video = new
                {
                    vr.TargetVideo.Id,
                    vr.TargetVideo.Title,
                    vr.TargetVideo.ThumbnailUrl
                }
            })
            .ToListAsync();

        return Ok(reports);
    }

    [HttpPut("reports/{id}")]
    public async Task<IActionResult> ReviewReport(Guid id, [FromBody] ReviewReportDto dto)
    {
        var moderatorId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var report = await _context.VideoReports
            .Include(vr => vr.TargetVideo)
            .FirstOrDefaultAsync(vr => vr.Id == id);

        if (report == null) return NotFound();

        report.Status = dto.Status;
        report.ModeratorNote = dto.ModeratorNote;
        report.ReviewedByModeratorId = moderatorId;
        report.ReviewedAt = DateTime.UtcNow;

        if (dto.Status == ReportStatus.VideoRemoved)
        {
            var ownerId = await _context.Channels
                .Where(c => c.Id == report.TargetVideo.ChannelId)
                .Select(c => c.OwnerId)
                .FirstOrDefaultAsync();

            await _videoService.DeleteVideoAsync(report.TargetVideoId, ownerId);
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Report reviewed" });
    }

    [HttpGet("videos")]
    public async Task<IActionResult> GetVideos(
        [FromQuery] string? search = null,
        [FromQuery] VideoStatus? status = null,
        [FromQuery] int page = 1)
    {
        const int pageSize = 20;

        var query = _context.Videos
            .Include(v => v.Channel)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(v => v.Title.ToLower().Contains(search.ToLower()));

        if (status.HasValue)
            query = query.Where(v => v.Status == status);

        var videos = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new
            {
                v.Id,
                v.Title,
                v.ThumbnailUrl,
                v.Status,
                v.Visibility,
                v.ViewsCount,
                v.LikesCount,
                v.DislikesCount,
                v.CommentsCount,
                v.CreatedAt,
                Channel = new { v.Channel.Id, v.Channel.Name },
                ReportsCount = _context.VideoReports
                    .Count(vr => vr.TargetVideoId == v.Id && vr.Status == ReportStatus.Pending)
            })
            .ToListAsync();

        var total = await query.CountAsync();

        return Ok(new { videos, total, page, pageSize });
    }

    [HttpDelete("videos/{id}")]
    public async Task<IActionResult> DeleteVideo(Guid id)
    {
        var video = await _context.Videos
            .Include(v => v.Channel)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (video == null) return NotFound();

        var (success, message) = await _videoService.DeleteVideoAsync(id, video.Channel.OwnerId);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message = "Video deleted by moderator" });
    }

    [HttpPut("videos/{id}/visibility")]
    public async Task<IActionResult> SetVideoVisibility(Guid id, [FromBody] SetVideoVisibilityDto dto)
    {
        var (success, message) = await _videoService.AdminSetVisibilityAsync(id, dto.Visibility);
        if (!success) return NotFound();
        return Ok(new { message });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("channels")]
    public async Task<IActionResult> GetChannels(
        [FromQuery] string? search = null,
        [FromQuery] int page = 1)
    {
        const int pageSize = 20;

        var query = _context.Channels
            .Include(c => c.Owner)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.ToLower().Contains(search.ToLower()));

        var channels = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.BannerUrl,
                c.SubscribersCount,
                c.CreatedAt,
                Owner = new { c.Owner.Id, c.Owner.Username, c.Owner.Email },
                VideosCount = _context.Videos.Count(v => v.ChannelId == c.Id)
            })
            .ToListAsync();

        var total = await query.CountAsync();

        return Ok(new { channels, total, page, pageSize });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("channels/{id}")]
    public async Task<IActionResult> DeleteChannel(Guid id)
    {
        var channel = await _context.Channels
            .Include(c => c.Videos)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (channel == null) return NotFound();

        var (success, message) = await _channelService.DeleteChannelAsync(id, channel.OwnerId);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message = "Channel deleted by admin" });
    }


    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search = null,
        [FromQuery] UserRole? role = null,
        [FromQuery] int page = 1)
    {
        const int pageSize = 20;

        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u =>
                u.Username.ToLower().Contains(search.ToLower()) ||
                u.Email.ToLower().Contains(search.ToLower()));

        if (role.HasValue)
            query = query.Where(u => u.Role == role);

        var users = await query
            .OrderByDescending(u => u.RegistrationDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.Role,
                u.AvatarUrl,
                u.RegistrationDate,
                u.TotalViewsCount,
                HasChannel = _context.Channels.Any(c => c.OwnerId == u.Id)
            })
            .ToListAsync();

        var total = await query.CountAsync();

        return Ok(new { users, total, page, pageSize });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> SetUserRole(Guid id, [FromBody] SetUserRoleDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        if (id == userId)
            return BadRequest(new { message = "Cannot change your own role" });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (user.Role == UserRole.Admin && dto.Role != UserRole.Admin)
            return Forbid();

        user.Role = dto.Role;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Role updated to {dto.Role}" });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        if (id == userId)
            return BadRequest(new { message = "Cannot delete yourself" });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (user.Role == UserRole.Admin)
            return Forbid();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User deleted" });
    }


    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        return Ok(new
        {
            totalUsers = await _context.Users.CountAsync(),
            totalVideos = await _context.Videos.CountAsync(),
            totalChannels = await _context.Channels.CountAsync(),
            pendingReports = await _context.VideoReports
                .CountAsync(vr => vr.Status == ReportStatus.Pending),
            totalViews = await _context.Videos.SumAsync(v => v.ViewsCount),
            totalComments = await _context.Comments.CountAsync(),
            newUsersToday = await _context.Users
                .CountAsync(u => u.RegistrationDate >= DateTime.UtcNow.AddDays(-1)),
            newVideosToday = await _context.Videos
                .CountAsync(v => v.CreatedAt >= DateTime.UtcNow.AddDays(-1))
        });
    }
}