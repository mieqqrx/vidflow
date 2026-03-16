import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store/store";

export const apiSlice = createApi({
    reducerPath: "api",

    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        prepareHeaders: (headers, { getState }) => {
            headers.set("ngrok-skip-browser-warning", "true");

            const activeUserId = (getState() as RootState).auth?.activeUserId;

            if (activeUserId) {
                headers.set("X-Active-User", activeUserId);
            }

            return headers;
        },
        credentials: "include",
    }),

    tagTypes: [
        "Video", "User", "Channel", "Like", "Dislike",
        "Comment", "Playlist", "Notification", "History",
        "LiveStream", "LiveStreamMessage", "Sessions"
    ],

    endpoints: () => ({}),
});