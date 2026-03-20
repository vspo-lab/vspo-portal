import { Loading } from "@/features/shared/components/Elements";
import { Livestream } from "@/features/shared/domain";
import AddLinkIcon from "@mui/icons-material/AddLink";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import SaveIcon from "@mui/icons-material/Save";
import ShareIcon from "@mui/icons-material/Share";
import TuneIcon from "@mui/icons-material/Tune";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React from "react";
import {
  LayoutSelector,
  MultiviewGrid,
  SimplePlaybackControls,
  StreamSelector,
  UrlInput,
} from "../../components/containers";
import { LayoutType, useMultiviewLayout } from "../../hooks/useMultiviewLayout";
import {
  CustomLayoutPreset,
  deleteCustomLayout,
  loadCustomLayouts,
  resolveStream,
  saveCustomLayout,
  toStreamSnapshot,
} from "../../utils/stateManager";
import { scaledBorderRadius } from "../../utils/theme";

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(2),
  fontSize: "1.5rem",
  color: theme.palette.text.primary,
  [theme.breakpoints.down("sm")]: {
    fontSize: "1.2rem",
  },
  [theme.getColorSchemeSelector("dark")]: {
    color: "white",
  },
}));

const ControlsPanel = styled(Paper)<{ collapsed?: boolean }>(
  ({ theme, collapsed = false }) => ({
    position: "fixed",
    right: collapsed ? "-500px" : theme.spacing(1), // Move off-screen when collapsed
    top: "50%",
    transform: "translateY(-50%)",
    width: "550px",
    maxWidth: "min(550px, calc(100vw - 2rem))",
    maxHeight: "80vh",
    overflowY: "auto",
    overflowX: "hidden",
    padding: theme.spacing(3),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    boxShadow: theme.shadows[8],
    borderRadius: scaledBorderRadius(theme, 2),
    border: `1px solid ${theme.palette.grey[300]}`,
    zIndex: 1100,
    transition: theme.transitions.create(["right", "opacity"], {
      duration: theme.transitions.duration.short,
    }),
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
    },
    opacity: collapsed ? 0 : 1,
    [theme.breakpoints.down("lg")]: {
      position: "relative",
      right: "unset",
      top: "unset",
      transform: "none",
      width: "100%",
      maxHeight: "unset",
      marginBottom: theme.spacing(2),
      marginTop: theme.spacing(2),
      borderRadius: theme.shape.borderRadius,
      padding: theme.spacing(2),
      backdropFilter: "none",
    },
    [theme.getColorSchemeSelector("dark")]: {
      backgroundColor: "rgba(53, 53, 53, 0.95)", // Using the actual color value for customColors.gray
      border: `1px solid ${theme.palette.grey[700]}`,
    },
  }),
);

export type MultiviewPagePresenterProps = {
  livestreams: Livestream[];
  selectedStreams: Livestream[];
  /** Set of stream IDs that have a chat cell open in the grid. */
  chatStreamIds: ReadonlySet<string>;
  selectedLayout: LayoutType;
  isProcessing: boolean;
  shareableUrl: string;
  onStreamSelection: (stream: Livestream) => void;
  onRemoveStream: (streamId: string) => void;
  onLayoutChange: (layout: LayoutType) => void;
  onManualStreamAdd: (stream: Livestream) => void;
  /** Replace all selected streams at once (used by preset restoration). */
  onRestoreStreams: (streams: Livestream[]) => void;
  /** Toggle the chat cell for a given stream ID (add if absent, remove if present). */
  onToggleChat: (streamId: string) => void;
  /** Remove a chat cell for the given stream ID. */
  onRemoveChat: (streamId: string) => void;
};

