using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using VidFlow.DTOs;
using VidFlow.Services;

namespace VidFlow.Tests
{
    public class AuthServiceTests
    {
        private readonly SqliteConnection _connection;

        public AuthServiceTests()
        {
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();
        }

        private AppDbContext GetDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_connection)
                .Options;
            var context = new AppDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }

        public void Dispose()
        {
            _connection.Close();
        }

        [Fact]
        public async Task Register_Fail_IfEmailAlreadyExists()
        {
            using var context = GetDbContext();
            var existingUser = new User { Username = "old_user", Email = "test@test.com", PasswordHash = "123" };
            context.Users.Add(existingUser);
            await context.SaveChangesAsync();
            var playlistMock = new Mock<IPlaylistService>();
            var s3Mock = new Mock<IS3Service>();
            var configMock = new Mock<IConfiguration>();
            var service = new AuthService(context, configMock.Object, playlistMock.Object, s3Mock.Object);
            var registerDto = new RegisterDto { Email = "test@test.com", Username = "new_user", Password = "password123" };

            var (success, message) = await service.RegisterAsync(registerDto);
            Assert.False(success);
            Assert.Equal("Email already in use", message);
        }

        [Fact]
        public async Task ChangePassword_ShouldFail_IfCurrentPasswordIsIncorrect()
        {
            using var context = GetDbContext();
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("password");
            var userId = Guid.NewGuid();
            context.Users.Add(new User { Id = userId, Email = "user1234@gmail.com", PasswordHash = passwordHash });
            await context.SaveChangesAsync();

            var service = new AuthService(context, null!, null!, null!);
            var changePasswordDto = new ChangePasswordDto
            {
                CurrentPassword = "wrong_user_password",
                NewPassword = "new_password123"
            };
            var (success, message) = await service.ChangePasswordAsync(userId, changePasswordDto);
            Assert.False(success); 
            Assert.Equal("Current password is incorrect", message);
        }

        [Fact]
        public async Task UpdateProfile_ShouldChangeUsername_IfItIsAvailable()
        {
            using var context = GetDbContext();
            var userId = Guid.NewGuid();
            context.Users.Add(new User { Id = userId, Username = "old_name", Email = "name@gmail.com" });
            await context.SaveChangesAsync();

            var service = new AuthService(context, null!, null!, null!);
            var updateDto = new UpdateUserProfileDto { Username = "new_unique_name" };

            var (success, message) = await service.UpdateProfileAsync(userId, updateDto);
            Assert.True(success);
            var updatedUser = await context.Users.FindAsync(userId);
            Assert.Equal("new_unique_name", updatedUser?.Username);
        }
    }
}