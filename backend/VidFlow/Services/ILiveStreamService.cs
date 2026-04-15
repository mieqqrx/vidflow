using VidFlow.DTOs;

namespace VidFlow.Services
{
    public interface ILiveStreamService
    {
        Task<(bool Success, string Message, LiveStreamResponseDto? Stream)> CreateStreamAsync(Guid userId, CreateLiveStreamDto dto);
        Task<(bool Success, string Message)> UpdateStreamAsync(Guid streamId, Guid userId, UpdateLiveStreamDto dto);
        Task<(bool Success, string Message)> DeleteStreamAsync(Guid streamId, Guid userId);
        Task<LiveStreamResponseDto?> GetStreamByIdAsync(Guid streamId);
        Task<LiveStreamResponseDto?> GetStreamByKeyAsync(string streamKey);
        Task<IEnumerable<LiveStreamResponseDto>> GetLiveStreamsAsync();
        Task<IEnumerable<LiveStreamResponseDto>> GetChannelStreamsAsync(Guid channelId);

        Task<bool> OnPublishAsync(string streamKey);
        Task OnPublishDoneAsync(string streamKey);
        Task OnRecordDoneAsync(string streamKey, string filePath);

        Task<int> IncrementViewersAsync(Guid streamId);
        Task<int> DecrementViewersAsync(Guid streamId);

        Task ProcessRecordingAsync(Guid streamId, string filePath);

        Task<(bool Success, string Message)> UpdateThumbnailAsync(Guid streamId, Guid userId, IFormFile thumbnail);

        Task<(bool Success, string Message, bool IsLiked)> ToggleLikeAsync(Guid streamId, Guid userId);
        Task<(bool Success, string Message, bool IsDisliked)> ToggleDislikeAsync(Guid streamId, Guid userId);
    }
}