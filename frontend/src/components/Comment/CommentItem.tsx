"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ThumbsUp, ThumbsDown, Loader2,
    ChevronDown, ChevronUp, Pencil, X, Check, Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    useCreateCommentMutation,
    useGetMeQuery,
    useGetCommentRepliesQuery,
    useUpdateCommentMutation,
    useToggleCommentLikeMutation,
    useToggleCommentDislikeMutation,
    useDeleteCommentMutation
} from "@/store/api/apiSlice";
import { Comment } from "@/types";

interface CommentProps extends Comment {
    depth?: number;
}

export default function CommentItem(props: CommentProps) {
    const {
        id, username, avatarUrl, text, createdAt, likesCount,
        dislikesCount, isLiked, isDisliked,
        userId: authorId, channelId,
        repliesCount, replies: initialReplies, videoId, parentCommentId,
        depth = 0
    } = props;

    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [showReplies, setShowReplies] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(text);

    const { data: currentUser } = useGetMeQuery();

    const [createComment, { isLoading: isSubmittingReply }] = useCreateCommentMutation();
    const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();
    const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();
    const [toggleLike] = useToggleCommentLikeMutation();
    const [toggleDislike] = useToggleCommentDislikeMutation();

    const { data: fetchedReplies, isLoading: isLoadingReplies } = useGetCommentRepliesQuery(id, {
        skip: !showReplies
    });

    const isOwner = currentUser?.id === authorId;
    const timeAgo = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : "Recently";

    const safeUserName = username || "User";
    const userHandle = `@${safeUserName.replace(/\s+/g, '').toLowerCase()}`;
    const firstLetter = safeUserName[0]?.toUpperCase() || "U";

    // Если у пользователя есть канал, ведем на него. Иначе - на страницу "канал не найден"
    const targetUrl = channelId ? `/channel/${channelId}` : `/channel/not-found`;

    const displayedReplies = initialReplies?.length ? initialReplies : fetchedReplies;
    const isMaxDepth = depth >= 2;
    const avatarSize = depth === 0 ? "w-10 h-10" : depth === 1 ? "w-8 h-8" : "w-6 h-6 mt-1";

    const indentClass = depth === 0
        ? "mb-6"
        : "ml-8 md:ml-12 mt-3 border-l-2 border-[#3f3f3f] pl-4";

    const handleReplyClick = () => {
        if (!showReplyInput) {
            setReplyText(`${userHandle} `);
        } else {
            setReplyText("");
        }
        setShowReplyInput(!showReplyInput);
    };

    const handleReplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            const targetParentId = isMaxDepth ? parentCommentId : id;
            await createComment({
                videoId,
                text: replyText,
                parentCommentId: (targetParentId || undefined) as any
            }).unwrap();

            setReplyText("");
            setShowReplyInput(false);
            setShowReplies(true);
        } catch (error) {
            console.error("Failed to post reply", error);
        }
    };

    const handleUpdate = async () => {
        if (!editText.trim() || editText === text) {
            setIsEditing(false);
            return;
        }
        try {
            await updateComment({ id, text: editText, videoId }).unwrap();
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update comment", error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Permanently delete this comment?")) return;
        try {
            await deleteComment({
                id,
                videoId,
                parentCommentId: parentCommentId || null
            }).unwrap();
        } catch (error) {
            console.error("Failed to delete comment", error);
        }
    };

    const handleLike = () => toggleLike({
        id,
        videoId,
        parentCommentId: (parentCommentId || null) as any
    });

    const handleDislike = () => toggleDislike({
        id,
        videoId,
        parentCommentId: (parentCommentId || null) as any
    });

    // Функция отрисовки текста с синими ссылками-упоминаниями.
    // Принимает targetId для формирования ссылки.
    const renderTextWithMentions = (textContent: string, targetId: string | null | undefined) => {
        if (!textContent) return "";
        const parts = textContent.split(/(@[\w.-]+)/g);

        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                // Если targetId есть, рендерим ссылку на канал, иначе ссылку на заглушку
                if (targetId) {
                    return (
                        <Link
                            key={index}
                            href={`/channel/${targetId}`}
                            className="text-[#3ea6ff] font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                } else {
                    return (
                        <Link
                            key={index}
                            href="/channel/not-found"
                            className="text-[#3ea6ff] font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </Link>
                    );
                }
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className={`flex flex-col w-full group ${indentClass}`}>
            <div className="flex gap-4">
                {/* Аватарка ведет на канал автора или на страницу-заглушку */}
                <Link href={targetUrl}>
                    <Avatar className={`cursor-pointer shrink-0 ${avatarSize}`}>
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className={depth > 0 ? "text-[10px]" : ""}>{firstLetter}</AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex flex-col gap-1 w-full min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[13px] mb-0.5">
                            {/* Имя ведет на канал автора или на страницу-заглушку */}
                            <Link href={targetUrl}>
                                <span className="font-semibold text-white cursor-pointer hover:text-gray-300 transition-colors">
                                    {safeUserName}
                                </span>
                            </Link>
                            <span className="text-[#AAAAAA] text-xs shrink-0">{timeAgo}</span>
                        </div>

                        {isOwner && !isEditing && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 hover:bg-[#272727] rounded-full cursor-pointer"
                                    title="Edit"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-[#AAAAAA]" />
                                </button>

                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="p-1.5 hover:bg-[#272727] rounded-full cursor-pointer hover:text-red-500"
                                    title="Delete"
                                >
                                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="flex flex-col gap-2 mt-1 w-full max-w-[800px]">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="bg-transparent border-b border-[#3ea6ff] text-sm text-white outline-none py-1 w-full resize-none"
                                rows={1}
                                autoFocus
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { setIsEditing(false); setEditText(text); }}
                                    className="p-1.5 hover:bg-[#272727] rounded-full text-[#AAAAAA] cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="p-1.5 bg-[#3ea6ff] text-black rounded-full hover:bg-[#6ebcff] cursor-pointer disabled:opacity-50"
                                >
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[14px] text-white leading-tight whitespace-pre-wrap break-words">
                            {/* Вызов функции с передачей channelId */}
                            {renderTextWithMentions(text || "", channelId)}
                        </p>
                    )}

                    <div className="flex items-center gap-4 mt-1">
                        <div
                            onClick={handleLike}
                            className="flex items-center gap-2 cursor-pointer hover:bg-[#272727] p-1.5 -ml-1.5 rounded-full transition-colors"
                        >
                            <ThumbsUp
                                className={`${depth > 0 ? 'w-3 h-3' : 'w-4 h-4'} ${isLiked ? "fill-white text-white" : "text-white"}`}
                            />

                            <span className="text-[#AAAAAA] text-xs font-medium">{likesCount ?? 0}</span>
                        </div>

                        <div
                            onClick={handleDislike}
                            className="flex items-center gap-2 cursor-pointer hover:bg-[#272727] p-1.5 rounded-full transition-colors"
                        >
                            <ThumbsDown
                                className={`${depth > 0 ? 'w-3 h-3' : 'w-4 h-4'} ${isDisliked ? "fill-white text-white" : "text-white"}`}
                            />

                            <span className="text-[#AAAAAA] text-xs font-medium">{dislikesCount ?? 0}</span>
                        </div>

                        <button
                            onClick={handleReplyClick}
                            className="text-[#AAAAAA] text-xs font-semibold hover:bg-[#272727] cursor-pointer hover:text-white px-3 py-1.5 rounded-full transition-colors"
                        >
                            Reply
                        </button>
                    </div>

                    {/* Логика ввода ответа */}
                    {showReplyInput && (
                        <form onSubmit={handleReplySubmit} className="flex gap-4 mt-2 mb-2 w-full max-w-[800px]">
                            <Avatar className="h-6 w-6 shrink-0 mt-1">
                                <AvatarImage src={currentUser?.avatarUrl || undefined} />
                                <AvatarFallback className="text-[10px]">{currentUser?.username?.[0]?.toUpperCase() || "ME"}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 flex flex-col items-end">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Add a reply..."
                                    className="w-full bg-transparent border-b border-[#3F3F3F] pb-1 text-[13px] text-white placeholder-[#AAAAAA] outline-none focus:border-white focus:border-b-2 transition-all"
                                    disabled={isSubmittingReply}
                                    autoFocus
                                />

                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowReplyInput(false)}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium hover:bg-[#272727] transition-colors cursor-pointer"
                                        disabled={isSubmittingReply}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#3ea6ff] text-black hover:bg-[#6ebcff] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                        disabled={isSubmittingReply || !replyText.trim()}
                                    >
                                        {isSubmittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reply"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {repliesCount > 0 && depth < 2 && (
                        <div className="mt-1">
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="flex items-center gap-2 text-[#3ea6ff] font-medium text-sm hover:bg-[#3ea6ff]/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer -ml-3"
                            >
                                {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {showReplies ? "Hide replies" : `${repliesCount} replies`}
                            </button>
                        </div>
                    )}

                    {showReplies && (
                        <div className="mt-2 flex flex-col w-full">
                            {isLoadingReplies ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#3ea6ff] ml-2 mt-2" />
                            ) : (
                                displayedReplies?.map((reply) => (
                                    <CommentItem
                                        key={reply.id}
                                        {...reply}
                                        videoId={videoId}
                                        depth={depth + 1}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}