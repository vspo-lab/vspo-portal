"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { cn } from "../../utils/cn";

export interface PreviewContent {
  title: string;
  description?: string;
  thumbnail?: string;
  metadata?: {
    views?: string;
    duration?: string;
    creator?: string;
    date?: string;
  };
}

export interface LinkPreviewProps {
  href: string;
  children: React.ReactNode;
  preview?: PreviewContent;
  className?: string;
  previewClassName?: string;
  disabled?: boolean;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export const LinkPreview = ({
  href,
  children,
  preview,
  className,
  previewClassName,
  disabled = false,
  placement = "top",
  delay = 300,
}: LinkPreviewProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const showPreview = useCallback(() => {
    if (disabled || !preview) return;

    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    setTimeoutId(id);
  }, [disabled, preview, delay]);

  const hidePreview = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  }, [timeoutId]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      if (event.key === " ") {
        event.preventDefault();
      }
      // Let Next.js Link handle the navigation
    }
  };

  const placementClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-block">
      <Link
        ref={linkRef}
        href={href}
        className={cn(
          "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm",
          className,
        )}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onKeyDown={handleKeyDown}
        onFocus={showPreview}
        onBlur={hidePreview}
      >
        {children}
      </Link>

      {/* Preview Tooltip */}
      {isVisible && preview && (
        <div
          className={cn(
            "absolute z-50 w-80 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4",
            "transform transition-all duration-200 ease-out",
            "opacity-100 scale-100",
            placementClasses[placement],
            previewClassName,
          )}
          role="tooltip"
          aria-hidden="true"
        >
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-3 h-3 bg-white border-gray-200 transform rotate-45",
              {
                "top-full left-1/2 -translate-x-1/2 -mt-1.5 border-b border-r":
                  placement === "top",
                "bottom-full left-1/2 -translate-x-1/2 -mb-1.5 border-t border-l":
                  placement === "bottom",
                "top-1/2 left-full -translate-y-1/2 -ml-1.5 border-b border-l":
                  placement === "left",
                "top-1/2 right-full -translate-y-1/2 -mr-1.5 border-t border-r":
                  placement === "right",
              },
            )}
          />

          {/* Thumbnail */}
          {preview.thumbnail && (
            <div className="mb-3">
              <img
                src={preview.thumbnail}
                alt={preview.title}
                className="w-full h-32 object-cover rounded-md"
                loading="lazy"
              />
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
            {preview.title}
          </h3>

          {/* Description */}
          {preview.description && (
            <p className="text-gray-600 text-xs mb-3 line-clamp-3">
              {preview.description}
            </p>
          )}

          {/* Metadata */}
          {preview.metadata && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {preview.metadata.views && (
                <span className="flex items-center">
                  📊 {preview.metadata.views}
                </span>
              )}
              {preview.metadata.duration && (
                <span className="flex items-center">
                  ⏱️ {preview.metadata.duration}
                </span>
              )}
              {preview.metadata.creator && (
                <span className="flex items-center">
                  👤 {preview.metadata.creator}
                </span>
              )}
              {preview.metadata.date && (
                <span className="flex items-center">
                  📅 {preview.metadata.date}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
