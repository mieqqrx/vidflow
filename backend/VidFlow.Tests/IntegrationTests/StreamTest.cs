using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using VidFlow.DTOs;
using VidFlow.Models;
using Xunit;

public class StreamIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public StreamIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task StreamTest()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.LiveStreams.RemoveRange(db.LiveStreams);
            await db.SaveChangesAsync();
        }

        var loginResp = await _client.PostAsJsonAsync("/api/auth/login", new LoginDto
        {
            Email = "test@gmail.com",
            Password = "test123"
        });
        var authJson = await loginResp.Content.ReadFromJsonAsync<JsonElement>();
        var token = authJson.GetProperty("token").GetString();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createDto = new CreateLiveStreamDto { Title = "Test", Description = "Test" };
        var createResp = await _client.PostAsJsonAsync("/api/streams", createDto);
        createResp.EnsureSuccessStatusCode();

        var stream = await createResp.Content.ReadFromJsonAsync<LiveStreamResponseDto>();
        string streamKey = stream!.StreamKey;

        try
        {
            var formContent = new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("name", streamKey) });
            var publishResp = await _client.PostAsync("/api/streams/on-publish", formContent);
            Assert.Equal(HttpStatusCode.OK, publishResp.StatusCode);

            var updatedStream = await _client.GetFromJsonAsync<LiveStreamResponseDto>($"/api/streams/{stream.Id}");
            Assert.Equal(LiveStreamStatus.Live, updatedStream!.Status);
        }
        finally
        {
            var doneContent = new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("name", streamKey) });
            await _client.PostAsync("/api/streams/on-publish-done", doneContent);
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var s = await db.LiveStreams.FindAsync(stream.Id);
                if (s != null)
                {
                    db.LiveStreams.Remove(s);
                    await db.SaveChangesAsync();
                }
            }
        }
    }
}