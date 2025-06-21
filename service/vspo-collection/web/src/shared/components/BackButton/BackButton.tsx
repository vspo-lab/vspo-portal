"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "../../utils/cn";

export interface BackButtonProps {
  className?: string;
  label?: string;
  onClick?: () => void;
  variant?: "default" | "minimal" | "ghost";
  showIcon?: boolean;
  disabled?: boolean;
}

export const BackButton = ({
  className,
  label = "戻る",
  onClick,
  variant = "default",
  showIcon = true,
  disabled = false,
}: BackButtonProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (disabled) return;

    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  const baseClasses = cn(
    "inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    {
      "px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300":
        variant === "default",
      "px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100":
        variant === "minimal",
      "px-2 py-1 text-gray-600 hover:text-gray-800": variant === "ghost",
    },
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(baseClasses, className)}
      disabled={disabled}
      aria-label={`${label} - 前のページに戻る`}
    >
      {showIcon && <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
      {label}
    </button>
  );
};
