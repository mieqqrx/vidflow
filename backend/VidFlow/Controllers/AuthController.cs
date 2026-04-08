using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VidFlow.DTOs;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _context;

    public AuthController(IAuthService authService, AppDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, message) = await _authService.RegisterAsync(dto);
        if (!success) return Conflict(new { message });

        return Ok(new { message });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, token, message) = await _authService.LoginAsync(dto);
        if (!success) return Unauthorized(new { message });

        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        var userId = jwt.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value;

        Response.Cookies.Append($"token_{userId}", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new { message = "Login successful", token = token, userId = userId });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        var userId = Guid.Parse(userIdClaim);
        var user = await _authService.GetUserByIdAsync(userId);

        if (user == null) return NotFound();

        return Ok(new UserResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            RegistrationDate = user.RegistrationDate,
            AutoplayEnabled = user.AutoplayEnabled,
            NotifyOnNewVideo = user.NotifyOnNewVideo,
            NotifyOnCommentReply = user.NotifyOnCommentReply,
            NotifyOnMention = user.NotifyOnMention,
            NotifyOnVideoReady = user.NotifyOnVideoReady,
            Role = user.Role
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Request.Headers["X-Active-User"].FirstOrDefault();

        if (!string.IsNullOrEmpty(userId))
        {
            Response.Cookies.Delete($"token_{userId}", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });
        }

        return Ok(new { message = "Logged out" });
    }

    [HttpPost("logout-all")]
    public IActionResult LogoutAll()
    {
        var tokenCookies = Request.Cookies
            .Where(c => c.Key.StartsWith("token_"))
            .ToList();

        foreach (var cookie in tokenCookies)
        {
            Response.Cookies.Delete(cookie.Key, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });
        }

        return Ok(new { message = "All sessions cleared" });
    }

    [Authorize]
    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateUserSettingsDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _authService.UpdateSettingsAsync(userId, dto);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [Authorize]
    [HttpPut("avatar")]
    public async Task<IActionResult> UpdateAvatar([FromForm] UpdateAvatarDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message, avatarUrl) = await _authService.UpdateAvatarAsync(
            userId, dto.Avatar, dto.RemoveAvatar);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message, avatarUrl });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _authService.UpdateProfileAsync(userId, dto);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _authService.ChangePasswordAsync(userId, dto);

        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        try
        {
            var payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(dto.IdToken);
            var (success, token, message) = await _authService.GoogleLoginAsync(
                payload.Subject, payload.Email, payload.Name, payload.Picture);

            if (!success) return Unauthorized(new { message });

            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            var userId = jwt.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value;

            Response.Cookies.Append($"token_{userId}", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Ok(new { message = "Login successful", token = token, userId = userId });
        }
        catch
        {
            return Unauthorized(new { message = "Invalid Google token" });
        }
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetActiveSessions()
    {
        var activeIds = Request.Cookies
            .Where(c => c.Key.StartsWith("token_"))
            .Select(c => Guid.TryParse(c.Key.Replace("token_", ""), out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToList();

        if (!activeIds.Any()) return Ok(new List<object>());

        var users = await _context.Users
            .Where(u => activeIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.AvatarUrl
            })
            .ToListAsync();

        return Ok(users);
    }
}