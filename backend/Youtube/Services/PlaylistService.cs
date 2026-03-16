using Microsoft.EntityFrameworkCore;
using Youtube.DTOs;
using Youtube.Models;
using Youtube.Models.Search;

namespace Youtube.Services
{
    public class PlaylistService : IPlaylistService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IElasticsearchService _esService;

        public PlaylistService(AppDbContext context, IConfiguration configuration, IElasticsearchService esService)
        {
            _context = context;
            _configuration = configuration;
            _esService = esService;
        }

        private string GetDeletedThumbnailUrl()
        {
            var minioUrl = _configuration["MinIO:PublicUrl"];
            return $"{minioUrl}/thumbnails/deleted-video.jpg";
        }

        public async Task CreateSystemPlaylistsAsync(Guid userId)
        {
            var playlists = new[]
            {
                new Playlist
                {
                    Title = "Понравившиеся",
                    IsPrivate = true,
                    IsSystem = true,
                    Type = PlaylistType.Liked,
                    UserId = userId
                },
                new Playlist
                {
                    Title = "Смотреть позже",
                    IsPrivate = true,
                    IsSystem = true,
                    Type = PlaylistType.WatchLater,
                    UserId = userId
                }
            };

            _context.Playlists.AddRange(playlists);
            await _context.SaveChangesAsync();
        }

        public async Task<(bool Success, string Message, Guid? PlaylistId)> CreatePlaylistAsync(
            Guid userId, CreatePlaylistDto dto)
        {
            var playlist = new Playlist
            {
                Title = dto.Title,
                IsPrivate = dto.IsPrivate,
                IsSystem = false,
                Type = PlaylistType.Custom,
                UserId = userId
            };

            _context.Playlists.Add(playlist);
            await _context.SaveChangesAsync();

            if (!playlist.IsPrivate)
            {
                var channel = await _context.Channels.FirstOrDefaultAsync(c => c.OwnerId == userId);
                await _esService.IndexPlaylistAsync(new PlaylistDocument
                {
                    Id = playlist.Id,
                    Title = playlist.Title,
                    ChannelName = channel?.Name ?? "",
                    ChannelId = channel?.Id ?? Guid.Empty,
                    ThumbnailUrl = null,
                    VideosCount = 0,
                    IsPrivate = playlist.IsPrivate,
                    CreatedAt = playlist.CreatedAt
                });
            }

            return (true, "Playlist created", playlist.Id);
        }

        public async Task<(bool Success, string Message)> UpdatePlaylistAsync(
            Guid userId, Guid playlistId, UpdatePlaylistDto dto)
        {
            var playlist = await _context.Playlists
                .FirstOrDefaultAsync(p => p.Id == playlistId && p.UserId == userId);

            if (playlist == null)
                return (false, "Playlist not found");

            if (playlist.IsSystem)
                return (false, "Cannot edit system playlists");

            if (dto.Title != null) playlist.Title = dto.Title;
            if (dto.IsPrivate.HasValue) playlist.IsPrivate = dto.IsPrivate.Value;

            playlist.LastUpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var channel = await _context.Channels.FirstOrDefaultAsync(c => c.OwnerId == userId);
            var videosCount = await _context.PlaylistVideos.CountAsync(pv => pv.PlaylistId == playlistId);

            if (playlist.IsPrivate)
            {
                try { await _esService.DeletePlaylistAsync(playlistId); } catch { }
            }
            else
            {
                await _esService.UpdatePlaylistAsync(new PlaylistDocument
                {
                    Id = playlist.Id,
                    Title = playlist.Title,
                    ChannelName = channel?.Name ?? "",
                    ChannelId = channel?.Id ?? Guid.Empty,
                    VideosCount = videosCount,
                    IsPrivate = playlist.IsPrivate,
                    CreatedAt = playlist.CreatedAt
                });
            }

            return (true, "Playlist updated");
        }

        public async Task<(bool Success, string Message)> DeletePlaylistAsync(
            Guid userId, Guid playlistId)
        {
            var playlist = await _context.Playlists
                .FirstOrDefaultAsync(p => p.Id == playlistId && p.UserId == userId);

            if (playlist == null)
                return (false, "Playlist not found");

            if (playlist.IsSystem)
                return (false, "Cannot delete system playlists");

            _context.Playlists.Remove(playlist);
            await _context.SaveChangesAsync();

            try { await _esService.DeletePlaylistAsync(playlistId); } catch { }

            return (true, "Playlist deleted");
        }

