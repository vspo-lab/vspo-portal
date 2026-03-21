"use client";

import { Livestream } from "@/features/shared/domain";
import React, { useCallback } from "react";
import { ChatCellPresenter } from "../presenters";

export type ChatCellProps = {
  stream: Livestream;
  onRemove: () => void;
  index: number;
};

/**
 * Container component that wraps ChatCellPresenter for use in the multiview grid.
 * Handles removal callback memoization.
 */
const ChatCellComponent: React.FC<ChatCellProps> = ({
  stream,
  onRemove,
  index: _index,
}) => {
  const handleRemove = useCallback(() => {
    onRemove();
  }, [onRemove]);

  return <ChatCellPresenter stream={stream} onRemove={handleRemove} />;
};

ChatCellComponent.displayName = "ChatCell";

export const ChatCell = React.memo(ChatCellComponent);
