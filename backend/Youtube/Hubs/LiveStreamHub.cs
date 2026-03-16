using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using Youtube.DTOs;
using Youtube.Models;
using Youtube.Services;
using Microsoft.EntityFrameworkCore;

namespace Youtube.Hubs
{
    public class LiveStreamHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly ILiveStreamService _streamService;

        private static readonly Dictionary<string, HashSet<string>> _streamViewers = new();
        private static readonly object _lock = new();

        public LiveStreamHub(AppDbContext context, ILiveStreamService streamService)
        {
            _context = context;
            _streamService = streamService;
        }

        public async Task JoinStream(string streamId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, streamId);

            int viewers;
            lock (_lock)
            {
                if (!_streamViewers.ContainsKey(streamId))
                    _streamViewers[streamId] = new HashSet<string>();

                _streamViewers[streamId].Add(Context.ConnectionId);
                viewers = _streamViewers[streamId].Count;
            }

            if (Guid.TryParse(streamId, out var id))
                await _streamService.IncrementViewersAsync(id);

            await Clients.Group(streamId).SendAsync("ViewersUpdated", viewers);
        }

        public async Task LeaveStream(string streamId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, streamId);
            await HandleViewerLeft(streamId);
        }

        [Authorize]
        public async Task SendMessage(string streamId, string text)
        {
            if (string.IsNullOrWhiteSpace(text) || text.Length > 500) return;

            var userId = Guid.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var stream = await _context.LiveStreams
                .FirstOrDefaultAsync(s => s.Id == Guid.Parse(streamId) &&
                    s.Status == LiveStreamStatus.Live &&
                    s.ChatEnabled);

            if (stream == null) return;

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return;

            var message = new LiveStreamMessage
            {
                StreamId = Guid.Parse(streamId),
                UserId = userId,
                Text = text.Trim(),
                SentAt = DateTime.UtcNow
            };

            _context.LiveStreamMessages.Add(message);
            await _context.SaveChangesAsync();

            var dto = new LiveStreamMessageDto
            {
                Id = message.Id,
                Text = message.Text,
                SentAt = message.SentAt,
                UserId = userId,
                Username = user.Username,
                AvatarUrl = user.AvatarUrl
            };

            await Clients.Group(streamId).SendAsync("NewMessage", dto);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            List<string> streamsToLeave;
            lock (_lock)
            {
                streamsToLeave = _streamViewers
                    .Where(kv => kv.Value.Contains(Context.ConnectionId))
                    .Select(kv => kv.Key)
                    .ToList();
            }

            foreach (var streamId in streamsToLeave)
                await HandleViewerLeft(streamId);

            await base.OnDisconnectedAsync(exception);
        }

        private async Task HandleViewerLeft(string streamId)
        {
            int viewers;
            lock (_lock)
            {
                if (_streamViewers.TryGetValue(streamId, out var connections))
                {
                    connections.Remove(Context.ConnectionId);
                    viewers = connections.Count;
                    if (viewers == 0) _streamViewers.Remove(streamId);
                }
                else viewers = 0;
            }

            if (Guid.TryParse(streamId, out var id))
                await _streamService.DecrementViewersAsync(id);

            await Clients.Group(streamId).SendAsync("ViewersUpdated", viewers);
        }
    }
}