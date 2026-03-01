import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface IconProps extends ComponentProps<"svg"> {
    filled?: boolean;
}

export const SubsIcon = ({ className, filled, ...props }: IconProps) => {
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
                d="M10 18V12L15 15L10 18ZM17 3H7V4H17V3ZM20 6H4V7H20V6ZM22 9H2V21H22V9ZM3 10H21V20H3V10Z"
                fill="white"
                stroke="currentColor"
                strokeWidth={filled ? "0" : "1.5"}
            />
        </svg>
    );
};