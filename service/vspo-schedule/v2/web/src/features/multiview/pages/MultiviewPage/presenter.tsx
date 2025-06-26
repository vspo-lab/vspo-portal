import { Loading } from "@/features/shared/components/Elements";
import { Livestream } from "@/features/shared/domain";
import AddLinkIcon from "@mui/icons-material/AddLink";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import GridViewIcon from "@mui/icons-material/GridView";
import ShareIcon from "@mui/icons-material/Share";
import TuneIcon from "@mui/icons-material/Tune";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import {
  Box,
  Button,
  Collapse,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Tooltip,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React from "react";
import GridLayout from "react-grid-layout";
import {
  LayoutSelector,
  MultiviewGrid,
  SimplePlaybackControls,
  StreamSelector,
  UrlInput,
} from "../../components/containers";
import { LayoutType, useMultiviewLayout } from "../../hooks/useMultiviewLayout";

// Styled components
const HeaderSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: "white",
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  border: `1px solid ${theme.palette.grey[300]}`,
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
    border: `1px solid ${theme.palette.grey[700]}`,
  },
}));

const HeaderTitle = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1),
  color: theme.palette.text.primary,
  [theme.getColorSchemeSelector("dark")]: {
    color: "white",
  },
}));

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
    width: "450px",
    maxHeight: "80vh",
    overflowY: "auto",
    overflowX: "hidden",
    padding: theme.spacing(3),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    boxShadow: theme.shadows[8],
    borderRadius: theme.shape.borderRadius * 2,
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
  selectedLayout: LayoutType;
  isProcessing: boolean;
  shareableUrl: string;
  onStreamSelection: (stream: Livestream) => void;
  onRemoveStream: (streamId: string) => void;
  onLayoutChange: (layout: LayoutType) => void;
  onStreamReorder: (activeId: string, overId: string) => void;
  onManualStreamAdd: (stream: Livestream) => void;
  onGridLayoutChange?: (layout: GridLayout.Layout[]) => void;
  savedGridLayout?: Array<{ x: number; y: number; w: number; h: number }>;
};

export const Presenter: React.FC<MultiviewPagePresenterProps> = ({
  livestreams,
  selectedStreams,
  selectedLayout,
  isProcessing,
  shareableUrl,
  onStreamSelection,
  onRemoveStream,
  onLayoutChange,
  onStreamReorder,
  onManualStreamAdd,
  onGridLayoutChange,
  savedGridLayout,
}) => {
  const { t } = useTranslation(["multiview", "common"]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const [controlsPanelCollapsed, setControlsPanelCollapsed] =
    React.useState(false);
  const [layoutSectionCollapsed, setLayoutSectionCollapsed] =
    React.useState(false);
  const [urlInputCollapsed, setUrlInputCollapsed] = React.useState(false);
  const [streamSelectorCollapsed, setStreamSelectorCollapsed] =
    React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Toggle fullscreen
  const toggleFullscreen = React.useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
      ref={containerRef}
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
      {/* Header */}
      <Container
        maxWidth={false}
        sx={{
          pt: 2,
          pb: 1,
          backgroundColor: "transparent",
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <HeaderSection elevation={1}>
          <HeaderTitle>
            <GridViewIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography
              variant="h4"
              fontWeight={700}
              fontSize={isMobile ? "1.5rem" : "2rem"}
              sx={{
                [theme.getColorSchemeSelector("dark")]: {
                  color: "white",
                },
              }}
            >
              {t("multiview:title", "マルチビュー")}
            </Typography>
          </HeaderTitle>
          <Typography
            variant="body1"
            color="text.secondary"
            fontSize={isMobile ? "0.875rem" : "1rem"}
            sx={{
              [theme.getColorSchemeSelector("dark")]: {
                color: "rgba(255, 255, 255, 0.7)",
              },
            }}
          >
            {t(
              "multiview:description",
              "複数の配信を同時に視聴できます。最大9つまで選択可能です。",
            )}
          </Typography>
        </HeaderSection>
      </Container>

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
            px: { xs: 0.5, sm: 1, md: 2 },
            pb: 2,
            pr:
              isLargeScreen && !controlsPanelCollapsed
                ? "470px"
                : { xs: 0.5, sm: 1, md: 2 }, // Space for fixed controls on large screens
            transition: "padding-right 0.3s ease", // Smooth transition when panel opens/closes
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
              selectedLayout={selectedLayout}
              onRemoveStream={onRemoveStream}
              onStreamReorder={onStreamReorder}
              onLayoutChange={onGridLayoutChange}
              savedGridLayout={savedGridLayout}
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
              bottom: theme.spacing(12), // Higher on mobile to avoid bottom navigation
              right: theme.spacing(2),
            },
          }}
        >
          {/* Toggle Controls Panel Button - Only on large screens */}
          {isLargeScreen && (
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

          {/* Fullscreen Button */}
          <Tooltip
            title={
              isFullscreen
                ? t("multiview:fullscreen.exit", "全画面を終了")
                : t("multiview:fullscreen.enter", "全画面表示")
            }
            placement={isLargeScreen ? "left" : "top"}
          >
            <IconButton
              onClick={toggleFullscreen}
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
              {isFullscreen ? (
                <FullscreenExitIcon sx={{ fontSize: 32 }} />
              ) : (
                <FullscreenIcon sx={{ fontSize: 32 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Controls Panel - Fixed on large screens, normal flow on mobile */}
        <ControlsPanel
          elevation={4}
          collapsed={controlsPanelCollapsed && isLargeScreen}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {(!controlsPanelCollapsed || !isLargeScreen) && (
              <>
                {/* Stream Selector - First */}
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
                      livestreams={livestreams}
                      selectedStreams={selectedStreams}
                      onStreamSelection={onStreamSelection}
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
                      maxStreams={9}
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

                {/* Share Button */}
                {selectedStreams.length > 0 && (
                  <Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ShareIcon />}
                      onClick={handleShare}
                      sx={{ mt: 2 }}
                    >
                      {t("multiview:share.button", "レイアウトを共有")}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </ControlsPanel>
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
