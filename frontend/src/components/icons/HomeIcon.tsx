import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface IconProps extends ComponentProps<"svg"> {
    filled?: boolean;
}

export const HomeIcon = ({ className, filled, ...props }: IconProps) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("w-6 h-6", className)}
            {...props}
        >
            <g clipPath="url(#clip0_153_400)">
                <path
                    d="M4 10V21H10V15H14V21H20V10L12 3L4 10Z"
                    fill="white"
                    stroke="currentColor"
                    strokeWidth={filled ? "0" : "1.5"}
                />
            </g>
            <defs>
                <clipPath id="clip0_153_400">
                    <rect width="24" height="24" fill="white"/>
                </clipPath>
            </defs>
        </svg>
    );
};