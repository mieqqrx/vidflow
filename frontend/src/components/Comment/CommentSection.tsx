"use client";

import React, { useState } from "react";
import { AlignLeft, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CommentItem from "./CommentItem";
import { Comment } from "@/types";
import { useCreateCommentMutation, useGetMeQuery, useGetVideoByIdQuery, useGetVideoCommentsQuery } from "@/store/api";

interface CommentSectionProps {
    videoId: string;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
    const [inputText, setInputText] = useState("");

    const { data: comments, isLoading } = useGetVideoCommentsQuery(videoId, { skip: !videoId });

    const { data: video } = useGetVideoByIdQuery(videoId, { skip: !videoId });

    const [createComment, { isLoading: isSubmitting }] = useCreateCommentMutation();

    const { data: currentUser } = useGetMeQuery();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        try {
            await createComment({ videoId, text: inputText }).unwrap();
            setInputText("");
        } catch (error) {
            console.error("Failed to post comment", error);
        }
    };

    const totalComments = video?.commentsCount || 0;

    return (
        <div className="mt-6 w-full max-w-[1280px]">
            <div className="flex items-center gap-8 mb-6">
                <span className="text-xl font-bold text-white">
                    {totalComments.toLocaleString()} Comments
                </span>

                <div className="flex items-center gap-2 cursor-pointer text-white hover:text-gray-300 transition-colors">
                    <AlignLeft className="w-5 h-5" />
                    <span className="font-semibold text-sm">Sort by</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={currentUser?.avatarUrl || undefined} />
                    <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase() || "ME"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 flex flex-col items-end">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Add a public comment..."
                        className="w-full bg-transparent border-b border-[#3F3F3F] pb-1 text-sm text-white placeholder-[#AAAAAA] outline-none focus:border-white focus:border-b-2 transition-all"
                        disabled={isSubmitting}
                    />

                    {inputText.trim().length > 0 && (
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setInputText("")}
                                className="px-4 py-2 rounded-full text-sm font-medium hover:bg-[#272727] transition-colors cursor-pointer"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="px-4 py-2 rounded-full text-sm font-medium bg-[#3ea6ff] text-black hover:bg-[#6ebcff] transition-colors flex items-center gap-2 cursor-pointer"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Comment"}
                            </button>
                        </div>
                    )}
                </div>
            </form>

            <div className="flex flex-col">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3ea6ff]" />
                    </div>
                ) : comments?.length === 0 ? (
                    <div className="text-center text-[#AAAAAA] py-6">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    comments?.map((comment: Comment) => (
                        <CommentItem
                            key={comment.id}
                            {...comment}
                            videoId={videoId}
                        />
                    ))
                )}
            </div>
        </div>
    );
}