import { Livestream } from "@/features/shared/domain";
import React, {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  VideoPlayerRef,
  usePlaybackContext,
} from "../../context/PlaybackContext";
import { VideoPlayerPresenter } from "../presenters";

export type VideoPlayerProps = {
  stream: Livestream;
  onRemove: () => void;
  index: number;
};

const VideoPlayerComponent = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ stream, onRemove, index }, ref) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(index !== 0); // Only first video is unmuted by default
    const [volume, setVolume] = useState<number>(index === 0 ? 0.7 : 0.3);
    const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { registerPlayer, unregisterPlayer } = usePlaybackContext();

    // Fullscreen control
    const toggleFullscreen = useCallback(() => {
      if (iframeRef.current) {
        if (!document.fullscreenElement) {
          iframeRef.current.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    }, []);

    // YouTube Player API control
    const postMessageToPlayer = useCallback(
      (command: string, args?: unknown) => {
        if (!isPlayerReady && command !== "pauseVideo") {
          return;
        }

        if (iframeRef.current && iframeRef.current.contentWindow) {
          const message = {
            event: "command",
            func: command,
            args: args || [],
          };

          // YouTube iframe API
          if (stream.platform === "youtube") {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify(message),
              "*", // YouTube accepts any origin
            );
          }
          // Twitch iframe API - Try different message formats
          else if (stream.platform === "twitch") {
            // Try Twitch Player API format
            const twitchMessage = {
              namespace: "twitch-everywhere",
              eventName: "",
              params: {} as Record<string, unknown>,
            };

            if (command === "playVideo") {
              twitchMessage.eventName = "play";
            } else if (command === "pauseVideo") {
              twitchMessage.eventName = "pause";
            } else if (command === "mute") {
              twitchMessage.eventName = "mute";
            } else if (command === "unmute") {
              twitchMessage.eventName = "unmute";
            } else if (command === "setVolume") {
              const volumeValue = Array.isArray(args)
                ? (args[0] as number) / 100
                : 0;
              twitchMessage.eventName = "volume";
              twitchMessage.params = { volume: volumeValue };
            }

            if (twitchMessage.eventName) {
              iframeRef.current.contentWindow.postMessage(twitchMessage, "*");
            }
          }
        }
      },
      [stream.platform, isPlayerReady, stream.id],
    );

    // Create player interface
    useImperativeHandle(
      ref,
      () => ({
        play: () => postMessageToPlayer("playVideo"),
        pause: () => postMessageToPlayer("pauseVideo"),
        setVolume: (newVolume: number) => {
          setVolume(newVolume);
          postMessageToPlayer("setVolume", [newVolume * 100]);
        },
        mute: () => {
          setIsMuted(true);
          postMessageToPlayer("mute");
        },
        unmute: () => {
          setIsMuted(false);
          postMessageToPlayer("unmute");
        },
        getState: () => ({ isMuted, volume }),
        toggleFullscreen,
      }),
      [postMessageToPlayer, toggleFullscreen, isMuted, volume],
    );

    // Create player ref
    const playerRef = useRef<VideoPlayerRef>({
      play: () => postMessageToPlayer("playVideo"),
      pause: () => postMessageToPlayer("pauseVideo"),
      setVolume: (newVolume: number) => {
        setVolume(newVolume);
        postMessageToPlayer("setVolume", [newVolume * 100]);
      },
      mute: () => {
        setIsMuted(true);
        postMessageToPlayer("mute");
      },
      unmute: () => {
        setIsMuted(false);
        postMessageToPlayer("unmute");
      },
      getState: () => ({ isMuted, volume }),
      toggleFullscreen,
    });

    // Update player ref when functions change
    useEffect(() => {
      playerRef.current = {
        play: () => postMessageToPlayer("playVideo"),
        pause: () => postMessageToPlayer("pauseVideo"),
        setVolume: (newVolume: number) => {
          setVolume(newVolume);
          postMessageToPlayer("setVolume", [newVolume * 100]);
        },
        mute: () => {
          setIsMuted(true);
          postMessageToPlayer("mute");
        },
        unmute: () => {
          setIsMuted(false);
          postMessageToPlayer("unmute");
        },
        getState: () => ({ isMuted, volume }),
        toggleFullscreen,
      };
    }, [postMessageToPlayer, toggleFullscreen, isMuted, volume]);

    // Register player with context - re-register when playerRef changes
    useEffect(() => {
      registerPlayer(stream.id, playerRef.current);
      return () => {
        unregisterPlayer(stream.id);
      };
    }, [stream.id, registerPlayer, unregisterPlayer, playerRef.current]);

    useEffect(() => {
      setIsLoading(true);
      setHasError(false);
    }, [stream.id]);

    const handlePlayerReady = useCallback(() => {
      setIsLoading(false);

      // Initialize player state after iframe loads
      // Wait a bit for iframe to be fully ready
      setTimeout(() => {
        setIsPlayerReady(true);

        if (iframeRef.current) {
          // Set initial volume
          postMessageToPlayer("setVolume", [volume * 100]);

          // Set initial mute state
          if (isMuted) {
            postMessageToPlayer("mute");
          }

          // Don't autoplay - require user interaction
          postMessageToPlayer("pauseVideo");
        }
      }, 1500);
    }, [postMessageToPlayer, volume, isMuted]);

    const handlePlayerError = useCallback(() => {
      setIsLoading(false);
      setHasError(true);
    }, []);

    const handleRemove = useCallback(() => {
      onRemove();
    }, [onRemove]);

    // Handle iframe ref
    const handleIframeRef = useCallback((element: HTMLIFrameElement | null) => {
      if (element) {
        iframeRef.current = element;
      }
    }, []);

    return (
      <VideoPlayerPresenter
        ref={handleIframeRef}
        stream={stream}
        isLoading={isLoading}
        hasError={hasError}
        onRemove={handleRemove}
        onPlayerReady={handlePlayerReady}
        onPlayerError={handlePlayerError}
        autoplay={false}
        muted={isMuted}
      />
    );
  },
);

VideoPlayerComponent.displayName = "VideoPlayer";

export const VideoPlayer = VideoPlayerComponent;
