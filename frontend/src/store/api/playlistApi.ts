import { apiSlice } from "./apiSlice";
import { Playlist, PlaylistResponse } from "@/types";

export const playlistApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMyPlaylists: builder.query<Playlist[], void>({
            query: () => "/playlists/my",
            providesTags: ["Playlist"],
        }),

        getPlaylistById: builder.query<PlaylistResponse, string>({
            query: (id) => `/playlists/${id}`,
            providesTags: (result, error, id) => [{ type: "Playlist", id }],
        }),

        getPlaylistsByChannelId: builder.query<PlaylistResponse[], string>({
            query: (channelId) => `/playlists/channel/${channelId}`,
            providesTags: ["Playlist"],
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
            invalidatesTags: (result, error, arg) => [{ type: "Playlist", id: arg.id }, "Playlist"],
        }),

        removeVideoFromPlaylist: builder.mutation<{ message: string }, { playlistId: string; playlistVideoId: string }>({
            query: ({ playlistId, playlistVideoId }) => ({
                url: `/playlists/${playlistId}/videos/${playlistVideoId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Playlist"],
        }),
    }),
});

export const {
    useGetMyPlaylistsQuery,
    useGetPlaylistByIdQuery,
    useGetPlaylistsByChannelIdQuery,
    useCreatePlaylistMutation,
    useAddVideoToPlaylistMutation,
    useUpdatePlaylistMutation,
    useRemoveVideoFromPlaylistMutation,
} = playlistApi;