import type { Channel } from "./channel";

export enum VideoStatus {
    Processing = 0,
    Published = 1,
    Failed = 2,
}

export enum VideoVisibility {
    Public,
    Unlisted,
    Private
}

export interface Category {
    id: string;
    name: string;
}

export interface Video {
    id: string;
    title: string;
    description: string;
    durationSeconds: number;
    videoUrl: string;
    thumbnailUrl: string | null;
    resolutions: string[];
    viewsCount: number;
    likesCount: number;
    dislikesCount: number;
    isLiked?: boolean;
    isDisliked?: boolean;
    commentsCount: number;
    ageRestriction: boolean;
    status: VideoStatus;
    visibility: VideoVisibility;
    createdAt: string;
    channelId: string;
    channel: Channel;
    categoryId: string;
    category: Category;
    channelName: string;

    channelAvatarUrl?: string;
    isShort?: boolean;

    watchedPercent?: number;
    tags?: string[];
}

export interface UpdateVideoRequest {
    id: string;
    title?: string;
    description?: string;
    categoryId?: string;
    ageRestriction?: boolean;
    customThumbnail?: File;
    visibility?: number;
    tags?: string[];
}

export interface TrimVideoRequest {
    id: string;
    startSeconds: number;
    endSeconds: number;
}