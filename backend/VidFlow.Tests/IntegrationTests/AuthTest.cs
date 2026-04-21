using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using VidFlow.DTOs;
using VidFlow.Models;
using Xunit;

namespace VidFlow.IntegrationTests;

public class AuthApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public AuthApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((context, config) =>
            {
                var configPath = Path.Combine(Directory.GetCurrentDirectory(), "../../../../../backend/VidFlow/appsettings.json");
                config.AddJsonFile(configPath, optional: true);
                config.AddEnvironmentVariables();
            });
        });
        _client = _factory.CreateClient();
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Register_ShouldSaveToDatabase_WhenDtoIsValid()
    {
        var uniqueEmail = $"test{Guid.NewGuid()}@test.com";
        var registerDto = new RegisterDto
        {
            Username = "Tester",
            Email = uniqueEmail,
            Password = "Password123!",
            DateOfBirth = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new Exception($"error {response.StatusCode}: {errorBody}");
        }
        Assert.True(response.IsSuccessStatusCode);
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
        var savedUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == uniqueEmail);
        Assert.NotNull(savedUser);
        Assert.Equal("Tester", savedUser.Username);
        Assert.NotEqual(registerDto.Password, savedUser.PasswordHash);
        dbContext.Remove(savedUser);
        await dbContext.SaveChangesAsync(); 
    }
}