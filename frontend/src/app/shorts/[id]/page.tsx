"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import ShortPlayer from "@/components/Shorts/ShortPlayer";
import { Video } from "@/types";
import { useGetShortsQuery } from "@/store/api";

export default function ShortsPage() {
    const params = useParams();
    const initialShortId = params?.id ? String(params.id) : null;

    const [page, setPage] = useState(1);
    const { data: shorts, isLoading, isFetching } = useGetShortsQuery({ page, pageSize: 10 });

    const [activeShortId, setActiveShortId] = useState<string | null>(initialShortId);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (page === 1 && shorts && shorts.length > 0 && !activeShortId) {
            setActiveShortId(shorts[0].id);
            window.history.replaceState(null, '', `/shorts/${shorts[0].id}`);
        }
    }, [shorts, activeShortId, page]);

    useEffect(() => {
        if (initialShortId && shorts && containerRef.current) {
            const targetElement = containerRef.current.querySelector(`[data-short-id="${initialShortId}"]`);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'auto' });
            }
        }
    }, [initialShortId, shorts]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const shortId = entry.target.getAttribute("data-short-id");
                        if (shortId && shortId !== activeShortId) {
                            setActiveShortId(shortId);
                            window.history.replaceState(null, '', `/shorts/${shortId}`);
                        }
                    }
                });
            },
            {
                root: container,
                threshold: 0.6,
            }
        );

        const elements = container.querySelectorAll(".short-container");
        elements.forEach((el) => observer.observe(el));

        return () => {
            elements.forEach((el) => observer.unobserve(el));
            observer.disconnect();
        };
    }, [shorts, activeShortId]);

    const lastElementObserver = useRef<IntersectionObserver | null>(null);
    const lastShortElementRef = useCallback((node: HTMLDivElement) => {
        if (isFetching) return;
        if (lastElementObserver.current) lastElementObserver.current.disconnect();

        lastElementObserver.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && shorts && shorts.length >= page * 10) {
                setPage(prevPage => prevPage + 1);
            }
        });

        if (node) lastElementObserver.current.observe(node);
    }, [isFetching, shorts, page]);

    const scrollToIndex = useCallback((index: number) => {
        if (!shorts || index < 0 || index >= shorts.length) return;

        const targetId = shorts[index].id;
        const targetElement = containerRef.current?.querySelector(`[data-short-id="${targetId}"]`);

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    }, [shorts]);

    const handleNext = useCallback(() => {
        const currentIndex = shorts?.findIndex(s => s.id === activeShortId) ?? -1;
        scrollToIndex(currentIndex + 1);
    }, [shorts, activeShortId, scrollToIndex]);

    const handlePrev = useCallback(() => {
        const currentIndex = shorts?.findIndex(s => s.id === activeShortId) ?? -1;
        scrollToIndex(currentIndex - 1);
    }, [shorts, activeShortId, scrollToIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                handleNext();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                handlePrev();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext, handlePrev]);

    if (isLoading && page === 1) {
        return (
            <div className="flex h-[calc(100vh-72px)] bg-[#0f0f0f] items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#3ea6ff]" />
            </div>
        );
    }

    if (!shorts || shorts.length === 0) {
        return (
            <div className="flex h-[calc(100vh-72px)] bg-[#0f0f0f] items-center justify-center flex-col gap-4">
                <div className="w-16 h-16 bg-[#272727] rounded-full flex items-center justify-center mb-2">
                    <Loader2 className="w-8 h-8 text-[#aaaaaa]" />
                </div>
                <p className="text-[#aaaaaa] text-lg font-medium">No Shorts available right now.</p>
            </div>
        );
    }

    const currentIndex = shorts.findIndex(s => s.id === activeShortId);
    const isFirst = currentIndex <= 0;
    const isLast = currentIndex === shorts.length - 1;

    return (
        <div className="bg-[#0f0f0f] h-[calc(100vh-72px)] w-full overflow-hidden flex justify-center relative">
            <div
                ref={containerRef}
                className="w-full max-w-[600px] h-full overflow-y-auto snap-y snap-mandatory no-scrollbar relative z-10"
                style={{ scrollBehavior: 'smooth' }}
            >
                {shorts.map((short: Video, index: number) => {
                    const isLastElement = shorts.length === index + 1;

                    return (
                        <div
                            key={short.id}
                            data-short-id={short.id}
                            ref={isLastElement ? lastShortElementRef : null}
                            className="short-container w-full h-full snap-start snap-always flex items-center justify-center overflow-hidden"
                        >
                            <ShortPlayer
                                short={short}
                                isActive={activeShortId === short.id}
                            />
                        </div>
                    );
                })}

                {isFetching && page > 1 && (
                    <div className="w-full h-20 flex items-center justify-center snap-start flex-shrink-0">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3ea6ff]" />
                    </div>
                )}
            </div>

            <div className="hidden sm:flex absolute right-4 md:right-8 lg:right-16 xl:right-32 top-1/2 -translate-y-1/2 flex-col gap-4 z-20">
                <button
                    onClick={handlePrev}
                    disabled={isFirst}
                    className="w-12 h-12 bg-[#272727] hover:bg-[#3f3f3f] disabled:opacity-30 disabled:hover:bg-[#272727] disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all shadow-lg text-white"
                >
                    <ChevronUp className="w-7 h-7" />
                </button>

                <button
                    onClick={handleNext}
                    disabled={isLast && !isFetching}
                    className="w-12 h-12 bg-[#272727] hover:bg-[#3f3f3f] disabled:opacity-30 disabled:hover:bg-[#272727] disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all shadow-lg text-white"
                >
                    <ChevronDown className="w-7 h-7" />
                </button>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}