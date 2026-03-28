import type { Video } from "./video";

export interface Channel {
    id: string;
    name: string;
    description?: string;
    bannerUrl?: string;
    avatarUrl?: string;
    ownerAvatarUrl?: string;
    subscribersCount: number;
    notificationEnabled: boolean;
    ownerId: string;
    ownerUsername: string;
    createdAt: string;
    featuredVideoId?: string | null;
    featuredVideo?: Video | null;
}

export interface CreateChannelRequest {
    name: string;
    handle: string;
    description?: string;
}

export interface Subscription {
    id: string;
    channelId: string;
    channelName?: string;
    name?: string;
    notificationEnabled?: boolean;
    channelAvatarUrl?: string | null;
    avatarUrl?: string | null;
    ownerAvatarUrl?: string | null;
    hasNewVideos?: boolean;
}