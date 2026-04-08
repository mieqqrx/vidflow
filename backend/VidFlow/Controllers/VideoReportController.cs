using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VidFlow.DTOs;
using VidFlow.Models;
using Microsoft.EntityFrameworkCore;

namespace VidFlow.Controllers
{
    [ApiController]
    [Route("api/videos/{videoId}/report")]
    public class VideoReportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VideoReportController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateReport(Guid videoId, [FromBody] CreateVideoReportDto dto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var videoExists = await _context.Videos.AnyAsync(v => v.Id == videoId);
            if (!videoExists) return NotFound();

            var alreadyReported = await _context.VideoReports
                .AnyAsync(vr => vr.ReporterId == userId && vr.TargetVideoId == videoId);

            if (alreadyReported)
                return BadRequest(new { message = "You already reported this video" });

            _context.VideoReports.Add(new VideoReport
            {
                ReporterId = userId,
                TargetVideoId = videoId,
                Reason = dto.Reason,
                Details = dto.Details
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Report submitted" });
        }
    }
}
