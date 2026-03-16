import type { Video } from "./video";

export enum PlaylistType {
    "Custom",
    "Liked",
    "WatchLater",
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