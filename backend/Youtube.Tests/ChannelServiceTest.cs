using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Youtube.DTOs;
using Youtube.Models;
using Youtube.Services;

namespace Youtube.Tests
{
    public class ChannelServiceTest : IDisposable
    {
        private readonly SqliteConnection _connection;

        public ChannelServiceTest()
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
        public async Task CreateChannel_ShouldFailIfUserAlreadyHasChannel()
        {
            using var context = GetDbContext();
            var s3Mock = new Mock<IS3Service>();
            var esMock = new Mock<IElasticsearchService>();
            var userId = Guid.NewGuid();

            context.Users.Add(new User { Id = userId, Username = "owner", Email = "test@u.com" });
            context.Channels.Add(new Channel { OwnerId = userId, Name = "Existed Channel" });
            await context.SaveChangesAsync();

            var service = new ChannelService(context, s3Mock.Object, esMock.Object);
            var dto = new CreateChannelDto { Name = "New Channel" };
            var result = await service.CreateChannelAsync(dto, userId);
            Assert.False(result.Success);
            Assert.Equal("You already have a channel", result.Message);
        }

        [Fact]
        public async Task DeleteChannel_ShouldDeleteFilesFromS3()
        {
            using var context = GetDbContext();
            var s3Mock = new Mock<IS3Service>();
            var esMock = new Mock<IElasticsearchService>();
            var userId = Guid.NewGuid();
            var channelId = Guid.NewGuid();
            var videoId = Guid.NewGuid();

            context.Users.Add(new User { Id = userId, Username = "owner" });
            var channel = new Channel { Id = channelId, OwnerId = userId, Name = "channel" };
            var video = new Video { Id = videoId, ChannelId = channelId, Title = "Video" };

            context.Channels.Add(channel);
            context.Videos.Add(video);
            await context.SaveChangesAsync();

            s3Mock.Setup(s => s.ListFilesAsync(It.IsAny<string>(), "videos"))
                .ReturnsAsync(new List<string> { $"{videoId}/quality_1080.mp4" });
            var service = new ChannelService(context, s3Mock.Object, esMock.Object);
            var result = await service.DeleteChannelAsync(channelId, userId);
            
            Assert.True(result.Success);
            s3Mock.Verify(d => d.DeleteFileAsync(It.IsAny<string>(), "videos"), Times.AtLeastOnce);
            esMock.Verify(es => es.DeleteChannelAsync(channelId), Times.Once);
        }

        [Fact]
        public async Task SetFeaturedVideo_VideoFromAnotherUser_ShouldFail()
        {
            using var context = GetDbContext();
            var s3Mock = new Mock<IS3Service>();
            var esMock = new Mock<IElasticsearchService>();

            var userId = Guid.NewGuid();
            var myChannelId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();
            var otherChannelId = Guid.NewGuid();
            var otherVideoId = Guid.NewGuid();

           
            context.Users.Add(new User { Id = userId, Username = "me" ,Email="123@gmail.com"});
            context.Channels.Add(new Channel { Id = myChannelId, OwnerId = userId, Name = "MyChannel" });
            context.Users.Add(new User { Id = otherUserId, Username = "other", Email="123@test.com"});
            context.Channels.Add(new Channel { Id = otherChannelId, OwnerId = otherUserId, Name = "OtherChannel" });
            context.Videos.Add(new Video
            {
                Id = otherVideoId,
                ChannelId = otherChannelId,
                Title = "other video",
                Status = VideoStatus.Ready,
            });

            await context.SaveChangesAsync();
            var service = new ChannelService(context, s3Mock.Object, esMock.Object);
            var result = await service.SetFeaturedVideoAsync(myChannelId, userId, otherVideoId);
            Assert.False(result.Success);
            Assert.Equal("Video not found or doesn't belong to this channel", result.Message);

            var channelInDb = await context.Channels.FindAsync(myChannelId);
            Assert.Null(channelInDb?.FeaturedVideoId);
        }
    }
}