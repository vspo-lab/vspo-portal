import { Loading } from "@/features/shared/components/Elements";
import { Livestream } from "@/features/shared/domain";
import AddLinkIcon from "@mui/icons-material/AddLink";
import ChatIcon from "@mui/icons-material/Chat";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GridViewIcon from "@mui/icons-material/GridView";
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
  saveCustomLayout,
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
  onToggleChat,
  onRemoveChat,
}) => {
  const { t } = useTranslation(["multiview", "common"]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  // Controls panel collapsed by default on large screens (dashboard style)
  const [controlsPanelCollapsed, setControlsPanelCollapsed] =
    React.useState(true);
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

    saveCustomLayout(trimmedName, {
      type: selectedLayout,
      gridPositions: gridPositionsRef.current,
    });
    setCustomLayouts(loadCustomLayouts());
    setSaveDialogOpen(false);
    setLayoutName("");
    setSnackbarMessage(
      t("multiview:customLayout.saved", "レイアウトを保存しました"),
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

  // Apply a saved custom layout
  const handleApplyCustomLayout = React.useCallback(
    (preset: CustomLayoutPreset) => {
      onLayoutChange(preset.layout.type);
      setExternalGridPositions(preset.layout.gridPositions);
    },
    [onLayoutChange],
  );

  // Toggle immersive mode: hide header, footer, bottom nav for maximum viewing area
  const toggleImmersiveMode = React.useCallback(() => {
    setImmersiveMode((prev) => {
      const next = !prev;
      document.documentElement.dataset.immersive = next ? "true" : "false";
      return next;
    });
  }, []);

  // Escape key exits immersive mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setImmersiveMode(false);
        document.documentElement.dataset.immersive = "false";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  if (isProcessing) {
    return <Loading />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        [theme.getColorSchemeSelector("dark")]: {
          backgroundColor: theme.vars.palette.customColors.darkGray,
          color: "white",
        },
      }}
    >
      {/* Compact Header Bar - hidden in immersive mode */}
      {!immersiveMode && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: { xs: 1, sm: 1.5, md: 2 },
            py: 1,
            backgroundColor: "transparent",
          }}
        >
          <GridViewIcon
            sx={{
              mr: 1,
              color: theme.palette.primary.main,
              fontSize: "1.2rem",
            }}
          />
          <Typography
            variant="h6"
            fontWeight={700}
            fontSize={isMobile ? "1rem" : "1.2rem"}
            sx={{
              [theme.getColorSchemeSelector("dark")]: {
                color: "white",
              },
            }}
          >
            {t("multiview:title", "マルチビュー")}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              ml: 2,
              [theme.getColorSchemeSelector("dark")]: {
                color: "rgba(255, 255, 255, 0.7)",
              },
            }}
          >
            {t(
              "multiview:description",
              "複数の配信を同時に視聴できます。",
            )}
          </Typography>
        </Box>
      )}

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
            bottom: theme.spacing(3),
            right: theme.spacing(3),
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
                  ? t("multiview:controlPanel.show", "レイアウト設定を表示")
                  : t("multiview:controlPanel.hide", "レイアウト設定を隠す")
              }
              placement="left"
            >
              <IconButton
                onClick={() =>
                  setControlsPanelCollapsed(!controlsPanelCollapsed)
                }
                aria-label={
                  controlsPanelCollapsed
                    ? t("multiview:controlPanel.show", "レイアウト設定を表示")
                    : t("multiview:controlPanel.hide", "レイアウト設定を隠す")
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
              bottom: theme.spacing(3),
              right: theme.spacing(3),
              zIndex: 1200,
              opacity: 0,
              transition: "opacity 0.3s ease",
              "&:hover": { opacity: 1 },
              // Show briefly on touch devices
              "@media (hover: none)": { opacity: 0.5 },
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
                      {t("multiview:layout.title", "レイアウト設定")}
                    </SectionTitle>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setLayoutSectionCollapsed(!layoutSectionCollapsed)
                      }
                      aria-label={layoutSectionCollapsed ? t("multiview:expand", "展開") : t("multiview:collapse", "折りたたむ")}
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
                          {t("multiview:share.button", "レイアウトを共有")}
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<SaveIcon />}
                          onClick={() => setSaveDialogOpen(true)}
                        >
                          {t(
                            "multiview:customLayout.save",
                            "レイアウトを保存",
                          )}
                        </Button>
                      </Box>
                    )}
                    {/* Saved custom layouts */}
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

                {/* Chat Toggle - per selected stream */}
                {selectedStreams.length > 0 && (
                  <Box>
                    <SectionTitle variant="h6">
                      <ChatIcon
                        sx={{
                          mr: 1,
                          verticalAlign: "middle",
                          fontSize: "1.2rem",
                        }}
                      />
                      {t("multiview:chat.sectionTitle", "チャット")}
                    </SectionTitle>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      {selectedStreams
                        .filter(
                          (stream) =>
                            stream.platform === "youtube" ||
                            stream.platform === "twitch",
                        )
                        .map((stream) => {
                          const hasChatOpen = chatStreamIds.has(stream.id);
                          return (
                            <Chip
                              key={`chat-toggle-${stream.id}`}
                              icon={
                                hasChatOpen ? (
                                  <ChatIcon />
                                ) : (
                                  <ChatBubbleOutlineIcon />
                                )
                              }
                              label={stream.channelTitle}
                              onClick={() => onToggleChat(stream.id)}
                              color={hasChatOpen ? "primary" : "default"}
                              variant={hasChatOpen ? "filled" : "outlined"}
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
                          );
                        })}
                      {selectedStreams.filter(
                        (s) =>
                          s.platform === "youtube" || s.platform === "twitch",
                      ).length === 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {t(
                            "multiview:chat.noSupported",
                            "チャット対応の配信がありません",
                          )}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

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
          {t("multiview:customLayout.dialogTitle", "レイアウトを保存")}
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
