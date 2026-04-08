using VidFlow.DTOs;

namespace VidFlow.Services
{
    public interface IWatchHistoryService
    {
        Task UpdatePositionAsync(Guid userId, UpdateWatchPositionDto dto);
        Task<VideoPositionDto?> GetPositionAsync(Guid userId, Guid videoId);
        Task<IEnumerable<WatchHistoryResponseDto>> GetHistoryAsync(Guid userId, int page = 1);
        Task DeleteHistoryItemAsync(Guid userId, Guid videoId);
        Task ClearHistoryAsync(Guid userId);
    }
}
