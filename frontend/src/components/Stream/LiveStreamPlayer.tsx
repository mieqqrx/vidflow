"use client";

import React, { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Settings, Maximize, Check, Radio, RectangleHorizontal, Subtitles, Loader2, Users } from "lucide-react";
import { LiveStreamStatus, LiveStreamResponse } from "@/types/stream";
import { fixUrl } from "@/utils/fixUrl";

const formatTime = (time: number, totalDuration?: number) => {
    if (isNaN(time)) return "0:00";
    if (totalDuration !== undefined && (totalDuration - time) < 0.05) time = totalDuration;
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

interface LiveStreamPlayerProps {
    stream: LiveStreamResponse;
    viewersCount: number;
}

export default function LiveStreamPlayer({ stream, viewersCount }: LiveStreamPlayerProps) {
    const isBackendLive = stream?.status === LiveStreamStatus.Live;
    const isBackendEnded = stream?.status === LiveStreamStatus.Ended;
    const isScheduled = stream?.status === LiveStreamStatus.Scheduled;

    const wasLiveRef = useRef(isBackendLive);
    const [isDrainingBuffer, setIsDrainingBuffer] = useState(false);
    const streamStatusRef = useRef(stream?.status);

    useEffect(() => {
        streamStatusRef.current = stream?.status;
    }, [stream?.status]);

    useEffect(() => {
        if (isBackendLive) {
            wasLiveRef.current = true;
        } else if (isBackendEnded && wasLiveRef.current) {
            setIsDrainingBuffer(true);
            wasLiveRef.current = false;
        }
    }, [isBackendLive, isBackendEnded]);

    const isEffectivelyLive = isBackendLive || isDrainingBuffer;
    const isRecordingAvailable = isBackendEnded && !!stream?.recordingUrl && !isDrainingBuffer;
    const isProcessing = isBackendEnded && !stream?.recordingUrl && !isDrainingBuffer;

    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(1);

    const [buffered, setBuffered] = useState(0);
    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    const [isDraggingVolume, setIsDraggingVolume] = useState(false);
    const [wasPlaying, setWasPlaying] = useState(false);

    const [levels, setLevels] = useState<{ height: number }[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1);
    const [playingLevel, setPlayingLevel] = useState<number>(-1);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const volumeBarRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const progressFillRef = useRef<HTMLDivElement>(null);
    const timeTextRef = useRef<HTMLSpanElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!stream || !video) return;

        const savedVolume = localStorage.getItem("vidflow_volume");
        if (savedVolume !== null) {
            const parsedVolume = parseFloat(savedVolume);
            if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
                video.volume = parsedVolume;
                video.muted = parsedVolume === 0;
                setVolume(parsedVolume);
                setIsMuted(parsedVolume === 0);
                if (parsedVolume > 0) setPreviousVolume(parsedVolume);
            }
        }

        if (isRecordingAvailable && stream.recordingUrl) {
            const fixedUrl = fixUrl(stream.recordingUrl);
            if (video.src !== fixedUrl) {
                video.src = fixedUrl;
                video.load();
            }
            return;
        }

        if (isEffectivelyLive && stream.playbackUrl) {
            let hls: Hls;
            if (Hls.isSupported()) {
                hls = new Hls({ lowLatencyMode: true, backBufferLength: 90 });
                hlsRef.current = hls;
                hls.loadSource(stream.playbackUrl);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    setLevels(data.levels);
                    video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                });
                hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => setPlayingLevel(data.level));
                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            if (streamStatusRef.current === LiveStreamStatus.Ended) {
                                hls.stopLoad();
                            } else {
                                setTimeout(() => hls.startLoad(), 2000);
                            }
                        }
                        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
                        else hls.destroy();
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream.playbackUrl;
                video.addEventListener("loadedmetadata", () => {
                    video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                });
            }
            return () => { if (hls) hls.destroy(); };
        }
    }, [stream?.playbackUrl, stream?.recordingUrl, isEffectivelyLive, isRecordingAvailable]);

    const updateProgress = (clientX: number, isFinal: boolean = false) => {
        if (videoRef.current && progressBarRef.current && isRecordingAvailable) {
            const rect = progressBarRef.current.getBoundingClientRect();
            const clickPosition = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = clickPosition / rect.width;
            const newTime = percentage * videoRef.current.duration;

            if (progressFillRef.current) progressFillRef.current.style.width = `${percentage * 100}%`;
            if (timeTextRef.current) timeTextRef.current.innerText = `${formatTime(newTime)} / ${formatTime(videoRef.current.duration)}`;

            if (isFinal) {
                videoRef.current.currentTime = newTime;
                setIsBuffering(true);
            }
        }
    };

    const updateVolume = (clientX: number) => {
        if (videoRef.current && volumeBarRef.current) {
            const rect = volumeBarRef.current.getBoundingClientRect();
            const percentage = Math.max(0, Math.min(clientX - rect.left, rect.width)) / rect.width;
            videoRef.current.volume = percentage;
            setVolume(percentage);
            localStorage.setItem("vidflow_volume", percentage.toString());

            if (percentage === 0) {
                videoRef.current.muted = true; setIsMuted(true);
            } else if (isMuted) {
                videoRef.current.muted = false; setIsMuted(false);
            }
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingProgress) updateProgress(e.clientX, false);
            if (isDraggingVolume) updateVolume(e.clientX);
        };
        const handleMouseUp = (e: MouseEvent) => {
            if (isDraggingProgress) {
                setIsDraggingProgress(false);
                updateProgress(e.clientX, true);
                if (videoRef.current && wasPlaying) videoRef.current.play().catch(() => {});
            }
            if (isDraggingVolume) setIsDraggingVolume(false);
        };

        if (isDraggingProgress || isDraggingVolume) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingProgress, isDraggingVolume, wasPlaying, isRecordingAvailable]);

    const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isRecordingAvailable) return;
        e.preventDefault(); e.stopPropagation();
        setIsDraggingProgress(true);
        if (videoRef.current) {
            setWasPlaying(!videoRef.current.paused);
            videoRef.current.pause();
        }
        updateProgress(e.clientX, false);
    };

    const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingVolume(true); updateVolume(e.clientX);
    };

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play().catch(() => {});
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            if (isMuted) {
                const restoreVolume = previousVolume > 0 ? previousVolume : 1;
                videoRef.current.muted = false; videoRef.current.volume = restoreVolume;
                setVolume(restoreVolume); setIsMuted(false);
                localStorage.setItem("vidflow_volume", restoreVolume.toString());
            } else {
                setPreviousVolume(volume); videoRef.current.muted = true;
                setVolume(0); setIsMuted(true);
                localStorage.setItem("vidflow_volume", "0");
            }
        }
    };

    const toggleFullscreen = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!playerContainerRef.current) return;
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handleQualityChange = (levelIndex: number) => {
        if (hlsRef.current) {
            hlsRef.current.nextLevel = levelIndex;
            setCurrentLevel(levelIndex);
            setIsSettingsOpen(false);
        }
    };

    const updateBuffered = () => {
        if (videoRef.current && videoRef.current.duration > 0 && isRecordingAvailable) {
            const bufferedRanges = videoRef.current.buffered;
            let loaded = 0;
            if (bufferedRanges.length > 0) {
                const currentTime = videoRef.current.currentTime;
                for (let i = 0; i < bufferedRanges.length; i++) {
                    if (bufferedRanges.start(i) <= currentTime && bufferedRanges.end(i) >= currentTime) {
                        loaded = bufferedRanges.end(i);
                        break;
                    }
                }
                if (loaded === 0) loaded = bufferedRanges.end(bufferedRanges.length - 1);
            }
            setBuffered((loaded / videoRef.current.duration) * 100);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            if (videoRef.current.readyState < 3) {
                if (!isBuffering) setIsBuffering(true);
                return;
            } else if (isBuffering) setIsBuffering(false);

            if (isRecordingAvailable && !isDraggingProgress) {
                const current = videoRef.current.currentTime;
                const total = videoRef.current.duration;
                if (progressFillRef.current && total > 0) progressFillRef.current.style.width = `${(current / total) * 100}%`;
                if (timeTextRef.current) timeTextRef.current.innerText = `${formatTime(current)} / ${formatTime(total)}`;
                updateBuffered();
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current && isRecordingAvailable) {
            if (timeTextRef.current) timeTextRef.current.innerText = `0:00 / ${formatTime(videoRef.current.duration)}`;
        }
    };

    const activeLevel = currentLevel !== -1 ? currentLevel : playingLevel;
    const isHD = activeLevel !== -1 && levels[activeLevel]?.height >= 720;

    return (
        <div
            ref={playerContainerRef}
            className="w-full aspect-video bg-black rounded-xl overflow-hidden relative group border border-[#3F3F3F] select-none shadow-xl"
            onClick={(e) => {
                if (isSettingsOpen) setIsSettingsOpen(false);
                else if (isEffectivelyLive || isRecordingAvailable) togglePlay(e);
            }}
        >
            {isEffectivelyLive || isRecordingAvailable ? (
                <>
                    <video
                        ref={videoRef}
                        poster={fixUrl(stream.thumbnailUrl) || undefined}
                        className="w-full h-full object-contain cursor-pointer"
                        autoPlay={isEffectivelyLive}
                        muted={isMuted}
                        onTimeUpdate={handleTimeUpdate}
                        onProgress={updateBuffered}
                        onLoadedMetadata={handleLoadedMetadata}
                        onWaiting={isEffectivelyLive ? () => setIsBuffering(true) : undefined}
                        onPlaying={isEffectivelyLive ? () => { setIsBuffering(false); setIsPlaying(true); } : undefined}
                        onPause={isEffectivelyLive ? () => setIsPlaying(false) : undefined}
                        onCanPlay={() => setIsBuffering(false)}
                        onEnded={() => {
                            setIsPlaying(false);
                            if (isDrainingBuffer) setIsDrainingBuffer(false);
                        }}
                    />

                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isPlaying || isBuffering || isDraggingProgress ? "opacity-0" : "opacity-100"}`}>
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                            <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
                        </div>
                    </div>

                    {isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                            <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-[#3ea6ff] animate-spin drop-shadow-lg" />
                        </div>
                    )}

                    {isEffectivelyLive ? (
                        <div className="absolute top-4 left-4 flex items-center gap-3 z-40 transition-opacity duration-300 opacity-100 group-hover:opacity-100">
                            <div className="bg-[#CC0000] text-white text-[12px] font-bold px-2 py-1 rounded flex items-center gap-1.5 tracking-wider shadow-lg">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                LIVE
                            </div>
                            <div className="bg-black/60 backdrop-blur-sm text-white text-[12px] font-bold px-2 py-1 rounded flex items-center gap-1.5 shadow-lg">
                                <Users className="w-3.5 h-3.5" />
                                {viewersCount.toLocaleString()}
                            </div>
                        </div>
                    ) : (
                        <div className="absolute top-4 left-4 flex items-center gap-3 z-40 pointer-events-none transition-opacity duration-300 opacity-100 group-hover:opacity-100">
                            <div className="bg-black/60 backdrop-blur-sm text-white text-[12px] font-bold px-2 py-1 rounded flex items-center shadow-lg">
                                STREAM RECORDING
                            </div>
                        </div>
                    )}

                    <div
                        className={`absolute bottom-0 left-0 right-0 px-4 pb-4 pt-14 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${isPlaying && !isSettingsOpen && !isDraggingProgress && !isDraggingVolume ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isRecordingAvailable ? (
                            <div ref={progressBarRef} className="w-full h-[5px] bg-white/30 cursor-pointer relative group/progress rounded-full" onMouseDown={handleProgressMouseDown}>
                                <div className="absolute inset-y-0 left-0 right-0 bg-transparent group-hover/progress:h-[5px] transition-all z-0"></div>
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 h-[5px] group-hover/progress:h-[6px] bg-[#AAAAAA]/60 z-10 transition-all rounded-l-full" style={{ width: `${buffered}%` }}></div>
                                <div ref={progressFillRef} className={`absolute top-1/2 -translate-y-1/2 left-0 h-[5px] group-hover/progress:h-[6px] bg-[#3ea6ff] z-20 rounded-l-full ${isDraggingProgress ? 'transition-none' : 'transition-all duration-200 ease-out'}`} style={{ width: '0%' }}>
                                    <div className={`absolute right-[-6px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#3ea6ff] rounded-full transition-transform shadow-sm ${isDraggingProgress ? 'scale-125' : 'scale-0 group-hover/progress:scale-100'}`} />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-[4px] bg-white/20 relative rounded-full mb-1 cursor-default">
                                <div className="absolute top-0 left-0 h-full bg-[#CC0000] w-full rounded-full shadow-[0_0_8px_rgba(204,0,0,0.6)]"></div>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-white mt-1">
                            <div className="flex items-center gap-4 md:gap-6">
                                <button onClick={togglePlay} className="hover:text-[#3ea6ff] transition-colors cursor-pointer">
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current drop-shadow" /> : <Play className="w-6 h-6 fill-current drop-shadow" />}
                                </button>

                                <div className="flex items-center gap-2 group/vol">
                                    <button onClick={toggleMute} className="hover:text-[#3ea6ff] transition-colors cursor-pointer">
                                        {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 drop-shadow" /> : <Volume2 className="w-6 h-6 drop-shadow" />}
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 flex items-center ${isDraggingVolume ? "w-16" : "w-0 group-hover/vol:w-16"}`}>
                                        <div ref={volumeBarRef} className="h-[20px] w-14 ml-2 relative cursor-pointer flex items-center group/volbar" onMouseDown={handleVolumeMouseDown}>
                                            <div className="h-[3px] w-full bg-white/50 rounded-full relative pointer-events-none">
                                                <div className={`absolute left-0 top-0 h-full bg-white rounded-full ${isDraggingVolume ? 'transition-none' : 'transition-all duration-150'}`} style={{ width: `${isMuted ? 0 : volume * 100}%` }}>
                                                    <div className={`absolute right-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform ${isDraggingVolume ? 'scale-125' : 'scale-0 group-hover/volbar:scale-100'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isRecordingAvailable ? (
                                    <span ref={timeTextRef} className="text-[13px] font-medium text-[#ddd] tracking-wide ml-1">0:00 / 0:00</span>
                                ) : (
                                    <div className="flex items-center gap-1.5 ml-1 hidden sm:flex">
                                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,1)]"></div>
                                        <span className="text-[13px] font-medium text-[#ddd] tracking-wide uppercase">Live</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 md:gap-6 relative">
                                <Subtitles className="w-5 h-5 drop-shadow hover:text-white text-white/90 hidden sm:block cursor-pointer" strokeWidth={2} />

                                {isEffectivelyLive && (
                                    <div className="relative flex items-center">
                                        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="relative cursor-pointer">
                                            <Settings className={`w-5 h-5 drop-shadow hover:text-[#3ea6ff] text-white/90 transition-transform duration-300 ${isSettingsOpen ? "rotate-45" : ""}`} />
                                            {isHD && <div className="absolute -top-2 -right-2 bg-[#FF0000] text-[9px] font-bold px-1 rounded-[2px] shadow-sm leading-none z-10">HD</div>}
                                        </button>

                                        {isSettingsOpen && (
                                            <div className="absolute bottom-10 right-[-20px] bg-[#282828]/95 backdrop-blur-md rounded-lg shadow-xl py-2 min-w-[140px] border border-[#3F3F3F] z-50">
                                                <div className="px-4 py-1.5 text-[11px] text-[#AAAAAA] uppercase font-bold border-b border-[#3F3F3F] mb-1">Quality</div>
                                                <button onClick={() => handleQualityChange(-1)} className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#3F3F3F] transition-colors flex items-center gap-2 cursor-pointer">
                                                    <div className="w-4 flex justify-center">{currentLevel === -1 && <Check className="w-4 h-4 text-[#3ea6ff]" />}</div>
                                                    <span className={currentLevel === -1 ? "text-white font-medium" : "text-[#AAAAAA]"}>Auto</span>
                                                </button>
                                                {[...levels].reverse().map((level, reversedIndex) => {
                                                    const originalIndex = levels.length - 1 - reversedIndex;
                                                    return (
                                                        <button key={originalIndex} onClick={() => handleQualityChange(originalIndex)} className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#3F3F3F] transition-colors flex items-center gap-2 cursor-pointer">
                                                            <div className="w-4 flex justify-center">{currentLevel === originalIndex && <Check className="w-4 h-4 text-[#3ea6ff]" />}</div>
                                                            <span className={currentLevel === originalIndex ? "text-white font-medium" : "text-[#AAAAAA]"}>{level.height}p</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <RectangleHorizontal className="w-5 h-5 drop-shadow hover:text-[#3ea6ff] text-white/90 hidden sm:block cursor-pointer transition-colors" />

                                <button onClick={toggleFullscreen} className="cursor-pointer">
                                    <Maximize className="w-5 h-5 drop-shadow hover:text-[#3ea6ff] text-white/90 transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-40 backdrop-blur-sm">
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-12 h-12 text-[#3ea6ff] animate-spin mb-4" />
                            <p className="text-[#AAAAAA] font-medium text-lg">Processing recording...</p>
                            <p className="text-[#555] text-sm mt-2">This may take a few minutes.</p>
                        </>
                    ) : isScheduled ? (
                        <>
                            <div className="w-16 h-16 border-4 border-[#3ea6ff] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[#AAAAAA] font-medium">Waiting for broadcast...</p>
                        </>
                    ) : (
                        <>
                            <Radio className="w-12 h-12 text-[#444] mb-4" />
                            <p className="text-[#AAAAAA] font-medium text-lg">This stream has ended.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}