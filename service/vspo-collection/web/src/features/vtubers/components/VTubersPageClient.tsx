"use client";

import { useMemo, useState } from "react";
import type { Creator, MemberType } from "../../../common/types/creator";
import { VTubersPagePresenter } from "../pages/VTubersPage/presenter";

interface VTubersPageClientProps {
  initialVTubers: Creator[];
}

const memberTypeOptions: { value: MemberType | "all"; label: string }[] = [
  { value: "all", label: "全員" },
  { value: "vspo_jp", label: "VSPO! JP" },
  { value: "vspo_en", label: "VSPO! EN" },
  { value: "vspo_ch", label: "VSPO! CH" },
  { value: "vspo_all", label: "VSPO! ALL" },
  { value: "general", label: "その他" },
];

export const VTubersPageClient = ({
  initialVTubers,
}: VTubersPageClientProps) => {
  const [selectedMemberType, setSelectedMemberType] = useState<
    MemberType | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "subscribers" | "clips" | "joined"
  >("name");

  // Filter and sort VTubers
  const filteredAndSortedVTubers = useMemo(() => {
    let filtered = initialVTubers;

    // Filter by member type
    if (selectedMemberType !== "all") {
      filtered = filtered.filter(
        (vtuber) => vtuber.memberType === selectedMemberType,
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (vtuber) =>
          vtuber.name.toLowerCase().includes(query) ||
          vtuber.description?.toLowerCase().includes(query) ||
          vtuber.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "subscribers": {
          const aSubscribers =
            a.platformLinks.find((link) => link.subscriberCount)
              ?.subscriberCount || 0;
          const bSubscribers =
            b.platformLinks.find((link) => link.subscriberCount)
              ?.subscriberCount || 0;
          return bSubscribers - aSubscribers;
        }
        case "clips":
          return (b.stats?.totalClips || 0) - (a.stats?.totalClips || 0);
        case "joined":
          return (
            new Date(b.joinedDate || "").getTime() -
            new Date(a.joinedDate || "").getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [initialVTubers, selectedMemberType, searchQuery, sortBy]);

  // Event handlers
  const handleMemberTypeChange = (memberType: MemberType | "all") => {
    setSelectedMemberType(memberType);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (sort: typeof sortBy) => {
    setSortBy(sort);
  };

  const handleVTuberClick = (vtuber: Creator) => {
    // Future implementation: navigate to individual VTuber page
    alert(`${vtuber.name}のページに移動します（未実装）`);
  };

  const handlePlatformClick = (vtuber: Creator, platform: string) => {
    const link = vtuber.platformLinks.find((p) => p.platform === platform);
    if (link) {
      window.open(link.url, "_blank");
    }
  };

  const handleFavoriteToggle = (vtuber: Creator) => {
    // Future implementation: toggle favorite status
    alert(`${vtuber.name}をお気に入りに追加しました！`);
  };

  return (
    <VTubersPagePresenter
      vtubers={filteredAndSortedVTubers}
      memberTypeOptions={memberTypeOptions}
      selectedMemberType={selectedMemberType}
      searchQuery={searchQuery}
      sortBy={sortBy}
      onMemberTypeChange={handleMemberTypeChange}
      onSearchChange={handleSearchChange}
      onSortChange={handleSortChange}
      onVTuberClick={handleVTuberClick}
      onPlatformClick={handlePlatformClick}
      onFavoriteToggle={handleFavoriteToggle}
    />
  );
};
