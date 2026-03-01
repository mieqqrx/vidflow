"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useGetMyPlaylistsQuery } from "@/store/api/apiSlice";
import PlaylistCard from "@/components/Playlist/PlaylistCard";

export default function PlaylistsPage() {
    const { data: playlists, isLoading } = useGetMyPlaylistsQuery();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white pt-24 pb-10 px-4 md:px-8 max-w-[1920px] mx-auto">
            <h1 className="text-[28px] font-bold mb-8">Playlists</h1>

            {(!playlists || playlists.length === 0) ? (
                <div className="text-[#aaaaaa] text-center mt-20">
                    You don't have any playlists yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8">
                    {playlists.map((playlist) => (
                        <PlaylistCard key={playlist.id} playlist={playlist} />
                    ))}
                </div>
            )}
        </div>
    );
}