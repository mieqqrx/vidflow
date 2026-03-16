import { apiSlice } from "./apiSlice";
import { WatchHistoryItem, VideoPositionResponse, UpdateWatchPositionRequest } from "@/types";

export const historyApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        updateWatchPosition: builder.mutation<void, UpdateWatchPositionRequest>({
            query: (body) => ({
                url: `/history/position`,
                method: "POST",
                body,
            }),
        }),

        getVideoPosition: builder.query<VideoPositionResponse, string>({
            query: (videoId) => `/history/position/${videoId}`,
        }),

        getWatchHistory: builder.query<WatchHistoryItem[], number | void>({
            query: (page = 1) => `/history?page=${page}`,
            providesTags: ["History"],
        }),

        deleteHistoryItem: builder.mutation<void, string>({
            query: (videoId) => ({ url: `/history/${videoId}`, method: "DELETE" }),
            invalidatesTags: ["History"],
        }),

        clearHistory: builder.mutation<void, void>({
            query: () => ({ url: `/history`, method: "DELETE" }),
            invalidatesTags: ["History"],
        }),
    }),
});

export const {
    useUpdateWatchPositionMutation,
    useGetVideoPositionQuery,
    useGetWatchHistoryQuery,
    useDeleteHistoryItemMutation,
    useClearHistoryMutation,
} = historyApi;