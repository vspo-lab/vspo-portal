"use client";

import { useCallback, useState } from "react";
import type {
  ClipType,
  ExtendedClip,
  Platform,
  SortBy,
} from "../../../lib/services/clips-service";
import { ClipsPagePresenter } from "../pages/ClipsPage/presenter";

export type ViewMode = "grid" | "list";

interface ClipsPageClientProps {
  initialClips: ExtendedClip[];
}

export const ClipsPageClient = ({ initialClips }: ClipsPageClientProps) => {
  // State
  const [allClips] = useState<ExtendedClip[]>(initialClips);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("all");
  const [selectedType, setSelectedType] = useState<ClipType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("views");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 12;

  // Filter and sort clips
  const filteredAndSortedClips = useCallback(() => {
    let filtered = [...allClips];

    // Filter by platform
    if (selectedPlatform !== "all") {
      filtered = filtered.filter((clip) => clip.platform === selectedPlatform);
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((clip) => clip.clipType === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (clip) =>
          clip.title.toLowerCase().includes(query) ||
          clip.vtuber.toLowerCase().includes(query) ||
          clip.clipper.toLowerCase().includes(query),
      );
    }

    // Sort
    switch (sortBy) {
      case "views":
        filtered.sort((a, b) => {
          const aViews = parseViewCount(a.views);
          const bViews = parseViewCount(b.views);
          return bViews - aViews;
        });
        break;
      case "recent":
        filtered.sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        );
        break;
      case "likes":
        filtered.sort((a, b) => b.likes - a.likes);
        break;
    }

    return filtered;
  }, [allClips, selectedPlatform, selectedType, searchQuery, sortBy]);

  // Parse view count string to number
  const parseViewCount = (views: string): number => {
    if (views.endsWith("M")) {
      return Number.parseFloat(views) * 1000000;
    }
    if (views.endsWith("K")) {
      return Number.parseFloat(views) * 1000;
    }
    return Number.parseInt(views);
  };

  // Get paginated clips
  const paginatedClips = useCallback(() => {
    const filtered = filteredAndSortedClips();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filteredAndSortedClips, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedClips().length / itemsPerPage);

  // Event handlers
  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: ClipType) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: SortBy) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleClipClick = (clip: ExtendedClip) => {
    alert(
      `Playing: ${clip.title}\n\nby ${clip.vtuber}\nClipped by: ${clip.clipper}`,
    );
  };

  const handleLike = (clip: ExtendedClip) => {
    alert(`Liked: ${clip.title}`);
  };

  const handleWatchParty = (clip: ExtendedClip) => {
    alert(`Joining watch party for: ${clip.title}`);
  };

  return (
    <ClipsPagePresenter
      // Data
      clips={paginatedClips()}
      totalClips={filteredAndSortedClips().length}
      currentPage={currentPage}
      totalPages={totalPages}
      isLoading={isLoading}
      // Filters
      selectedPlatform={selectedPlatform}
      selectedType={selectedType}
      sortBy={sortBy}
      viewMode={viewMode}
      searchQuery={searchQuery}
      // Handlers
      onPlatformChange={handlePlatformChange}
      onTypeChange={handleTypeChange}
      onSortChange={handleSortChange}
      onViewModeChange={handleViewModeChange}
      onSearch={handleSearch}
      onPageChange={handlePageChange}
      onClipClick={handleClipClick}
      onLike={handleLike}
      onWatchParty={handleWatchParty}
    />
  );
};
