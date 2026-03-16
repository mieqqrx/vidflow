"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Search as SearchIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetSearchSuggestionsQuery } from "@/store/api";

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Дебаунс: ждем 300мс после последнего нажатия клавиши, прежде чем менять debouncedQuery
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Запрашиваем подсказки, только если длина запроса >= 2
    const { data: suggestions, isFetching } = useGetSearchSuggestionsQuery(debouncedQuery, {
        skip: debouncedQuery.length < 2,
    });

    const handleSearch = (e?: React.FormEvent, searchVal?: string) => {
        e?.preventDefault();
        const finalQuery = searchVal || query;
        if (finalQuery.trim()) {
            setIsFocused(false);
            router.push(`/search?q=${encodeURIComponent(finalQuery.trim())}`);
        }
    };

    // Закрываем выпадашку при клике вне нее
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full max-w-[600px] hidden md:flex flex-col z-50" ref={dropdownRef}>
            <form onSubmit={handleSearch} className="flex items-center w-full">
                <div className={`flex items-center w-full h-10 border bg-[#121212] rounded-l-full px-4 transition-colors ${isFocused ? 'border-[#1c62b9] ml-0' : 'border-[#3F3F3F]'}`}>
                    {isFocused && <Search className="w-4 h-4 text-white mr-3 shrink-0" />}

                    <input
                        type="text"
                        placeholder="Search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        className="w-full bg-transparent outline-none text-white text-[16px] font-normal placeholder-[#AAAAAA]"
                    />

                    {query && (
                        <button type="button" onClick={() => setQuery("")} className="p-1 hover:bg-[#272727] rounded-full shrink-0">
                            <X className="w-5 h-5 text-[#AAAAAA]" />
                        </button>
                    )}
                </div>

                <button
                    type="submit"
                    className="h-10 w-16 bg-[#222222] border border-l-0 border-[#3F3F3F] rounded-r-full flex items-center justify-center hover:bg-[#303030] transition-colors cursor-pointer shrink-0"
                >
                    <SearchIcon className="w-5 h-5 text-white font-thin" />
                </button>
            </form>

            {/* Выпадающий список подсказок */}
            {isFocused && query.length >= 2 && suggestions && suggestions.length > 0 && (
                <div className="absolute top-12 left-0 right-16 bg-[#212121] rounded-xl border border-[#3F3F3F] shadow-2xl py-3 z-50 flex flex-col">
                    {suggestions.map((suggestion, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                setQuery(suggestion);
                                handleSearch(undefined, suggestion);
                            }}
                            className="flex items-center w-full px-4 py-1.5 hover:bg-[#3F3F3F] text-left transition-colors cursor-pointer"
                        >
                            <Search className="w-4 h-4 text-[#AAAAAA] mr-4 shrink-0" />
                            <span className="text-white font-medium text-[15px] truncate">{suggestion}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}