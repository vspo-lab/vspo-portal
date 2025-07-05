import type { Livestream } from "@/features/shared/domain";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Switch,
  Tooltip,
  Typography,
  alpha,
  styled,
  useTheme,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import type React from "react";
import { useCallback, useState } from "react";
import type { StreamPlaybackState } from "../../hooks/usePlaybackControls";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import MixerIcon from "@mui/icons-material/MusicNote";
import PauseIcon from "@mui/icons-material/Pause";
import PictureInPictureIcon from "@mui/icons-material/PictureInPicture";
// Icons
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import SyncIcon from "@mui/icons-material/Sync";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

const ControlsContainer = styled(Paper)<{
  position?: string;
  isMobile?: boolean;
}>(({ theme, position = "bottom", isMobile = false }) => ({
  backgroundColor: "white",
  border: `1px solid ${theme.palette.divider}`,
  backdropFilter: "blur(10px)",
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(isMobile ? 1 : 1.5),
  boxShadow: theme.shadows[8],
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
    border: `1px solid ${theme.palette.grey[700]}`,
  },
  transition: theme.transitions.create(["transform", "opacity"], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeInOut,
  }),
  ...(position === "top" && {
    top: theme.spacing(isMobile ? 1 : 2),
  }),
  ...(position === "bottom" && {
    bottom: theme.spacing(isMobile ? 1 : 2),
  }),
  ...(position === "floating" && {
    top: "50%",
    transform: "translateY(-50%)",
    maxWidth: 400,
    left: "50%",
    right: "auto",
    marginLeft: "-200px",
  }),
}));

const MainControls = styled(Box)<{ isMobile?: boolean }>(
  ({ theme, isMobile }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(isMobile ? 0.5 : 1),
    flexWrap: isMobile ? "wrap" : "nowrap",
  }),
);

const VolumeSection = styled(Box)<{ isMobile?: boolean }>(
  ({ theme, isMobile }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    minWidth: isMobile ? "100%" : 200,
    [theme.breakpoints.down("md")]: {
      minWidth: "100%",
      marginTop: theme.spacing(1),
    },
  }),
);

const StreamControlsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  paddingTop: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  maxHeight: "300px",
  overflowY: "auto",
  overflowX: "hidden",
  // Custom scrollbar for better aesthetics
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: alpha(theme.palette.background.default, 0.1),
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: alpha(theme.palette.primary.main, 0.3),
    borderRadius: "3px",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.5),
    },
  },
}));

const StreamControlItem = styled(Box)<{
  isActive?: boolean;
  isCompact?: boolean;
}>(({ theme, isActive, isCompact = false }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(isCompact ? 0.25 : 0.5, isCompact ? 0.5 : 1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: isActive
    ? alpha(theme.palette.primary.main, 0.1)
    : "transparent",
  border: isActive
    ? `1px solid ${theme.palette.primary.main}`
    : "1px solid transparent",
  marginBottom: theme.spacing(isCompact ? 0.25 : 0.5),
  transition: theme.transitions.create(["background-color", "border-color"]),
  "&:hover": {
    backgroundColor: alpha(theme.palette.action.hover, 0.1),
  },
}));

const StreamInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
  flex: 1,
  minWidth: 0,
});

const StreamTitle = styled(Typography)({
  fontWeight: 500,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "0.875rem",
  lineHeight: 1.2,
});

const StreamControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const QuickActions = styled(Box)<{ isMobile?: boolean }>(
  ({ theme, isMobile }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(isMobile ? 0.5 : 1),
    marginLeft: "auto",
  }),
);

const AdvancedControls = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  paddingTop: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const ControlGroup = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const KeyboardShortcuts = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: "rgba(0, 0, 0, 0.03)",
  borderRadius: theme.shape.borderRadius,
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
}));

const ShortcutItem = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(0.5),
  "&:last-child": {
    marginBottom: 0,
  },
}));

