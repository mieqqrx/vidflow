import { apiSlice } from "./apiSlice";
import {
    BaseSearchParams, ChannelSearchResultResponse,
    PlaylistSearchResultResponse, SearchResultResponse, SearchVideosParams
} from "@/types";

export const searchApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

        searchVideos: builder.query<SearchResultResponse, SearchVideosParams>({
            query: (params) => {
                const queryParams = new URLSearchParams();

                if (params.query) queryParams.append("Query", params.query);
                if (params.categoryName) queryParams.append("CategoryName", params.categoryName);
                if (params.language) queryParams.append("Language", params.language);

                if (params.tags && params.tags.length > 0) {
                    params.tags.forEach(tag => queryParams.append("Tags", tag));
                }

                if (params.minDuration !== undefined) queryParams.append("MinDuration", params.minDuration.toString());
                if (params.maxDuration !== undefined) queryParams.append("MaxDuration", params.maxDuration.toString());
                if (params.sortBy !== undefined) queryParams.append("SortBy", params.sortBy.toString());
                if (params.safeSearch) queryParams.append("SafeSearch", "true");

                if (params.page) queryParams.append("Page", params.page.toString());
                if (params.pageSize) queryParams.append("PageSize", params.pageSize.toString());

                return {
                    url: `/search?${queryParams.toString()}`,
                    method: 'GET'
                };
            },
            providesTags: ["Video"],
        }),

        getSearchSuggestions: builder.query<string[], string>({
            query: (query) => `/search/suggestions?query=${encodeURIComponent(query)}`,
        }),

        searchChannels: builder.query<ChannelSearchResultResponse, BaseSearchParams>({
            query: (params) => {
                const queryParams = new URLSearchParams();

                if (params.query) queryParams.append("query", params.query);
                if (params.page) queryParams.append("page", params.page.toString());
                if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());

                return {
                    url: `/search/channels?${queryParams.toString()}`,
                    method: 'GET'
                };
            },
            providesTags: ["Channel"],
        }),

        searchPlaylists: builder.query<PlaylistSearchResultResponse, BaseSearchParams>({
            query: (params) => {
                const queryParams = new URLSearchParams();

                if (params.query) queryParams.append("query", params.query);
                if (params.page) queryParams.append("page", params.page.toString());
                if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());

                return {
                    url: `/search/playlists?${queryParams.toString()}`,
                    method: 'GET'
                };
            },
            providesTags: ["Playlist"],
        }),
    }),

    overrideExisting: false,
});

export const {
    useSearchVideosQuery,
    useGetSearchSuggestionsQuery,
    useSearchChannelsQuery,
    useSearchPlaylistsQuery,
} = searchApi;