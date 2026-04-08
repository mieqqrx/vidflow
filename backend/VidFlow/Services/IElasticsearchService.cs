using VidFlow.DTOs;
using VidFlow.Models.Search;

namespace VidFlow.Services
{
    public interface IElasticsearchService
    {
        Task IndexVideoAsync(VideoDocument video);
        Task UpdateVideoAsync(VideoDocument video);
        Task DeleteVideoAsync(Guid videoId);
        Task<SearchResult> SearchVideosAsync(SearchVideosDto dto);
        Task<IEnumerable<string>> GetSuggestionsAsync(string query);
        Task ReindexAllAsync();

        Task IndexChannelAsync(ChannelDocument channel);
        Task UpdateChannelAsync(ChannelDocument channel);
        Task DeleteChannelAsync(Guid channelId);
        Task<ChannelSearchResult> SearchChannelsAsync(string query, int page = 1, int pageSize = 20);

        Task IndexPlaylistAsync(PlaylistDocument playlist);
        Task UpdatePlaylistAsync(PlaylistDocument playlist);
        Task DeletePlaylistAsync(Guid playlistId);
        Task<PlaylistSearchResult> SearchPlaylistsAsync(string query, int page = 1, int pageSize = 20);

        Task<SearchResult> SearchShortsAsync(SearchVideosDto dto);

    }

    public class SearchResult
    {
        public IEnumerable<VideoDocument> Videos { get; set; } = new List<VideoDocument>();
        public long Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
