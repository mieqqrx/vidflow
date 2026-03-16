import type { UserRole } from "./auth";
import type { VideoStatus, VideoVisibility } from "./video";

export enum ReportStatus {
    Pending = 0,
    Reviewed = 1,
    Resolved = 2,
    VideoRemoved = 3
}

export interface CreateVideoReportRequest {
    videoId: string;
    reason: number;
    details?: string;
}

export interface CreateVideoReportResponse {
    message: string;
}

export interface AdminStats {
    totalUsers: number;
    totalVideos: number;
    totalChannels: number;
    pendingReports: number;
    totalViews: number;
    totalComments: number;
    newUsersToday: number;
    newVideosToday: number;
}

export interface AdminReport {
    id: string;
    reason: string;
    details: string;
    status: ReportStatus;
    moderatorNote?: string;
    createdAt: string;
    reviewedAt?: string;
    reporter: {
        id: string;
        username: string;
    };
    video: {
        id: string;
        title: string;
        thumbnailUrl: string;
    };
}

export interface AdminVideoItem {
    id: string;
    title: string;
    thumbnailUrl: string;
    status: VideoStatus;
    visibility: VideoVisibility;
    viewsCount: number;
    likesCount: number;
    dislikesCount: number;
    commentsCount: number;
    createdAt: string;
    channel: {
        id: string;
        name: string;
    };
    reportsCount: number;
}

export interface AdminVideosResponse {
    videos: AdminVideoItem[];
    total: number;
    page: number;
    pageSize: number;
}

export interface AdminUserItem {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    registrationDate: string;
    totalViewsCount: number;
    hasChannel: boolean;
}

export interface AdminUsersResponse {
    users: AdminUserItem[];
    total: number;
    page: number;
    pageSize: number;
}