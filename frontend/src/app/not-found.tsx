"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MonitorOff, Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-56px)] w-full bg-[#0F0F0F] flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-[#3ea6ff]/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center text-center z-10"
            >
                <motion.div
                    animate={{
                        y: [0, -15, 0],
                        rotate: [0, -3, 3, 0]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="mb-8 relative"
                >
                    <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full scale-150" />
                    <MonitorOff className="w-28 h-28 md:w-36 md:h-36 text-[#ff0000] relative z-10 drop-shadow-[0_0_15px_rgba(255,0,0,0.4)]" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.5 }}
                    className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-2"
                >
                    4<span className="text-[#3ea6ff]">0</span>4
                </motion.h1>

                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-2xl md:text-3xl font-bold text-[#EEEEEE] mb-4"
                >
                    This page isn't available.
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-[#AAAAAA] max-w-[450px] mb-10 text-sm md:text-base leading-relaxed"
                >
                    Sorry about that. The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                >
                    <Link href="/" className="w-full sm:w-auto">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button className="w-full bg-[#EEEEEE] text-[#0F0F0F] hover:bg-white font-bold rounded-full px-8 h-12 text-[15px] transition-colors">
                                <Home className="w-5 h-5 mr-2" />
                                Go to Home
                            </Button>
                        </motion.div>
                    </Link>

                    <Link href="/explore" className="w-full sm:w-auto">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" className="w-full bg-[#272727] border-none text-white hover:bg-[#3F3F3F] font-bold rounded-full px-8 h-12 text-[15px] transition-colors">
                                <Compass className="w-5 h-5 mr-2" />
                                Explore Videos
                            </Button>
                        </motion.div>
                    </Link>
                </motion.div>

            </motion.div>
        </div>
    );
}