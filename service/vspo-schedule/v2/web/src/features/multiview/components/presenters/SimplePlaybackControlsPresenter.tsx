import { Livestream } from "@/features/shared/domain";
import {
  Box,
  IconButton,
  Slider,
  Tooltip,
  Typography,
  alpha,
  styled,
  useTheme,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React from "react";
import { StreamPlaybackState } from "../../hooks/usePlaybackControls";

import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import SyncIcon from "@mui/icons-material/Sync";

const ControlsContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "white",
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
  },
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
}));

const GlobalControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const VolumeControl = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  flex: 1,
}));

const StreamControl = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  flexWrap: "wrap",
  "&:hover": {
    backgroundColor: alpha(theme.palette.action.hover, 0.1),
  },
}));

const StreamInfo = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  marginRight: theme.spacing(1),
}));

const StreamTitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 500,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  [theme.getColorSchemeSelector("dark")]: {
    color: "white",
  },
}));

const ChannelName = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.text.secondary,
  [theme.getColorSchemeSelector("dark")]: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export type SimplePlaybackControlsPresenterProps = {
  streams: Livestream[];
  streamStates: Record<string, StreamPlaybackState>;

  // Global controls
  globalVolume: number;
  isGlobalMuted: boolean;

  // Actions
  onToggleGlobalPlay: () => void;
  onSetGlobalVolume: (volume: number) => void;
  onToggleGlobalMute: () => void;
  onToggleStreamPlay: (streamId: string) => void;
  onSetStreamVolume: (streamId: string, volume: number) => void;
  onToggleStreamMute: (streamId: string) => void;
  onMuteAllButOne: (streamId: string) => void;
  onSyncToLive: () => void;
};

export const SimplePlaybackControlsPresenter: React.FC<
  SimplePlaybackControlsPresenterProps
> = ({
  streams,
  streamStates,
  globalVolume,
  isGlobalMuted,
  onToggleGlobalPlay,
  onSetGlobalVolume,
  onToggleGlobalMute,
  onToggleStreamPlay,
  onSetStreamVolume,
  onToggleStreamMute,
  onMuteAllButOne,
  onSyncToLive,
}) => {
  const { t } = useTranslation("multiview");
  const theme = useTheme();

  // Check if all streams are playing
  const allPlaying = streams.every(
    (stream) => streamStates[stream.id]?.isPlaying ?? false,
  );

  const handleGlobalVolumeChange = (_: Event, value: number | number[]) => {
    onSetGlobalVolume(value as number);
  };

  const handleStreamVolumeChange =
    (streamId: string) => (_: Event, value: number | number[]) => {
      onSetStreamVolume(streamId, value as number);
    };

  return (
    <ControlsContainer>
      {/* Global Controls */}
      <GlobalControls>
        <IconButton
          onClick={onToggleGlobalPlay}
          size="medium"
          aria-label={allPlaying ? t("controls.pauseAll", "すべて一時停止") : t("controls.playAll", "すべて再生")}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          {allPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        <Tooltip title={t("controls.syncToLive", "ライブに同期")} arrow>
          <IconButton
            onClick={onSyncToLive}
            size="medium"
            aria-label={t("controls.syncToLive", "ライブに同期")}
          >
            <SyncIcon />
          </IconButton>
        </Tooltip>

        <VolumeControl>
          <IconButton size="small" onClick={onToggleGlobalMute} aria-label={isGlobalMuted ? t("controls.unmute", "ミュート解除") : t("controls.mute", "ミュート")}>
            {isGlobalMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
          <Slider
            value={isGlobalMuted ? 0 : globalVolume}
            onChange={handleGlobalVolumeChange}
            aria-label={t("controls.globalVolume", "全体音量")}
            size="small"
            min={0}
            max={100}
            sx={{ flex: 1 }}
          />
          <Typography
            variant="caption"
            sx={{ minWidth: 40, textAlign: "right" }}
          >
            {Math.round(globalVolume)}%
          </Typography>
        </VolumeControl>
      </GlobalControls>

      {/* Individual Stream Controls */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("controls.individualVolume", "個別音量")}
        </Typography>
        {streams.some((s) => s.platform === "twitch") && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            {t("controls.twitchNote", "※ Twitchの配信は手動で操作してください")}
          </Typography>
        )}
        {streams.map((stream) => {
          const state = streamStates[stream.id] || {
            volume: 100,
            isMuted: false,
            isPlaying: false,
          };

          return (
            <StreamControl key={stream.id}>
              <StreamInfo>
                <StreamTitle>{stream.title}</StreamTitle>
                <ChannelName>
                  {stream.platform === "youtube" && "🎬 "}
                  {stream.platform === "twitch" && "🎮 "}
                  {stream.channelTitle}
                </ChannelName>
              </StreamInfo>

              <IconButton
                size="small"
                onClick={() => onToggleStreamPlay(stream.id)}
                disabled={stream.platform === "twitch"}
                aria-label={state.isPlaying ? t("controls.pause", "一時停止") : t("controls.play", "再生")}
                sx={{
                  color:
                    stream.platform === "twitch"
                      ? theme.palette.action.disabled
                      : theme.palette.primary.main,
                }}
                title={
                  stream.platform === "twitch"
                    ? t(
                        "controls.twitchManual",
                        "Twitchは手動で操作してください",
                      )
                    : undefined
                }
              >
                {state.isPlaying ? (
                  <PauseIcon fontSize="small" />
                ) : (
                  <PlayArrowIcon fontSize="small" />
                )}
              </IconButton>

              <IconButton
                size="small"
                onClick={() => onToggleStreamMute(stream.id)}
                disabled={stream.platform === "twitch"}
                aria-label={state.isMuted ? t("controls.unmute", "ミュート解除") : t("controls.mute", "ミュート")}
              >
                {state.isMuted ? (
                  <VolumeOffIcon fontSize="small" />
                ) : (
                  <VolumeUpIcon fontSize="small" />
                )}
              </IconButton>

              <Tooltip title={t("controls.listenOnlyThis", "この配信だけ聴く")} arrow>
                <IconButton
                  size="small"
                  onClick={() => onMuteAllButOne(stream.id)}
                  disabled={stream.platform === "twitch"}
                  aria-label={t("controls.listenOnlyThis", "この配信だけ聴く")}
                  sx={{
                    color: !state.isMuted &&
                      streams.every((s) =>
                        s.id === stream.id
                          ? !(streamStates[s.id]?.isMuted ?? true)
                          : (streamStates[s.id]?.isMuted ?? false)
                      )
                      ? theme.palette.primary.main
                      : undefined,
                  }}
                >
                  <HeadphonesIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Box
                sx={{
                  width: { xs: 80, sm: 100 },
                  minWidth: 60,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  opacity: stream.platform === "twitch" ? 0.5 : 1,
                }}
              >
                <Slider
                  value={state.isMuted ? 0 : state.volume}
                  onChange={handleStreamVolumeChange(stream.id)}
                  aria-label={t("controls.streamVolume", "{{title}}の音量", {
                    title: stream.title,
                  })}
                  size="small"
                  min={0}
                  max={100}
                  disabled={stream.platform === "twitch"}
                />
                <Typography
                  variant="caption"
                  sx={{ minWidth: 35, textAlign: "right" }}
                >
                  {Math.round(state.volume)}%
                </Typography>
              </Box>
            </StreamControl>
          );
        })}
      </Box>
    </ControlsContainer>
  );
};
