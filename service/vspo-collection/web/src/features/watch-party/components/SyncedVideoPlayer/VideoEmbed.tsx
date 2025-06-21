import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { VideoEmbedProps } from "./types";

export const VideoEmbed = forwardRef<any, VideoEmbedProps>(
  ({ video, videoState, onStateChange, isHost }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const playerReadyRef = useRef(false);

    // Extract video ID from URL
    const getVideoId = (url: string, platform: string) => {
      switch (platform) {
        case "youtube": {
          const match = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
          );
          return match?.[1] || "";
        }
        case "twitch": {
          const match = url.match(/twitch\.tv\/videos\/(\d+)/);
          return match?.[1] || "";
        }
        default:
          return "";
      }
    };

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (playerRef.current) {
          switch (video.platform) {
            case "youtube":
              playerRef.current.seekTo(time, true);
              break;
            case "twitch":
              playerRef.current.seek(time);
              break;
          }
        }
      },
      getCurrentTime: () => {
        if (playerRef.current) {
          switch (video.platform) {
            case "youtube":
              return playerRef.current.getCurrentTime();
            case "twitch":
              return playerRef.current.getCurrentTime();
            default:
              return 0;
          }
        }
        return 0;
      },
    }));

    // YouTube Player
    useEffect(() => {
      if (video.platform !== "youtube") return;

      const videoId = getVideoId(video.url, "youtube");
      if (!videoId || !containerRef.current) return;

      // Load YouTube IFrame API
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const initPlayer = () => {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: videoState.isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: () => {
              playerReadyRef.current = true;
              playerRef.current.setVolume(videoState.volume * 100);
              if (videoState.currentTime > 0) {
                playerRef.current.seekTo(videoState.currentTime, true);
              }
            },
            onStateChange: (event: any) => {
              switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                  onStateChange({ isPlaying: true, isBuffering: false });
                  break;
                case window.YT.PlayerState.PAUSED:
                  onStateChange({ isPlaying: false });
                  break;
                case window.YT.PlayerState.BUFFERING:
                  onStateChange({ isBuffering: true });
                  break;
                case window.YT.PlayerState.ENDED:
                  onStateChange({ isPlaying: false });
                  break;
              }
            },
          },
        });
      };

      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        window.onYouTubeIframeAPIReady = initPlayer;
      }

      // Update time periodically
      const timeInterval = setInterval(() => {
        if (playerRef.current && playerReadyRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (currentTime !== undefined && duration !== undefined) {
            onStateChange({ currentTime, duration });
          }
        }
      }, 250);

      return () => {
        clearInterval(timeInterval);
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
        }
      };
    }, [video.platform, video.url]);

    // Twitch Player
    useEffect(() => {
      if (video.platform !== "twitch") return;

      const videoId = getVideoId(video.url, "twitch");
      if (!videoId || !containerRef.current) return;

      // Load Twitch Embed API
      if (!window.Twitch) {
        const script = document.createElement("script");
        script.src = "https://embed.twitch.tv/embed/v1.js";
        document.body.appendChild(script);
      }

      const initPlayer = () => {
        playerRef.current = new window.Twitch.Player(containerRef.current, {
          video: videoId,
          width: "100%",
          height: "100%",
          autoplay: videoState.isPlaying,
          muted: videoState.isMuted,
          controls: false,
        });

        playerRef.current.addEventListener(
          window.Twitch.Player.READY,
          () => {
            playerReadyRef.current = true;
            playerRef.current.setVolume(videoState.volume);
            if (videoState.currentTime > 0) {
              playerRef.current.seek(videoState.currentTime);
            }
          },
        );

        playerRef.current.addEventListener(
          window.Twitch.Player.PLAYING,
          () => {
            onStateChange({ isPlaying: true, isBuffering: false });
          },
        );

        playerRef.current.addEventListener(
          window.Twitch.Player.PAUSE,
          () => {
            onStateChange({ isPlaying: false });
          },
        );

        playerRef.current.addEventListener(
          window.Twitch.Player.BUFFERING,
          () => {
            onStateChange({ isBuffering: true });
          },
        );
      };

      if (window.Twitch && window.Twitch.Player) {
        initPlayer();
      } else {
        const checkInterval = setInterval(() => {
          if (window.Twitch && window.Twitch.Player) {
            clearInterval(checkInterval);
            initPlayer();
          }
        }, 100);
      }

      // Update time periodically
      const timeInterval = setInterval(() => {
        if (playerRef.current && playerReadyRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (currentTime !== undefined && duration !== undefined) {
            onStateChange({ currentTime, duration });
          }
        }
      }, 250);

      return () => {
        clearInterval(timeInterval);
        if (playerRef.current) {
          playerRef.current = null;
        }
      };
    }, [video.platform, video.url]);

    // Handle play/pause state changes
    useEffect(() => {
      if (!playerRef.current || !playerReadyRef.current) return;

      switch (video.platform) {
        case "youtube":
          if (videoState.isPlaying) {
            playerRef.current.playVideo();
          } else {
            playerRef.current.pauseVideo();
          }
          break;
        case "twitch":
          if (videoState.isPlaying) {
            playerRef.current.play();
          } else {
            playerRef.current.pause();
          }
          break;
      }
    }, [videoState.isPlaying, video.platform]);

    // Handle volume changes
    useEffect(() => {
      if (!playerRef.current || !playerReadyRef.current) return;

      switch (video.platform) {
        case "youtube":
          playerRef.current.setVolume(videoState.volume * 100);
          if (videoState.isMuted) {
            playerRef.current.mute();
          } else {
            playerRef.current.unMute();
          }
          break;
        case "twitch":
          playerRef.current.setVolume(videoState.volume);
          playerRef.current.setMuted(videoState.isMuted);
          break;
      }
    }, [videoState.volume, videoState.isMuted, video.platform]);

    // Fallback for unsupported platforms
    if (video.platform === "twitcasting" || video.platform === "niconico") {
      return (
        <div className="aspect-video bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-lg mb-2">{video.title}</p>
            <p className="text-sm text-white/60 mb-4">
              {video.platform} playback is not yet supported
            </p>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Open in {video.platform}
            </a>
          </div>
        </div>
      );
    }

    return <div ref={containerRef} className="aspect-video bg-black" />;
  },
);

VideoEmbed.displayName = "VideoEmbed";

// Type declarations for external APIs
declare global {
  interface Window {
    YT: any;
    Twitch: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}