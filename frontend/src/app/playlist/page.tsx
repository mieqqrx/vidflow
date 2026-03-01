"use client";

import React, { useMemo, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Play, Shuffle, Clock, Lock, Globe, ListVideo, ThumbsUp, ChevronDown } from "lucide-react";
import { useGetMyPlaylistsQuery, useGetPlaylistByIdQuery, useUpdatePlaylistMutation } from "@/store/api/apiSlice";
import PlaylistVideoCard from "@/components/Playlist/PlaylistVideoCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

function PlaylistContent() {
    const searchParams = useSearchParams();
    const listParam = searchParams.get("list");

    const { data: myPlaylists, isLoading: isPlaylistsLoading } = useGetMyPlaylistsQuery();
    const [updatePlaylist] = useUpdatePlaylistMutation();

    // Состояние для нашего кастомного меню
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const targetPlaylistId = useMemo(() => {
        if (!listParam) return null;
        if (listParam === "WL") return myPlaylists?.find(p => p.type === 2)?.id || null;
        if (listParam === "LL") return myPlaylists?.find(p => p.type === 1)?.id || null;
        return listParam;
    }, [listParam, myPlaylists]);

    const { data: playlist, isLoading: isPlaylistLoading } = useGetPlaylistByIdQuery(
        targetPlaylistId || "",
        { skip: !targetPlaylistId }
    );

    const handleVisibilityChange = async (newIsPrivate: boolean) => {
        if (!playlist || playlist.isPrivate === newIsPrivate) return;

        try {
            await updatePlaylist({ id: playlist.id, isPrivate: newIsPrivate }).unwrap();
            toast.success(`Playlist is now ${newIsPrivate ? 'Private' : 'Public'}`);
        } catch (error) {
            console.error("Failed to update playlist visibility", error);
            toast.error("Failed to update playlist visibility");
        }
    };

    if (isPlaylistsLoading || isPlaylistLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    if (!listParam || !playlist) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-white pt-20">
                <ListVideo className="w-16 h-16 text-[#3f3f3f] mb-4" />
                <h1 className="text-2xl font-bold mb-2">Playlist not found</h1>
                <p className="text-[#AAAAAA]">The playlist does not exist or is private.</p>
            </div>
        );
    }

    const isWatchLater = playlist.type === 2;
    const isLiked = playlist.type === 1;
    const isSystem = playlist.isSystem;
    const title = playlist.title;
    const heroThumbnail = playlist.thumbnailUrl || "/placeholder.jpg";

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white flex justify-center pt-20 pb-6 px-4 md:px-8">
            <div className="flex flex-col xl:flex-row max-w-[1400px] w-full gap-8">

                {/* ЛЕВАЯ ПАНЕЛЬ */}
                <div className="w-full xl:w-[360px] shrink-0">
                    <div className="relative w-full rounded-2xl overflow-hidden flex flex-col xl:min-h-[calc(100vh-100px)] xl:sticky xl:top-[80px] shadow-2xl border border-white/5 bg-[#121212]">
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-125 pointer-events-none"
                            style={{ backgroundImage: `url(${heroThumbnail})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#0F0F0F] pointer-events-none" />

                        <div className="relative z-10 p-6 flex flex-col items-center xl:items-start text-center xl:text-left h-full">
                            <div className="w-full max-w-[320px] aspect-video rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] mb-6 bg-[#272727] flex items-center justify-center relative group">
                                {playlist.videoCount > 0 ? (
                                    <>
                                        <img src={heroThumbnail} alt={title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                            <Play className="w-12 h-12 text-white fill-white" />
                                        </div>
                                    </>
                                ) : (
                                    isWatchLater ? <Clock className="w-12 h-12 text-[#aaaaaa]" /> :
                                        isLiked ? <ThumbsUp className="w-12 h-12 text-[#aaaaaa]" /> :
                                            <ListVideo className="w-12 h-12 text-[#aaaaaa]" />
                                )}
                            </div>

                            <h1 className="text-3xl font-bold text-white mb-4 line-clamp-2 leading-tight">
                                {title}
                            </h1>

                            <h3 className="text-[15px] font-medium text-white mb-2">Your channel</h3>

                            <div className="text-[12px] text-[#aaaaaa] flex flex-wrap items-center justify-center xl:justify-start gap-y-1 gap-x-1.5 mb-6">
                                {/* ИНТЕРАКТИВНЫЙ БЕЙДЖ ВИДИМОСТИ */}
                                {isSystem ? (
                                    <span className="flex items-center gap-1 bg-[#272727] px-2 py-1.5 rounded-md text-[#aaaaaa] cursor-not-allowed" title="System playlists are always private">
                                        <Lock className="w-3.5 h-3.5" />
                                        <span className="text-[13px] font-medium">Private</span>
                                    </span>
                                ) : (
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="flex items-center gap-1 bg-[#272727] hover:bg-[#3f3f3f] px-2 py-1.5 rounded-md text-white outline-none transition-colors cursor-pointer group"
                                        >
                                            {playlist.isPrivate ? <Lock className="w-3.5 h-3.5 text-[#aaaaaa] group-hover:text-white" /> : <Globe className="w-3.5 h-3.5 text-[#aaaaaa] group-hover:text-white" />}
                                            <span className="text-[13px] font-medium">{playlist.isPrivate ? "Private" : "Public"}</span>
                                            <ChevronDown className={`w-3.5 h-3.5 ml-0.5 opacity-60 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                                <div className="absolute top-full left-0 mt-1.5 bg-[#212121] border border-[#3f3f3f] text-white rounded-xl shadow-2xl w-[140px] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                                                    <div
                                                        onClick={() => { handleVisibilityChange(false); setIsDropdownOpen(false); }}
                                                        className={`flex items-center px-4 py-2.5 cursor-pointer transition-colors ${!playlist.isPrivate ? 'bg-[#3f3f3f]/80' : 'hover:bg-[#3f3f3f]/50'}`}
                                                    >
                                                        <Globe className="w-4 h-4 mr-2.5 text-[#aaaaaa]" />
                                                        <span className="text-[14px]">Public</span>
                                                    </div>
                                                    <div
                                                        onClick={() => { handleVisibilityChange(true); setIsDropdownOpen(false); }}
                                                        className={`flex items-center px-4 py-2.5 cursor-pointer transition-colors ${playlist.isPrivate ? 'bg-[#3f3f3f]/80' : 'hover:bg-[#3f3f3f]/50'}`}
                                                    >
                                                        <Lock className="w-4 h-4 mr-2.5 text-[#aaaaaa]" />
                                                        <span className="text-[14px]">Private</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <span>•</span>
                                <span>{playlist.videoCount} {playlist.videoCount === 1 ? 'video' : 'videos'}</span>
                                <span>•</span>
                                <span>Updated recently</span>
                            </div>

                            <div className="flex gap-3 w-full max-w-[320px]">
                                <Link
                                    href={playlist.videoCount > 0 ? `/watch/${playlist.videos[0].videoId}?list=${playlist.id}` : "#"}
                                    className="flex-1"
                                >
                                    <Button disabled={playlist.videoCount === 0} className="w-full bg-white hover:bg-[#d9d9d9] text-black font-semibold rounded-full h-10 transition-colors disabled:opacity-50 cursor-pointer">
                                        <Play className="w-4 h-4 fill-black mr-2" /> Play all
                                    </Button>
                                </Link>

                                {/* Для Shuffle можно пока сделать то же самое, либо написать логику рандома позже */}
                                <Link
                                    href={playlist.videoCount > 0 ? `/watch/${playlist.videos[Math.floor(Math.random() * playlist.videos.length)].videoId}?list=${playlist.id}` : "#"}
                                    className="flex-1"
                                >
                                    <Button disabled={playlist.videoCount === 0} className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full h-10 transition-colors backdrop-blur-md disabled:opacity-50 cursor-pointer">
                                        <Shuffle className="w-4 h-4 mr-2" /> Shuffle
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ПРАВАЯ ПАНЕЛЬ */}
                <div className="flex-1 flex flex-col gap-2 min-w-0 pb-20">
                    {playlist.videos.length === 0 ? (
                        <div className="text-center mt-20 flex flex-col items-center">
                            {isWatchLater ? <Clock className="w-16 h-16 text-[#3f3f3f] mb-4" /> :
                                isLiked ? <ThumbsUp className="w-16 h-16 text-[#3f3f3f] mb-4" /> :
                                    <ListVideo className="w-16 h-16 text-[#3f3f3f] mb-4" />}

                            <h2 className="text-xl font-medium text-white mb-1">No videos in this playlist yet</h2>
                            <p className="text-[#aaaaaa] text-[14px]">
                                {isLiked ? "Videos you like will show up here." : "Save videos to this playlist to watch them later."}
                            </p>
                        </div>
                    ) : (
                        playlist.videos.map((item, index) => (
                            <PlaylistVideoCard
                                key={item.id}
                                index={index + 1}
                                playlistId={playlist.id}
                                playlistVideoId={item.id}
                                videoItem={item}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PlaylistPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" /></div>}>
            <PlaylistContent />
        </Suspense>
    );
}