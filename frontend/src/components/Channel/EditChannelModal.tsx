"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Camera, Loader2, MonitorPlay } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Channel, Video } from "@/types";
import {
    useUpdateChannelMutation,
    useUpdateAvatarMutation,
    useSetFeaturedVideoMutation
} from "@/store/api";

interface EditChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel: Channel;
    videos: Video[];
}

export default function EditChannelModal({ isOpen, onClose, channel, videos }: EditChannelModalProps) {
    const [activeTab, setActiveTab] = useState<"layout" | "branding" | "basic">("layout");

    const [name, setName] = useState(channel.name);
    const [description, setDescription] = useState(channel.description || "");
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [featuredVideoId, setFeaturedVideoId] = useState<string | null>(channel.featuredVideoId || null);

    const [bannerPreview, setBannerPreview] = useState(channel.bannerUrl || "");
    const [avatarPreview, setAvatarPreview] = useState(channel.ownerAvatarUrl || "");

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [updateChannel] = useUpdateChannelMutation();
    const [updateAvatar] = useUpdateAvatarMutation();
    const [setFeaturedVideo] = useSetFeaturedVideoMutation();

    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const promises = [];

            if (name !== channel.name || description !== channel.description || bannerFile) {
                const channelData = new FormData();
                if (name !== channel.name) channelData.append("Name", name);
                if (description !== channel.description) channelData.append("Description", description);
                if (bannerFile) channelData.append("Banner", bannerFile);
                promises.push(updateChannel({ id: channel.id, formData: channelData }).unwrap());
            }

            if (avatarFile) {
                const avatarData = new FormData();
                avatarData.append("Avatar", avatarFile);
                promises.push(updateAvatar(avatarData).unwrap());
            }

            const currentFeaturedId = channel.featuredVideoId || null;
            if (featuredVideoId !== currentFeaturedId) {
                promises.push(setFeaturedVideo({ id: channel.id, videoId: featuredVideoId }).unwrap());
            }

            if (promises.length > 0) {
                await Promise.all(promises);
                toast.success("Channel customized successfully!");
            }

            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update channel");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#212121] rounded-xl w-full max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#3F3F3F]">

                <div className="flex items-center justify-between p-6 border-b border-[#3F3F3F]">
                    <h2 className="text-xl font-bold text-white">Channel customization</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[#3F3F3F] rounded-full transition-colors text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-6 px-6 border-b border-[#3F3F3F]">
                    <button
                        onClick={() => setActiveTab("layout")}
                        className={`py-3 text-sm font-medium transition-colors relative ${activeTab === "layout" ? "text-[#3ea6ff]" : "text-[#AAAAAA] hover:text-white"}`}
                    >
                        Layout
                        {activeTab === "layout" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3ea6ff]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("branding")}
                        className={`py-3 text-sm font-medium transition-colors relative ${activeTab === "branding" ? "text-[#3ea6ff]" : "text-[#AAAAAA] hover:text-white"}`}
                    >
                        Branding
                        {activeTab === "branding" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3ea6ff]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("basic")}
                        className={`py-3 text-sm font-medium transition-colors relative ${activeTab === "basic" ? "text-[#3ea6ff]" : "text-[#AAAAAA] hover:text-white"}`}
                    >
                        Basic info
                        {activeTab === "basic" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3ea6ff]" />}
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === "layout" ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-white font-medium text-base">Video spotlight</h3>
                                <p className="text-[#AAAAAA] text-sm">Add a video to the top of your channel homepage.</p>

                                <div className="bg-[#181818] p-5 rounded-xl border border-[#3F3F3F]/50 mt-4 flex items-start gap-4">
                                    <MonitorPlay className="w-6 h-6 text-[#AAAAAA] shrink-0 mt-1" />
                                    <div className="flex-1 w-full">
                                        <label className="block text-white font-medium text-sm mb-1">Featured video</label>
                                        <p className="text-[#AAAAAA] text-xs mb-3">Highlight a video for your subscribers to watch.</p>

                                        <select
                                            value={featuredVideoId || ""}
                                            onChange={(e) => setFeaturedVideoId(e.target.value === "" ? null : e.target.value)}
                                            className="w-full bg-[#272727] text-white border border-[#3F3F3F] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#3ea6ff] appearance-none cursor-pointer"
                                        >
                                            <option value="">-- Do not feature any video --</option>
                                            {videos.map((vid) => (
                                                <option key={vid.id} value={vid.id}>
                                                    {vid.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === "branding" ? (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-40 flex flex-col gap-2 shrink-0 text-[#AAAAAA] text-sm">
                                    <h3 className="text-white font-medium text-base">Picture</h3>
                                    <p>Your profile picture will appear where your channel is presented on YouTube.</p>
                                </div>

                                <div className="flex items-center gap-6 bg-[#181818] p-4 rounded-xl flex-1 border border-[#3F3F3F]/50">
                                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                        <Avatar className="w-24 h-24 border border-[#3F3F3F]">
                                            <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                                            <AvatarFallback className="bg-purple-600 text-2xl">{channel.name[0]}</AvatarFallback>
                                        </Avatar>

                                        <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-6 h-6 text-white mb-1" />
                                        </div>

                                        <input type="file" hidden accept="image/jpeg, image/png, image/webp" ref={avatarInputRef} onChange={handleAvatarChange} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[#AAAAAA] text-xs max-w-[200px]">It's recommended to use a picture that's at least 98 x 98 pixels and 4MB or less.</p>

                                        <Button variant="ghost" className="text-[#3ea6ff] hover:bg-[#3ea6ff]/10 w-fit p-0 h-auto font-medium" onClick={() => avatarInputRef.current?.click()}>
                                            Change
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-[#3F3F3F]" />

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-40 flex flex-col gap-2 shrink-0 text-[#AAAAAA] text-sm">
                                    <h3 className="text-white font-medium text-base">Banner image</h3>
                                    <p>This image will appear across the top of your channel.</p>
                                </div>

                                <div className="flex flex-col gap-4 bg-[#181818] p-4 rounded-xl flex-1 border border-[#3F3F3F]/50">
                                    <div
                                        className="w-full aspect-[6/1] bg-[#272727] rounded-lg overflow-hidden relative group cursor-pointer border border-[#3F3F3F]"
                                        onClick={() => bannerInputRef.current?.click()}
                                    >
                                        {bannerPreview ? (
                                            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-r from-purple-900/40 to-blue-900/40" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="w-6 h-6 text-white mb-1" />
                                            <span className="text-white text-sm font-medium">Upload banner</span>
                                        </div>

                                        <input type="file" hidden accept="image/jpeg, image/png, image/webp" ref={bannerInputRef} onChange={handleBannerChange} />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p className="text-[#AAAAAA] text-xs max-w-[280px]">For the best results on all devices, use an image that's at least 2048 x 1152 pixels and 6MB or less.</p>

                                        <Button variant="ghost" className="text-[#3ea6ff] hover:bg-[#3ea6ff]/10 p-0 h-auto font-medium" onClick={() => bannerInputRef.current?.click()}>
                                            Change
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-white font-medium text-sm">Name</label>
                                <p className="text-[#AAAAAA] text-xs">Choose a channel name that represents you and your content.</p>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#272727] border border-[#3F3F3F] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3ea6ff] transition-colors"
                                    placeholder="Add a channel name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-white font-medium text-sm">Description</label>
                                <p className="text-[#AAAAAA] text-xs">Tell viewers about your channel. Your description will appear in the About section of your channel.</p>

                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-[#272727] border border-[#3F3F3F] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3ea6ff] transition-colors h-32 resize-none"
                                    placeholder="Tell viewers about your channel"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-[#3F3F3F] flex justify-end gap-3 bg-[#181818]">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-[#3F3F3F] text-white rounded-full">
                        Cancel
                    </Button>
                    
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-medium rounded-full px-6"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish"}
                    </Button>
                </div>
            </div>
        </div>
    );
}