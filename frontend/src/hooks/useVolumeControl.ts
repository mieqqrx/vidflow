"use client";

import { useState, useEffect, useCallback, RefObject } from "react";

export function useVolumeControl(videoRef: RefObject<HTMLVideoElement | null>) {
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(1);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

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
        } else {
            video.volume = volume;
            video.muted = isMuted;
        }
    }, [videoRef]);

    const changeVolume = useCallback((newVolume: number) => {
        const video = videoRef.current;
        if (!video) return;

        const clamped = Math.max(0, Math.min(newVolume, 1));
        video.volume = clamped;
        setVolume(clamped);
        localStorage.setItem("vidflow_volume", clamped.toString());

        if (clamped === 0) {
            video.muted = true;
            setIsMuted(true);
        } else {
            video.muted = false;
            setIsMuted(false);
            setPreviousVolume(clamped);
        }
    }, [videoRef]);

    const toggleMute = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        if (isMuted) {
            const restoreVolume = previousVolume > 0 ? previousVolume : 1;
            video.muted = false;
            video.volume = restoreVolume;
            setVolume(restoreVolume);
            setIsMuted(false);
            localStorage.setItem("vidflow_volume", restoreVolume.toString());
        } else {
            setPreviousVolume(volume);
            video.muted = true;
            setVolume(0);
            setIsMuted(true);
            localStorage.setItem("vidflow_volume", "0");
        }
    }, [isMuted, previousVolume, volume, videoRef]);

    return { volume, isMuted, changeVolume, toggleMute };
}