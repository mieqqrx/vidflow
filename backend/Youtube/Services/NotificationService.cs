using Microsoft.EntityFrameworkCore;
using Youtube.DTOs;
using Youtube.Models;

namespace Youtube.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;

        public NotificationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task NotifyNewVideoAsync(Video video, Channel channel)
        {
            var subscribers = await _context.Subscriptions
                .Where(s => s.ChannelId == channel.Id && s.NotificationEnabled)
                .Include(s => s.User)
                .ToListAsync();

            var notificationType = video.IsShort ? NotificationType.NewShort : NotificationType.NewVideo;
            var message = video.IsShort
                ? $"{channel.Name} posted a new short: {video.Title}"
                : $"{channel.Name} posted a new video: {video.Title}";

            var notifications = subscribers
                .Where(s => s.User.NotifyOnNewVideo)
                .Select(s => new Notification
                {
                    UserId = s.UserId,
                    Type = notificationType,
                    VideoId = video.Id,
                    ChannelId = channel.Id,
                    Message = message,
                    ThumbnailUrl = video.ThumbnailUrl,
                    ActorName = channel.Name,
                    ActorAvatarUrl = channel.BannerUrl
                })
                .ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }

        public async Task NotifyVideoReadyAsync(Guid channelOwnerId, Video video)
        {
            var user = await _context.Users.FindAsync(channelOwnerId);
            if (user == null || !user.NotifyOnVideoReady) return;

            _context.Notifications.Add(new Notification
            {
                UserId = channelOwnerId,
                Type = NotificationType.VideoReady,
                VideoId = video.Id,
                Message = $"Your video \"{video.Title}\" is ready to watch",
                ThumbnailUrl = video.ThumbnailUrl,
                ActorName = "YouTube"
            });

            await _context.SaveChangesAsync();
        }

        public async Task NotifyCommentReplyAsync(Comment reply, Comment parentComment)
        {
            if (reply.UserId == parentComment.UserId) return;

            var parentAuthor = await _context.Users.FindAsync(parentComment.UserId);
            if (parentAuthor == null || !parentAuthor.NotifyOnCommentReply) return;

            var replyAuthor = await _context.Users.FindAsync(reply.UserId);

            _context.Notifications.Add(new Notification
            {
                UserId = parentComment.UserId,
                Type = NotificationType.CommentReply,
                VideoId = reply.VideoId,
                CommentId = reply.Id,
                Message = $"{replyAuthor?.Username} replied to your comment",
                ActorName = replyAuthor?.Username,
                ActorAvatarUrl = replyAuthor?.AvatarUrl
            });

            await _context.SaveChangesAsync();
        }

        public async Task NotifyMentionsAsync(Comment comment, string text)
        {
            var mentions = ExtractMentions(text);
            if (!mentions.Any()) return;

            var commentAuthor = await _context.Users.FindAsync(comment.UserId);

            foreach (var username in mentions)
            {
                var mentionedUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == username);

                if (mentionedUser == null) continue;
                if (mentionedUser.Id == comment.UserId) continue; 
                if (!mentionedUser.NotifyOnMention) continue;

                _context.Notifications.Add(new Notification
                {
                    UserId = mentionedUser.Id,
                    Type = NotificationType.CommentMention,
                    VideoId = comment.VideoId,
                    CommentId = comment.Id,
                    Message = $"{commentAuthor?.Username} mentioned you in a comment",
                    ActorName = commentAuthor?.Username,
                    ActorAvatarUrl = commentAuthor?.AvatarUrl
                });
            }

            await _context.SaveChangesAsync();
        }

        private List<string> ExtractMentions(string text)
        {
            var mentions = new List<string>();
            var words = text.Split(' ', '\n');

            foreach (var word in words)
            {
                if (word.StartsWith("@") && word.Length > 1)
                {
                    var username = word.Substring(1).Trim('@', ',', '.', '!', '?');
                    if (!string.IsNullOrEmpty(username))
                        mentions.Add(username);
                }
            }

            return mentions.Distinct().ToList();
        }

        public async Task<IEnumerable<NotificationResponseDto>> GetNotificationsAsync(
            Guid userId, int page = 1)
        {
            const int pageSize = 20;

            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new NotificationResponseDto
                {
                    Id = n.Id,
                    Type = n.Type,
                    Message = n.Message,
                    ThumbnailUrl = n.ThumbnailUrl,
                    ActorName = n.ActorName,
                    ActorAvatarUrl = n.ActorAvatarUrl,
                    VideoId = n.VideoId,
                    CommentId = n.CommentId,
                    ChannelId = n.ChannelId,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    IsShort = n.VideoId != null && n.Video != null && n.Video.IsShort
                })
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(Guid userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task MarkAsReadAsync(Guid userId, Guid notificationId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null) return;

            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }

        public async Task MarkAllAsReadAsync(Guid userId)
        {
            await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        }

        public async Task DeleteNotificationAsync(Guid userId, Guid notificationId)
        {
            await _context.Notifications
                .Where(n => n.Id == notificationId && n.UserId == userId)
                .ExecuteDeleteAsync();
        }

        public async Task DeleteAllNotificationsAsync(Guid userId)
        {
            await _context.Notifications
                .Where(n => n.UserId == userId)
                .ExecuteDeleteAsync();
        }

        public async Task DeleteManyNotificationsAsync(Guid userId, List<Guid> notificationIds)
        {
            await _context.Notifications
                .Where(n => n.UserId == userId && notificationIds.Contains(n.Id))
                .ExecuteDeleteAsync();
        }

        public async Task NotifyLiveStreamStartedAsync(Channel channel, LiveStream stream)
        {
            var subscribers = await _context.Subscriptions
                .Where(s => s.ChannelId == channel.Id)
                .Select(s => s.UserId)
                .ToListAsync();

            var notifications = subscribers.Select(userId => new Notification
            {
                UserId = userId,
                Type = NotificationType.LiveStreamStarted,
                Message = $"{channel.Name} began the live broadcast: {stream.Title}",
                ChannelId = channel.Id,
                ActorName = channel.Name,
                ActorAvatarUrl = channel.Owner?.AvatarUrl
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }
    }
}