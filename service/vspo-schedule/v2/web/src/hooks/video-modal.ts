import { useContext } from "react";
import { VideoModalContext } from "@/context/VideoModalContext";

export const useVideoModalContext = () => {
  const context = useContext(VideoModalContext);

  if (context === undefined) {
    throw new Error("Cannot access VideoModalContext outside of its provider");
  }
  return context;
};
