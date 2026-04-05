"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Pen, Trash2, ExternalLink, Eye, Lock, Link as LinkIcon, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetVideosByChannelIdQuery, useDeleteVideoMutation } from "@/store/api";
import { Video } from "@/types";
import { fixUrl } from "@/utils/fixUrl";

export default function VideosTab({ channelId }: { channelId: string }) {
    const { data: videos, isLoading: isVideosLoading } = useGetVideosByChannelIdQuery(channelId, { skip: !channelId });
    const [deleteVideo, { isLoading: isDeleting }] = useDeleteVideoMutation();
    const [videoToDelete, setVideoToDelete] = useState<{ id: string, title: string } | null>(null);

    const handleDeleteVideo = async () => {
        if (!videoToDelete) return;
        try {
            await deleteVideo(videoToDelete.id).unwrap();
            setVideoToDelete(null);
            toast.success("Video deleted successfully");
        } catch (error) {
            toast.error("Failed to delete video");
        }
    };

    if (isVideosLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" /></div>;
    }

    return (
        <div className="px-8 py-4 w-full h-full bg-[#282828]">
            <div className="min-w-[900px]">
                <div className="grid grid-cols-[4fr_1fr_1.5fr_1fr_1fr_1fr] gap-4 text-[#aaaaaa] text-[13px] font-medium border-b border-[#3f3f3f] pb-3 px-4">
                    <div>Video</div>
                    <div>Visibility</div>
                    <div>Date</div>
                    <div>Views</div>
                    <div>Comments</div>
                    <div>Likes (vs Dislikes)</div>
                </div>

                <div className="flex flex-col">
                    {videos?.length === 0 ? (
                        <div className="text-center py-20 text-[#aaaaaa]">
                            You haven't uploaded any videos yet.
                        </div>
                    ) : (
                        videos?.map((video: Video) => (
                            <div key={video.id} className="grid grid-cols-[4fr_1fr_1.5fr_1fr_1fr_1fr] gap-4 items-center border-b border-[#3f3f3f] py-3 px-4 hover:bg-[#1f1f1f] transition-colors group">
                                <div className="flex gap-4 min-w-0">
                                    <div className="relative w-[120px] h-[68px] shrink-0 bg-black rounded overflow-hidden">
                                        <img
                                            src={fixUrl(video.thumbnailUrl) || "/placeholder.jpg"}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                        />

                                        <span className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-medium">
                                            {video.durationSeconds ? `${Math.floor(video.durationSeconds / 60)}:${Math.floor(video.durationSeconds % 60).toString().padStart(2, '0')}` : "0:00"}
                                        </span>
                                    </div>

                                    <div className="flex flex-col justify-between min-w-0 py-1 flex-1">
                                        <div>
                                            <h3 className="text-[14px] font-medium truncate pr-4" title={video.title}>
                                                {video.title}
                                            </h3>

                                            <p className="text-[12px] text-[#aaaaaa] truncate pr-4 mt-0.5">
                                                {video.description || "No description"}
                                            </p>
                                        </div>

                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                            <Link href={`/studio/video/${video.id}`} className="text-[#aaaaaa] hover:text-white cursor-pointer" title="Edit">
                                                <Pen className="w-[18px] h-[18px]" />
                                            </Link>

                                            <Link href={`/watch/${video.id}`} className="text-[#aaaaaa] hover:text-white cursor-pointer block" title="Watch on platform">
                                                <ExternalLink className="w-[18px] h-[18px]" />
                                            </Link>

                                            <button
                                                onClick={() => setVideoToDelete({ id: video.id, title: video.title })}
                                                className="text-[#aaaaaa] hover:text-red-500 transition-colors cursor-pointer"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-[18px] h-[18px]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[13px]">
                                    {video.visibility === 2 ? (
                                        <><Lock className="w-4 h-4 text-[#aaaaaa]" /><span className="text-[#aaaaaa]">Private</span></>
                                    ) : video.visibility === 1 ? (
                                        <><LinkIcon className="w-4 h-4 text-[#aaaaaa]" /><span className="text-[#aaaaaa]">Unlisted</span></>
                                    ) : (
                                        <><Eye className="w-4 h-4 text-[#2ba640]" /><span className="text-white">Public</span></>
                                    )}
                                </div>

                                <div className="text-[13px] text-[#aaaaaa]">
                                    {video.createdAt ? format(new Date(video.createdAt), "MMM dd, yyyy") : "Unknown"}
                                    <div className="text-[12px]">Published</div>
                                </div>

                                <div className="text-[13px]">{video.viewsCount?.toLocaleString() || 0}</div>
                                <div className="text-[13px]">{video.commentsCount?.toLocaleString() || 0}</div>

                                <div className="text-[13px] flex items-center gap-1">
                                    <span>{video.likesCount?.toLocaleString() || 0}</span>
                                    <span className="text-[#aaaaaa] text-[11px] mx-1">/</span>
                                    <span>{video.dislikesCount?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {videoToDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#212121] rounded-xl max-w-md w-full shadow-2xl border border-[#3f3f3f] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                Permanently delete this video?
                            </h2>

                            <p className="text-[14px] text-[#aaaaaa] mb-4 line-clamp-2">
                                <span className="text-white font-medium">{videoToDelete.title}</span>
                            </p>

                            <div className="bg-[#1f1f1f] p-4 rounded-lg text-[13px] text-[#aaaaaa] mb-6 border border-[#3f3f3f]">
                                Permanent deletion cannot be undone. The video will be removed from the platform and all its comments and views will be lost.
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setVideoToDelete(null)} className="hover:bg-[#3f3f3f] text-white cursor-pointer" disabled={isDeleting}>Cancel</Button>
                                <Button onClick={handleDeleteVideo} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer" disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete forever"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}