import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
    AuthResponse, Category, Channel, CreateChannelRequest,
    LoginRequest,
    RegisterRequest,
    User,
    Video,
    Comment, CreateCommentResponse, CreateCommentRequest, UpdateVideoRequest, TrimVideoRequest, Playlist,
    PlaylistResponse, NotificationItem, UnreadCountResponse, UpdateNotificationSettingsDto
} from "@/types"

export const apiSlice = createApi({
    reducerPath: "api",

    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        prepareHeaders: (headers) => {
            headers.set("ngrok-skip-browser-warning", "true");

            return headers;
        },
        credentials: "include",
    }),

    tagTypes: ["Video", "User", "Channel", "Like", "Dislike", "Comment", "Playlist", "Notification"],

    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials,
            }),
            invalidatesTags: ["User", "Channel"],
        }),

        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
            }),

            async onQueryStarted(args, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(apiSlice.util.resetApiState());
                } catch (err) {
                    console.error("Error to logout", err);
                }
            },
        }),

        register: builder.mutation<void, RegisterRequest>({
            query: (userData) => ({
                url: "/auth/register",
                method: "POST",
                body: userData,
            }),
        }),

        getMe: builder.query<User, void>({
            query: () => "/auth/me",
            providesTags: ["User", "Channel"],
        }),

        getMyChannel: builder.query<Channel, void>({
            query: () => "/channels/my",
            providesTags: ["Channel"],
        }),

        getChannelById: builder.query<Channel, string>({
            query: (id) => `/channels/${id}`,
            providesTags: (result, error, id) => [{ type: "Channel", id }],
        }),

        getChannelByUserId: builder.query<Channel, string>({
            query: (userId) => `/channels/by-user/${userId}`,
            providesTags: (result, error, userId) => [{ type: "Channel", id: userId }],
        }),

        createChannel: builder.mutation<Channel, CreateChannelRequest>({
            query: (channelData) => ({
                url: "/channels",
                method: "POST",
                body: channelData,
            }),
            invalidatesTags: ["User", "Channel"],
        }),

        getSubscriptions: builder.query<Channel[], void>({
            query: () => "/subscriptions",
            providesTags: ["Channel"],
        }),

        toggleSubscription: builder.mutation<void, string>({
            query: (channelId) => ({
                url: `/subscriptions/${channelId}`,
                method: "POST",
            }),
            invalidatesTags: ["Channel"],
        }),

        unsubscribeFromChannel: builder.mutation<void, string>({
            query: (channelId) => ({
                url: `/subscriptions/${channelId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Channel"],
        }),

        toggleNotifications: builder.mutation<void, string>({
            query: (channelId) => ({
                url: `/subscriptions/${channelId}/notifications`,
                method: "PATCH",
            }),
            invalidatesTags: ["Channel"],
        }),

        getAllVideos: builder.query<Video[], void>({
            query: () => "/videos",
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "Video" as const, id })),
                        { type: "Video", id: "LIST" },
                    ]
                    : [{ type: "Video", id: "LIST" }],
        }),

        getVideoById: builder.query<Video, string>({
            query: (id) => `/videos/${id}`,
            providesTags: (result, error, id) => [{ type: "Video", id }],
        }),

        getVideosByChannelId: builder.query<Video[], string>({
            query: (channelId) => `/videos/channel/${channelId}`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "Video" as const, id })),
                        { type: "Video", id: "LIST" },
                    ]
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

                return {
                    url: `/videos/${id}`,
                    method: "PUT",
                    body: formData,
                };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Video", id: arg.id },
                "Video"
            ],
        }),

        deleteVideo: builder.mutation<void, string>({
            query: (id) => ({
                url: `/videos/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Video"],
        }),

        getCategories: builder.query<Category[], void>({
            query: () => "/videos/categories"
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
            query: (id) => ({
                url: `/videos/${id}/like`,
                method: "POST",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Like", id },
                { type: "Dislike", id },
                { type: "Video", id },
                "Playlist"
            ],
        }),

        toggleDislike: builder.mutation<{ message: string; isDisliked: boolean }, string>({
            query: (id) => ({
                url: `/videos/${id}/dislike`,
                method: "POST",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Like", id },
                { type: "Dislike", id },
                { type: "Video", id },
                "Playlist"
            ],
        }),

        recordView: builder.mutation<void, string>({
            query: (id) => ({
                url: `/videos/${id}/view`,
                method: "POST",
            }),
            invalidatesTags: (result, error, id) => [{ type: "Video", id }],
        }),

        getVideoComments: builder.query<Comment[], string>({
            query: (videoId) => `/comments/video/${videoId}`,
            providesTags: (result, error, videoId) => [{ type: "Comment", id: videoId }],
        }),

        createComment: builder.mutation<CreateCommentResponse, CreateCommentRequest>({
            query: (body) => ({
                url: `/comments`,
                method: "POST",
                body,
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Comment", id: arg.videoId },
                { type: "Video", id: arg.videoId },
                ...(arg.parentCommentId ? [{ type: "Comment" as const, id: arg.parentCommentId }] : [])
            ],
        }),

        getCommentReplies: builder.query<Comment[], string>({
            query: (commentId) => `/comments/${commentId}/replies`,
            providesTags: (result, error, id) => [{ type: "Comment", id }],
        }),

        updateComment: builder.mutation<{ message: string }, { id: string; text: string; videoId: string }>({
            query: ({ id, text }) => ({
                url: `/comments/${id}`,
                method: "PUT",
                body: { text },
            }),
            invalidatesTags: (result, error, arg) => [{ type: "Comment", id: arg.videoId }],
        }),

        toggleCommentLike: builder.mutation<{ isLiked: boolean }, { id: string; videoId: string; parentCommentId?: string | null }>({
            query: ({ id }) => ({
                url: `/comments/${id}/like`,
                method: "POST",
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Comment", id: arg.videoId },
                ...(arg.parentCommentId ? [{ type: "Comment" as const, id: arg.parentCommentId }] : [])
            ],
        }),

        toggleCommentDislike: builder.mutation<{ isDisliked: boolean }, { id: string; videoId: string; parentCommentId?: string | null }>({
            query: ({ id }) => ({
                url: `/comments/${id}/dislike`,
                method: "POST",
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Comment", id: arg.videoId },
                ...(arg.parentCommentId ? [{ type: "Comment" as const, id: arg.parentCommentId }] : [])
            ],
        }),

        deleteComment: builder.mutation<{ message: string }, { id: string; videoId: string; parentCommentId?: string | null }>({
            query: ({ id }) => ({
                url: `/comments/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Comment", id: arg.videoId },
                ...(arg.parentCommentId ? [{ type: "Comment" as const, id: arg.parentCommentId }] : [])
            ],
        }),

        trimVideo: builder.mutation<{ message: string }, TrimVideoRequest>({
            query: ({ id, startSeconds, endSeconds }) => ({
                url: `/videos/${id}/trim`,
                method: "POST",
                body: { startSeconds, endSeconds },
            }),
            invalidatesTags: (result, error, arg) => [{ type: "Video", id: arg.id }],
        }),

        getMyPlaylists: builder.query<Playlist[], void>({
            query: () => "/playlists/my",
            providesTags: ["Playlist"],
        }),

        getPlaylistById: builder.query<PlaylistResponse, string>({
            query: (id) => `/playlists/${id}`,
            providesTags: (result, error, id) => [{ type: "Playlist", id }],
        }),

        createPlaylist: builder.mutation<{ message: string; playlistId: string }, { title: string; isPrivate: boolean }>({
            query: (body) => ({
                url: "/playlists",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Playlist"],
        }),

        addVideoToPlaylist: builder.mutation<{ message: string }, { playlistId: string; videoId: string }>({
            query: ({ playlistId, videoId }) => ({
                url: `/playlists/${playlistId}/videos`,
                method: "POST",
                body: { videoId },
            }),
            invalidatesTags: ["Playlist"],
        }),

        updatePlaylist: builder.mutation<{ message: string }, { id: string; title?: string; isPrivate?: boolean }>({
            query: ({ id, ...body }) => ({
                url: `/playlists/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Playlist", id: arg.id },
                "Playlist"
            ],
        }),

        removeVideoFromPlaylist: builder.mutation<{ message: string }, { playlistId: string; playlistVideoId: string }>({
            query: ({ playlistId, playlistVideoId }) => ({
                url: `/playlists/${playlistId}/videos/${playlistVideoId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Playlist"],
        }),

        getNotifications: builder.query<NotificationItem[], number | void>({
            query: (page = 1) => `/notifications?page=${page}`,
            providesTags: ["Notification"],
        }),

        getUnreadCount: builder.query<UnreadCountResponse, void>({
            query: () => "/notifications/unread-count",
            providesTags: ["Notification"],
        }),

        markAsRead: builder.mutation<void, string>({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: "POST",
            }),
            invalidatesTags: ["Notification"],
        }),

        markAllAsRead: builder.mutation<void, void>({
            query: () => ({
                url: `/notifications/read-all`,
                method: "POST",
            }),
            invalidatesTags: ["Notification"],
        }),

        updateNotificationSettings: builder.mutation<void, UpdateNotificationSettingsDto>({
            query: (settings) => ({
                url: `/notifications/settings`,
                method: "PUT",
                body: settings,
            }),
        }),

        deleteNotification: builder.mutation<void, string>({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Notification"],
        }),

        deleteAllNotifications: builder.mutation<void, void>({
            query: () => ({
                url: `/notifications`,
                method: "DELETE",
            }),
            invalidatesTags: ["Notification"],
        }),

        deleteMultipleNotifications: builder.mutation<void, string[]>({
            query: (ids) => ({
                url: `/notifications/batch`,
                method: "DELETE",
                body: ids,
            }),
            invalidatesTags: ["Notification"],
        }),
    }),
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useLogoutMutation,
    useGetMeQuery,
    useGetMyChannelQuery,
    useCreateChannelMutation,
    useLazyGetMyChannelQuery,
    useGetChannelByIdQuery,
    useGetChannelByUserIdQuery,
    useGetSubscriptionsQuery,
    useToggleSubscriptionMutation,
    useUnsubscribeFromChannelMutation,
    useToggleNotificationsMutation,
    useGetAllVideosQuery,
    useGetVideoByIdQuery,
    useGetVideosByChannelIdQuery,
    useUploadVideoMutation,
    useDeleteVideoMutation,
    useGetCategoriesQuery,
    useToggleLikeMutation,
    useToggleDislikeMutation,
    useGetLikeStatusQuery,
    useGetDislikeStatusQuery,
    useRecordViewMutation,
    useGetVideoCommentsQuery,
    useCreateCommentMutation,
    useGetCommentRepliesQuery,
    useUpdateCommentMutation,
    useToggleCommentLikeMutation,
    useToggleCommentDislikeMutation,
    useDeleteCommentMutation,
    useUpdateVideoDetailsMutation,
    useTrimVideoMutation,
    useAddVideoToPlaylistMutation,
    useCreatePlaylistMutation,
    useGetMyPlaylistsQuery,
    useUpdatePlaylistMutation,
    useRemoveVideoFromPlaylistMutation,
    useGetPlaylistByIdQuery,
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useUpdateNotificationSettingsMutation,
    useDeleteNotificationMutation,
    useDeleteAllNotificationsMutation,
    useDeleteMultipleNotificationsMutation,
} = apiSlice;