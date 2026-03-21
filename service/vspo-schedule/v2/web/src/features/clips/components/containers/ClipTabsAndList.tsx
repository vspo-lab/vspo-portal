"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Clip, Pagination } from "../../../shared/domain/clip";
import { ClipTabsAndListPresenter, type TabOption } from "../presenters";

type ClipTabsAndListProps = {
  clips: Clip[];
  pagination: Pagination;
  initialOrderKey: string;
};

export const ClipTabsAndList: React.FC<ClipTabsAndListProps> = ({
  clips,
  pagination,
  initialOrderKey,
}) => {
  const sortOptions: TabOption[] = [
    { value: "new", label: "New" },
    { value: "popular", label: "Popular" },
  ];

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Track the actual UI page locally to ensure proper highlighting
  const [activeUIPage, setActiveUIPage] = useState(1);

  // Update the local UI page when pagination changes from the server
  useEffect(() => {
    // For pages 0 and 1, we show page 1 in the UI
    setActiveUIPage(
      pagination.currentPage < 1 ? 1 : pagination.currentPage + 1,
    );
  }, [pagination.currentPage]);

  // Determine the initial tab index based on the current sort parameters
  const getInitialTabIndex = () => {
    if (initialOrderKey === "viewCount") {
      return 1; // Popular tab
    }
    return 0; // New tab (default)
  };

  const [selectedTabIndex, setSelectedTabIndex] = useState(
    getInitialTabIndex(),
  );

  const handleTabChange = (newValue: number) => {
    setSelectedTabIndex(newValue);

    let newOrderKey = "publishedAt"; // Default for New tab

    if (newValue === 1) {
      // Popular tab
      newOrderKey = "viewCount";
    }

    // Update the URL with the new sort option while keeping other query params
    const params = new URLSearchParams(searchParams.toString());
    params.set("orderKey", newOrderKey);
    params.set("page", "0"); // Reset to first page (0-indexed) when changing sort
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    // Set the UI page immediately for responsive UX
    setActiveUIPage(page + 1);

    // Update the URL with the new page number while keeping other query params
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page)); // The API page (0-indexed)
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <ClipTabsAndListPresenter
      tabOptions={sortOptions}
      selectedTabIndex={selectedTabIndex}
      onTabChange={handleTabChange}
      clips={clips}
      pagination={{
        ...pagination,
        // Override currentPage to ensure proper UI display
        currentPage: activeUIPage - 1,
      }}
      onPageChange={handlePageChange}
      isMobile={isMobile}
    />
  );
};