const ShortcutKey = styled(Chip)(({ theme }) => ({
  fontSize: "0.75rem",
  height: 20,
  backgroundColor: theme.palette.grey[200],
  color: theme.palette.text.primary,
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.palette.grey[800],
    color: "white",
  },
}));

export interface PlaybackControlsPresenterProps {
  // State
  streams: Livestream[];
  globalVolume: number;
  globalMuted: boolean;
  globalPlaying: boolean;
  streamStates: Map<string, StreamPlaybackState>;
  fullscreenStreamId: string | null;
  pipStreamId: string | null;
  syncMode: boolean;
  audioMixMode: boolean;
  primaryStreamId: string | null;

  // Actions
  onToggleGlobalPlay: () => void;
  onSetGlobalVolume: (volume: number) => void;
  onToggleGlobalMute: () => void;
  onToggleStreamPlay: (streamId: string) => void;
  onSetStreamVolume: (streamId: string, volume: number) => void;
  onToggleStreamMute: (streamId: string) => void;
  onToggleFullscreen: (streamId: string) => void;
  onTogglePictureInPicture: (streamId: string) => void;
  onExitPictureInPicture: () => void;
  onToggleSyncMode: () => void;
  onSyncAllStreams: () => void;
  onToggleAudioMixMode: () => void;
  onSetPrimaryStream: (streamId: string) => void;

  // Mobile/Touch
  onTouchGesture: (gesture: string, streamId?: string) => void;

  // UI Props
  className?: string;
  position: "top" | "bottom" | "floating";
  isMobile: boolean;
}

export const PlaybackControlsPresenter: React.FC<
  PlaybackControlsPresenterProps
