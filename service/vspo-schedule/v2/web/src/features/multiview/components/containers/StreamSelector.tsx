import { Livestream } from "@/features/shared/domain";
import React, { useState, useMemo } from "react";
import { StreamSelectorPresenter } from "../presenters";

export type StreamSelectorProps = {
  livestreams: Livestream[];
  selectedStreams: Livestream[];
  onStreamSelection: (stream: Livestream) => void;
};

export const StreamSelector: React.FC<StreamSelectorProps> = ({
  livestreams,
  selectedStreams,
  onStreamSelection,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "upcoming">(
    "all",
  );

  const filteredStreams = useMemo(() => {
    return livestreams.filter((stream) => {
      // Filter by status
      if (statusFilter === "live" && stream.status !== "live") return false;
      if (statusFilter === "upcoming" && stream.status !== "upcoming")
        return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          stream.title.toLowerCase().includes(query) ||
          stream.channelTitle.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [livestreams, searchQuery, statusFilter]);

  const handleStreamClick = (stream: Livestream) => {
    onStreamSelection(stream);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilterChange = (status: "all" | "live" | "upcoming") => {
    setStatusFilter(status);
  };

  return (
    <StreamSelectorPresenter
      filteredStreams={filteredStreams}
      selectedStreams={selectedStreams}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      onStreamClick={handleStreamClick}
      onSearchChange={handleSearchChange}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
};
