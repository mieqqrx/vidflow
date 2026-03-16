"use client";

import React, { useRef, useState, useEffect } from "react";
import Hls from "hls.js";
import { Scissors, Play, Pause, Loader2, X, Clock, Info } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video } from "@/types";
import { useTrimVideoMutation } from "@/store/api";

interface VideoTrimmerProps {
    video: Video;
}

const formatTimeWithMs = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00.000";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${minutes}:${secs.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
};

const parseTimeWithMs = (timeStr: string): number | null => {
    const regex = /^(\d+):(\d{1,2})(\.\d{1,3})?$/;
    const match = timeStr.match(regex);
    if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const millisecondsStr = match[3] ? match[3].slice(1) : "0";
        const milliseconds = parseInt(millisecondsStr.padEnd(3, "0"), 10);
        return minutes * 60 + seconds + milliseconds / 1000;
    }
    const secs = parseFloat(timeStr);
    if (!isNaN(secs)) return secs;
    return null;
};

export default function VideoTrimmer({ video }: VideoTrimmerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    const [trimVideo, { isLoading: isTrimming }] = useTrimVideoMutation();

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(video.durationSeconds || 0);
    const [currentTime, setCurrentTime] = useState(0);
    const [trimRange, setTrimRange] = useState<[number, number]>([0, video.durationSeconds || 100]);

    const [startInput, setStartInput] = useState("0:00.000");
    const [endInput, setEndInput] = useState("0:00.000");

    const [isScrubbing, setIsScrubbing] = useState(false);
    const [isDraggingTrim, setIsDraggingTrim] = useState(false);
    const [wasPlayingBeforeScrub, setWasPlayingBeforeScrub] = useState(false);

    const trimDuration = Math.max(0, trimRange[1] - trimRange[0]);
    const cutDuration = Math.max(0, duration - trimDuration);

    useEffect(() => {
        setStartInput(formatTimeWithMs(trimRange[0]));
        setEndInput(formatTimeWithMs(trimRange[1]));
    }, [trimRange]);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(video.videoUrl);
            hls.attachMedia(videoEl);
            hlsRef.current = hls;
        } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
            videoEl.src = video.videoUrl;
        }
        return () => hlsRef.current?.destroy();
    }, [video.videoUrl]);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        const onLoaded = () => {
            const d = videoEl.duration;
            if (!duration && d) {
                setDuration(d);
                setTrimRange([0, d]);
            }
        };
        videoEl.addEventListener("loadedmetadata", onLoaded);
        return () => videoEl.removeEventListener("loadedmetadata", onLoaded);
    }, [duration]);

    useEffect(() => {
        let animationFrameId: number;
        const videoEl = videoRef.current;

        const updateProgress = () => {
            if (!videoEl || isScrubbing || isDraggingTrim) return;

            const time = videoEl.currentTime;
            setCurrentTime(time);

            if (time >= trimRange[1]) {
                videoEl.pause();
                videoEl.currentTime = trimRange[0];
                setCurrentTime(trimRange[0]);
                setIsPlaying(false);
            } else if (isPlaying) {
                animationFrameId = requestAnimationFrame(updateProgress);
            }
        };

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(updateProgress);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, isScrubbing, isDraggingTrim, trimRange]);

    useEffect(() => {
        const handleGlobalPointerUp = () => setIsDraggingTrim(false);
        window.addEventListener("pointerup", handleGlobalPointerUp);
        return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
    }, []);

    const seekTo = (sec: number) => {
        if (videoRef.current) videoRef.current.currentTime = sec;
    };

    const togglePlay = () => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        if (isPlaying) {
            videoEl.pause();
        } else {
            if (videoEl.currentTime < trimRange[0] || videoEl.currentTime >= trimRange[1]) {
                videoEl.currentTime = trimRange[0];
            }
            videoEl.play();
        }
        setIsPlaying(!isPlaying);
    };

    const getScrubTime = (clientX: number) => {
        if (!timelineRef.current || duration === 0) return 0;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        return (x / rect.width) * duration;
    };

    const handleScrubStart = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        if (isPlaying) {
            setWasPlayingBeforeScrub(true);
            setIsPlaying(false);
            videoRef.current?.pause();
        } else {
            setWasPlayingBeforeScrub(false);
        }
        setIsScrubbing(true);
        const newTime = getScrubTime(e.clientX);
        setCurrentTime(newTime);
        seekTo(newTime);
    };

    const handleScrubMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isScrubbing) return;
        const newTime = getScrubTime(e.clientX);
        setCurrentTime(newTime);
        seekTo(newTime);
    };

    const handleScrubEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isScrubbing) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        setIsScrubbing(false);
        if (wasPlayingBeforeScrub && videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleRangeChange = (vals: number[]) => {
        const start = vals[0];
        const end = vals[1];
        if (start !== trimRange[0]) {
            seekTo(start);
            setCurrentTime(start);
        } else if (end !== trimRange[1]) {
            seekTo(end);
            setCurrentTime(end);
        }
        setTrimRange([start, end]);
    };

    const handleInputCommit = (type: "start" | "end", value: string) => {
        const parsed = parseTimeWithMs(value);
        if (parsed === null || parsed < 0 || parsed > duration) {
            setStartInput(formatTimeWithMs(trimRange[0]));
            setEndInput(formatTimeWithMs(trimRange[1]));
            return;
        }
        let newStart = trimRange[0];
        let newEnd = trimRange[1];
        if (type === "start") {
            newStart = Math.min(parsed, trimRange[1] - 0.1);
        } else {
            newEnd = Math.max(parsed, trimRange[0] + 0.1);
        }
        setTrimRange([newStart, newEnd]);
        seekTo(type === "start" ? newStart : newEnd);
    };

    const resetTrim = () => {
        setTrimRange([0, duration]);
        seekTo(0);
    };

    const handleTrimSubmit = async () => {
        const [startSeconds, endSeconds] = trimRange;
        if (startSeconds === 0 && endSeconds === duration) {
            alert("Please modify the range first.");
            return;
        }
        try {
            await trimVideo({ id: video.id, startSeconds, endSeconds }).unwrap();
            alert("Trim task submitted!");
        } catch (err) {
            console.error(err);
            alert("Error submitting trim task.");
        }
    };

    const startPercent = duration > 0 ? (trimRange[0] / duration) * 100 : 0;
    const endPercent = duration > 0 ? (trimRange[1] / duration) * 100 : 100;

    const trimTransitionClass = isDraggingTrim ? "transition-none" : "transition-all duration-200 ease-out";

    const playheadTransitionClass = (isScrubbing || isDraggingTrim || isPlaying)
        ? "transition-none"
        : "transition-all duration-200 ease-out";

    if (video.status === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-[#3f3f3f] rounded-lg bg-[#1a1a1a]">
                <Loader2 className="w-10 h-10 animate-spin text-[#3ea6ff] mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">Processing video...</h3>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 w-full mx-auto h-[calc(100vh-280px)] min-h-[600px]">
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5 flex-1 min-h-0">
                <div className="lg:col-span-2 xl:col-span-3 bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#2e2e2e] shadow-xl relative group flex items-center justify-center h-full">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3f3f3f]/30 via-[#0a0a0a]/80 to-[#000000] pointer-events-none" />

                    <div
                        className="absolute inset-0 opacity-[0.15] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                            backgroundSize: '24px 24px'
                        }}
                    />

                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] cursor-pointer z-10"
                        playsInline
                        onClick={togglePlay}
                    />

                    {!isPlaying && (
                        <div onClick={togglePlay} className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[10px]">
                            <div className="bg-black/60 p-6 rounded-full border border-white/20 backdrop-blur-md shadow-2xl transform group-hover:scale-110 transition-transform">
                                <Play className="w-12 h-12 text-white fill-white translate-x-1" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1 xl:col-span-1 bg-[#0f0f0f] border border-[#2e2e2e] rounded-xl p-5 shadow-xl flex flex-col justify-between h-full overflow-y-auto">
                    <div>
                        <div className="flex items-center gap-2 mb-5">
                            <Scissors className="w-5 h-5 text-[#3ea6ff]" />
                            <h2 className="text-lg font-semibold text-white">Trim Properties</h2>
                        </div>

                        <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-4 mb-5 flex flex-col gap-3">
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-[#aaaaaa] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Original length</span>
                                <span className="text-white font-mono">{formatTimeWithMs(duration)}</span>
                            </div>

                            <div className="flex justify-between items-center text-[13px] pt-2 border-t border-[#333]">
                                <span className="text-[#aaaaaa] flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Trimmed length</span>
                                <span className="text-[#3ea6ff] font-mono">{formatTimeWithMs(trimDuration)}</span>
                            </div>

                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-[#aaaaaa]">Time removed</span>
                                <span className="text-red-400 font-mono">- {formatTimeWithMs(cutDuration)}</span>
                            </div>
                        </div>

                        <div className="flex gap-4 mb-2">
                            <div className="flex flex-col gap-1.5 flex-1 relative">
                                <label className="text-[12px] text-[#aaaaaa] absolute -top-2.5 left-2 bg-[#0f0f0f] px-1 z-10">Start time</label>

                                <Input
                                    type="text"
                                    value={startInput}
                                    onChange={(e) => setStartInput(e.target.value)}
                                    onBlur={(e) => handleInputCommit("start", e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleInputCommit("start", startInput)}
                                    className="w-full h-11 bg-[#1a1a1a] border-[#3f3f3f] text-white font-mono focus-visible:ring-[#3ea6ff] text-[14px]"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 flex-1 relative">
                                <label className="text-[12px] text-[#aaaaaa] absolute -top-2.5 left-2 bg-[#0f0f0f] px-1 z-10">End time</label>

                                <Input
                                    type="text"
                                    value={endInput}
                                    onChange={(e) => setEndInput(e.target.value)}
                                    onBlur={(e) => handleInputCommit("end", e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleInputCommit("end", endInput)}
                                    className="w-full h-11 bg-[#1a1a1a] border-[#3f3f3f] text-white font-mono focus-visible:ring-[#3ea6ff] text-[14px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        <Button
                            onClick={resetTrim}
                            variant="outline"
                            className="w-full border-[#333] text-[#aaaaaa] hover:text-white hover:bg-[#1a1a1a] h-10 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4 mr-2" /> Reset Changes
                        </Button>

                        <Button
                            onClick={handleTrimSubmit}
                            disabled={isTrimming}
                            className="w-full bg-[#3ea6ff] text-black hover:bg-[#6ebcff] font-medium h-11 transition-all shadow-lg shadow-[#3ea6ff]/20 disabled:opacity-50 cursor-pointer"
                        >
                            {isTrimming ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Scissors className="w-5 h-5 mr-2" />}
                            Save Trim
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#2e2e2e] rounded-xl p-5 shadow-xl w-full shrink-0">
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        onClick={togglePlay}
                        variant="ghost"
                        className="rounded-full w-12 h-12 p-0 bg-[#1a1a1a] border border-[#333] hover:bg-[#333] hover:border-[#444] text-white shrink-0 transition-all cursor-pointer"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
                    </Button>

                    <div className="text-[14px] text-white font-mono bg-[#1a1a1a] px-4 py-2 rounded-md border border-[#333]">
                        <span className="text-white">{formatTimeWithMs(currentTime)}</span>
                        <span className="text-[#aaaaaa]"> / {formatTimeWithMs(duration)}</span>
                    </div>
                </div>

                <div className="relative w-full h-[72px] mt-2 group" ref={timelineRef}>

                    <div className="absolute inset-0 bg-[#121212] rounded-lg border border-[#333] overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 opacity-40 waveform-pattern" />

                        <div
                            className={`absolute h-full bg-black/80 border-r border-[#3ea6ff]/50 backdrop-blur-sm ${trimTransitionClass}`}
                            style={{ left: 0, width: `${startPercent}%` }}
                        />

                        <div
                            className={`absolute top-0 bottom-0 border-y-[3px] border-[#3ea6ff] ${trimTransitionClass}`}
                            style={{ left: `${startPercent}%`, right: `${100 - endPercent}%` }}
                        />

                        <div
                            className={`absolute h-full bg-black/80 border-l border-[#3ea6ff]/50 backdrop-blur-sm ${trimTransitionClass}`}
                            style={{ right: 0, left: `${endPercent}%` }}
                        />
                    </div>

                    <div
                        className="absolute inset-0 z-20 cursor-col-resize"
                        onPointerDown={handleScrubStart}
                        onPointerMove={handleScrubMove}
                        onPointerUp={handleScrubEnd}
                        onPointerCancel={handleScrubEnd}
                    />

                    <SliderPrimitive.Root
                        min={0}
                        max={duration || 100}
                        step={0.001}
                        value={trimRange}
                        onValueChange={handleRangeChange}
                        className="absolute inset-0 flex items-center w-full h-full z-30 pointer-events-none"
                    >
                        <SliderPrimitive.Track className="relative w-full h-full pointer-events-none" />

                        <SliderPrimitive.Thumb
                            onPointerDown={() => setIsDraggingTrim(true)}
                            className="pointer-events-auto block w-4 h-full cursor-ew-resize focus:outline-none rounded-l-md group outline-none"
                        >
                            <div className="w-full h-full border-y-[3px] border-l-[4px] border-r-0 border-[#3ea6ff] rounded-l-md bg-black/20 backdrop-blur-sm group-hover:bg-[#3ea6ff]/20 transition-colors flex items-center justify-center shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                                <div className="w-[1.5px] h-4 bg-[#3ea6ff] rounded-full group-hover:bg-white transition-colors" />
                            </div>
                        </SliderPrimitive.Thumb>

                        <SliderPrimitive.Thumb
                            onPointerDown={() => setIsDraggingTrim(true)}
                            className="pointer-events-auto block w-4 h-full cursor-ew-resize focus:outline-none rounded-r-md group outline-none"
                        >
                            <div className="w-full h-full border-y-[3px] border-r-[4px] border-l-0 border-[#3ea6ff] rounded-r-md bg-black/20 backdrop-blur-sm group-hover:bg-[#3ea6ff]/20 transition-colors flex items-center justify-center shadow-[-4px_0_10px_rgba(0,0,0,0.5)]">
                                <div className="w-[1.5px] h-4 bg-[#3ea6ff] rounded-full group-hover:bg-white transition-colors" />
                            </div>
                        </SliderPrimitive.Thumb>
                    </SliderPrimitive.Root>

                    <div
                        className={`absolute top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-40 pointer-events-none ${playheadTransitionClass}`}
                        style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                    >
                        <div className="absolute -top-[12px] -translate-x-1/2 w-4 h-[14px] bg-red-500 rounded-t-sm flex items-center justify-center shadow-lg shadow-red-500/20">
                            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-transparent border-t-black/30 mt-1" />
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .waveform-pattern {
                    background-image: repeating-linear-gradient(
                            90deg,
                            #444 0px,
                            #444 2px,
                            transparent 2px,
                            transparent 6px
                    );
                    background-position: center;
                    background-size: 100% 70%;
                    background-repeat: repeat-x;
                }
            `}</style>
        </div>
    );
}