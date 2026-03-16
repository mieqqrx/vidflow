import { apiSlice } from "./apiSlice";
import {
    Video,
    UpdateVideoRequest,
    TrimVideoRequest,
    Category,
    CreateVideoReportResponse,
    CreateVideoReportRequest
} from "@/types";
import {CreateLiveStreamRequest, LiveStreamMessageDto, LiveStreamResponse} from "@/types/stream";

export const videoApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllVideos: builder.query<Video[], void>({
            query: () => "/videos",
            providesTags: (result) => result
                ? [...result.map(({ id }) => ({ type: "Video" as const, id })), { type: "Video", id: "LIST" }]
                : [{ type: "Video", id: "LIST" }],
        }),

        getRecommendations: builder.query<Video[], { count?: number; excludeVideoId?: string } | void>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params?.count) queryParams.append("count", params.count.toString());
                if (params?.excludeVideoId) queryParams.append("excludeVideoId", params.excludeVideoId);
                return `/recommendations?${queryParams.toString()}`;
            },
            providesTags: ["Video"],
        }),

        getSimilarVideos: builder.query<Video[], { videoId: string; count?: number }>({
            query: ({ videoId, count }) => {
                let url = `/recommendations/similar/${videoId}`;
                if (count) url += `?count=${count}`;
                return url;
            },
            providesTags: ["Video"],
        }),

        getVideoById: builder.query<Video, string>({
            query: (id) => `/videos/${id}`,
            providesTags: (result, error, id) => [{ type: "Video", id }],
        }),

        getVideosByChannelId: builder.query<Video[], string>({
            query: (channelId) => `/videos/channel/${channelId}`,
            providesTags: (result) => result
                ? [...result.map(({ id }) => ({ type: "Video" as const, id })), { type: "Video", id: "LIST" }]
                : [{ type: "Video", id: "LIST" }],
        }),

        uploadVideo: builder.mutation<Video, FormData>({
            query: (formData) => ({
                url: "/videos/upload",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["Video", "Channel"],
        }),

        updateVideoDetails: builder.mutation<{ message: string }, UpdateVideoRequest>({
            query: ({ id, ...rest }) => {
                const formData = new FormData();
                if (rest.title) formData.append("Title", rest.title);
                if (rest.description) formData.append("Description", rest.description);
                if (rest.categoryId) formData.append("CategoryId", rest.categoryId);
                if (rest.ageRestriction !== undefined) formData.append("AgeRestriction", String(rest.ageRestriction));
                if (rest.customThumbnail) formData.append("CustomThumbnail", rest.customThumbnail);
                if (rest.visibility !== undefined) formData.append("Visibility", String(rest.visibility));

                if (rest.tags && rest.tags.length > 0) {
                    rest.tags.forEach(tag => formData.append("Tags", tag));
                }
                return { url: `/videos/${id}`, method: "PUT", body: formData };
            },
            invalidatesTags: (result, error, arg) => [{ type: "Video", id: arg.id }, "Video"],
        }),

        deleteVideo: builder.mutation<void, string>({
            query: (id) => ({ url: `/videos/${id}`, method: "DELETE" }),
            invalidatesTags: ["Video"],
        }),

        trimVideo: builder.mutation<{ message: string }, TrimVideoRequest>({
            query: ({ id, startSeconds, endSeconds }) => ({
                url: `/videos/${id}/trim`,
                method: "POST",
                body: { startSeconds, endSeconds },
            }),
            invalidatesTags: (result, error, arg) => [{ type: "Video", id: arg.id }],
        }),

        createVideoReport: builder.mutation<CreateVideoReportResponse, CreateVideoReportRequest>({
            query: ({ videoId, ...body }) => ({
                url: `/videos/${videoId}/report`,
                method: "POST",
                body,
            }),
        }),

        getCategories: builder.query<Category[], void>({
            query: () => "/videos/categories"
        }),

        recordView: builder.mutation<void, string>({
            query: (id) => ({ url: `/videos/${id}/view`, method: "POST" }),
            invalidatesTags: (result, error, id) => [{ type: "Video", id }],
        }),

        getLikeStatus: builder.query<{ isLiked: boolean }, string>({
            query: (id) => `/videos/${id}/like`,
            providesTags: (result, error, id) => [{ type: "Like", id }],
        }),

        getDislikeStatus: builder.query<{ isDisliked: boolean }, string>({
            query: (id) => `/videos/${id}/dislike`,
            providesTags: (result, error, id) => [{ type: "Dislike", id }],
        }),

        toggleLike: builder.mutation<{ message: string; isLiked: boolean }, string>({
            query: (id) => ({ url: `/videos/${id}/like`, method: "POST" }),
            invalidatesTags: (result, error, id) => [{ type: "Like", id }, { type: "Dislike", id }, { type: "Video", id }, "Playlist"],
        }),

        toggleDislike: builder.mutation<{ message: string; isDisliked: boolean }, string>({
            query: (id) => ({ url: `/videos/${id}/dislike`, method: "POST" }),
            invalidatesTags: (result, error, id) => [{ type: "Like", id }, { type: "Dislike", id }, { type: "Video", id }, "Playlist"],
        }),

        createLiveStream: builder.mutation<LiveStreamResponse, CreateLiveStreamRequest>({
            query: (body) => ({
                url: "/streams",
                method: "POST",
                body,
            }),
            invalidatesTags: ["LiveStream"],
        }),

        getChannelStreams: builder.query<LiveStreamResponse[], string>({
            query: (channelId) => `/streams/channel/${channelId}`,
            providesTags: ["LiveStream"],
        }),

        deleteLiveStream: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/streams/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["LiveStream"],
        }),

        getLiveStreamById: builder.query<LiveStreamResponse, string>({
            query: (id) => `/streams/${id}`,
            providesTags: ["LiveStream"],
        }),

        getLiveStreamMessages: builder.query<LiveStreamMessageDto[], string>({
            query: (id) => `/streams/${id}/messages?count=50`,
            providesTags: ["LiveStreamMessage"],
        }),

        updateLiveStreamThumbnail: builder.mutation<{ message: string }, { id: string; file: File }>({
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append("thumbnail", file);

                return {
                    url: `/streams/${id}/thumbnail`,
                    method: "PUT",
                    body: formData,
                };
            },
            invalidatesTags: ["LiveStream"],
        }),

        updateStream: builder.mutation<{ message: string }, { id: string; title: string; description?: string }>({
            query: ({ id, ...body }) => ({
                url: `/streams/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["LiveStream"],
        }),

        getShorts: builder.query<Video[], { page: number; pageSize: number }>({
            query: ({ page, pageSize }) => `/videos/shorts?page=${page}&pageSize=${pageSize}`,
            providesTags: ["Video"],
            serializeQueryArgs: ({ endpointName }) => {
                return endpointName;
            },
            merge: (currentCache, newItems) => {
                currentCache.push(...newItems);
            },
            forceRefetch({ currentArg, previousArg }) {
                return currentArg?.page !== previousArg?.page;
            }
        }),

        getChannelShorts: builder.query<Video[], string>({
            query: (channelId) => `/videos/shorts/channel/${channelId}`,
            providesTags: ["Video"],
        }),

        getShortsRecommendations: builder.query<Video[], { count?: number; excludeVideoId?: string }>({
            query: ({ count = 10, excludeVideoId }) => {
                let url = `/recommendations/shorts?count=${count}`;
                if (excludeVideoId) url += `&excludeVideoId=${excludeVideoId}`;
                return url;
            },
            providesTags: ["Video"],
        }),

        uploadShort: builder.mutation<{ message: string; videoId: string }, FormData>({
            query: (formData) => ({
                url: "/videos/shorts/upload",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["Video", "Channel"],
        }),
    }),
});

export const {
    useGetAllVideosQuery,
    useGetVideoByIdQuery,
    useGetVideosByChannelIdQuery,
    useUploadVideoMutation,
    useUpdateVideoDetailsMutation,
    useDeleteVideoMutation,
    useTrimVideoMutation,
    useCreateVideoReportMutation,
    useGetCategoriesQuery,
    useRecordViewMutation,
    useGetLikeStatusQuery,
    useGetDislikeStatusQuery,
    useToggleLikeMutation,
    useToggleDislikeMutation,
    useGetRecommendationsQuery,
    useGetSimilarVideosQuery,
    useCreateLiveStreamMutation,
    useGetChannelStreamsQuery,
    useDeleteLiveStreamMutation,
    useGetLiveStreamByIdQuery,
    useGetLiveStreamMessagesQuery,
    useUpdateLiveStreamThumbnailMutation,
    useUpdateStreamMutation,
    useGetChannelShortsQuery,
    useGetShortsQuery,
    useGetShortsRecommendationsQuery,
    useUploadShortMutation,
} = videoApi;