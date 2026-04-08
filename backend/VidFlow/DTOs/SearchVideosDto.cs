using VidFlow.Models.Search;

namespace VidFlow.DTOs
{
    public class SearchVideosDto
    {
        public string? Query { get; set; }
        public string? CategoryName { get; set; }
        public string? Language { get; set; }
        public string[]? Tags { get; set; }
        public double? MinDuration { get; set; }
        public double? MaxDuration { get; set; }
        public SearchSortBy SortBy { get; set; } = SearchSortBy.Relevance;
        public bool SafeSearch { get; set; } = false;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class ChannelSearchResult
    {
        public IEnumerable<ChannelDocument> Channels { get; set; } = new List<ChannelDocument>();
        public long Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class PlaylistSearchResult
    {
        public IEnumerable<PlaylistDocument> Playlists { get; set; } = new List<PlaylistDocument>();
        public long Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public enum SearchSortBy
    {
        Relevance,      
        ViewsCount,     
        LikesCount,     
        CreatedAt,      
        Duration        
    }
}
