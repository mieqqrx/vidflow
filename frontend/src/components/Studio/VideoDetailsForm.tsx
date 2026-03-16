"use client";

import React, { useState, useEffect, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    ImagePlus, Copy, Check, AlertCircle, PlaySquare,
    ChevronDown, Globe, Link as LinkIcon, Lock, X
} from "lucide-react";
import { Video } from "@/types";
import { Button } from "@/components/ui/button";

function formatTimeWithMs(seconds: number) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

const detailsSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
    description: z.string().max(5000, "Description is too long").optional(),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

export interface VideoDetailsUpdatePayload {
    title: string;
    description?: string;
    visibility: number;
    customThumbnail?: File;
    tags?: string[]; // <-- Добавили поле для тегов
}

interface VideoDetailsFormProps {
    video: Video;
    onSave: (data: VideoDetailsUpdatePayload) => void;
    isSaving: boolean;
}

const VISIBILITY_OPTIONS = [
    { value: 0, label: "Public", icon: Globe, desc: "Everyone can watch your video" },
    { value: 1, label: "Unlisted", icon: LinkIcon, desc: "Anyone with the video link can watch" },
    { value: 2, label: "Private", icon: Lock, desc: "Only you can watch your video" },
];

export default function VideoDetailsForm({ video, onSave, isSaving }: VideoDetailsFormProps) {
    const [customThumbnailUrl, setCustomThumbnailUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const [visibility, setVisibility] = useState<number>(video.visibility ?? 0);
    const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);

    // === СТЕЙТЫ ДЛЯ ТЕГОВ ===
    const [tags, setTags] = useState<string[]>(video.tags || []);
    const [tagInput, setTagInput] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<DetailsFormValues>({
        resolver: zodResolver(detailsSchema),
        defaultValues: {
            title: video.title || "",
            description: video.description || "",
        },
    });

    const titleValue = watch("title") || "";
    const descriptionValue = watch("description") || "";

    useEffect(() => {
        return () => {
            if (customThumbnailUrl) URL.revokeObjectURL(customThumbnailUrl);
        };
    }, [customThumbnailUrl]);

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setCustomThumbnailUrl(URL.createObjectURL(file));
        }
    };

    // === ОБРАБОТЧИКИ ТЕГОВ ===
    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Добавляем тег по нажатию Enter или запятой
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault(); // Важно: предотвращаем сабмит всей формы по Enter
            const newTag = tagInput.trim().replace(/^#/, ''); // Убираем пробелы и хэштег, если юзер его написал

            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput("");
        }
        // Удаляем последний тег по Backspace, если инпут пустой
        else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (indexToRemove: number) => {
        setTags(tags.filter((_, index) => index !== indexToRemove));
    };

    const onSubmit = (data: DetailsFormValues) => {
        onSave({
            title: data.title,
            description: data.description,
            visibility: visibility,
            customThumbnail: selectedFile || undefined,
            tags: tags, // <-- Передаем теги в родительский компонент
        });
    };

    const handleCopyLink = async () => {
        const link = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/watch/${video.id}`;
        await navigator.clipboard.writeText(link);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const videoLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/watch/${video.id}`;

    const selectedVisibilityOption = VISIBILITY_OPTIONS.find(opt => opt.value === visibility) || VISIBILITY_OPTIONS[0];

    return (
        <form id="video-details-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col xl:flex-row gap-8 w-full">
            <div className="flex-1 flex flex-col gap-8 w-full">

                {/* --- TITLE --- */}
                <div>
                    <div className={`relative border rounded-lg p-3 pt-5 transition-all duration-200 bg-[#0f0f0f] group focus-within:bg-[#121212] ${
                        errors.title ? 'border-red-500' : 'border-[#333] focus-within:border-[#3ea6ff] hover:border-[#555]'
                    }`}>
                        <label className={`absolute top-2 left-3 text-[12px] font-medium transition-colors ${
                            errors.title ? 'text-red-500' : 'text-[#aaaaaa] group-focus-within:text-[#3ea6ff]'
                        }`}>
                            Title (required)
                        </label>

                        <input
                            {...register("title")}
                            className="w-full bg-transparent text-[15px] text-white outline-none mt-1 placeholder:text-[#555]"
                            placeholder="Add a title that describes your video"
                        />
                    </div>

                    <div className="flex justify-between mt-1.5 px-1">
                        <span className="text-[12px] text-red-500 flex items-center gap-1">
                            {errors.title && <AlertCircle className="w-3.5 h-3.5" />}
                            {errors.title?.message}
                        </span>
                        <span className="text-[12px] text-[#aaaaaa] ml-auto font-mono">{titleValue.length}/100</span>
                    </div>
                </div>

                {/* --- DESCRIPTION --- */}
                <div>
                    <div className={`relative border rounded-lg p-3 pt-5 transition-all duration-200 bg-[#0f0f0f] group focus-within:bg-[#121212] ${
                        errors.description ? 'border-red-500' : 'border-[#333] focus-within:border-[#3ea6ff] hover:border-[#555]'
                    }`}>
                        <label className={`absolute top-2 left-3 text-[12px] font-medium transition-colors ${
                            errors.description ? 'text-red-500' : 'text-[#aaaaaa] group-focus-within:text-[#3ea6ff]'
                        }`}>
                            Description
                        </label>

                        <textarea
                            {...register("description")}
                            className="w-full bg-transparent text-[15px] text-white outline-none resize-none min-h-[160px] mt-1 placeholder:text-[#555] leading-relaxed"
                            placeholder="Tell viewers about your video"
                        />
                    </div>

                    <div className="flex justify-between mt-1.5 px-1">
                        <span className="text-[12px] text-red-500 flex items-center gap-1">
                            {errors.description && <AlertCircle className="w-3.5 h-3.5" />}
                            {errors.description?.message}
                        </span>
                        <span className="text-[12px] text-[#aaaaaa] ml-auto font-mono">{descriptionValue.length}/5000</span>
                    </div>
                </div>

                {/* --- TAGS (НОВЫЙ БЛОК) --- */}
                <div className="mt-2">
                    <h3 className="text-[16px] font-semibold text-white mb-1.5 flex items-center gap-2">
                        Tags
                    </h3>
                    <p className="text-[13px] text-[#aaaaaa] mb-4 max-w-2xl leading-relaxed">
                        Tags can be useful if content in your video is commonly misspelled. Otherwise, tags play a minimal role in helping viewers find your video.
                    </p>

                    <div className={`relative border rounded-lg p-3 transition-all duration-200 bg-[#0f0f0f] group focus-within:bg-[#121212] border-[#333] focus-within:border-[#3ea6ff] hover:border-[#555] min-h-[60px] flex flex-wrap gap-2 items-center`}>
                        {tags.map((tag, index) => (
                            <div key={index} className="flex items-center gap-1 bg-[#272727] text-[#aaaaaa] border border-[#3f3f3f] px-2.5 py-1 rounded-sm text-[13px]">
                                <span>{tag}</span>
                                <button
                                    type="button"
                                    onClick={() => removeTag(index)}
                                    className="hover:text-white transition-colors ml-1 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            className="flex-1 bg-transparent min-w-[150px] text-[15px] text-white outline-none placeholder:text-[#555]"
                            placeholder={tags.length === 0 ? "Add tags (press Enter or comma)" : ""}
                        />
                    </div>
                </div>

                {/* --- THUMBNAIL --- */}
                <div className="mt-2 border-t border-[#3F3F3F] pt-8">
                    <h3 className="text-[16px] font-semibold text-white mb-1.5 flex items-center gap-2">
                        <PlaySquare className="w-5 h-5 text-[#aaaaaa]" />
                        Thumbnail
                    </h3>

                    <p className="text-[13px] text-[#aaaaaa] mb-5 max-w-2xl leading-relaxed">
                        Select or upload a picture that shows what's in your video. A good thumbnail stands out and draws viewers' attention.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <label className="relative flex flex-col items-center justify-center w-[160px] h-[90px] border-2 border-dashed border-[#444] rounded-lg bg-[#121212] hover:bg-[#1f1f1f] hover:border-[#666] cursor-pointer transition-all duration-200 overflow-hidden group shadow-sm">
                            <input
                                type="file"
                                accept="image/jpeg, image/png, image/webp"
                                className="hidden"
                                onChange={handleThumbnailChange}
                            />

                            {customThumbnailUrl ? (
                                <>
                                    <img src={customThumbnailUrl} alt="Custom" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                                        <ImagePlus className="w-6 h-6 text-white transform group-hover:scale-110 transition-transform" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center transform group-hover:-translate-y-0.5 transition-transform">
                                    <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-2 group-hover:bg-[#333] transition-colors">
                                        <ImagePlus className="w-4 h-4 text-[#aaaaaa] group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="text-[12px] font-medium text-[#aaaaaa] group-hover:text-white transition-colors">Upload file</span>
                                </div>
                            )}
                        </label>

                        {!customThumbnailUrl && video.thumbnailUrl && (
                            <div className="relative w-[160px] h-[90px] rounded-lg overflow-hidden border-2 border-[#3ea6ff] shadow-[0_0_15px_rgba(62,166,255,0.15)] group">
                                <img src={video.thumbnailUrl} alt="Current" className="w-full h-full object-cover" />
                                <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-[#3ea6ff] rounded-full animate-pulse" />
                                    <span className="text-[10px] font-medium text-white uppercase tracking-wider">Current</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- ПРАВАЯ КОЛОНКА (ПРЕВЬЮ И ПРИВАТНОСТЬ) --- */}
            <div className="w-full xl:w-[380px] shrink-0">
                <div className="sticky top-28 flex flex-col gap-6">
                    {/* Video Preview Card */}
                    <div className="bg-[#0f0f0f] rounded-xl overflow-hidden border border-[#2e2e2e] shadow-xl">
                        <div className="w-full aspect-video bg-[#050505] relative group border-b border-[#2e2e2e]">
                            <img
                                src={customThumbnailUrl || video.thumbnailUrl || "/placeholder.jpg"}
                                alt="Preview"
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px] font-mono text-white">
                                {formatTimeWithMs(video.durationSeconds || 0).split('.')[0]}
                            </div>
                        </div>

                        <div className="p-5">
                            <div>
                                <p className="text-[12px] font-medium text-[#aaaaaa] mb-1.5">Video link</p>

                                <div className="flex justify-between items-start gap-3">
                                    <a
                                        href={videoLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[13px] text-[#3ea6ff] hover:text-[#6ebcff] hover:underline break-all leading-tight mt-1"
                                    >
                                        {videoLink}
                                    </a>

                                    <Button
                                        type="button"
                                        onClick={handleCopyLink}
                                        variant="ghost"
                                        className="shrink-0 w-9 h-9 p-0 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] rounded-md transition-all text-[#aaaaaa] hover:text-white cursor-pointer"
                                        title="Copy link"
                                    >
                                        {isCopied ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visibility Dropdown */}
                    <div className="bg-[#0f0f0f] rounded-xl border border-[#2e2e2e] shadow-xl p-5">
                        <p className="text-[14px] font-medium text-white mb-4">Visibility</p>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
                                className={`w-full flex items-center justify-between bg-[#121212] border ${isVisibilityOpen ? 'border-[#3ea6ff]' : 'border-[#333] hover:border-[#555]'} rounded-lg p-3 transition-all outline-none cursor-pointer`}
                            >
                                <div className="flex items-center gap-3">
                                    <selectedVisibilityOption.icon className="w-5 h-5 text-[#aaaaaa]" />
                                    <div className="flex flex-col items-start">
                                        <span className="text-[14px] text-white leading-none mb-1">{selectedVisibilityOption.label}</span>
                                        <span className="text-[12px] text-[#aaaaaa] leading-none text-left">{selectedVisibilityOption.desc}</span>
                                    </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-[#aaaaaa] transition-transform duration-200 ${isVisibilityOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isVisibilityOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsVisibilityOpen(false)} />

                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#212121] border border-[#3f3f3f] rounded-lg shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-100">
                                        {VISIBILITY_OPTIONS.map((opt) => {
                                            const isActive = visibility === opt.value;
                                            return (
                                                <div
                                                    key={opt.value}
                                                    onClick={() => {
                                                        setVisibility(opt.value);
                                                        setIsVisibilityOpen(false);
                                                    }}
                                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? 'bg-[#3f3f3f]/80' : 'hover:bg-[#3f3f3f]/50'}`}
                                                >
                                                    <opt.icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-white' : 'text-[#aaaaaa]'}`} />
                                                    <div className="flex flex-col">
                                                        <span className={`text-[14px] font-medium mb-1 ${isActive ? 'text-white' : 'text-[#f1f1f1]'}`}>
                                                            {opt.label}
                                                        </span>
                                                        <span className="text-[12px] text-[#aaaaaa] leading-snug">
                                                            {opt.desc}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <button type="submit" id="submit-details-form" className="hidden">Submit</button>
        </form>
    );
}