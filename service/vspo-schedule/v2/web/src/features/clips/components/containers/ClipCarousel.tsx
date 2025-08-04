import type React from "react";
import type { Clip } from "@/features/shared/domain";
import { ClipCarouselPresenter } from "../presenters/ClipCarouselPresenter";

export type ClipCarouselProps = {
  clips: Clip[];
};

export const ClipCarousel: React.FC<ClipCarouselProps> = ({ clips }) => {
  return <ClipCarouselPresenter clips={clips} />;
};
