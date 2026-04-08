using VidFlow.DTOs;

namespace VidFlow.Services
{
    public interface IChannelService
    {
        Task<(bool Success, string Message)> CreateChannelAsync(CreateChannelDto dto, Guid userId);
        Task<ChannelResponseDto?> GetChannelByIdAsync(Guid id);
        Task<ChannelResponseDto?> GetChannelByUserIdAsync(Guid userId);
        Task<(bool Success, string Message)> DeleteChannelAsync(Guid channelId, Guid userId);
        Task<(bool Success, string Message)> SetFeaturedVideoAsync(Guid channelId, Guid userId, Guid? videoId);
        Task<(bool Success, string Message)> UpdateChannelAsync(Guid channelId, Guid userId, UpdateChannelDto dto);
    }
}
