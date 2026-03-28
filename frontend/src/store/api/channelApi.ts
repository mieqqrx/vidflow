import { apiSlice } from "./apiSlice";
import { Channel, CreateChannelRequest } from "@/types";

export const channelApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
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

        updateChannel: builder.mutation<{ message: string }, { id: string; formData: FormData }>({
            query: ({ id, formData }) => ({
                url: `/channels/${id}`,
                method: "PUT",
                body: formData,
            }),
            invalidatesTags: ["Channel", "User", "Video"],
        }),

        setFeaturedVideo: builder.mutation<{ message: string }, { id: string; videoId: string | null }>({
            query: ({ id, videoId }) => ({
                url: `/channels/${id}/featured`,
                method: "PUT",
                body: { videoId },
            }),
            invalidatesTags: (result, error, arg) => [{ type: "Channel", id: arg.id }],
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
    }),
});

export const {
    useGetMyChannelQuery,
    useLazyGetMyChannelQuery,
    useGetChannelByIdQuery,
    useGetChannelByUserIdQuery,
    useCreateChannelMutation,
    useUpdateChannelMutation,
    useSetFeaturedVideoMutation,
    useGetSubscriptionsQuery,
    useToggleSubscriptionMutation,
    useUnsubscribeFromChannelMutation,
    useToggleNotificationsMutation,
} = channelApi;