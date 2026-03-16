export enum UserRole {
    User = 0,
    Moderator = 1,
    Admin = 2
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

    autoplayEnabled?: boolean;
    notifyOnNewVideo?: boolean;
    notifyOnCommentReply?: boolean;
    notifyOnMention?: boolean;
    notifyOnVideoReady?: boolean;
    notifyOnLiveStream?: boolean;

    role: UserRole;
}

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

export interface UpdateUserSettingsDto {
    autoplayEnabled?: boolean;
    notifyOnNewVideo?: boolean;
    notifyOnCommentReply?: boolean;
    notifyOnMention?: boolean;
    notifyOnVideoReady?: boolean;
}