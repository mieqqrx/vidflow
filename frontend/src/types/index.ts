export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    dateOfBirth: string;
}

export interface CreateChannelRequest {
    name: string;
    handle: string;
    description?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
    totalViewsCount: number;
    channelId?: string | null;
    registrationDate: string;
    dateOfBirth?: string;

    notifyOnNewVideo?: boolean;
    notifyOnCommentReply?: boolean;
    notifyOnMention?: boolean;
    notifyOnVideoReady?: boolean;
}

export interface Channel {
    id: string;
    name: string;
    description?: string;
    bannerUrl?: string;
    avatarUrl?: string;
    subscribersCount: number;
    notificationEnabled: boolean;
    ownerId: string;
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
}

export interface Comment {
    id: string;
    text: string;
    createdAt: string;
    username: string;
    avatarUrl?: string | null;
    userId: string;
    videoId: string;
    parentCommentId?: string | null;
    channelId?: string | null;
    repliesCount: number;
    likesCount: number;
    dislikesCount: number;
    isLiked: boolean;
    isDisliked: boolean;
    replies?: Comment[];
}

export interface Playlist {
    id: string;
    title: string;
    isPrivate: boolean;
    isSystem: boolean;
    type: PlaylistType;
    createdAt: string;
    lastUpdatedAt: string;
    userId: string;
    playlistVideos: { id: string; videoId: string }[];
}

export interface PlaylistVideoItem {
    id: string;
    videoId: string;
    videoTitle: string;
    channelName?: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    isDeleted?: boolean;
    addedAt: string;
    order: number;
    video?: Video;
}

export interface PlaylistResponse {
    id: string;
    title: string;
    isPrivate: boolean;
    isSystem: boolean;
    type: PlaylistType;
    videoCount: number;
    thumbnailUrl?: string;
    createdAt: string;
    lastUpdatedAt: string;
    videos: PlaylistVideoItem[];
}

export interface CreateCommentRequest {
    videoId: string;
    text: string;
    parentCommentId?: string | null;
}

export interface CreateCommentResponse {
    message: string;
    comment: Comment;
}

export interface UpdateVideoRequest {
    id: string;
    title?: string;
    description?: string;
    categoryId?: string;
    ageRestriction?: boolean;
    customThumbnail?: File;
    visibility?: number;
}

export interface TrimVideoRequest {
    id: string;
    startSeconds: number;
    endSeconds: number;
}

export interface NotificationItem {
    id: string;
    type: NotificationType;
    message: string;
    thumbnailUrl?: string;
    actorName?: string;
    actorAvatarUrl?: string;
    videoId?: string;
    commentId?: string;
    channelId?: string;
    isRead: boolean;
    createdAt: string;
}

export interface UnreadCountResponse {
    count: number;
}

export interface UpdateNotificationSettingsDto {
    notifyOnNewVideo: boolean;
    notifyOnCommentReply: boolean;
    notifyOnMention: boolean;
    notifyOnVideoReady: boolean;
}

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

export enum PlaylistType {
    "Custom",
    "Liked",
    "WatchLater",
}

export enum NotificationType {
    "NewVideo",
    "VideoReady",
    "CommentReply",
    "CommentMention"
}