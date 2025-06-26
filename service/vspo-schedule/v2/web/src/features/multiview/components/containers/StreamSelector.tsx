import { Livestream } from "@/features/shared/domain";
import React, { useState, useMemo } from "react";
import { StreamSelectorPresenter } from "../presenters";

export type StreamSelectorProps = {
  streams: Livestream[];
  selectedStreams: Livestream[];
  onStreamSelect: (stream: Livestream) => void;
};

export const StreamSelector: React.FC<StreamSelectorProps> = ({
  streams,
  selectedStreams,
  onStreamSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "upcoming">(
    "all",
  );

  const filteredStreams = useMemo(() => {
    let filtered = streams;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((stream) => stream.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (stream) =>
          stream.title.toLowerCase().includes(query) ||
          stream.channelTitle.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [streams, statusFilter, searchQuery]);

  const handleStreamClick = (stream: Livestream) => {
    onStreamSelect(stream);
  };

  return (
    <StreamSelectorPresenter
      filteredStreams={filteredStreams}
      selectedStreams={selectedStreams}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      onStreamClick={handleStreamClick}
      onSearchChange={setSearchQuery}
      onStatusFilterChange={setStatusFilter}
    />
  );
};