        public async Task<(bool Success, string Message)> AddVideoAsync(
            Guid userId, Guid playlistId, Guid videoId)
        {
            var playlist = await _context.Playlists
                .FirstOrDefaultAsync(p => p.Id == playlistId && p.UserId == userId);

            if (playlist == null)
                return (false, "Playlist not found");

            if (playlist.Type == PlaylistType.Liked)
                return (false, "Liked playlist is managed automatically");

            var video = await _context.Videos
                .Include(v => v.Channel)
                .FirstOrDefaultAsync(v => v.Id == videoId && v.Status == VideoStatus.Ready);

            if (video == null)
                return (false, "Video not found");

            var alreadyExists = await _context.PlaylistVideos
                .AnyAsync(pv => pv.PlaylistId == playlistId && pv.VideoId == videoId);

            if (alreadyExists)
                return (false, "Video already in playlist");

            var maxOrder = await _context.PlaylistVideos
                .Where(pv => pv.PlaylistId == playlistId)
                .Select(pv => (int?)pv.Order)
                .MaxAsync() ?? 0;

            _context.PlaylistVideos.Add(new PlaylistVideo
            {
                PlaylistId = playlistId,
                VideoId = videoId,
                VideoTitle = video.Title,
                VideoThumbnailUrl = video.ThumbnailUrl,
                VideoChannelName = video.Channel.Name,
                Order = maxOrder + 1
            });

            playlist.LastUpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, "Video added to playlist");
        }

        public async Task<(bool Success, string Message)> RemoveVideoAsync(
            Guid userId, Guid playlistId, Guid playlistVideoId)
        {
            var playlist = await _context.Playlists
                .FirstOrDefaultAsync(p => p.Id == playlistId && p.UserId == userId);

            if (playlist == null)
                return (false, "Playlist not found");

            var playlistVideo = await _context.PlaylistVideos
                .FirstOrDefaultAsync(pv => pv.Id == playlistVideoId && pv.PlaylistId == playlistId);

            if (playlistVideo == null)
                return (false, "Video not found in playlist");

            _context.PlaylistVideos.Remove(playlistVideo);
            playlist.LastUpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, "Video removed from playlist");
        }

        public async Task SyncLikedPlaylistAsync(Guid userId, Guid videoId, bool isLiked)
        {
            var likedPlaylist = await _context.Playlists
                .FirstOrDefaultAsync(p => p.UserId == userId && p.Type == PlaylistType.Liked);

            if (likedPlaylist == null) return;

            if (isLiked)
            {
                var video = await _context.Videos
                    .Include(v => v.Channel)
                    .FirstOrDefaultAsync(v => v.Id == videoId);

                if (video == null) return;

                var alreadyExists = await _context.PlaylistVideos
                    .AnyAsync(pv => pv.PlaylistId == likedPlaylist.Id && pv.VideoId == videoId);

                if (!alreadyExists)
                {
                    var maxOrder = await _context.PlaylistVideos
                        .Where(pv => pv.PlaylistId == likedPlaylist.Id)
                        .Select(pv => (int?)pv.Order)
                        .MaxAsync() ?? 0;

                    _context.PlaylistVideos.Add(new PlaylistVideo
                    {
                        PlaylistId = likedPlaylist.Id,
                        VideoId = videoId,
                        VideoTitle = video.Title,
                        VideoThumbnailUrl = video.ThumbnailUrl,
                        VideoChannelName = video.Channel.Name,
                        Order = maxOrder + 1
                    });

                    likedPlaylist.LastUpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
            else
            {
                var entry = await _context.PlaylistVideos
                    .FirstOrDefaultAsync(pv => pv.PlaylistId == likedPlaylist.Id && pv.VideoId == videoId);

                if (entry != null)
                {
                    _context.PlaylistVideos.Remove(entry);
                    likedPlaylist.LastUpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
        }

        private PlaylistVideoDto MapPlaylistVideo(PlaylistVideo pv)
        {
            var isDeleted = pv.VideoId == null;
            return new PlaylistVideoDto
            {
                Id = pv.Id,
                VideoId = pv.VideoId,
                VideoTitle = isDeleted ? pv.VideoTitle : pv.Video?.Title ?? pv.VideoTitle,
                ThumbnailUrl = isDeleted
                    ? GetDeletedThumbnailUrl()
                    : pv.Video?.ThumbnailUrl ?? pv.VideoThumbnailUrl,
                DurationSeconds = pv.Video?.DurationSeconds ?? 0,
                IsDeleted = isDeleted,
                AddedAt = pv.AddedAt,
                Order = pv.Order,
                ChannelName = isDeleted
                    ? pv.VideoChannelName
                    : pv.Video?.Channel?.Name ?? pv.VideoChannelName
            };
        }

        private bool CanViewPlaylist(Playlist p, Guid? requesterId)
        {
            if (requesterId == p.UserId) return true;
            if (p.IsPrivate) return false;
            return true;
        }

        public async Task<IEnumerable<PlaylistResponseDto>> GetMyPlaylistsAsync(Guid userId)
        {
            var playlists = await _context.Playlists
                .Where(p => p.UserId == userId)
                .Include(p => p.PlaylistVideos)
                    .ThenInclude(pv => pv.Video)
                .OrderBy(p => p.Type) 
                .ThenByDescending(p => p.LastUpdatedAt)
                .ToListAsync();

            return playlists.Select(p => MapPlaylist(p, userId));
        }

        public async Task<IEnumerable<PlaylistResponseDto>> GetPublicPlaylistsByChannelAsync(
            Guid channelId, Guid? requesterId)
        {
            var channel = await _context.Channels
                .FirstOrDefaultAsync(c => c.Id == channelId);

            if (channel == null) return Enumerable.Empty<PlaylistResponseDto>();

            var playlists = await _context.Playlists
                .Where(p => p.UserId == channel.OwnerId)
                .Include(p => p.PlaylistVideos)
                    .ThenInclude(pv => pv.Video)
                .ToListAsync();

            return playlists
                .Where(p => CanViewPlaylist(p, requesterId) && !p.IsSystem)
                .Where(p => p.PlaylistVideos.Any(pv => pv.Video != null)) 
                .Select(p => MapPlaylist(p, requesterId));
        }

        public async Task<PlaylistResponseDto?> GetPlaylistByIdAsync(Guid playlistId, Guid? requesterId)
        {
            var playlist = await _context.Playlists
                .Include(p => p.PlaylistVideos)
                    .ThenInclude(pv => pv.Video)
                        .ThenInclude(v => v!.Channel)
                .FirstOrDefaultAsync(p => p.Id == playlistId);

            if (playlist == null) return null;
            if (!CanViewPlaylist(playlist, requesterId)) return null;

            return MapPlaylist(playlist, requesterId);
        }

        private PlaylistResponseDto MapPlaylist(Playlist p, Guid? requesterId)
        {
            var isOwner = requesterId == p.UserId;

            var videos = p.PlaylistVideos
                .OrderBy(pv => pv.Order)
                .Where(pv =>
                    pv.VideoId == null || 
                    pv.Video == null ||
                    pv.Video.Visibility == VideoVisibility.Public ||
                    pv.Video.Visibility == VideoVisibility.Unlisted ||
                    (pv.Video.Visibility == VideoVisibility.Private && isOwner))
                .Select(MapPlaylistVideo)
                .ToList();

            var firstLive = p.PlaylistVideos
                .OrderBy(pv => pv.Order)
                .FirstOrDefault(pv => pv.Video != null);

            return new PlaylistResponseDto
            {
                Id = p.Id,
                Title = p.Title,
                IsPrivate = p.IsPrivate,
                IsSystem = p.IsSystem,
                Type = p.Type,
                VideoCount = p.PlaylistVideos.Count,
                ThumbnailUrl = firstLive?.Video?.ThumbnailUrl,
                CreatedAt = p.CreatedAt,
                LastUpdatedAt = p.LastUpdatedAt,
                Videos = videos
            };
        }
    }
}