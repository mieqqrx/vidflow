using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using VidFlow.DTOs;
using VidFlow.Services;

public interface IAuthService
{
    Task<(bool Success, string Message)> RegisterAsync(RegisterDto dto);
    Task<(bool Success, string Token, string Message)> LoginAsync(LoginDto dto);
    Task<User?> GetUserByIdAsync(Guid id);
    Task<(bool Success, string Message, string? AvatarUrl)> UpdateAvatarAsync(Guid userId, IFormFile? avatar, bool remove);
    Task<(bool Success, string Message)> UpdateProfileAsync(Guid userId, UpdateUserProfileDto dto);
    Task<(bool Success, string Message)> UpdateSettingsAsync(Guid userId, UpdateUserSettingsDto dto);
    Task<(bool Success, string Message)> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
    Task<(bool Success, string Token, string Message)> GoogleLoginAsync(string googleId, string email, string name, string? avatarUrl);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPlaylistService _playlistService;
    private readonly IS3Service _s3Service;

    public AuthService(AppDbContext context, IConfiguration configuration,
        IPlaylistService playlistService, IS3Service s3Service)
    {
        _context = context;
        _configuration = configuration;
        _playlistService = playlistService;
        _s3Service = s3Service;
    }

    public async Task<(bool Success, string Token, string Message)> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

        if (user == null)
            return (false, string.Empty, "Invalid email or password");

        bool passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!passwordValid)
            return (false, string.Empty, "Invalid email or password");

        string token = GenerateJwtToken(user);
        return (true, token, "Login successful");
    }

    public async Task<(bool Success, string Message)> RegisterAsync(RegisterDto dto)
    {
        bool emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
        if (emailExists)
            return (false, "Email already in use");

        bool usernameExists = await _context.Users.AnyAsync(u => u.Username == dto.Username);
        if (usernameExists)
            return (false, "Username already taken");

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            DateOfBirth = dto.DateOfBirth,
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await _playlistService.CreateSystemPlaylistsAsync(user.Id);

        return (true, "Registration successful");
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpiresInMinutes"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<User?> GetUserByIdAsync(Guid id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<(bool Success, string Message)> UpdateSettingsAsync(
        Guid userId, UpdateUserSettingsDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (false, "User not found");

        if (dto.AutoplayEnabled.HasValue) user.AutoplayEnabled = dto.AutoplayEnabled.Value;
        if (dto.NotifyOnNewVideo.HasValue) user.NotifyOnNewVideo = dto.NotifyOnNewVideo.Value;
        if (dto.NotifyOnCommentReply.HasValue) user.NotifyOnCommentReply = dto.NotifyOnCommentReply.Value;
        if (dto.NotifyOnMention.HasValue) user.NotifyOnMention = dto.NotifyOnMention.Value;
        if (dto.NotifyOnVideoReady.HasValue) user.NotifyOnVideoReady = dto.NotifyOnVideoReady.Value;

        await _context.SaveChangesAsync();
        return (true, "Settings updated");
    }

    public async Task<(bool Success, string Message, string? AvatarUrl)> UpdateAvatarAsync(
        Guid userId, IFormFile avatar)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (false, "User not found", null);

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(avatar.ContentType))
            return (false, "Only JPEG, PNG, WebP allowed", null);

        if (avatar.Length > 5 * 1024 * 1024)
            return (false, "File size must be less than 5MB", null);

        if (!string.IsNullOrEmpty(user.AvatarUrl))
            try { await _s3Service.DeleteFileAsync($"avatars/{userId}.jpg", "avatars"); } catch { }

        using var stream = avatar.OpenReadStream();
        var avatarUrl = await _s3Service.UploadFileAsync(
            stream,
            $"{userId}/avatar.jpg",
            "avatars",
            avatar.ContentType
        );

        user.AvatarUrl = avatarUrl;
        await _context.SaveChangesAsync();

        return (true, "Avatar updated", avatarUrl);
    }

    public async Task<(bool Success, string Message, string? AvatarUrl)> UpdateAvatarAsync(
        Guid userId, IFormFile? avatar, bool remove)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (false, "User not found", null);

        if (!string.IsNullOrEmpty(user.AvatarUrl))
            try { await _s3Service.DeleteFileAsync($"{userId}/avatar.jpg", "avatars"); } catch { }

        if (remove)
        {
            user.AvatarUrl = null;
            await _context.SaveChangesAsync();
            return (true, "Avatar removed", null);
        }

        if (avatar == null)
            return (false, "No file provided", null);

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(avatar.ContentType))
            return (false, "Only JPEG, PNG, WebP allowed", null);

        if (avatar.Length > 5 * 1024 * 1024)
            return (false, "File size must be less than 5MB", null);

        using var stream = avatar.OpenReadStream();
        var avatarUrl = await _s3Service.UploadFileAsync(
            stream,
            $"{userId}/avatar.jpg",
            "avatars",
            avatar.ContentType
        );

        user.AvatarUrl = avatarUrl;
        await _context.SaveChangesAsync();

        return (true, "Avatar updated", avatarUrl);
    }

    public async Task<(bool Success, string Message)> UpdateProfileAsync(
        Guid userId, UpdateUserProfileDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (false, "User not found");

        if (dto.Username != null)
        {
            var taken = await _context.Users
                .AnyAsync(u => u.Username == dto.Username && u.Id != userId);
            if (taken)
                return (false, "Username already taken");

            user.Username = dto.Username;
        }

        if (dto.Bio != null)
            user.Bio = dto.Bio;

        await _context.SaveChangesAsync();
        return (true, "Profile updated");
    }

    public async Task<(bool Success, string Message)> ChangePasswordAsync(
        Guid userId, ChangePasswordDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return (false, "User not found");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return (false, "Current password is incorrect");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return (true, "Password changed successfully");
    }

    public async Task<(bool Success, string Token, string Message)> GoogleLoginAsync(
    string googleId, string email, string name, string? avatarUrl)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);

        if (user == null)
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());

            if (user != null)
            {
                user.GoogleId = googleId;
                if (user.AvatarUrl == null && avatarUrl != null)
                    user.AvatarUrl = avatarUrl;
                await _context.SaveChangesAsync();
            }
            else
            {
                var username = await GenerateUniqueUsernameAsync(name);

                user = new User
                {
                    Username = username,
                    Email = email.ToLower(),
                    GoogleId = googleId,
                    AvatarUrl = avatarUrl,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    DateOfBirth = DateTime.UtcNow 
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                await _playlistService.CreateSystemPlaylistsAsync(user.Id);
            }
        }

        var token = GenerateJwtToken(user);
        return (true, token, "Login successful");
    }

    private async Task<string> GenerateUniqueUsernameAsync(string name)
    {
        var base_name = new string(name.Where(c => char.IsLetterOrDigit(c)).ToArray());
        if (string.IsNullOrEmpty(base_name)) base_name = "user";

        var username = base_name;
        var counter = 1;

        while (await _context.Users.AnyAsync(u => u.Username == username))
        {
            username = $"{base_name}{counter}";
            counter++;
        }

        return username;
    }
}