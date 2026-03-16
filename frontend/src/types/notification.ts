export enum NotificationType {
    NewVideo = 0,
    VideoReady = 1,
    CommentReply = 2,
    CommentMention = 3,
    LiveStreamStarted = 4,
    NewShort = 5
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
    isShort?: boolean;
}

export interface UnreadCountResponse {
    count: number;
}