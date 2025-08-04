import dynamic from "next/dynamic";
import { createContext, useCallback, useState } from "react";
import type { Clip } from "@/features/shared/domain";
import type { Video } from "@/features/shared/domain/video";

const VideoModal = dynamic(
  () =>
    import("../features/shared/components/Elements").then(
      (mod) => mod.VideoModal,
    ),
  { ssr: false },
);

type ContextProps = {
  activeVideo: Video | Clip | undefined;
  pushVideo: (video: Video | Clip) => void;
  popVideo: () => void;
  clearVideos: () => void;
};

export const VideoModalContext = createContext<ContextProps | undefined>(
  undefined,
);

export const VideoModalContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [history, setHistory] = useState<(Video | Clip)[]>([]);

  const pushVideo = useCallback((video: Video | Clip) => {
    setHistory((history) => [...history, video]);
  }, []);
  const popVideo = useCallback(() => {
    setHistory((history) => history.slice(0, -1));
  }, []);
  const clearVideos = useCallback(() => {
    setHistory([]);
  }, []);

  const activeVideo = history.at(-1);

  return (
    <VideoModalContext.Provider
      value={{
        activeVideo,
        pushVideo,
        popVideo,
        clearVideos,
      }}
    >
      <VideoModal />
      {children}
    </VideoModalContext.Provider>
  );
};