> = ({
  streams,
  globalVolume,
  globalMuted,
  globalPlaying,
  streamStates,
  fullscreenStreamId,
  pipStreamId,
  syncMode,
  audioMixMode,
  primaryStreamId,

  onToggleGlobalPlay,
  onSetGlobalVolume,
  onToggleGlobalMute,
  onToggleStreamPlay,
  onSetStreamVolume,
  onToggleStreamMute,
  onToggleFullscreen,
  onTogglePictureInPicture,
  onExitPictureInPicture,
  onToggleSyncMode,
  onSyncAllStreams,
  onToggleAudioMixMode,
  onSetPrimaryStream,

  onTouchGesture,

  className,
  position,
  isMobile,
}) => {
  const { t } = useTranslation("multiview");
  const theme = useTheme();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showStreamControls, setShowStreamControls] = useState(!isMobile);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const getVolumeIcon = useCallback(
    (volume: number, muted: boolean, size?: "small" | "medium") => {
      if (muted || volume === 0) return <VolumeOffIcon fontSize={size} />;
      if (volume < 0.5) return <VolumeDownIcon fontSize={size} />;
      return <VolumeUpIcon fontSize={size} />;
    },
    [],
  );

  const truncateTitle = useCallback((title: string, maxLength = 30): string => {
    return title.length > maxLength
      ? `${title.substring(0, maxLength)}...`
      : title;
  }, []);

  return (
    <ControlsContainer
      className={className}
      position={position}
      isMobile={isMobile}
      elevation={8}
    >
      {/* Main Controls */}
      <MainControls isMobile={isMobile}>
        {/* Global Play/Pause */}
        <Tooltip
          title={t(
            "controls.global.playPause",
            globalPlaying ? "すべて一時停止" : "すべて再生",
          )}
        >
          <IconButton
            onClick={onToggleGlobalPlay}
            size={isMobile ? "medium" : "large"}
            color="primary"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            {globalPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>

        {/* Global Volume */}
        <VolumeSection isMobile={isMobile}>
          <Tooltip
            title={t(
              "controls.global.mute",
              globalMuted ? "ミュート解除" : "ミュート",
            )}
          >
            <IconButton
              onClick={onToggleGlobalMute}
              size="small"
              color={globalMuted ? "error" : "default"}
            >
              {getVolumeIcon(globalVolume, globalMuted, "medium")}
            </IconButton>
          </Tooltip>

          <Slider
            value={globalMuted ? 0 : globalVolume * 100}
            onChange={(_, value) => onSetGlobalVolume((value as number) / 100)}
            min={0}
            max={100}
            step={1}
            size="small"
            sx={{ flex: 1, mx: 1 }}
            disabled={globalMuted}
          />

          <Typography
            variant="caption"
            sx={{ minWidth: 35, textAlign: "center" }}
          >
            {Math.round((globalMuted ? 0 : globalVolume) * 100)}%
          </Typography>
        </VolumeSection>

        {/* Quick Actions */}
        <QuickActions isMobile={isMobile}>
          {/* Fullscreen - Removed to avoid confusion with grid fullscreen */}

          {/* Picture-in-Picture */}
          {pipStreamId ? (
            <Tooltip title={t("controls.pip.exit", "PiP終了")}>
              <IconButton
                onClick={onExitPictureInPicture}
                size="small"
                color="primary"
              >
                <PictureInPictureIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip
              title={t("controls.pip.enter", "ピクチャーインピクチャー")}
            >
              <IconButton
                onClick={() =>
                  primaryStreamId && onTogglePictureInPicture(primaryStreamId)
                }
                size="small"
                disabled={!primaryStreamId}
              >
                <PictureInPictureIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Sync Mode */}
          <Tooltip
            title={t(
              "controls.sync.toggle",
              syncMode ? "同期モード無効" : "同期モード有効",
            )}
          >
            <IconButton
              onClick={onToggleSyncMode}
              size="small"
              color={syncMode ? "primary" : "default"}
            >
              <SyncIcon />
            </IconButton>
          </Tooltip>

          {/* Audio Mix Mode */}
          <Tooltip
            title={t(
              "controls.audioMix.toggle",
              audioMixMode ? "ミックスモード無効" : "ミックスモード有効",
            )}
          >
            <IconButton
              onClick={onToggleAudioMixMode}
              size="small"
              color={audioMixMode ? "primary" : "default"}
            >
              <MixerIcon />
            </IconButton>
          </Tooltip>

          {/* Advanced Settings */}
          <Tooltip title={t("controls.advanced.toggle", "詳細設定")}>
            <IconButton
              onClick={() => setShowAdvanced(!showAdvanced)}
              size="small"
              color={showAdvanced ? "primary" : "default"}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </QuickActions>
      </MainControls>

      {/* Stream Controls Toggle (Mobile) */}
      {isMobile && streams.length > 1 && (
        <Box sx={{ mt: 1, textAlign: "center" }}>
          <IconButton
            onClick={() => setShowStreamControls(!showStreamControls)}
            size="small"
          >
            {showStreamControls ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      )}

      {/* Individual Stream Controls */}
      <Collapse in={showStreamControls && streams.length > 1}>
        <StreamControlsContainer>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">
              {t("controls.streams.title", "個別コントロール")}
            </Typography>
            {streams.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                {streams.length} {t("controls.streams.count", "配信")}
              </Typography>
            )}
          </Box>

          {streams.map((stream) => {
            const streamState = streamStates.get(stream.id);
            const isPrimary = primaryStreamId === stream.id;
            const isFullscreen = fullscreenStreamId === stream.id;
            const isPip = pipStreamId === stream.id;
            const isCompact = streams.length > 4;

            return (
              <StreamControlItem
                key={stream.id}
                isActive={isPrimary}
                isCompact={isCompact}
                onDoubleClick={() => onTouchGesture("double-tap", stream.id)}
              >
                <StreamInfo>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <StreamTitle variant="caption">
                      {truncateTitle(stream.channelTitle, isCompact ? 20 : 30)}
                    </StreamTitle>
                    {!isCompact && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{
                          fontSize: "0.7rem",
                          [theme.getColorSchemeSelector("dark")]: {
                            color:
                              theme.palette.grey?.[100] ||
                              theme.palette.text.primary,
                          },
                        }}
                      >
                        {truncateTitle(stream.title, 25)}
                      </Typography>
                    )}
                  </Box>

                  {isPrimary && (
                    <Chip
                      label={
                        isCompact
                          ? "M"
                          : t("controls.streams.primary", "メイン")
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{
                        height: isCompact ? 16 : 20,
                        fontSize: isCompact ? "0.65rem" : "0.75rem",
                      }}
                    />
                  )}

                  {isFullscreen && !isCompact && (
                    <Chip
                      label={t("controls.streams.fullscreen", "フルスクリーン")}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ height: 20 }}
                    />
                  )}

                  {isPip && !isCompact && (
                    <Chip
                      label={t("controls.streams.pip", "PiP")}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ height: 20 }}
                    />
                  )}
                </StreamInfo>

                <StreamControls>
                  {/* Stream Play/Pause */}
                  <Tooltip
                    title={t(
                      "controls.stream.playPause",
                      streamState?.isPlaying ? "一時停止" : "再生",
                    )}
                  >
                    <IconButton
                      onClick={() => onToggleStreamPlay(stream.id)}
                      size="small"
                    >
                      {streamState?.isPlaying ? (
                        <PauseIcon fontSize={isCompact ? "small" : "medium"} />
                      ) : (
                        <PlayArrowIcon
                          fontSize={isCompact ? "small" : "medium"}
                        />
                      )}
                    </IconButton>
                  </Tooltip>

                  {/* Stream Mute */}
                  <Tooltip
                    title={t(
                      "controls.stream.mute",
                      streamState?.isMuted ? "ミュート解除" : "ミュート",
                    )}
                  >
                    <IconButton
                      onClick={() => onToggleStreamMute(stream.id)}
                      size="small"
                      color={streamState?.isMuted ? "error" : "default"}
                    >
                      {getVolumeIcon(
                        streamState?.volume || 0,
                        streamState?.isMuted || false,
                        isCompact ? "small" : "medium",
                      )}
                    </IconButton>
                  </Tooltip>

                  {/* Stream Volume - Hidden in compact mode */}
                  {!isMobile && !isCompact && (
                    <Box sx={{ width: 80, mx: 1 }}>
                      <Slider
                        value={
                          streamState?.isMuted
                            ? 0
                            : (streamState?.volume || 0) * 100
                        }
                        onChange={(_, value) =>
                          onSetStreamVolume(stream.id, (value as number) / 100)
                        }
                        min={0}
                        max={100}
                        step={1}
                        size="small"
                        disabled={streamState?.isMuted}
                      />
                    </Box>
                  )}

                  {/* Set as Primary - Hidden in compact mode and when already primary */}
                  {!isPrimary && !isCompact && (
                    <Tooltip
                      title={t("controls.stream.setPrimary", "メインに設定")}
                    >
                      <IconButton
                        onClick={() => onSetPrimaryStream(stream.id)}
                        size="small"
                      >
                        <MixerIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Fullscreen - Hidden in compact mode */}
                  {!isCompact && (
                    <Tooltip
                      title={t("controls.stream.fullscreen", "フルスクリーン")}
                    >
                      <IconButton
                        onClick={() => onToggleFullscreen(stream.id)}
                        size="small"
                        color={isFullscreen ? "primary" : "default"}
                      >
                        {isFullscreen ? (
                          <FullscreenExitIcon fontSize="small" />
                        ) : (
                          <FullscreenIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Picture-in-Picture - Hidden in compact mode */}
                  {!isCompact && (
                    <Tooltip
                      title={t(
                        "controls.stream.pip",
                        "ピクチャーインピクチャー",
                      )}
                    >
                      <IconButton
                        onClick={() => onTogglePictureInPicture(stream.id)}
                        size="small"
                        color={isPip ? "primary" : "default"}
                      >
                        <PictureInPictureIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </StreamControls>
              </StreamControlItem>
            );
          })}
        </StreamControlsContainer>
      </Collapse>

      {/* Advanced Controls */}
      <Collapse in={showAdvanced}>
        <AdvancedControls>
          <Typography variant="subtitle2">
            {t("controls.advanced.title", "詳細設定")}
          </Typography>

          {/* Sync Controls */}
          <ControlGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={syncMode}
                  onChange={onToggleSyncMode}
                  size="small"
                />
              }
              label={t("controls.sync.enable", "同期モード")}
            />

            {syncMode && (
              <IconButton
                onClick={onSyncAllStreams}
                size="small"
                color="primary"
              >
                <SyncIcon />
              </IconButton>
            )}
          </ControlGroup>

          {/* Audio Mix Controls */}
          <ControlGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={audioMixMode}
                  onChange={onToggleAudioMixMode}
                  size="small"
                />
              }
              label={t("controls.audioMix.enable", "オーディオミックス")}
            />

            {audioMixMode && primaryStreamId && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>
                  {t("controls.audioMix.primary", "メイン音声")}
                </InputLabel>
                <Select
                  value={primaryStreamId}
                  onChange={(e) => onSetPrimaryStream(e.target.value)}
                  label={t("controls.audioMix.primary", "メイン音声")}
                >
                  {streams.map((stream) => (
                    <MenuItem key={stream.id} value={stream.id}>
                      {truncateTitle(stream.channelTitle, 20)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </ControlGroup>

          <Divider />

          {/* Keyboard Shortcuts */}
          <ControlGroup>
            <Typography variant="body2">
              {t("controls.keyboard.title", "キーボードショートカット")}
            </Typography>
            <IconButton
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              size="small"
            >
              <KeyboardIcon />
            </IconButton>
          </ControlGroup>

          <Collapse in={showKeyboardShortcuts}>
            <KeyboardShortcuts>
              <ShortcutItem>
                <Typography variant="caption">
                  {t("controls.keyboard.playPause", "再生/一時停止")}
                </Typography>
                <ShortcutKey label="Space" size="small" />
              </ShortcutItem>
              <ShortcutItem>
                <Typography variant="caption">
                  {t("controls.keyboard.mute", "ミュート")}
                </Typography>
                <ShortcutKey label="M" size="small" />
              </ShortcutItem>
              <ShortcutItem>
                <Typography variant="caption">
                  {t("controls.keyboard.fullscreen", "フルスクリーン")}
                </Typography>
                <ShortcutKey label="F" size="small" />
              </ShortcutItem>
              <ShortcutItem>
                <Typography variant="caption">
                  {t("controls.keyboard.pip", "PiP")}
                </Typography>
                <ShortcutKey label="P" size="small" />
              </ShortcutItem>
              <ShortcutItem>
                <Typography variant="caption">
                  {t("controls.keyboard.sync", "同期モード")}
                </Typography>
                <ShortcutKey label="S" size="small" />
              </ShortcutItem>
              <ShortcutItem>
                <Typography variant="caption">
                  {t("controls.keyboard.audioMix", "ミックスモード")}
                </Typography>
                <ShortcutKey label="A" size="small" />
              </ShortcutItem>
              <ShortcutItem>
                <Typography variant="caption">
                  {t("controls.keyboard.volumeUp", "音量アップ")}
                </Typography>
                <ShortcutKey label="↑" size="small" />
              </ShortcutItem>
              <ShortcutItem>
                <Typography variant="caption">
                  {t("controls.keyboard.volumeDown", "音量ダウン")}
                </Typography>
                <ShortcutKey label="↓" size="small" />
              </ShortcutItem>
            </KeyboardShortcuts>
          </Collapse>
        </AdvancedControls>
      </Collapse>
    </ControlsContainer>
  );
};
