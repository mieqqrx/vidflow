import { apiSlice } from "./apiSlice";
import { NotificationItem, UnreadCountResponse } from "@/types";

export const notificationApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query<NotificationItem[], number | void>({
            query: (page = 1) => `/notifications?page=${page}`,
            providesTags: ["Notification"],
        }),

        getUnreadCount: builder.query<UnreadCountResponse, void>({
            query: () => "/notifications/unread-count",
            providesTags: ["Notification"],
        }),

        markAsRead: builder.mutation<void, string>({
            query: (id) => ({ url: `/notifications/${id}/read`, method: "POST" }),
            invalidatesTags: ["Notification"],
        }),

        markAllAsRead: builder.mutation<void, void>({
            query: () => ({ url: `/notifications/read-all`, method: "POST" }),
            invalidatesTags: ["Notification"],
        }),

        deleteNotification: builder.mutation<void, string>({
            query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
            invalidatesTags: ["Notification"],
        }),

        deleteAllNotifications: builder.mutation<void, void>({
            query: () => ({ url: `/notifications`, method: "DELETE" }),
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
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
    useDeleteAllNotificationsMutation,
    useDeleteMultipleNotificationsMutation,
} = notificationApi;