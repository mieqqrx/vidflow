import { apiSlice } from "./apiSlice";
import { Comment, CreateCommentRequest, CreateCommentResponse } from "@/types";

export const commentApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
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
            query: ({ id }) => ({ url: `/comments/${id}/like`, method: "POST" }),
            invalidatesTags: (result, error, arg) => [
                { type: "Comment", id: arg.videoId },
                ...(arg.parentCommentId ? [{ type: "Comment" as const, id: arg.parentCommentId }] : [])
            ],
        }),

        toggleCommentDislike: builder.mutation<{ isDisliked: boolean }, { id: string; videoId: string; parentCommentId?: string | null }>({
            query: ({ id }) => ({ url: `/comments/${id}/dislike`, method: "POST" }),
            invalidatesTags: (result, error, arg) => [
                { type: "Comment", id: arg.videoId },
                ...(arg.parentCommentId ? [{ type: "Comment" as const, id: arg.parentCommentId }] : [])
            ],
        }),

        deleteComment: builder.mutation<{ message: string }, { id: string; videoId: string; parentCommentId?: string | null }>({
            query: ({ id }) => ({ url: `/comments/${id}`, method: "DELETE" }),
            invalidatesTags: (result, error, arg) => [
                { type: "Comment", id: arg.videoId },
                ...(arg.parentCommentId ? [{ type: "Comment" as const, id: arg.parentCommentId }] : [])
            ],
        }),
    }),
});

export const {
    useGetVideoCommentsQuery,
    useCreateCommentMutation,
    useGetCommentRepliesQuery,
    useUpdateCommentMutation,
    useToggleCommentLikeMutation,
    useToggleCommentDislikeMutation,
    useDeleteCommentMutation,
} = commentApi;