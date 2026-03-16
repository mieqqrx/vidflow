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