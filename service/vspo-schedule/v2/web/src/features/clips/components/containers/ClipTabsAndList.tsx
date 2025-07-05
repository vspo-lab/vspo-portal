import { useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useState } from "react";
import type { Clip, Pagination } from "../../../shared/domain/clip";
import { ClipTabsAndListPresenter, type TabOption } from "../presenters";

export type ClipTabsAndListProps = {
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
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          orderKey: newOrderKey,
          page: 0, // Reset to first page (0-indexed) when changing sort
        },
      },
      undefined,
    );
  };

  const handlePageChange = (page: number) => {
    // Set the UI page immediately for responsive UX
    setActiveUIPage(page + 1);

    // Update the URL with the new page number while keeping other query params
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          page, // The API page (0-indexed)
        },
      },
      undefined,
    );
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
