"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Trash2, ExternalLink, Eye, EyeOff, Copy, AlertTriangle, Loader2,
    Radio, UploadCloud, Image as ImageIcon, Users, History, Play, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    useGetChannelStreamsQuery,
    useCreateLiveStreamMutation,
    useDeleteLiveStreamMutation,
    useUpdateLiveStreamThumbnailMutation
} from "@/store/api";
import { LiveStreamResponse, LiveStreamStatus } from "@/types/stream";
import { fixUrl } from "@/utils/fixUrl";

type LiveViewType = "room" | "history";

export default function LiveTab({ channelId }: { channelId: string }) {
    const [liveView, setLiveView] = useState<LiveViewType>("room");

    const [streamTitle, setStreamTitle] = useState("");
    const [streamDesc, setStreamDesc] = useState("");
    const [showStreamKey, setShowStreamKey] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [streamToDelete, setStreamToDelete] = useState<{ id: string, title: string } | null>(null);

    const { data: channelStreams, isLoading: isStreamsLoading } = useGetChannelStreamsQuery(channelId, { skip: !channelId });
    const [createStream, { isLoading: isCreatingStream }] = useCreateLiveStreamMutation();
    const [updateThumbnail, { isLoading: isUploadingThumbnail }] = useUpdateLiveStreamThumbnailMutation();
    const [deleteStream, { isLoading: isDeletingStream }] = useDeleteLiveStreamMutation();

    const activeStream = channelStreams?.find((s: LiveStreamResponse) => s.status === LiveStreamStatus.Scheduled || s.status === LiveStreamStatus.Live);
    const pastStreams = channelStreams?.filter((s: LiveStreamResponse) => s.status === LiveStreamStatus.Ended || s.status === LiveStreamStatus.Failed) || [];
    const rtmpServerUrl = process.env.NEXT_PUBLIC_RTMP_URL || "rtmp://localhost:1935/live";

    const isWorking = isCreatingStream || isUploadingThumbnail;

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) return toast.error("Please upload a valid image file");
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleCreateStream = async () => {
        if (!streamTitle.trim()) return toast.error("Please enter a stream title");
        try {
            const newStream = await createStream({ title: streamTitle, description: streamDesc, saveRecording: true, chatEnabled: true }).unwrap();
            if (thumbnailFile) {
                await updateThumbnail({ id: newStream.id, file: thumbnailFile }).unwrap();
            }
            toast.success("Stream created successfully! Ready for OBS.");
            setStreamTitle(""); setStreamDesc(""); setThumbnailFile(null); setThumbnailPreview(null);
        } catch (error: any) {
            toast.error(error.data?.message || "Failed to create stream");
        }
    };

    const handleCancelActiveStream = async (streamId: string) => {
        if (!confirm("Are you sure you want to cancel this active stream?")) return;
        try {
            await deleteStream(streamId).unwrap();
            toast.success("Stream cancelled");
        } catch (error: any) {
            toast.error(error.data?.message || "Failed to cancel stream. If it's live, stop it in OBS first.");
        }
    };

    const handleDeleteStreamConfirm = async () => {
        if (!streamToDelete) return;
        try {
            await deleteStream(streamToDelete.id).unwrap();
            setStreamToDelete(null);
            toast.success("Stream history deleted successfully");
        } catch (error) {
            toast.error("Failed to delete stream");
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${type} copied to clipboard!`);
    };

    return (
        <div className="p-6 lg:p-8 bg-[#1f1f1f] min-h-full">
            <div className="flex bg-[#0f0f0f] p-1.5 rounded-xl w-fit mb-6 border border-[#3f3f3f] shadow-sm">
                <button onClick={() => setLiveView("room")} className={`px-8 py-2 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${liveView === 'room' ? 'bg-[#3ea6ff] text-black shadow-md' : 'text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a]'}`}>
                    <div className="flex items-center gap-2"><Radio className="w-4 h-4" /> Stream Room</div>
                </button>
                <button onClick={() => setLiveView("history")} className={`px-8 py-2 rounded-lg text-[14px] font-medium transition-all cursor-pointer ${liveView === 'history' ? 'bg-[#3ea6ff] text-black shadow-md' : 'text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a]'}`}>
                    <div className="flex items-center gap-2"><History className="w-4 h-4" /> Past Streams</div>
                </button>
            </div>

            {isStreamsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff]" /></div>
            ) : liveView === "room" ? (
                !activeStream ? (
                    <div className="max-w-5xl bg-[#282828] border border-[#3f3f3f] rounded-2xl p-6 lg:p-8 shadow-2xl mx-auto w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-[#3f3f3f] pb-5 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2"><Radio className="w-6 h-6 text-[#CC0000]" /> Go Live</h2>
                                <p className="text-[#AAAAAA] text-[13px] sm:text-[14px]">Setup your stream details and thumbnail to generate an RTMP connection URL.</p>
                            </div>
                            <Button onClick={handleCreateStream} disabled={isWorking || !streamTitle.trim()} className="bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-bold rounded-lg h-11 px-8 transition-all shadow-[0_0_15px_rgba(62,166,255,0.15)] disabled:shadow-none hidden sm:flex cursor-pointer">
                                {isWorking ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating...</> : "Create Stream"}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-7 flex flex-col gap-5">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#AAAAAA] mb-1.5">Stream Title (required)</label>
                                    <input type="text" value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} className="w-full bg-[#121212] border border-[#333] focus:border-[#3ea6ff] rounded-lg px-4 py-2.5 text-[15px] outline-none transition-colors" placeholder="e.g., Chill Gaming & Chat" />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className="block text-[13px] font-medium text-[#AAAAAA] mb-1.5">Description</label>
                                    <textarea value={streamDesc} onChange={(e) => setStreamDesc(e.target.value)} className="w-full flex-1 bg-[#121212] border border-[#333] focus:border-[#3ea6ff] rounded-lg px-4 py-2.5 text-[15px] outline-none transition-colors resize-none min-h-[120px]" placeholder="Tell viewers what your stream is about..." />
                                </div>
                            </div>
                            <div className="lg:col-span-5 flex flex-col">
                                <label className="block text-[13px] font-medium text-[#AAAAAA] mb-1.5">Custom Thumbnail</label>
                                {thumbnailPreview ? (
                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[#3f3f3f] group shadow-lg">
                                        <img src={thumbnailPreview} className="w-full h-full object-cover" alt="Preview" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <button onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }} className="bg-[#272727] hover:bg-[#3f3f3f] p-3 rounded-full text-white transition-colors shadow-xl cursor-pointer">
                                                <Trash2 className="w-6 h-6 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-[#444] hover:border-[#3ea6ff] rounded-lg cursor-pointer bg-[#121212] hover:bg-[#1a1a1a] transition-all group">
                                        <UploadCloud className="w-10 h-10 text-[#555] group-hover:text-[#3ea6ff] transition-colors mb-3 transform group-hover:-translate-y-1" />
                                        <span className="text-[14px] text-[#aaaaaa] group-hover:text-white transition-colors font-medium">Upload image</span>
                                        <span className="text-[12px] text-[#555] mt-1">JPEG, PNG, WEBP</span>
                                        <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleThumbnailChange} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <Button onClick={handleCreateStream} disabled={isWorking || !streamTitle.trim()} className="sm:hidden w-full mt-6 bg-[#3ea6ff] hover:bg-[#6ebcff] text-black font-bold rounded-lg h-11 transition-all">
                            {isWorking ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating...</> : "Create Stream"}
                        </Button>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <div className="relative flex items-center justify-center w-4 h-4">
                                        <div className={`absolute w-full h-full rounded-full opacity-50 ${activeStream.status === LiveStreamStatus.Live ? 'bg-[#CC0000] animate-ping' : 'bg-yellow-500'}`}></div>
                                        <div className={`relative w-2.5 h-2.5 rounded-full ${activeStream.status === LiveStreamStatus.Live ? 'bg-[#CC0000]' : 'bg-yellow-500'}`}></div>
                                    </div>
                                    {activeStream.status === LiveStreamStatus.Live ? 'You are LIVE!' : 'Stream is Ready'}
                                </h2>
                                <p className="text-[#aaaaaa] text-[14px] mt-1">Connect your encoder to start broadcasting.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href={`/live/${activeStream.id}`} target="_blank">
                                    <Button variant="secondary" className="rounded-lg cursor-pointer hover:bg-[#3f3f3f] bg-[#272727] text-white border border-[#3f3f3f] h-10">
                                        <ExternalLink className="w-4 h-4 mr-2" /> View Room
                                    </Button>
                                </Link>
                                <Button onClick={() => handleCancelActiveStream(activeStream.id)} disabled={isDeletingStream} variant="destructive" className="rounded-lg cursor-pointer h-10 font-medium">
                                    {isDeletingStream ? <Loader2 className="w-4 h-4 animate-spin" /> : "End Stream"}
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                <div className="bg-[#282828] border border-[#3f3f3f] rounded-2xl p-6 shadow-xl">
                                    <h3 className="font-semibold mb-6 text-[18px] text-white flex items-center gap-2"><Settings className="w-5 h-5 text-[#aaaaaa]" /> Encoder Setup (OBS)</h3>
                                    <div className="flex flex-col gap-5">
                                        <div>
                                            <label className="block text-[13px] font-medium text-[#AAAAAA] mb-1.5">Stream URL (Server)</label>
                                            <div className="flex gap-2">
                                                <input readOnly value={rtmpServerUrl} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-3 text-[14px] text-white outline-none cursor-text font-mono" />
                                                <Button variant="secondary" onClick={() => copyToClipboard(rtmpServerUrl, "Server URL")} className="shrink-0 h-auto px-5 bg-[#272727] hover:bg-[#3F3F3F] text-white border border-[#333] cursor-pointer rounded-lg"><Copy className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-medium text-[#AAAAAA] mb-1.5">Stream Key (Keep this secret!)</label>
                                            <div className="flex gap-2">
                                                <div className="relative w-full">
                                                    <input readOnly type={showStreamKey ? "text" : "password"} value={activeStream.streamKey} className="w-full bg-[#121212] border border-[#333] rounded-lg pl-4 pr-12 py-3 text-[14px] text-white outline-none cursor-text font-mono tracking-widest" />
                                                    <button onClick={() => setShowStreamKey(!showStreamKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-white transition-colors cursor-pointer bg-[#121212] pl-2">
                                                        {showStreamKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                                <Button variant="secondary" onClick={() => copyToClipboard(activeStream.streamKey, "Stream Key")} className="shrink-0 h-auto px-5 bg-[#3ea6ff] hover:bg-[#6ebcff] text-black cursor-pointer rounded-lg font-medium">Copy</Button>
                                            </div>
                                            <p className="text-[12px] text-red-400 mt-2.5 flex items-center gap-1.5 bg-red-500/10 w-fit px-3 py-1.5 rounded-md border border-red-500/20"><AlertTriangle className="w-3.5 h-3.5" /> Do not share this key with anyone.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-1">
                                <div className="bg-[#282828] border border-[#3f3f3f] rounded-2xl overflow-hidden flex flex-col h-full shadow-xl">
                                    <div className="aspect-video bg-[#111] relative flex flex-col items-center justify-center border-b border-[#3f3f3f]">
                                        {activeStream.thumbnailUrl ? (
                                            <>
                                                <img src={fixUrl(activeStream.thumbnailUrl)} className="w-full h-full object-cover opacity-50" alt="Thumbnail" />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 drop-shadow-lg">
                                                    <Radio className={`w-10 h-10 mb-3 ${activeStream.status === LiveStreamStatus.Live ? 'text-[#CC0000] animate-pulse' : 'text-white'}`} />
                                                    <span className={`text-[14px] bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm ${activeStream.status === LiveStreamStatus.Live ? 'text-white font-bold tracking-widest' : 'text-white font-medium'}`}>
                                                        {activeStream.status === LiveStreamStatus.Live ? 'LIVE NOW' : 'WAITING FOR OBS'}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <><ImageIcon className="w-12 h-12 mb-3 opacity-20" /><span className="text-[12px] font-bold opacity-30 tracking-widest uppercase">No Thumbnail</span></>
                                        )}
                                    </div>
                                    <div className="p-6 flex flex-col gap-2 flex-1">
                                        <h4 className="font-bold text-white text-[16px] line-clamp-2 leading-snug">{activeStream.title}</h4>
                                        <p className="text-[13px] text-[#AAAAAA] line-clamp-3 mt-1 mb-4">{activeStream.description || "No description provided."}</p>
                                        <div className="mt-auto pt-5 border-t border-[#3f3f3f]">
                                            <div className="flex items-center justify-between text-[14px]">
                                                <span className="text-[#AAAAAA]">Status</span>
                                                {activeStream.status === LiveStreamStatus.Scheduled ?
                                                    <span className="text-yellow-500 font-medium animate-pulse">Waiting...</span> :
                                                    <span className="text-[#2ba640] font-medium flex items-center gap-1.5"><div className="w-2 h-2 bg-[#2ba640] rounded-full"></div> Receiving data</span>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            ) : (
                <div className="max-w-[1600px] mx-auto w-full">
                    <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-[#aaaaaa]" /> Live Replays & History
                    </h2>
                    {pastStreams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#3f3f3f] rounded-2xl bg-[#1a1a1a]">
                            <Radio className="w-12 h-12 text-[#444] mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No past streams</h3>
                            <p className="text-[#aaaaaa] text-[14px]">When you finish a live stream, the recording will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {pastStreams.map((pastStream: LiveStreamResponse) => (
                                <div key={pastStream.id} className="bg-[#282828] border border-[#3f3f3f] rounded-xl overflow-hidden group hover:border-[#555] transition-all hover:shadow-xl relative flex flex-col">
                                    <div className="aspect-video bg-[#111] relative border-b border-[#3f3f3f]">
                                        <img
                                            src={fixUrl(pastStream.thumbnailUrl) || "/placeholder.jpg"}
                                            alt={pastStream.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white tracking-widest uppercase">
                                            {pastStream.status === LiveStreamStatus.Failed ? 'FAILED' : 'VOD'}
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                            <Link href={`/live/${pastStream.id}`}>
                                                <Button variant="secondary" className="rounded-full w-12 h-12 p-0 bg-white/20 hover:bg-[#3ea6ff] text-white hover:text-black border-none transition-colors shadow-lg cursor-pointer">
                                                    <Play className="w-5 h-5 ml-1 fill-current" />
                                                </Button>
                                            </Link>
                                            <Button onClick={() => setStreamToDelete({ id: pastStream.id, title: pastStream.title })} variant="destructive" className="rounded-full w-12 h-12 p-0 shadow-lg cursor-pointer" title="Delete permanently">
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="font-semibold text-white text-[15px] line-clamp-2 leading-snug mb-1">{pastStream.title}</h3>
                                        <div className="mt-auto pt-3 flex items-center justify-between text-[12px] text-[#aaaaaa]">
                                            <span>{format(new Date(pastStream.createdAt), "MMM dd, yyyy")}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1" title="Total Views"><Eye className="w-3.5 h-3.5"/> {pastStream.totalViewsCount?.toLocaleString() || 0}</span>
                                                <span className="flex items-center gap-1" title="Peak Concurrent Viewers"><Users className="w-3.5 h-3.5"/> {pastStream.peakViewersCount?.toLocaleString() || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {streamToDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#212121] rounded-xl max-w-md w-full shadow-2xl border border-[#3f3f3f] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                Delete stream recording?
                            </h2>
                            <p className="text-[14px] text-[#aaaaaa] mb-4 line-clamp-2">
                                <span className="text-white font-medium">{streamToDelete.title}</span>
                            </p>
                            <div className="bg-[#1f1f1f] p-4 rounded-lg text-[13px] text-[#aaaaaa] mb-6 border border-[#3f3f3f]">
                                Permanent deletion cannot be undone. The recording (VOD) and all chat history will be permanently deleted from the platform.
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setStreamToDelete(null)} className="hover:bg-[#3f3f3f] text-white cursor-pointer" disabled={isDeletingStream}>Cancel</Button>
                                <Button onClick={handleDeleteStreamConfirm} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer" disabled={isDeletingStream}>
                                    {isDeletingStream ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete forever"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}