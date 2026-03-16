import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface IconProps extends ComponentProps<"svg"> {
    filled?: boolean;
}

export const UVideosIcon = ({ className, filled, ...props }: IconProps) => {
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
            <g clipPath="url(#clip0_153_478)">
                <path
                    d="M10 8L16 12L10 16V8ZM21 3V21H3V3H21ZM20 4H4V20H20V4Z"
                    fill="#EEEEEE"
                    stroke="#EEEEEE"
                    strokeWidth={filled ? "0" : "1"}
                />
            </g>
            <defs>
                <clipPath id="clip0_153_478">
                    <rect width="24" height="24" fill="white"/>
                </clipPath>
            </defs>
        </svg>

    );
};