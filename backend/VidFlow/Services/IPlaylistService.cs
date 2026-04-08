using VidFlow.DTOs;

namespace VidFlow.Services
{
    public interface IPlaylistService
    {
        Task CreateSystemPlaylistsAsync(Guid userId);

        Task<(bool Success, string Message, Guid? PlaylistId)> CreatePlaylistAsync(Guid userId, CreatePlaylistDto dto);
        Task<(bool Success, string Message)> UpdatePlaylistAsync(Guid userId, Guid playlistId, UpdatePlaylistDto dto);
        Task<(bool Success, string Message)> DeletePlaylistAsync(Guid userId, Guid playlistId);

        Task<(bool Success, string Message)> AddVideoAsync(Guid userId, Guid playlistId, Guid videoId);
        Task<(bool Success, string Message)> RemoveVideoAsync(Guid userId, Guid playlistId, Guid playlistVideoId);

        Task<IEnumerable<PlaylistResponseDto>> GetMyPlaylistsAsync(Guid userId);
        Task<IEnumerable<PlaylistResponseDto>> GetPublicPlaylistsByChannelAsync(Guid channelId, Guid? requesterId);
        Task<PlaylistResponseDto?> GetPlaylistByIdAsync(Guid playlistId, Guid? requesterId);

        Task SyncLikedPlaylistAsync(Guid userId, Guid videoId, bool isLiked);
    }
}