export const Presenter: React.FC<MultiviewPagePresenterProps> = ({
  livestreams,
  selectedStreams,
  chatStreamIds,
  selectedLayout,
  isProcessing,
  shareableUrl,
  onStreamSelection,
  onRemoveStream,
  onLayoutChange,
  onManualStreamAdd,
  onRestoreStreams,
  onToggleChat,
  onRemoveChat,
}) => {
  const { t } = useTranslation(["multiview", "common"]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  // Controls panel collapsed by default on large screens (dashboard style)
  const [controlsPanelCollapsed, setControlsPanelCollapsed] =
    React.useState(false);
  const [layoutSectionCollapsed, setLayoutSectionCollapsed] =
    React.useState(false);
  const [urlInputCollapsed, setUrlInputCollapsed] = React.useState(false);
  const [streamSelectorCollapsed, setStreamSelectorCollapsed] =
    React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [immersiveMode, setImmersiveMode] = React.useState(false);

  // Custom layout state
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [layoutName, setLayoutName] = React.useState("");
  const [customLayouts, setCustomLayouts] = React.useState<
    ReadonlyArray<CustomLayoutPreset>
  >([]);
  const gridPositionsRef = React.useRef<
    Array<{ i: string; x: number; y: number; w: number; h: number }>
  >([]);
  const [externalGridPositions, setExternalGridPositions] = React.useState<
    | ReadonlyArray<{
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }>
    | undefined
  >(undefined);

  // Auto-collapse panel when streams are added on large screens
  const hasAutoCollapsedRef = React.useRef(false);
  React.useEffect(() => {
    if (isLargeScreen && selectedStreams.length > 0 && !hasAutoCollapsedRef.current) {
      hasAutoCollapsedRef.current = true;
      setControlsPanelCollapsed(true);
    }
  }, [selectedStreams.length, isLargeScreen]);

  // Load custom layouts on mount
  React.useEffect(() => {
    setCustomLayouts(loadCustomLayouts());
  }, []);

  // Capture grid positions from the grid component
  const handleGridPositionsChange = React.useCallback(
    (
      positions: Array<{
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }>,
    ) => {
      gridPositionsRef.current = positions;
    },
    [],
  );

  // Save current layout as a custom preset
  const handleSaveLayout = React.useCallback(() => {
    const trimmedName = layoutName.trim();
    if (!trimmedName || gridPositionsRef.current.length === 0) return;

    saveCustomLayout(
      trimmedName,
      {
        type: selectedLayout,
        gridPositions: gridPositionsRef.current,
      },
      selectedStreams.map(toStreamSnapshot),
    );
    setCustomLayouts(loadCustomLayouts());
    setSaveDialogOpen(false);
    setLayoutName("");
    setSnackbarMessage(
      t("multiview:customLayout.saved", "配信とレイアウトを保存しました"),
    );
    setSnackbarOpen(true);
  }, [layoutName, selectedLayout, t]);

  // Delete a custom layout preset
  const handleDeleteCustomLayout = React.useCallback(
    (name: string) => {
      deleteCustomLayout(name);
      setCustomLayouts(loadCustomLayouts());
      setSnackbarMessage(
        t("multiview:customLayout.deleted", "レイアウトを削除しました"),
      );
      setSnackbarOpen(true);
    },
    [t],
  );

  // Apply a saved custom layout (restores streams + layout + grid positions)
  const handleApplyCustomLayout = React.useCallback(
    (preset: CustomLayoutPreset) => {
      if (preset.streams && preset.streams.length > 0) {
        onRestoreStreams(
          preset.streams.map((saved) => resolveStream(saved, livestreams)),
        );
      }

      onLayoutChange(preset.layout.type);
      setExternalGridPositions(preset.layout.gridPositions);
    },
    [onLayoutChange, onRestoreStreams, livestreams],
  );

  // Toggle immersive mode: hide header, footer, bottom nav for maximum viewing area
  const toggleImmersiveMode = React.useCallback(() => {
    setImmersiveMode((prev) => {
      const next = !prev;
      document.documentElement.dataset.immersive = next ? "true" : "false";
      return next;
    });
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement; // type-safe: KeyboardEvent.target is always an Element in the DOM
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key === "Escape") {
        if (immersiveMode) {
          toggleImmersiveMode();
        }
        return;
      }

      // F key for true fullscreen toggle
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
        return;
      }

      // I key for immersive mode toggle
      if (e.key === "i" || e.key === "I") {
        toggleImmersiveMode();
        return;
      }

      // T key for controls panel toggle (large screens only)
      if ((e.key === "t" || e.key === "T") && isLargeScreen) {
        setControlsPanelCollapsed((prev) => !prev);
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [immersiveMode, toggleImmersiveMode, isLargeScreen]);

  // Clean up immersive mode on unmount only
  React.useEffect(() => {
    return () => {
      document.documentElement.dataset.immersive = "false";
    };
  }, []);

  // Copy shareable URL to clipboard
  const handleShare = React.useCallback(() => {
    if (shareableUrl) {
      navigator.clipboard
        .writeText(shareableUrl)
        .then(() => {
          setSnackbarMessage(
            t("multiview:share.copied", "共有URLをコピーしました"),
          );
          setSnackbarOpen(true);
        })
        .catch(() => {
          setSnackbarMessage(
            t("multiview:share.copyFailed", "URLのコピーに失敗しました"),
          );
          setSnackbarOpen(true);
        });
    }
  }, [shareableUrl, t]);

  // Get layout information for display
  const { availableLayouts } = useMultiviewLayout({
    streamCount: selectedStreams.length,
    isMobile,
    initialLayout: selectedLayout,
  });

  // Streams added via URL (not in the server-provided list)
  const manualStreams = React.useMemo(() => {
    const knownIds = new Set(livestreams.map((s) => s.id));
    return selectedStreams.filter((s) => !knownIds.has(s.id));
  }, [livestreams, selectedStreams]);

  if (isProcessing) {
    return <Loading />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100dvh",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        [theme.getColorSchemeSelector("dark")]: {
          backgroundColor: theme.vars.palette.customColors.darkGray,
          color: "white",
        },
      }}
    >
      {/* Main content with full width viewer */}
      <Box
        sx={{
          width: "100%",
          position: "relative",
          backgroundColor: "transparent",
        }}
      >
        {/* Full width viewer */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "transparent",
          }}
        >
          <Box
            sx={{
              width: "100%",
              overflow: "hidden",
              backgroundColor: "transparent",
            }}
          >
            <MultiviewGrid
              selectedStreams={selectedStreams}
              chatStreamIds={chatStreamIds}
              selectedLayout={selectedLayout}
              onRemoveStream={onRemoveStream}
              onRemoveChat={onRemoveChat}
              onGridPositionsChange={handleGridPositionsChange}
              externalGridPositions={externalGridPositions}
            />
          </Box>
        </Box>

        {/* Floating Action Buttons */}
        <Box
          sx={{
            position: "fixed",
            bottom: `calc(${theme.spacing(3)} + env(safe-area-inset-bottom, 0px))`,
            right: `calc(${theme.spacing(3)} + env(safe-area-inset-right, 0px))`,
            zIndex: 1200, // Higher than controls panel
            display: "flex",
            gap: theme.spacing(2),
            alignItems: "center",
            [theme.breakpoints.down("md")]: {
              bottom: immersiveMode ? theme.spacing(3) : theme.spacing(12),
              right: theme.spacing(2),
            },
          }}
        >
          {/* Toggle Controls Panel Button - hidden in immersive mode */}
          {isLargeScreen && !immersiveMode && (
            <Tooltip
              title={
                controlsPanelCollapsed
                  ? t("multiview:controlPanel.show", "配信とレイアウトを表示")
                  : t("multiview:controlPanel.hide", "配信とレイアウトを隠す")
              }
              placement="left"
            >
              <IconButton
                onClick={() =>
                  setControlsPanelCollapsed(!controlsPanelCollapsed)
                }
                aria-label={
                  controlsPanelCollapsed
                    ? t("multiview:controlPanel.show", "配信とレイアウトを表示")
                    : t("multiview:controlPanel.hide", "配信とレイアウトを隠す")
                }
                aria-pressed={!controlsPanelCollapsed}
                size="large"
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[700]
                      : theme.palette.grey[500],
                  color: theme.palette.common.white,
                  boxShadow: theme.shadows[6],
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[600]
                        : theme.palette.grey[600],
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover": { transform: "none" },
                  },
                }}
              >
                {controlsPanelCollapsed ? (
                  <TuneIcon sx={{ fontSize: 28 }} />
                ) : (
                  <ChevronRightIcon sx={{ fontSize: 28 }} />
                )}
              </IconButton>
            </Tooltip>
          )}

          {/* Immersive Mode Toggle - hidden in immersive mode (exit via grid hover) */}
          {!immersiveMode && (
            <Tooltip
              title={t("multiview:immersive.enter", "レイアウトを非表示")}
              placement="left"
            >
              <IconButton
                onClick={toggleImmersiveMode}
                aria-label={t(
                  "multiview:immersive.enter",
                  "レイアウトを非表示",
                )}
                size="large"
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[700]
                      : theme.palette.grey[500],
                  color: theme.palette.common.white,
                  boxShadow: theme.shadows[6],
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[600]
                        : theme.palette.grey[600],
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover": { transform: "none" },
                  },
                }}
              >
                <OpenInFullIcon sx={{ fontSize: 28 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Immersive mode exit button - appears on hover at bottom-right */}
        {immersiveMode && (
          <Box
            sx={{
              position: "fixed",
              bottom: `calc(${theme.spacing(3)} + env(safe-area-inset-bottom, 0px))`,
              right: `calc(${theme.spacing(3)} + env(safe-area-inset-right, 0px))`,
              zIndex: 1200,
              opacity: 0,
              transition: "opacity 0.3s ease",
              "&:hover": { opacity: 1 },
              "&:focus-within": { opacity: 1 },
              // Always visible on touch devices (no hover)
              "@media (hover: none)": { opacity: 0.8 },
            }}
          >
            <Tooltip
              title={t("multiview:immersive.exit", "レイアウトを表示")}
              placement="left"
            >
              <IconButton
                onClick={toggleImmersiveMode}
                aria-label={t(
                  "multiview:immersive.exit",
                  "レイアウトを表示",
                )}
                size="large"
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.common.white,
                  boxShadow: theme.shadows[6],
                  "&:hover": {
                    backgroundColor: theme.palette.primary.dark,
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover": { transform: "none" },
                  },
                }}
              >
                <CloseFullscreenIcon sx={{ fontSize: 28 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Controls Panel - hidden in immersive mode */}
        <ControlsPanel
          elevation={4}
          collapsed={immersiveMode || (controlsPanelCollapsed && isLargeScreen)}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {(!controlsPanelCollapsed || !isLargeScreen) && (
              <>
                {/* Stream Selector */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: streamSelectorCollapsed ? 0 : 2,
                    }}
                  >
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <VideoLibraryIcon
                        sx={{
                          mr: 1,
                          verticalAlign: "middle",
                          fontSize: "1.2rem",
                        }}
                      />
                      {t("multiview:selector.title", "配信選択")}
                    </SectionTitle>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setStreamSelectorCollapsed(!streamSelectorCollapsed)
                      }
                      aria-label={streamSelectorCollapsed ? t("multiview:expand", "展開") : t("multiview:collapse", "折りたたむ")}
                      aria-expanded={!streamSelectorCollapsed}
                      sx={{ ml: 1 }}
                    >
                      {streamSelectorCollapsed ? (
                        <ExpandMoreIcon />
                      ) : (
                        <ExpandLessIcon />
                      )}
                    </IconButton>
                  </Box>
                  <Collapse in={!streamSelectorCollapsed}>
                    <StreamSelector
                      streams={livestreams}
                      selectedStreams={selectedStreams}
                      onStreamSelect={onStreamSelection}
                      chatStreamIds={chatStreamIds}
                      onToggleChat={onToggleChat}
                    />
                  </Collapse>
                </Box>

                {/* URL Input - Second */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: urlInputCollapsed ? 0 : 2,
                    }}
                  >
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <AddLinkIcon
                        sx={{
                          mr: 1,
                          verticalAlign: "middle",
                          fontSize: "1.2rem",
                        }}
                      />
                      {t("multiview:urlInput.sectionTitle", "URLから追加")}
                    </SectionTitle>
                    <IconButton
                      size="small"
                      onClick={() => setUrlInputCollapsed(!urlInputCollapsed)}
                      aria-label={urlInputCollapsed ? t("multiview:expand", "展開") : t("multiview:collapse", "折りたたむ")}
                      aria-expanded={!urlInputCollapsed}
                      sx={{ ml: 1 }}
                    >
                      {urlInputCollapsed ? (
                        <ExpandMoreIcon />
                      ) : (
                        <ExpandLessIcon />
                      )}
                    </IconButton>
                  </Box>
                  <Collapse in={!urlInputCollapsed}>
                    <UrlInput
                      selectedStreams={selectedStreams}
                      maxStreams={Infinity}
                      onStreamAdd={onManualStreamAdd}
                    />
                    {manualStreams.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                          {t("multiview:urlInput.addedStreams", "URLから追加済み")}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                          {manualStreams.map((stream) => (
                            <Chip
                              key={stream.id}
                              label={`${stream.title} — ${stream.channelTitle}`}
                              size="small"
                              variant="outlined"
                              onDelete={() => onRemoveStream(stream.id)}
                              sx={{
                                justifyContent: "flex-start",
                                maxWidth: "100%",
                                "& .MuiChip-label": {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Collapse>
                </Box>

                {/* Layout Selector - Third */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: layoutSectionCollapsed ? 0 : 2,
                    }}
                  >
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <TuneIcon
                        sx={{
                          mr: 1,
                          verticalAlign: "middle",
                          fontSize: "1.2rem",
                        }}
                      />
                      {t("multiview:layout.title", "配信とレイアウト")}
                    </SectionTitle>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setLayoutSectionCollapsed(!layoutSectionCollapsed)
                      }
                      aria-label={layoutSectionCollapsed ? t("multiview:expand", "展開") : t("multiview:collapse", "折りたたむ")}
                      aria-expanded={!layoutSectionCollapsed}
                      sx={{ ml: 1 }}
                    >
                      {layoutSectionCollapsed ? (
                        <ExpandMoreIcon />
                      ) : (
                        <ExpandLessIcon />
                      )}
                    </IconButton>
                  </Box>
                  <Collapse in={!layoutSectionCollapsed}>
                    <LayoutSelector
                      selectedLayout={selectedLayout}
                      availableLayouts={availableLayouts}
                      streamCount={selectedStreams.length}
                      onLayoutChange={onLayoutChange}
                    />
                    {selectedStreams.length > 0 && (
                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ShareIcon />}
                          onClick={handleShare}
                        >
                          {t("multiview:share.button", "配信とレイアウトを共有")}
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<SaveIcon />}
                          onClick={() => setSaveDialogOpen(true)}
                        >
                          {t(
                            "multiview:customLayout.save",
                            "配信とレイアウトを保存",
                          )}
                        </Button>
                      </Box>
                    )}
                    {/* Saved custom layouts — always visible for restoration */}
                    {customLayouts.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {t(
                            "multiview:customLayout.savedLayouts",
                            "保存済みレイアウト",
                          )}
                        </Typography>
                        {selectedStreams.length === 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontStyle: "italic" }}>
                            {t("multiview:customLayout.noStreamsHint", "配信を追加するとレイアウトが適用されます")}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          {customLayouts.map((preset) => (
                            <Chip
                              key={preset.name}
                              label={preset.name}
                              onClick={() => handleApplyCustomLayout(preset)}
                              onDelete={() =>
                                handleDeleteCustomLayout(preset.name)
                              }
                              deleteIcon={
                                <DeleteOutlineIcon fontSize="small" />
                              }
                              variant="outlined"
                              color="primary"
                              sx={{ maxWidth: 200 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Collapse>
                </Box>

                {/* Playback Controls */}
                {selectedStreams.length > 0 && (
                  <Box>
                    <SectionTitle variant="h6">
                      {t("multiview:playback.title", "再生コントロール")}
                    </SectionTitle>
                    <SimplePlaybackControls
                      streams={selectedStreams}
                      isVisible={true}
                    />
                  </Box>
                )}

              </>
            )}
          </Box>
        </ControlsPanel>
      </Box>

      {/* Save layout dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t("multiview:customLayout.dialogTitle", "配信とレイアウトを保存")}
          <IconButton
            aria-label={t("common:close", "閉じる")}
            onClick={() => setSaveDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t("multiview:customLayout.nameLabel", "レイアウト名")}
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveLayout();
              }
            }}
            inputProps={{ maxLength: 30 }}
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {t(
              "multiview:customLayout.maxHint",
              "最大10個まで保存できます。超過すると古いものから削除されます。",
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>
            {t("common:cancel", "キャンセル")}
          </Button>
          <Button
            onClick={handleSaveLayout}
            variant="contained"
            disabled={!layoutName.trim()}
          >
            {t("common:save", "保存")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visually-hidden live region for screen reader announcements */}
      <Box
        role="status"
        aria-live="polite"
        aria-atomic="true"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
      >
        {selectedStreams.length > 0
          ? t("multiview:status.streamCount", "{{count}}件の配信を表示中", { count: selectedStreams.length })
          : t("multiview:status.noStreams", "配信が選択されていません")}
      </Box>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};
