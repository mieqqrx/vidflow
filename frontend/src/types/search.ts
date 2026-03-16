export enum SearchSortBy {
    Relevance = 0,
    ViewsCount = 1,
    LikesCount = 2,
    CreatedAt = 3,
    Duration = 4
}

export interface SearchVideosParams {
    query?: string;
    categoryName?: string;
    language?: string;
    tags?: string[];
    minDuration?: number;
    maxDuration?: number;
    sortBy?: SearchSortBy;
    safeSearch?: boolean;
    page?: number;
    pageSize?: number;
}

export interface SearchVideoDocument {
    id: string;
    title: string;
    description?: string;
    tags: string[];
    categoryName?: string;
    language?: string;
    channelName: string;
    channelId: string;
    thumbnailUrl?: string;
    durationSeconds: number;
    viewsCount: number;
    likesCount: number;
    commentsCount: number;
    visibility: number;
    ageRestriction: boolean;
    createdAt: string;
    channelAvatarUrl?: string;
}

export interface SearchResultResponse {
    videos: SearchVideoDocument[];
    total: number;
    page: number;
    pageSize: number;
}

export interface SearchChannelDocument {
    id: string;
    channelName: string;
    handle?: string;
    avatarUrl?: string;
    subscribersCount: number;
    description?: string;
}


export interface SearchResultResponse {
    videos: SearchVideoDocument[];
    channels?: SearchChannelDocument[];
    total: number;
    page: number;
    pageSize: number;
}

export interface BaseSearchParams {
    query?: string;
    page?: number;
    pageSize?: number;
}

export interface SearchChannelDocument {
    id: string;
    name: string;
    description?: string;
    bannerUrl?: string;
    ownerAvatarUrl?: string;
    subscribersCount: number;
    videosCount: number;
    createdAt: string;
}

export interface ChannelSearchResultResponse {
    channels: SearchChannelDocument[];
    total: number;
    page: number;
    pageSize: number;
}

export interface SearchPlaylistDocument {
    id: string;
    title: string;
    channelName: string;
    channelId: string;
    thumbnailUrl?: string;
    videosCount: number;
    isPrivate: boolean;
    createdAt: string;
}

export interface PlaylistSearchResultResponse {
    playlists: SearchPlaylistDocument[];
    total: number;
    page: number;
    pageSize: number;
}