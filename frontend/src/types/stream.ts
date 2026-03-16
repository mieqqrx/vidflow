export enum LiveStreamStatus {
    Scheduled = 0,
    Live = 1,
    Ended = 2,
    Failed = 3
}

export interface LiveStreamResponse {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    streamKey: string;
    status: LiveStreamStatus;
    playbackUrl?: string;
    recordingUrl?: string;
    viewersCount: number;
    peakViewersCount: number;
    totalViewsCount: number;
    startedAt?: string;
    endedAt?: string;
    createdAt: string;
    saveRecording: boolean;
    chatEnabled: boolean;
    channelId: string;
    channelName: string;
    channelAvatarUrl?: string;
    videoId?: string;
}

export interface CreateLiveStreamRequest {
    title: string;
    description?: string;
    saveRecording: boolean;
    chatEnabled: boolean;
}

export interface LiveStreamMessageDto {
    id: string;
    text: string;
    sentAt: string;
    userId: string;
    username: string;
    avatarUrl?: string;
}