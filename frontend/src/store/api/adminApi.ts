import { apiSlice } from "./apiSlice";
import {
    AdminStats,
    AdminReport,
    ReportStatus,
    AdminUsersResponse,
    UserRole,
    VideoVisibility,
    AdminVideosResponse, VideoStatus
} from "@/types";

export const adminApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAdminStats: builder.query<AdminStats, void>({
            query: () => "/admin/stats",
            providesTags: ["Video", "User", "Channel", "Comment"],
        }),

        getAdminReports: builder.query<AdminReport[], { status?: ReportStatus; page?: number }>({
            query: ({ status, page = 1 }) => {
                let url = `/admin/reports?page=${page}`;
                if (status !== undefined) url += `&status=${status}`;
                return url;
            },
            providesTags: ["Video"],
        }),

        reviewReport: builder.mutation<void, { id: string; status: ReportStatus; moderatorNote?: string }>({
            query: ({ id, ...body }) => ({
                url: `/admin/reports/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Video"],
        }),

        getAdminVideos: builder.query<AdminVideosResponse, { search?: string; status?: VideoStatus; page?: number }>({
            query: ({ search, status, page = 1 }) => {
                let url = `/admin/videos?page=${page}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
                if (status !== undefined) url += `&status=${status}`;
                return url;
            },
            providesTags: ["Video"],
        }),
        deleteAdminVideo: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/admin/videos/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Video", "Channel"],
        }),
        setAdminVideoVisibility: builder.mutation<{ message: string }, { id: string; visibility: VideoVisibility }>({
            query: ({ id, visibility }) => ({
                url: `/admin/videos/${id}/visibility`,
                method: "PUT",
                body: { visibility },
            }),
            invalidatesTags: ["Video"],
        }),

        getAdminUsers: builder.query<AdminUsersResponse, { search?: string; role?: UserRole; page?: number }>({
            query: ({ search, role, page = 1 }) => {
                let url = `/admin/users?page=${page}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
                if (role !== undefined) url += `&role=${role}`;
                return url;
            },
            providesTags: ["User"],
        }),

        setAdminUserRole: builder.mutation<{ message: string }, { id: string; role: UserRole }>({
            query: ({ id, role }) => ({
                url: `/admin/users/${id}/role`,
                method: "PUT",
                body: { role },
            }),
            invalidatesTags: ["User"],
        }),

        deleteAdminUser: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/admin/users/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["User", "Channel", "Video", "Comment"],
        }),
    }),
});

export const {
    useGetAdminStatsQuery,
    useGetAdminReportsQuery,
    useReviewReportMutation,
    useGetAdminVideosQuery,
    useDeleteAdminVideoMutation,
    useSetAdminVideoVisibilityMutation,
    useGetAdminUsersQuery,
    useSetAdminUserRoleMutation,
    useDeleteAdminUserMutation,
} = adminApi;