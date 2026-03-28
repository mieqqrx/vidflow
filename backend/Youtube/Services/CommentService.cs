namespace Youtube.Services
{
    using global::Youtube.DTOs;
    using global::Youtube.Models;
    using Microsoft.EntityFrameworkCore;

    namespace Youtube.Services
    {
        public class CommentService : ICommentService
        {
            private readonly AppDbContext _context;
            private readonly INotificationService _notificationService;

            public CommentService(AppDbContext context, INotificationService notificationService)
            {
                _context = context;
                _notificationService = notificationService;
            }

            public async Task<(bool Success, string Message, CommentResponseDto? Comment)> CreateCommentAsync(Guid userId, CreateCommentDto dto)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return (false, "User not found", null);
                var videoExists = await _context.Videos.AnyAsync(v => v.Id == dto.VideoId);
                if (!videoExists)
                    return (false, "Video not found", null);

                if (dto.ParentCommentId.HasValue)
                {
                    var parentExists = await _context.Comments
                        .AnyAsync(c => c.Id == dto.ParentCommentId && c.VideoId == dto.VideoId);
                    if (!parentExists)
                        return (false, "Parent comment not found", null);
                }

                var comment = new Comment
                {
                    Text = dto.Text,
                    UserId = userId,
                    VideoId = dto.VideoId,
                    ParentCommentId = dto.ParentCommentId
                };

                _context.Comments.Add(comment);
                await _context.Videos
                    .Where(v => v.Id == dto.VideoId)
                    .ExecuteUpdateAsync(s => s.SetProperty(v => v.CommentsCount, v => v.CommentsCount + 1));
                await _context.SaveChangesAsync();

                if (dto.ParentCommentId.HasValue)
                {
                    var parentComment = await _context.Comments.FindAsync(dto.ParentCommentId.Value);
                    if (parentComment != null)
                        await _notificationService.NotifyCommentReplyAsync(comment, parentComment);
                }

                await _notificationService.NotifyMentionsAsync(comment, dto.Text);

                var response = new CommentResponseDto
                {
                    Id = comment.Id,
                    Text = comment.Text,
                    CreatedAt = comment.CreatedAt,
                    UserId = comment.UserId,
                    Username = user!.Username,
                    AvatarUrl = user.AvatarUrl,
                    VideoId = comment.VideoId,
                    ParentCommentId = comment.ParentCommentId,
                    RepliesCount = 0
                };

                return (true, "Comment created", response);
            }

            public async Task<(bool Success, string Message)> UpdateCommentAsync(
                Guid userId, Guid commentId, UpdateCommentDto dto)
            {
                var comment = await _context.Comments.FindAsync(commentId);

                if (comment == null)
                    return (false, "Comment not found");

                if (comment.UserId != userId)
                    return (false, "You don't have permission to edit this comment");

                comment.Text = dto.Text;
                comment.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return (true, "Comment updated");
            }

            public async Task<(bool Success, string Message)> DeleteCommentAsync(Guid userId, Guid commentId)
            {
                var comment = await _context.Comments
                    .Include(c => c.Replies)
                    .FirstOrDefaultAsync(c => c.Id == commentId);

                if (comment == null)
                    return (false, "Comment not found");

                if (comment.UserId != userId)
                    return (false, "You don't have permission to delete this comment");

                var totalCount = await CountAllRepliesAsync(commentId) + 1;

                await DeleteRepliesRecursiveAsync(commentId);
                _context.Comments.Remove(comment);

                await _context.Videos
                    .Where(v => v.Id == comment.VideoId)
                    .ExecuteUpdateAsync(s => s.SetProperty(
                        v => v.CommentsCount,
                        v => v.CommentsCount - totalCount));

                await _context.SaveChangesAsync();
                return (true, "Comment deleted");
            }

            private async Task DeleteRepliesRecursiveAsync(Guid commentId)
            {
                var replies = await _context.Comments
                    .Where(c => c.ParentCommentId == commentId)
                    .ToListAsync();

                foreach (var reply in replies)
                {
                    await DeleteRepliesRecursiveAsync(reply.Id);
                    _context.Comments.Remove(reply);
                }
            }

            public async Task<IEnumerable<CommentResponseDto>> GetVideoCommentsAsync(Guid videoId, Guid? userId = null)
            {
                var comments = await _context.Comments
                    .Where(c => c.VideoId == videoId && c.ParentCommentId == null)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new CommentResponseDto
                    {
                        Id = c.Id,
                        Text = c.Text,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        UserId = c.UserId,
                        Username = c.User.Username,
                        AvatarUrl = c.User.AvatarUrl,
                        VideoId = c.VideoId,
                        ParentCommentId = c.ParentCommentId,
                        LikesCount = c.LikesCount,
                        DislikesCount = c.DislikesCount,
                        ChannelId = c.User.Channel != null ? c.User.Channel.Id : (Guid?)null,
                        IsLiked = userId != null
                            ? c.Likes.Any(l => l.UserId == userId && !l.IsDislike)
                            : (bool?)null,
                        IsDisliked = userId != null
                            ? c.Likes.Any(l => l.UserId == userId && l.IsDislike)
                            : (bool?)null
                    })
                    .ToListAsync();

                foreach (var comment in comments)
                    comment.RepliesCount = await CountAllRepliesAsync(comment.Id);

                return comments;
            }

            public async Task<IEnumerable<CommentResponseDto>> GetCommentRepliesAsync(Guid commentId, Guid? userId = null)
            {
                var replies = await _context.Comments
                    .Where(c => c.ParentCommentId == commentId)
                    .OrderBy(c => c.CreatedAt)
                    .Select(c => new CommentResponseDto
                    {
                        Id = c.Id,
                        Text = c.Text,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        UserId = c.UserId,
                        Username = c.User.Username,
                        AvatarUrl = c.User.AvatarUrl,
                        VideoId = c.VideoId,
                        ParentCommentId = c.ParentCommentId,
                        ChannelId = c.User.Channel != null ? c.User.Channel.Id : (Guid?)null,
                        LikesCount = c.LikesCount,
                        DislikesCount = c.DislikesCount,
                        IsLiked = userId != null
                            ? c.Likes.Any(l => l.UserId == userId && !l.IsDislike)
                            : (bool?)null,
                        IsDisliked = userId != null
                            ? c.Likes.Any(l => l.UserId == userId && l.IsDislike)
                            : (bool?)null
                    })
                    .ToListAsync();

                foreach (var reply in replies)
                    reply.RepliesCount = await CountAllRepliesAsync(reply.Id);

                return replies;
            }

            public async Task<IEnumerable<CommentResponseDto>> GetCommentRepliesAsync(Guid commentId)
            {
                return await _context.Comments
                    .Where(c => c.ParentCommentId == commentId)
                    .OrderBy(c => c.CreatedAt) 
                    .Select(c => new CommentResponseDto
                    {
                        Id = c.Id,
                        Text = c.Text,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        UserId = c.UserId,
                        Username = c.User.Username,
                        AvatarUrl = c.User.AvatarUrl,
                        VideoId = c.VideoId,
                        ChannelId = c.User.Channel != null ? c.User.Channel.Id : (Guid?)null,
                        ParentCommentId = c.ParentCommentId,
                        RepliesCount = c.Replies.Count()
                    })
                    .ToListAsync();
            }

            public async Task<(bool Success, string Message, bool IsLiked)> ToggleCommentLikeAsync(
                Guid userId, Guid commentId)
            {
                var comment = await _context.Comments.FindAsync(commentId);
                if (comment == null)
                    return (false, "Comment not found", false);

                var existing = await _context.CommentLikes
                    .FirstOrDefaultAsync(cl => cl.UserId == userId && cl.CommentId == commentId);

                if (existing != null)
                {
                    if (!existing.IsDislike)
                    {
                        _context.CommentLikes.Remove(existing);
                        comment.LikesCount = Math.Max(0, comment.LikesCount - 1);
                        await _context.SaveChangesAsync();
                        return (true, "Like removed", false);
                    }
                    else
                    {
                        existing.IsDislike = false;
                        comment.DislikesCount = Math.Max(0, comment.DislikesCount - 1);
                        comment.LikesCount++;
                        await _context.SaveChangesAsync();
                        return (true, "Like added", true);
                    }
                }

                _context.CommentLikes.Add(new CommentLike
                {
                    UserId = userId,
                    CommentId = commentId,
                    IsDislike = false
                });
                comment.LikesCount++;
                await _context.SaveChangesAsync();
                return (true, "Like added", true);
            }

            public async Task<(bool Success, string Message, bool IsDisliked)> ToggleCommentDislikeAsync(
                Guid userId, Guid commentId)
            {
                var comment = await _context.Comments.FindAsync(commentId);
                if (comment == null)
                    return (false, "Comment not found", false);

                var existing = await _context.CommentLikes
                    .FirstOrDefaultAsync(cl => cl.UserId == userId && cl.CommentId == commentId);

                if (existing != null)
                {
                    if (existing.IsDislike)
                    {
                        _context.CommentLikes.Remove(existing);
                        comment.DislikesCount = Math.Max(0, comment.DislikesCount - 1);
                        await _context.SaveChangesAsync();
                        return (true, "Dislike removed", false);
                    }
                    else
                    {
                        existing.IsDislike = true;
                        comment.LikesCount = Math.Max(0, comment.LikesCount - 1);
                        comment.DislikesCount++;
                        await _context.SaveChangesAsync();
                        return (true, "Dislike added", true);
                    }
                }

                _context.CommentLikes.Add(new CommentLike
                {
                    UserId = userId,
                    CommentId = commentId,
                    IsDislike = true
                });
                comment.DislikesCount++;
                await _context.SaveChangesAsync();
                return (true, "Dislike added", true);
            }

            private async Task<int> CountAllRepliesAsync(Guid commentId)
            {
                var replies = await _context.Comments
                    .Where(c => c.ParentCommentId == commentId)
                    .Select(c => c.Id)
                    .ToListAsync();

                int count = replies.Count;

                foreach (var replyId in replies)
                    count += await CountAllRepliesAsync(replyId);

                return count;
            }
        }
    }
}
