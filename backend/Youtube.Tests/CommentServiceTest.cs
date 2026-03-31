using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Youtube.DTOs;
using Youtube.Models;
using Youtube.Services;
using Youtube.Services.Youtube.Services;

namespace Youtube.Tests
{
    public class CommentServiceTest : IDisposable
    {
        private readonly SqliteConnection _connection;

        public CommentServiceTest()
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
        public async Task CreateComment_ShouldNotifyMentions_WhenCommentIsCreated()
        {
            using var context = GetDbContext();
            var notificationMock = new Mock<INotificationService>();
            var userId = Guid.NewGuid();
            var channelId = Guid.NewGuid();
            var videoId = Guid.NewGuid();
            var user = new User { Id = userId, Username = "test_user" };
            context.Users.Add(user);

            var channel = new Channel { Id = channelId, OwnerId = userId, Name = "Test Channel" };
            context.Channels.Add(channel);
            context.Videos.Add(new Video
            {
                Id = videoId,
                ChannelId = channelId,
                Title = "Test Video",
                CommentsCount = 0
            });

            await context.SaveChangesAsync();

            var service = new CommentService(context, notificationMock.Object);
            var dto = new CreateCommentDto { VideoId = videoId, Text = "Hello @admin!" };
            var result = await service.CreateCommentAsync(userId, dto);
            Assert.True(result.Success);
            notificationMock.Verify(n => n.NotifyMentionsAsync(It.IsAny<Comment>(), "Hello @admin!"), Times.Once);
        }

        [Fact]
        public async Task CreateComment_UserDoesNotExist_ShouldNotAllowCommenting()
        {
            using var context = GetDbContext();
            var notificationMock = new Mock<INotificationService>();

            var realUserId = Guid.NewGuid();
            var channelId = Guid.NewGuid();
            var videoId = Guid.NewGuid();
            var nonExistentUserId = Guid.NewGuid();
            context.Users.Add(new User { Id = realUserId, Username = "real_user" });
            context.Channels.Add(new Channel { Id = channelId, OwnerId = realUserId, Name = "Channel" });
            context.Videos.Add(new Video { Id = videoId, ChannelId = channelId, Title = "Safe Video" });
            await context.SaveChangesAsync();

            var service = new CommentService(context, notificationMock.Object);
            var dto = new CreateCommentDto { VideoId = videoId, Text = "I am a ghost" };
            var result = await service.CreateCommentAsync(nonExistentUserId, dto);

            Assert.False(result.Success);
            Assert.Equal("User not found", result.Message);
            Assert.Equal(0, await context.Comments.CountAsync());
        }

        [Fact]
        public async Task DeleteComment_ShouldDecreaseVideoCommentCount_IncludingReplies()
        {
            using var context = GetDbContext();
            var videoId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var channelId = Guid.NewGuid();
             var user = new User { Id = userId, Username = "owner" };
            context.Users.Add(user);
            var channel = new Channel { Id = channelId, OwnerId = userId, Name = "Channel" };
            context.Channels.Add(channel);
            var video = new Video { Id = videoId, ChannelId = channelId, CommentsCount = 1 };
            context.Videos.Add(video);

            var mainComment = new Comment
            {
                Id = Guid.NewGuid(),
                VideoId = videoId,
                UserId = userId,
                Text = "Main comment"
            };
            context.Comments.Add(mainComment);
            await context.SaveChangesAsync();
            var service = new CommentService(context, new Mock<INotificationService>().Object);
            var result = await service.DeleteCommentAsync(userId, mainComment.Id);
            Assert.True(result.Success);
            await context.Entry(video).ReloadAsync();
            Assert.Equal(0, video.CommentsCount);
            Assert.Empty(context.Comments);
        }
    }
}