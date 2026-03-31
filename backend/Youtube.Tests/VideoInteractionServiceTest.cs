using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using Youtube.Models;
using Youtube.Services;

namespace Youtube.Tests
{
    public class VideoInteractionServiceTest : IDisposable
    {
        private readonly SqliteConnection _connection;

        public VideoInteractionServiceTest()
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

        public void Dispose() => _connection.Close();

        [Fact]
        public async Task ToggleLike_ShouldSyncWithLikedPlaylist()
        {
            using var context = GetDbContext();
            var playlistMock = new Mock<IPlaylistService>();
            var esMock = new Mock<IElasticsearchService>();

            var userId = Guid.NewGuid();
            var channelId = Guid.NewGuid();
            var videoId = Guid.NewGuid();
            context.Users.Add(new User { Id = userId, Username = "user1", Email = "u1@test.com" });
            context.Channels.Add(new Channel { Id = channelId, OwnerId = userId, Name = "Ch" });
            context.Videos.Add(new Video { Id = videoId, ChannelId = channelId, Title = "Test Video" });
            await context.SaveChangesAsync();

            var service = new VideoInteractionService(context, playlistMock.Object, esMock.Object);

            await service.ToggleLikeAsync(userId, videoId);

            playlistMock.Verify(l => l.SyncLikedPlaylistAsync(userId, videoId, true), Times.Once);
        }

        [Fact]
        public async Task RecordView_ShouldNotIncreaseCount_IfUserViewedRecently()
        {
            using var context = GetDbContext();
            var userId = Guid.NewGuid();
            var channelId = Guid.NewGuid();
            var videoId = Guid.NewGuid();

            context.Users.Add(new User { Id = userId, Username = "viewer", Email = "v@test.com" });
            context.Channels.Add(new Channel { Id = channelId, OwnerId = userId, Name = "Channel" });
            context.Videos.Add(new Video { Id = videoId, ChannelId = channelId, Title = "Video", ViewsCount = 1 });

            context.VideoViews.Add(new VideoView
            {
                Id = Guid.NewGuid(),
                VideoId = videoId,
                UserId = userId,
                ViewedAt = DateTime.UtcNow.AddHours(-1)
            });

            await context.SaveChangesAsync();

            var service = new VideoInteractionService(context, new Mock<IPlaylistService>().Object, new Mock<IElasticsearchService>().Object);

            await service.RecordViewAsync(videoId, userId);

            var videoInDb = await context.Videos.FindAsync(videoId);
            Assert.Equal(1, videoInDb?.ViewsCount);
        }

        [Fact]
        public async Task ToggleLike_ShouldRemoveDislike_IfItExists()
        {
            using var context = GetDbContext();
            var userId = Guid.NewGuid();
            var channelId = Guid.NewGuid();
            var videoId = Guid.NewGuid();

            context.Users.Add(new User { Id = userId, Username = "testuser", Email = "like@test.com" });
            context.Channels.Add(new Channel { Id = channelId, OwnerId = userId, Name = "Test Channel" });
            context.Videos.Add(new Video { Id = videoId, ChannelId = channelId, Title = "Test Video", DislikesCount = 1 });

            context.VideoDisLikes.Add(new VideoDislike { UserId = userId, VideoId = videoId });
            await context.SaveChangesAsync();

            var service = new VideoInteractionService(context, new Mock<IPlaylistService>().Object, new Mock<IElasticsearchService>().Object);

            var result = await service.ToggleLikeAsync(userId, videoId);

            Assert.True(result.IsLiked);
            var video = await context.Videos.FindAsync(videoId);
            Assert.Equal(1, video.LikesCount);
            Assert.Equal(0, video.DislikesCount); 
            Assert.Empty(context.VideoDisLikes);
        }
    }
}