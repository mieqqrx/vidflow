"use client";

import React, { useState } from "react";
import { Loader2, Search, Trash2, Eye, EyeOff, Globe, Lock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    useGetAdminVideosQuery,
    useDeleteAdminVideoMutation,
    useSetAdminVideoVisibilityMutation
} from "@/store/api";
import { VideoVisibility } from "@/types";

export default function AdminContentPage() {
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useGetAdminVideosQuery({ search: searchTerm, page });
    const [deleteVideo] = useDeleteAdminVideoMutation();
    const [setVisibility] = useSetAdminVideoVisibilityMutation();

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

        try {
            await deleteVideo(id).unwrap();
            toast.success("Video deleted successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete video");
        }
    };

    const handleVisibilityChange = async (id: string, visibility: VideoVisibility) => {
        try {
            await setVisibility({ id, visibility }).unwrap();
            toast.success("Visibility updated");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update visibility");
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchTerm(search);
        setPage(1);
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#212121] p-6 rounded-2xl border border-[#3F3F3F] shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Content Management</h1>
                    <p className="text-[#AAAAAA] text-sm mt-1">Manage all videos uploaded to the platform.</p>
                </div>

                <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto">
                    <div className="flex items-center bg-[#121212] border border-[#3F3F3F] rounded-lg px-4 h-10 w-full md:w-[300px] focus-within:border-[#3ea6ff] transition-colors">
                        <Search className="w-4 h-4 text-[#AAAAAA] mr-2 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search videos by title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-white text-sm w-full"
                        />
                    </div>
                </form>
            </div>

            <div className="bg-[#212121] border border-[#3F3F3F] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto w-full">
                    {isLoading ? (
                        <div className="p-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" /></div>
                    ) : data?.videos && data.videos.length > 0 ? (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                            <tr className="border-b border-[#3F3F3F] bg-[#181818]/80">
                                <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider w-[40%]">Video</th>
                                <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Visibility</th>
                                <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Metrics</th>
                                <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider">Date</th>
                                <th className="p-5 text-xs font-bold text-[#AAAAAA] uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3F3F3F]">
                            {data.videos.map((video) => (
                                <tr key={video.id} className="hover:bg-[#272727] transition-colors group">
                                    <td className="p-5 flex items-start gap-4">
                                        <div className="w-24 h-14 bg-black rounded-md overflow-hidden shrink-0 border border-[#3F3F3F]">
                                            <img src={video.thumbnailUrl || "/placeholder.jpg"} alt="thumb" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col">
                                            <a href={`/watch/${video.id}`} target="_blank" className="text-[15px] text-white font-medium line-clamp-2 hover:text-[#3ea6ff] transition-colors">
                                                {video.title}
                                            </a>
                                            <span className="text-[#AAAAAA] text-xs mt-1">{video.channel.name}</span>
                                            {video.reportsCount > 0 && (
                                                <span className="text-[#FF4444] text-[10px] font-bold uppercase mt-1 bg-[#FF4444]/10 w-fit px-1.5 py-0.5 rounded">
                                                        {video.reportsCount} Reports
                                                    </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <select
                                            value={video.visibility}
                                            onChange={(e) => handleVisibilityChange(video.id, Number(e.target.value))}
                                            className="bg-[#121212] border border-[#3F3F3F] text-white text-sm rounded-md px-2 py-1.5 outline-none cursor-pointer focus:border-[#3ea6ff]"
                                        >
                                            <option value={VideoVisibility.Public}>Public</option>
                                            <option value={VideoVisibility.Unlisted}>Unlisted</option>
                                            <option value={VideoVisibility.Private}>Private</option>
                                        </select>
                                    </td>
                                    <td className="p-5 text-[#AAAAAA] text-sm space-y-1">
                                        <div>{video.viewsCount.toLocaleString()} views</div>
                                        <div>{video.likesCount.toLocaleString()} likes</div>
                                    </td>
                                    <td className="p-5 text-[14px] text-[#888888]">
                                        {format(new Date(video.createdAt), "MMM d, yyyy")}
                                    </td>
                                    <td className="p-5 pr-8 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(video.id, video.title)}
                                                className="p-2 hover:bg-red-500/20 text-[#FF4444] rounded-full transition-colors cursor-pointer"
                                                title="Delete Video"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-16 text-center text-[#AAAAAA]">No videos found.</div>
                    )}
                </div>

                {data && data.total > data.pageSize && (
                    <div className="p-4 border-t border-[#3F3F3F] flex justify-center gap-2 bg-[#181818]/80">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-md disabled:opacity-50 text-sm"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-[#AAAAAA] text-sm">Page {page}</span>
                        <button
                            disabled={page * data.pageSize >= data.total}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 bg-[#272727] hover:bg-[#3F3F3F] text-white rounded-md disabled:opacity-50 text-sm"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}