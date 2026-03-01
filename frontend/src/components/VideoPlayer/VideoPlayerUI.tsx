"use client";

import React, { useState, useRef, useEffect } from "react";
import Hls from "hls.js";
import {
    Play, Pause, SkipForward, Volume2, VolumeX, Settings, Maximize,
    Subtitles, RectangleHorizontal, Check, Loader2
} from "lucide-react";

export interface VideoPlayerUIProps {
    videoUrl?: string;
    thumbnail: string | null;
}

const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function VideoPlayerUI({ videoUrl, thumbnail }: VideoPlayerUIProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(1);

    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    const [isDraggingVolume, setIsDraggingVolume] = useState(false);
    const [wasPlaying, setWasPlaying] = useState(false);

    const [levels, setLevels] = useState<{ height: number }[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1);
    const [playingLevel, setPlayingLevel] = useState<number>(-1);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const progressBarRef = useRef<HTMLDivElement>(null);
    const volumeBarRef = useRef<HTMLDivElement>(null);

    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoUrl) return;

        video.volume = volume;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;

            hls.loadSource(videoUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                setLevels(data.levels);
                const initialLevel = data.levels.length > 1 ? 1 : 0;
                hls.startLevel = initialLevel;
                setPlayingLevel(initialLevel);
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                setPlayingLevel(data.level);
            });

            hls.on(Hls.Events.FRAG_LOADING, () => {
                if (video.buffered.length === 0 || video.currentTime >= video.buffered.end(video.buffered.length - 1) - 0.5) {
                    setIsBuffering(true);
                }
            });

            hls.on(Hls.Events.FRAG_LOADED, () => {
                setIsBuffering(false);
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls?.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls?.recoverMediaError();
                            break;
                        default:
                            hls?.destroy();
                            break;
                    }
                }
                setIsBuffering(false);
            });
        }
        else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = videoUrl;
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoUrl]);

    // --- ОБНОВЛЕНО: Отделяем визуальную перемотку от физической ---
    const updateProgress = (clientX: number, isFinal: boolean = false) => {
        if (videoRef.current && progressBarRef.current) {
            const rect = progressBarRef.current.getBoundingClientRect();
            const clickPosition = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = clickPosition / rect.width;

            const newTime = percentage * videoRef.current.duration;

            // Обновляем визуальную часть (синяя полоска и таймер) всегда
            setProgress(percentage * 100);
            setCurrentTime(newTime);

            // Физически проматываем видео ТОЛЬКО когда отпустили мышку (isFinal === true)
            if (isFinal) {
                // Поскольку во время перетаскивания мы ставили видео на паузу,
                // videoRef.current.currentTime все еще хранит то время, откуда мы НАЧАЛИ тянуть ползунок.
                // Это позволяет нам идеально отследить перемотку назад.
                const requiresHardRefresh = newTime < videoRef.current.currentTime && currentLevel !== -1;

                if (requiresHardRefresh && hlsRef.current) {
                    hlsRef.current.currentLevel = currentLevel; // Сброс старых чанков
                }

                videoRef.current.currentTime = newTime; // Реальная перемотка
                setIsBuffering(true);
            }
        }
    };

    const updateVolume = (clientX: number) => {
        if (videoRef.current && volumeBarRef.current) {
            const rect = volumeBarRef.current.getBoundingClientRect();
            const clickPosition = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = clickPosition / rect.width;

            videoRef.current.volume = percentage;
            setVolume(percentage);

            if (percentage === 0) {
                videoRef.current.muted = true;
                setIsMuted(true);
            } else if (isMuted) {
                videoRef.current.muted = false;
                setIsMuted(false);
            }
        }
    };

    // Глобальные слушатели мыши
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingProgress) updateProgress(e.clientX, false); // isFinal = false (только визуал)
            if (isDraggingVolume) updateVolume(e.clientX);
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isDraggingProgress) {
                setIsDraggingProgress(false);
                updateProgress(e.clientX, true); // isFinal = true (отпустили кнопку, применяем перемотку!)

                if (videoRef.current && wasPlaying) {
                    videoRef.current.play(); // Если играло, продолжаем играть
                }
            }
            if (isDraggingVolume) {
                setIsDraggingVolume(false);
            }
        };

        if (isDraggingProgress || isDraggingVolume) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingProgress, isDraggingVolume, wasPlaying, currentLevel]);

    const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDraggingProgress(true);
        if (videoRef.current) {
            setWasPlaying(!videoRef.current.paused);
            videoRef.current.pause(); // Ставим на паузу, пока тянем ползунок
        }
        updateProgress(e.clientX, false); // Визуально перепрыгиваем в точку клика
    };

    const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDraggingVolume(true);
        updateVolume(e.clientX);
    };

    const handleQualityChange = (levelIndex: number) => {
        if (hlsRef.current) {
            hlsRef.current.nextLevel = levelIndex;
            setCurrentLevel(levelIndex);
            setIsSettingsOpen(false);
        }
    };

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (videoRef.current) {
            if (isMuted) {
                const restoreVolume = previousVolume > 0 ? previousVolume : 1;
                videoRef.current.muted = false;
                videoRef.current.volume = restoreVolume;
                setVolume(restoreVolume);
                setIsMuted(false);
            } else {
                setPreviousVolume(volume);
                videoRef.current.muted = true;
                setVolume(0);
                setIsMuted(true);
            }
        }
    };

    const toggleFullscreen = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const updateBuffered = () => {
        if (videoRef.current && videoRef.current.duration > 0) {
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
                if (loaded === 0) {
                    loaded = bufferedRanges.end(bufferedRanges.length - 1);
                }
            }

            setBuffered((loaded / videoRef.current.duration) * 100);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;

            if (!isDraggingProgress) {
                setCurrentTime(current);
                if (total > 0) setProgress((current / total) * 100);
            }
            updateBuffered();
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handlePlayerClick = (e: React.MouseEvent) => {
        if (isSettingsOpen) {
            setIsSettingsOpen(false);
        } else {
            togglePlay(e);
        }
    };

    const activeLevel = currentLevel !== -1 ? currentLevel : playingLevel;
    const isHD = activeLevel !== -1 && levels[activeLevel]?.height >= 720;

    return (
        <div
            ref={containerRef}
            className="w-full aspect-video bg-black rounded-xl overflow-hidden relative group shadow-lg border border-[#3F3F3F] select-none"
            onClick={handlePlayerClick}
        >
            <video
                ref={videoRef}
                poster={thumbnail || "/placeholder.jpg"}
                className="w-full h-full object-cover cursor-pointer"
                onTimeUpdate={handleTimeUpdate}
                onProgress={updateBuffered}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
            />

            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-[#3ea6ff] animate-spin drop-shadow-lg" />
                </div>
            )}

            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isPlaying || isBuffering || isDraggingProgress ? "opacity-0" : "opacity-100"}`}>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
                </div>
            </div>

            <div
                className={`absolute bottom-0 left-0 right-0 px-4 pb-4 pt-14 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${isPlaying && !isSettingsOpen && !isDraggingProgress && !isDraggingVolume ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    ref={progressBarRef}
                    className="w-full h-[5px] bg-white/30 cursor-pointer relative group/progress rounded-full"
                    onMouseDown={handleProgressMouseDown}
                >
                    <div className="absolute inset-y-0 left-0 right-0 bg-transparent group-hover/progress:h-[5px] transition-all z-0"></div>

                    <div
                        className="absolute top-1/2 -translate-y-1/2 left-0 h-[5px] group-hover/progress:h-[6px] bg-[#AAAAAA]/60 z-10 transition-all rounded-l-full"
                        style={{ width: `${buffered}%` }}
                    ></div>

                    <div
                        className={`absolute top-1/2 -translate-y-1/2 left-0 h-[5px] group-hover/progress:h-[6px] bg-[#3ea6ff] z-20 rounded-l-full ${isDraggingProgress ? 'transition-none' : 'transition-all'}`}
                        style={{ width: `${progress}%` }}
                    >
                        <div className={`absolute right-[-6px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#3ea6ff] rounded-full transition-transform shadow-sm ${isDraggingProgress ? 'scale-125' : 'scale-0 group-hover/progress:scale-100'}`} />
                    </div>
                </div>

                <div className="flex items-center justify-between text-white mt-1">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button onClick={togglePlay} className="hover:text-[#3ea6ff] transition-colors">
                            {isPlaying ? (
                                <Pause className="w-6 h-6 fill-current drop-shadow" />
                            ) : (
                                <Play className="w-6 h-6 fill-current drop-shadow" />
                            )}
                        </button>

                        <SkipForward className="w-6 h-6 fill-white drop-shadow hover:text-[#3ea6ff] hidden sm:block cursor-pointer transition-colors" />

                        <div className="flex items-center gap-2 group/vol">
                            <button onClick={toggleMute} className="hover:text-[#3ea6ff] transition-colors">
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="w-6 h-6 drop-shadow" />
                                ) : (
                                    <Volume2 className="w-6 h-6 drop-shadow" />
                                )}
                            </button>

                            <div className={`overflow-hidden transition-all duration-300 flex items-center ${isDraggingVolume ? "w-16" : "w-0 group-hover/vol:w-16"}`}>
                                <div
                                    ref={volumeBarRef}
                                    className="h-[20px] w-14 ml-2 relative cursor-pointer flex items-center group/volbar"
                                    onMouseDown={handleVolumeMouseDown}
                                >
                                    <div className="h-[3px] w-full bg-white/50 rounded-full relative pointer-events-none">
                                        <div
                                            className={`absolute left-0 top-0 h-full bg-white rounded-full ${isDraggingVolume ? 'transition-none' : 'transition-all duration-150'}`}
                                            style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                                        >
                                            <div className={`absolute right-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform ${isDraggingVolume ? 'scale-125' : 'scale-0 group-hover/volbar:scale-100'}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <span className="text-[13px] font-medium text-[#ddd] tracking-wide ml-1">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6 relative">
                        <Subtitles className="w-5 h-5 drop-shadow hover:text-white text-white/90 hidden sm:block cursor-pointer" strokeWidth={2} />

                        <div className="relative flex items-center">
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className="relative"
                            >
                                <Settings className={`w-5 h-5 drop-shadow hover:text-[#3ea6ff] text-white/90 transition-transform duration-300 ${isSettingsOpen ? "rotate-45" : ""}`} />

                                {isHD && (
                                    <div className="absolute -top-2 -right-2 bg-[#FF0000] text-[9px] font-bold px-1 rounded-[2px] shadow-sm leading-none z-10">
                                        HD
                                    </div>
                                )}
                            </button>

                            {isSettingsOpen && (
                                <div className="absolute bottom-10 right-[-20px] bg-[#282828]/95 backdrop-blur-md rounded-lg shadow-xl py-2 min-w-[140px] border border-[#3F3F3F] z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-1.5 text-[11px] text-[#AAAAAA] uppercase font-bold border-b border-[#3F3F3F] mb-1">
                                        Quality
                                    </div>

                                    <button
                                        onClick={() => handleQualityChange(-1)}
                                        className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#3F3F3F] transition-colors flex items-center gap-2"
                                    >
                                        <div className="w-4 flex justify-center">
                                            {currentLevel === -1 && <Check className="w-4 h-4 text-[#3ea6ff]" />}
                                        </div>
                                        <span className={currentLevel === -1 ? "text-white font-medium" : "text-[#AAAAAA]"}>
                                            Auto
                                        </span>
                                    </button>

                                    {[...levels].reverse().map((level, reversedIndex) => {
                                        const originalIndex = levels.length - 1 - reversedIndex;

                                        return (
                                            <button
                                                key={originalIndex}
                                                onClick={() => handleQualityChange(originalIndex)}
                                                className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#3F3F3F] transition-colors flex items-center gap-2"
                                            >
                                                <div className="w-4 flex justify-center">
                                                    {currentLevel === originalIndex && <Check className="w-4 h-4 text-[#3ea6ff]" />}
                                                </div>
                                                <span className={currentLevel === originalIndex ? "text-white font-medium" : "text-[#AAAAAA]"}>
                                                    {level.height}p
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <RectangleHorizontal className="w-5 h-5 drop-shadow hover:text-[#3ea6ff] text-white/90 hidden sm:block cursor-pointer transition-colors" />

                        <button onClick={toggleFullscreen}>
                            <Maximize className="w-5 h-5 drop-shadow hover:text-[#3ea6ff] text-white/90 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}