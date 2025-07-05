import type React from "react";
import type { Clip } from "../../../shared/domain/clip";
import { ClipCardPresenter } from "../presenters";

export type ClipCardProps = {
  clip: Clip;
};

export const ClipCard: React.FC<ClipCardProps> = (props) => {
  // This is a simple pass-through container since there's no logic needed
  return <ClipCardPresenter {...props} />;
};
