import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface IconProps extends ComponentProps<"svg"> {
    filled?: boolean;
}

export const LibraryIcon = ({ className, filled, ...props }: IconProps) => {
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
            <path
                d="M11 7L17 10.5L11 14V7ZM18 20H4V6H3V21H18V20ZM21 18H6V3H21V18ZM7 17H20V4H7V17Z"
                fill="#EEEEEE"
                stroke="#EEEEEE"
                strokeWidth={filled ? "0" : "1"}
            />
        </svg>
    );
};