"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "../../utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  maxItems?: number;
}

export const Breadcrumbs = ({
  items,
  className,
  showHome = true,
  maxItems = 5,
}: BreadcrumbsProps) => {
  // Limit the number of items displayed
  const displayItems =
    items.length > maxItems
      ? [
          items[0], // Always show first item (usually home)
          { label: "...", isEllipsis: true },
          ...items.slice(-maxItems + 2), // Show last few items
        ]
      : items;

  const handleKeyDown = (event: React.KeyboardEvent, href?: string) => {
    if ((event.key === "Enter" || event.key === " ") && href) {
      event.preventDefault();
      window.location.href = href;
    }
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-1 text-sm text-gray-600 bg-gray-50/50 px-4 py-2 rounded-lg",
        className,
      )}
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight
                className="mx-1 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            )}

            {/* Handle ellipsis */}
            {(item as any).isEllipsis ? (
              <span className="text-gray-400 px-1">...</span>
            ) : item.href && !item.isActive ? (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center hover:text-blue-600 transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm px-1",
                  index === 0 && showHome && "flex items-center",
                )}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, item.href)}
                aria-label={
                  index === 0 && showHome
                    ? `${item.label} (ホーム)`
                    : item.label
                }
              >
                {index === 0 && showHome && (
                  <Home className="mr-1 h-4 w-4" aria-hidden="true" />
                )}
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "flex items-center",
                  item.isActive ? "text-gray-900 font-medium" : "text-gray-500",
                  index === 0 && showHome && "flex items-center",
                )}
                aria-current={item.isActive ? "page" : undefined}
              >
                {index === 0 && showHome && (
                  <Home className="mr-1 h-4 w-4" aria-hidden="true" />
                )}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
