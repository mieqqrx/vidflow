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

export interface CreateCommentRequest {
    videoId: string;
    text: string;
    parentCommentId?: string | null;
}

export interface CreateCommentResponse {
    message: string;
    comment: Comment;
}