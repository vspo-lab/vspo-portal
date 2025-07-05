import type { Clip } from "@/features/shared/domain";
import type React from "react";
import { ClipSectionPresenter } from "../presenters/ClipSectionPresenter";

export type ClipSectionProps = {
  title: string;
  clips: Clip[];
  type?: "youtube" | "shorts" | "twitch";
  onViewMore?: () => void;
  singleRow?: boolean;
};

export const ClipSection: React.FC<ClipSectionProps> = ({
  title,
  clips,
  type = "youtube",
  onViewMore,
  singleRow,
}) => {
  return (
    <ClipSectionPresenter
      title={title}
      clips={clips}
      type={type}
      onViewMore={onViewMore}
      singleRow={singleRow}
    />
  );
};
