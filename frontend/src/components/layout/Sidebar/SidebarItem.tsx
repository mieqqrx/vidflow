"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ElementType } from "react";
import Link from "next/link";

interface MenuItemProps {
    icon: ElementType;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
    href?: string;
}

export function SidebarItem({ icon: Icon, label, isActive, onClick, href }: MenuItemProps) {
    const buttonContent = (
        <Button
            variant="ghost"
            onClick={onClick}
            className={cn(
                "w-full cursor-pointer justify-start gap-6 px-3 rounded-xl h-12 font-normal transition-colors",
                isActive
                    ? "bg-[#303030] text-white hover:bg-[#303030]"
                    : "text-white hover:bg-[#272727]"
            )}
        >
            <Icon
                className={cn(
                    "!h-6 !w-6 shrink-0 transition-colors",
                    isActive ? "text-white fill-current stroke-[2.5]" : "text-white"
                )}
            />

            <span className={cn(
                "text-[15px] overflow-hidden text-ellipsis whitespace-nowrap",
                isActive ? "font-medium" : "font-normal"
            )}>
                {label}
            </span>
        </Button>
    );

    if (href) {
        return (
            <Link href={href} className="block w-full">
                {buttonContent}
            </Link>
        );
    }

    return buttonContent;
}