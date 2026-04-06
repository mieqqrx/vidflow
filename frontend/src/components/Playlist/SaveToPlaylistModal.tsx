"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Lock, Globe, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
    useGetMyPlaylistsQuery,
    useCreatePlaylistMutation,
    useAddVideoToPlaylistMutation,
    useRemoveVideoFromPlaylistMutation
} from "@/store/api";

interface SaveToPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
}

export default function SaveToPlaylistModal({ isOpen, onClose, videoId }: SaveToPlaylistModalProps) {
    const { data: playlists, isLoading } = useGetMyPlaylistsQuery(undefined, { skip: !isOpen });
    const [createPlaylist, { isLoading: isCreating }] = useCreatePlaylistMutation();
    const [addVideo] = useAddVideoToPlaylistMutation();
    const [removeVideo] = useRemoveVideoFromPlaylistMutation();

    const [initialPlaylists, setInitialPlaylists] = useState<Record<string, boolean>>({});
    const [selectedPlaylists, setSelectedPlaylists] = useState<Record<string, boolean>>({});
    const [isSavingChanges, setIsSavingChanges] = useState(false);

    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);

    // Состояние для открытия кастомного дропдауна внутри модалки
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (playlists && isOpen) {
            const initial: Record<string, boolean> = {};
            playlists.forEach((p) => {
                const isInPlaylist = !!p.playlistVideos?.find(pv => pv.videoId === videoId);
                initial[p.id] = isInPlaylist;
            });
            setInitialPlaylists(initial);
            setSelectedPlaylists(initial);
        }
    }, [playlists, videoId, isOpen]);

    const handleToggleCheckbox = (playlistId: string) => {
        setSelectedPlaylists(prev => ({
            ...prev,
            [playlistId]: !prev[playlistId]
        }));
    };

    const handleSaveSelected = async () => {
        setIsSavingChanges(true);
        try {
            const promises = [];
            let addedCount = 0;
            let removedCount = 0;
            let lastModifiedPlaylistName = "";

            for (const playlist of playlists || []) {
                const wasSelected = initialPlaylists[playlist.id];
                const isNowSelected = selectedPlaylists[playlist.id];

                if (!wasSelected && isNowSelected) {
                    promises.push(addVideo({ playlistId: playlist.id, videoId }).unwrap());
                    addedCount++;
                    lastModifiedPlaylistName = playlist.title;
                } else if (wasSelected && !isNowSelected) {
                    const playlistVideoId = playlist.playlistVideos?.find(pv => pv.videoId === videoId)?.id;
                    if (playlistVideoId) {
                        promises.push(removeVideo({ playlistId: playlist.id, playlistVideoId }).unwrap());
                        removedCount++;
                        lastModifiedPlaylistName = playlist.title;
                    }
                }
            }

            if (promises.length > 0) {
                await Promise.all(promises);

                if (addedCount === 1 && removedCount === 0) {
                    toast.success(`Saved to ${lastModifiedPlaylistName}`);
                } else if (removedCount === 1 && addedCount === 0) {
                    toast.success(`Removed from ${lastModifiedPlaylistName}`);
                } else {
                    toast.success(`Playlists updated successfully`);
                }
            }

            handleClose();
        } catch (error) {
            console.error("Failed to save playlists", error);
            toast.error("Failed to update playlists. Please try again.");
        } finally {
            setIsSavingChanges(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newTitle.trim()) return;
        try {
            const res = await createPlaylist({ title: newTitle, isPrivate }).unwrap();
            await addVideo({ playlistId: res.playlistId, videoId }).unwrap();

            setInitialPlaylists(prev => ({ ...prev, [res.playlistId]: true }));
            setSelectedPlaylists(prev => ({ ...prev, [res.playlistId]: true }));

            toast.success(`Created playlist "${newTitle}" and saved video`);

            setNewTitle("");
            setIsPrivate(false);
            setIsCreatingNew(false);
        } catch (error) {
            console.error("Failed to create playlist", error);
            toast.error("Failed to create playlist.");
        }
    };

    const handleClose = () => {
        setIsCreatingNew(false);
        setNewTitle("");
        setIsDropdownOpen(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="bg-[#212121] border-none text-white sm:max-w-[320px] p-0 gap-0 overflow-hidden rounded-xl shadow-2xl [&>button]:text-[#aaaaaa] [&>button]:hover:text-white [&>button]:right-4 [&>button]:top-4 [&>button]:focus:ring-0 [&>button]:focus:outline-none">
                <DialogHeader className="p-4 pb-3 border-b border-[#3f3f3f]/50 text-left">
                    <DialogTitle className="text-[16px] font-medium tracking-wide">Save to...</DialogTitle>
                </DialogHeader>

                <div className="p-2 max-h-[260px] overflow-y-auto flex flex-col custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-6 h-6 animate-spin text-[#aaaaaa]" />
                        </div>
                    ) : (
                        playlists?.map((playlist) => {
                            const isChecked = !!selectedPlaylists[playlist.id];

                            return (
                                <label
                                    key={playlist.id}
                                    className="flex items-center space-x-3 group p-2 hover:bg-[#3f3f3f]/60 rounded-lg cursor-pointer transition-colors"
                                >
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => handleToggleCheckbox(playlist.id)}
                                        className="border-[#aaaaaa] data-[state=checked]:bg-[#3ea6ff] data-[state=checked]:border-[#3ea6ff] rounded-sm w-[18px] h-[18px]"
                                    />

                                    <span className="text-[14px] leading-none flex-1 truncate select-none text-[#f1f1f1]">
                                        {playlist.title}
                                    </span>

                                    {playlist.isPrivate ? (
                                        <Lock className="w-3.5 h-3.5 text-[#aaaaaa]" />
                                    ) : (
                                        <Globe className="w-3.5 h-3.5 text-[#aaaaaa]" />
                                    )}
                                </label>
                            );
                        })
                    )}
                </div>

                <div className="p-3 border-t border-[#3f3f3f]/50 bg-[#212121]">
                    {!isCreatingNew ? (
                        <div className="flex justify-between items-center gap-3">
                            <button
                                onClick={() => setIsCreatingNew(true)}
                                className="flex items-center text-[14px] font-medium text-white hover:bg-[#3f3f3f]/60 flex-1 p-2 rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5 mr-2 text-[#aaaaaa]" />
                                New playlist
                            </button>

                            <Button
                                onClick={handleSaveSelected}
                                disabled={isSavingChanges}
                                className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-semibold h-9 px-5 rounded-full transition-colors"
                            >
                                {isSavingChanges ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 p-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex flex-col gap-1 relative">
                                <label className="text-[12px] font-medium text-[#aaaaaa]">Name</label>

                                <input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Enter playlist name..."
                                    maxLength={150}
                                    className="w-full bg-transparent border-b-2 border-[#717171] focus:border-[#3ea6ff] text-[14px] text-white py-1 outline-none transition-colors placeholder:text-[#555] pr-10"
                                    autoFocus
                                />

                                <span className="absolute right-0 bottom-2 text-[11px] text-[#aaaaaa] font-mono">
                                    {newTitle.length}/150
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 relative z-50">
                                <label className="text-[12px] font-medium text-[#aaaaaa]">Privacy</label>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full flex items-center justify-between bg-transparent border-b-2 border-[#717171] hover:border-[#aaaaaa] focus:border-[#3ea6ff] text-[14px] text-white py-1.5 outline-none transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            {isPrivate ? <Lock className="w-4 h-4 text-[#aaaaaa]" /> : <Globe className="w-4 h-4 text-[#aaaaaa]" />}
                                            <span>{isPrivate ? "Private" : "Public"}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-[#aaaaaa] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                            <div className="absolute top-full left-0 w-full mt-1 bg-[#282828] border border-[#3f3f3f] rounded-lg shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                                <div
                                                    onClick={() => { setIsPrivate(false); setIsDropdownOpen(false); }}
                                                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${!isPrivate ? 'bg-[#3f3f3f]' : 'hover:bg-[#3f3f3f]/60'}`}
                                                >
                                                    <Globe className="w-4 h-4 text-[#aaaaaa]" />
                                                    <span className="text-[14px]">Public</span>
                                                </div>

                                                <div
                                                    onClick={() => { setIsPrivate(true); setIsDropdownOpen(false); }}
                                                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${isPrivate ? 'bg-[#3f3f3f]' : 'hover:bg-[#3f3f3f]/60'}`}
                                                >
                                                    <Lock className="w-4 h-4 text-[#aaaaaa]" />
                                                    <span className="text-[14px]">Private</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-2">
                                <button
                                    onClick={() => { setIsCreatingNew(false); setIsDropdownOpen(false); }}
                                    className="text-[13px] font-medium text-white hover:text-gray-300 transition-colors uppercase px-2 py-1"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleCreatePlaylist}
                                    disabled={!newTitle.trim() || isCreating}
                                    className="text-[13px] font-medium text-[#3ea6ff] hover:text-[#6ebcff] transition-colors uppercase px-2 py-1 disabled:opacity-50 flex items-center"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                                    Create
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #717171; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #aaaaaa; }
            `}</style>
        </Dialog>
    );
}