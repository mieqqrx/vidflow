"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Pen, Trash2, ExternalLink, Eye, Lock, Link as LinkIcon, AlertTriangle, Loader2, UploadCloud, PlaySquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetChannelShortsQuery, useUploadShortMutation, useDeleteVideoMutation } from "@/store/api";
import { Video } from "@/types";
import { fixUrl } from "@/utils/fixUrl";

export default function ShortsTab({ channelId }: { channelId: string }) {
    const { data: shorts, isLoading: isShortsLoading } = useGetChannelShortsQuery(channelId, { skip: !channelId });
    const [uploadShort, { isLoading: isUploading }] = useUploadShortMutation();
    const [deleteVideo, { isLoading: isDeleting }] = useDeleteVideoMutation();

    const [videoToDelete, setVideoToDelete] = useState<{ id: string, title: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDeleteVideo = async () => {
        if (!videoToDelete) return;
        try {
            await deleteVideo(videoToDelete.id).unwrap();
            setVideoToDelete(null);
            toast.success("Short deleted successfully");
        } catch (error) {
            toast.error("Failed to delete short");
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("video/")) {
            toast.error("Please select a valid video file.");
            return;
        }

        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';

        videoElement.onloadedmetadata = async () => {
            window.URL.revokeObjectURL(videoElement.src);

            if (videoElement.duration > 61) {
                toast.error(`Video is too long (${Math.round(videoElement.duration)}s). Shorts must be under 60 seconds.`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            if (videoElement.videoWidth > videoElement.videoHeight) {
                toast.error("Shorts must be vertical (height must be greater than width).");
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            const formData = new FormData();
            formData.append("File", file);
            formData.append("Title", file.name.replace(/\.[^/.]+$/, ""));
            formData.append("Description", "#shorts");
            formData.append("Visibility", "0");
            formData.append("AgeRestriction", "false");

            try {
                toast.loading("Uploading Short...", { id: "upload-short" });
                await uploadShort(formData).unwrap();
                toast.success("Short uploaded successfully! Processing started.", { id: "upload-short" });
            } catch (error: any) {
                toast.error(error.data?.message || "Failed to upload Short", { id: "upload-short" });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        videoElement.src = URL.createObjectURL(file);
    };

    if (isShortsLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" /></div>;
    }

    return (
        <div className="px-8 py-6 w-full h-full bg-[#1f1f1f] flex flex-col gap-8">
            <div className="bg-[#282828] border border-[#3f3f3f] rounded-2xl p-8 shadow-xl max-w-3xl">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <PlaySquare className="w-6 h-6 text-[#3ea6ff]" />
                    Upload a Short
                </h2>

                <p className="text-[#aaaaaa] text-[14px] mb-6">
                    Upload vertical videos under 60 seconds. They will automatically appear in the Shorts feed.
                </p>

                <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed ${isUploading ? 'border-[#3ea6ff] bg-[#3ea6ff]/10' : 'border-[#444] hover:border-[#3ea6ff] hover:bg-[#1a1a1a]'} rounded-xl cursor-pointer transition-all group`}>
                    {isUploading ? (
                        <>
                            <Loader2 className="w-10 h-10 text-[#3ea6ff] animate-spin mb-3" />
                            <span className="text-[15px] font-medium text-[#3ea6ff]">Uploading... Please wait</span>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-12 h-12 text-[#555] group-hover:text-[#3ea6ff] transition-colors mb-3 transform group-hover:-translate-y-1" />
                            <span className="text-[15px] text-white font-medium mb-1">Select video file to upload</span>
                            <span className="text-[13px] text-[#aaaaaa]">Vertical MP4, less than 60 seconds</span>

                            <input
                                type="file"
                                accept="video/mp4,video/x-m4v,video/*"
                                className="hidden"
                                onChange={handleFileSelect}
                                ref={fileInputRef}
                                disabled={isUploading}
                            />
                        </>
                    )}
                </label>
            </div>

            <div className="bg-[#282828] rounded-2xl overflow-hidden border border-[#3f3f3f] shadow-xl">
                <div className="px-6 py-4 border-b border-[#3f3f3f] bg-[#212121]">
                    <h3 className="font-semibold text-white">Your Shorts</h3>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <div className="min-w-[900px]">
                        <div className="grid grid-cols-[4fr_1fr_1.5fr_1fr_1fr_1fr] gap-4 text-[#aaaaaa] text-[13px] font-medium border-b border-[#3f3f3f] py-3 px-6 bg-[#212121]/50">
                            <div>Short</div>
                            <div>Visibility</div>
                            <div>Date</div>
                            <div>Views</div>
                            <div>Comments</div>
                            <div>Likes</div>
                        </div>

                        <div className="flex flex-col">
                            {shorts?.length === 0 ? (
                                <div className="text-center py-20 text-[#aaaaaa]">
                                    You haven't uploaded any Shorts yet.
                                </div>
                            ) : (
                                shorts?.map((video: Video) => (
                                    <div key={video.id} className="grid grid-cols-[4fr_1fr_1.5fr_1fr_1fr_1fr] gap-4 items-center border-b border-[#3f3f3f] py-3 px-6 hover:bg-[#1f1f1f] transition-colors group">
                                        <div className="flex gap-4 min-w-0 items-center">
                                            <div className="relative w-[45px] h-[80px] shrink-0 bg-black rounded overflow-hidden shadow-md">
                                                <img
                                                    src={fixUrl(video.thumbnailUrl) || "/placeholder.jpg"}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                />

                                                <span className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[9px] font-medium text-white">
                                                    {video.durationSeconds ? `0:${Math.floor(video.durationSeconds % 60).toString().padStart(2, '0')}` : "0:00"}
                                                </span>
                                            </div>

                                            <div className="flex flex-col min-w-0 py-1 flex-1">
                                                <h3 className="text-[14px] font-medium text-white truncate pr-4" title={video.title}>
                                                    {video.title}
                                                </h3>

                                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                                    <Link href={`/studio/video/${video.id}`} className="text-[#aaaaaa] hover:text-white cursor-pointer" title="Edit">
                                                        <Pen className="w-[16px] h-[16px]" />
                                                    </Link>

                                                    <Link href={`/shorts/${video.id}`} className="text-[#aaaaaa] hover:text-white cursor-pointer block" title="Watch Short">
                                                        <ExternalLink className="w-[16px] h-[16px]" />
                                                    </Link>

                                                    <button onClick={() => setVideoToDelete({ id: video.id, title: video.title })} className="text-[#aaaaaa] hover:text-red-500 transition-colors cursor-pointer" title="Delete">
                                                        <Trash2 className="w-[16px] h-[16px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-[13px]">
                                            {video.visibility === 2 ? <><Lock className="w-4 h-4 text-[#aaaaaa]" /><span className="text-[#aaaaaa]">Private</span></>
                                                : video.visibility === 1 ? <><LinkIcon className="w-4 h-4 text-[#aaaaaa]" /><span className="text-[#aaaaaa]">Unlisted</span></>
                                                    : <><Eye className="w-4 h-4 text-[#2ba640]" /><span className="text-white">Public</span></>}
                                        </div>

                                        <div className="text-[13px] text-[#aaaaaa]">
                                            {video.createdAt ? format(new Date(video.createdAt), "MMM dd, yyyy") : "Unknown"}
                                        </div>

                                        <div className="text-[13px] text-white">{video.viewsCount?.toLocaleString() || 0}</div>
                                        <div className="text-[13px] text-white">{video.commentsCount?.toLocaleString() || 0}</div>

                                        <div className="text-[13px] text-white flex items-center gap-1">
                                            {video.likesCount?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {videoToDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#212121] rounded-xl max-w-md w-full shadow-2xl border border-[#3f3f3f] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                Permanently delete this Short?
                            </h2>

                            <p className="text-[14px] text-[#aaaaaa] mb-6 line-clamp-2">
                                <span className="text-white font-medium">{videoToDelete.title}</span>
                            </p>

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