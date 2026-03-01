"use client";

import React from "react";
import Link from "next/link";
import { ListVideo, Play } from "lucide-react";

interface PlaylistCardProps {
    playlist: any;
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
    // Определяем правильный ID (для системных это WL или LL)
    let listId = playlist.id;
    if (playlist.type === "WatchLater" || playlist.type === 2) listId = "WL";
    if (playlist.type === "Liked" || playlist.type === 1) listId = "LL";

    // Ссылка на страницу самого плейлиста
    const playlistHref = `/playlist?list=${listId}`;

    // Ссылка на первое видео в плейлисте (чтобы работала кнопка Play All)
    const firstVideoId = playlist.playlistVideos?.[0]?.videoId;
    const playHref = firstVideoId ? `/watch/${firstVideoId}?list=${listId}` : playlistHref;

    const title = playlist.title;
    const thumbnail = playlist.thumbnailUrl || "/placeholder.jpg";
    const videoCount = playlist.videoCount ?? playlist.playlistVideos?.length ?? 0;
    const isPrivate = playlist.isPrivate;

    return (
        <div className="group flex flex-col w-full">
            {/* ВЕРХНЯЯ ЧАСТЬ (Картинка) - Ведет на просмотр первого видео с параметром ?list= */}
            <Link href={playHref} className="relative pt-2 cursor-pointer block">
                <div className="absolute top-0 left-2 right-2 h-full bg-[#3F3F3F] rounded-xl transition-transform duration-300 group-hover:-translate-y-1" />

                <div className="relative aspect-video bg-[#212121] rounded-xl overflow-hidden z-10 border border-[#3f3f3f]">
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded flex items-center gap-1.5 text-[12px] font-medium text-white tracking-wide">
                        <ListVideo className="w-3.5 h-3.5" />
                        {videoCount} {videoCount === 1 ? 'video' : 'videos'}
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <Play className="w-12 h-12 fill-white text-white" />
                    </div>
                </div>
            </Link>

            {/* НИЖНЯЯ ЧАСТЬ (Текст) - Ведет на страницу со списком видео плейлиста */}
            <Link href={playlistHref} className="mt-3 flex flex-col cursor-pointer">
                <h3 className="text-white text-[15px] font-semibold line-clamp-2 leading-snug group-hover:text-[#3ea6ff] transition-colors">
                    {title}
                </h3>

                <div className="text-[#AAAAAA] text-[13px] mt-1 line-clamp-1">
                    {isPrivate ? "Private" : "Public"} • Playlist
                </div>

                <div className="text-[#AAAAAA] text-[13px] mt-0.5 hover:text-white transition-colors">
                    View full playlist
                </div>
            </Link>
        </div>
    );
}