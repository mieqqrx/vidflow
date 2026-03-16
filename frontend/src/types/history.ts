export interface UpdateWatchPositionRequest {
    videoId: string;
    positionSeconds: number;
}

export interface VideoPositionResponse {
    lastPositionSeconds: number;
    watchedPercent: number;
    isCompleted: boolean;
}

export interface WatchHistoryItem {
    videoId: string;
    videoTitle: string;
    thumbnailUrl?: string;
    channelName?: string;
    durationSeconds: number;
    lastPositionSeconds: number;
    watchedPercent: number;
    isCompleted: boolean;
    watchedAt: string;
}