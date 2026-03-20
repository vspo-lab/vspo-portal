import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import ShareIcon from "@mui/icons-material/Share";
import {
  Avatar,
  BottomNavigation,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link as MuiLink,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React, { useEffect } from "react";
import type { Clip } from "@/features/shared/domain/clip";
import type { Freechat } from "@/features/shared/domain/freechat";
import type { Livestream } from "@/features/shared/domain/livestream";
import type { Platform, Video } from "@/features/shared/domain/video";
import { convertVideoPlayerLink } from "@/features/shared/utils";
import { useTimeZoneContext, useVideoModalContext } from "@/hooks";
import { formatDate } from "@/lib/utils";
import { Link, PlatformIcon } from "..";
import { ChatEmbed } from "../ChatEmbed";
import { HighlightedVideoChip } from "../Chip";

// Styled components
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.vars.palette.customColors.vspoPurple,
  borderBottom: `1px solid ${theme.vars.palette.divider}`,
  padding: theme.spacing(1),
  color: "white",

  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.darkGray,
  },
}));

const StyledDialogContent = styled(DialogContent)({
  overflow: "hidden",
  padding: "0",
});

const TypographySmallOnMobile = styled(Typography)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    fontSize: "1rem",
  },
}));

const TypographySmallOnMobileDescription = styled(Typography)(({ theme }) => ({
  whiteSpace: "pre-wrap",

  [theme.breakpoints.down("sm")]: {
    fontSize: "0.8rem",
  },
}));

const ResponsiveIframeWrapper = styled("div")(({ theme }) => ({
  overflow: "hidden",

  [theme.breakpoints.down("md")]: {
    aspectRatio: "16/9",
  },
}));

const ResponsiveIframe = styled("iframe")({
  width: "100%",
  height: "100%",
  border: "0",
});

interface TabPanelProps {
  value: number;
  index: number;
  children: React.ReactNode;
}

const TabPanelScrollContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflowX: "hidden",
  overflowY: "auto",
  padding: theme.spacing(1),
  ...theme.mixins.scrollbar,
}));

const TabPanel: React.FC<TabPanelProps> = ({ value, index, children }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`livestream tabpanel-${index}`}
      aria-labelledby={`livestream-tab-${index}`}
      style={{ flex: "1", overflow: "hidden" }}
    >
      {value === index && (
        <TabPanelScrollContainer>{children}</TabPanelScrollContainer>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `livestream-tab-${index}`,
    "aria-controls": `livestream tabpanel-${index}`,
  };
};

// Video Player Component (shared by all video types)
const VideoPlayerComponent: React.FC<{ video: Video }> = ({ video }) => {
  const embedUrl = convertVideoPlayerLink({
    videoPlayerLink: video.videoPlayerLink ?? "",
    platform: video.platform,
  });

  return (
    <ResponsiveIframeWrapper>
      <ResponsiveIframe
        key={embedUrl}
        src={embedUrl}
        title={`${video.platform} video player`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
        loading="lazy"
      />
    </ResponsiveIframeWrapper>
  );
};

const VideoPlayer = React.memo(VideoPlayerComponent);

// Base presenter props for all video types
interface BaseInfoTabsPresenterProps {
  video: Video;
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  urlRegex: RegExp;
}

// Livestream specific presenter
const LivestreamInfoTabsPresenter: React.FC<
  BaseInfoTabsPresenterProps & { video: Livestream }
> = ({ video, tabValue, onTabChange, urlRegex }) => {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const { timeZone } = useTimeZoneContext();

  const formattedStartTime = formatDate(
    video.scheduledStartTime || "",
    "MM/dd HH:mm~",
    { timeZone },
  );

  const showChatTab =
    (video.platform === "youtube" && video.status !== "ended") ||
    (video.platform === "twitch" && video.status !== "ended");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={onTabChange}
          aria-label="livestream tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t("videoModal.tabLabels.overview")} {...a11yProps(0)} />
          {/* <Tab
            label={t("videoModal.tabLabels.relatedVideos")}
            {...a11yProps(1)}
          /> */}
          {showChatTab && (
            <Tab label={t("videoModal.tabLabels.chat")} {...a11yProps(1)} />
          )}
        </Tabs>
      </Box>
      <TabPanel value={tabValue} index={0}>
        <Box>
          <TypographySmallOnMobile variant="h5">
            {video.title}
          </TypographySmallOnMobile>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              marginTop: "10px",
            }}
          >
            <TypographySmallOnMobile sx={{ marginRight: "10px" }}>
              {formattedStartTime}
            </TypographySmallOnMobile>
            {(video.status === "live" || video.status === "upcoming") && (
              <HighlightedVideoChip
                highlightColor={
                  theme.vars.palette.customColors.videoHighlight[video.status]
                }
                bold
              >
                {t(`liveStatus.${video.status}`)}
              </HighlightedVideoChip>
            )}
          </Box>
        </Box>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 2,
              mb: 2,
            }}
          >
            <Avatar src={video.channelThumbnailUrl} />
            <TypographySmallOnMobile variant="h6" style={{ marginLeft: 8 }}>
              {video.channelTitle}
            </TypographySmallOnMobile>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 2,
              mb: 2,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              {video.link && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={
                    <PlatformIcon platform={video.platform as Platform} />
                  }
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: "none",
                  }}
                >
                  {t("videoModal.watch")}
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ShareIcon />}
                onClick={async () => {
                  if (navigator.share) {
                    await navigator
                      .share({
                        title: video.title,
                        text: video.title,
                        url: video.link,
                      })
                      .catch((error) => {
                        console.error("Share failed:", error);
                      });
                  } else {
                    console.log(
                      "Your system does not support the Web Share API",
                    );
                  }
                }}
              >
                {t("videoModal.share")}
              </Button>
            </Box>
          </Box>
        </Box>
        <TypographySmallOnMobileDescription variant="body1">
          {video.description.split(urlRegex).map((text, index) => {
            if (index % 2 === 0) {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: Split produces stable order
                <React.Fragment key={`text-${index}`}>{text}</React.Fragment>
              );
            }
            return (
              <MuiLink
                href={text}
                target="_blank"
                rel="noopener noreferrer"
                // biome-ignore lint/suspicious/noArrayIndexKey: Split produces stable order
                key={`link-${index}`}
              >
                {text}
              </MuiLink>
            );
          })}
        </TypographySmallOnMobileDescription>
      </TabPanel>
      {showChatTab && (
        <TabPanel value={tabValue} index={1}>
          <ChatEmbed livestream={video} />
        </TabPanel>
      )}
    </Box>
  );
};

// Freechat specific presenter
const FreechatInfoTabsPresenter: React.FC<
  BaseInfoTabsPresenterProps & { video: Freechat }
> = ({ video, tabValue, onTabChange, urlRegex }) => {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const { timeZone } = useTimeZoneContext();

  const formattedStartTime = formatDate(
    video.scheduledStartTime || "",
    "MM/dd HH:mm~",
    { timeZone },
  );

  const showChatTab = video.platform === "youtube" && video.status !== "ended";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={onTabChange}
          aria-label="freechat tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t("videoModal.tabLabels.overview")} {...a11yProps(0)} />
          {/* <Tab
            label={t("videoModal.tabLabels.relatedVideos")}
            {...a11yProps(1)}
          /> */}
          {showChatTab && (
            <Tab label={t("videoModal.tabLabels.chat")} {...a11yProps(2)} />
          )}
        </Tabs>
      </Box>
      <TabPanel value={tabValue} index={0}>
        <Box>
          <TypographySmallOnMobile variant="h5">
            {video.title}
          </TypographySmallOnMobile>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              marginTop: "10px",
            }}
          >
            <TypographySmallOnMobile sx={{ marginRight: "10px" }}>
              {formattedStartTime}
            </TypographySmallOnMobile>
            {(video.status === "live" || video.status === "upcoming") && (
              <HighlightedVideoChip
                highlightColor={
                  theme.vars.palette.customColors.videoHighlight[video.status]
                }
                bold
              >
                {t(`liveStatus.${video.status}`)}
              </HighlightedVideoChip>
            )}
          </Box>
        </Box>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 2,
              mb: 2,
            }}
          >
            <Avatar src={video.channelThumbnailUrl} />
            <TypographySmallOnMobile variant="h6" style={{ marginLeft: 8 }}>
              {video.channelTitle}
            </TypographySmallOnMobile>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 2,
              mb: 2,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              {video.link && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={
                    <PlatformIcon platform={video.platform as Platform} />
                  }
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: "none",
                  }}
                >
                  {t("videoModal.watch")}
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ShareIcon />}
                onClick={async () => {
                  if (navigator.share) {
                    await navigator
                      .share({
                        title: video.title,
                        text: video.title,
                        url: video.link,
                      })
                      .catch((error) => {
                        console.error("Share failed:", error);
                      });
                  } else {
                    console.log(
                      "Your system does not support the Web Share API",
                    );
                  }
                }}
              >
                {t("videoModal.share")}
              </Button>
            </Box>
          </Box>
        </Box>
        <TypographySmallOnMobileDescription variant="body1">
          {video.description.split(urlRegex).map((text, index) => {
            if (index % 2 === 0) {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: Split produces stable order
                <React.Fragment key={`text-${index}`}>{text}</React.Fragment>
              );
            }
            return (
              <MuiLink
                href={text}
                target="_blank"
                rel="noopener noreferrer"
                // biome-ignore lint/suspicious/noArrayIndexKey: Split produces stable order
                key={`link-${index}`}
              >
                {text}
              </MuiLink>
            );
          })}
        </TypographySmallOnMobileDescription>
      </TabPanel>
      {showChatTab && (
        <TabPanel value={tabValue} index={1}>
          <ChatEmbed livestream={video} />
        </TabPanel>
      )}
    </Box>
  );
};

// Clip specific presenter
const ClipInfoTabsPresenter: React.FC<
  BaseInfoTabsPresenterProps & { video: Clip }
> = ({ video, tabValue, onTabChange, urlRegex }) => {
  const { t } = useTranslation("common");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={onTabChange}
          aria-label="clip tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t("videoModal.tabLabels.overview")} {...a11yProps(0)} />
          {/* <Tab
            label={t("videoModal.tabLabels.relatedVideos")}
            {...a11yProps(1)}
          /> */}
        </Tabs>
      </Box>
      <TabPanel value={tabValue} index={0}>
        <Box>
          <TypographySmallOnMobile variant="h5">
            {video.title}
          </TypographySmallOnMobile>
        </Box>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 2,
              mb: 2,
            }}
          >
            <Avatar src={video.channelThumbnailUrl} />
            <TypographySmallOnMobile variant="h6" style={{ marginLeft: 8 }}>
              {video.channelTitle}
            </TypographySmallOnMobile>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mt: 2,
              mb: 2,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              {video.link && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={
                    <PlatformIcon platform={video.platform as Platform} />
                  }
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: "none",
                  }}
                >
                  {t("videoModal.watch")}
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ShareIcon />}
                onClick={async () => {
                  if (navigator.share) {
                    await navigator
                      .share({
                        title: video.title,
                        text: video.title,
                        url: video.link,
                      })
                      .catch((error) => {
                        console.error("Share failed:", error);
                      });
                  } else {
                    console.log(
                      "Your system does not support the Web Share API",
                    );
                  }
                }}
              >
                {t("videoModal.share")}
              </Button>
            </Box>
          </Box>
        </Box>
        <TypographySmallOnMobileDescription variant="body1">
          {video.description.split(urlRegex).map((text, index) => {
            if (index % 2 === 0) {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: Split produces stable order
                <React.Fragment key={`text-${index}`}>{text}</React.Fragment>
              );
            }
            return (
              <MuiLink
                href={text}
                target="_blank"
                rel="noopener noreferrer"
                // biome-ignore lint/suspicious/noArrayIndexKey: Split produces stable order
                key={`link-${index}`}
              >
                {text}
              </MuiLink>
            );
          })}
        </TypographySmallOnMobileDescription>
      </TabPanel>
    </Box>
  );
};

// Container component for InfoTabs
const InfoTabsContainer: React.FC<{ video: Video }> = ({ video }) => {
  const [tabValue, setTabValue] = React.useState(0);
  const urlRegex = /(https?:\/\/\S+)/;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Render the appropriate presenter based on video type
  if (video.type === "livestream") {
    return (
      <LivestreamInfoTabsPresenter
        video={video as Livestream}
        tabValue={tabValue}
        onTabChange={handleTabChange}
        urlRegex={urlRegex}
      />
    );
  }
  if (video.type === "freechat") {
    return (
      <FreechatInfoTabsPresenter
        video={video as Freechat}
        tabValue={tabValue}
        onTabChange={handleTabChange}
        urlRegex={urlRegex}
      />
    );
  }
  if (video.type === "clip") {
    return (
      <ClipInfoTabsPresenter
        video={video as Clip}
        tabValue={tabValue}
        onTabChange={handleTabChange}
        urlRegex={urlRegex}
      />
    );
  }

  // Fallback for unknown video types
  return null;
};

// Presenter component for the entire VideoModal
interface VideoModalPresenterProps {
  isOpen: boolean;
  activeVideo: Video | undefined;
  onClose: () => void;
  onBack: () => void;
}

const VideoModalPresenter: React.FC<VideoModalPresenterProps> = ({
  isOpen,
  activeVideo,
  onClose,
  onBack,
}) => {
  const { t } = useTranslation("common");

  return (
    <Dialog open={isOpen} fullScreen>
      <StyledDialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box
            onClick={onClose}
            component={Link}
            href={"/schedule/all"}
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <Image
              src="/icon-top_transparent.png"
              alt="Page Icon"
              width={30}
              height={30}
            />
            <TypographySmallOnMobile
              sx={{ fontWeight: "bold", paddingTop: "3px" }}
            >
              {t("spodule")}
            </TypographySmallOnMobile>
          </Box>
        </Box>
      </StyledDialogTitle>
      <Box
        sx={{
          position: "absolute",
          top: 3,
          right: 0,
        }}
      >
        <IconButton onClick={onClose}>
          <CloseIcon style={{ color: "white" }} />
        </IconButton>
      </Box>
      {activeVideo && (
        <StyledDialogContent
          key={activeVideo.id}
          sx={{
            display: "grid",
            grid: {
              // 2 rows, 1 col
              // InfoTabs fills vertical space left below VideoPlayer
              xs: "auto minmax(0, 1fr) / 1fr",
              // 1 row, 2 cols
              // VideoPlayer spans 2/3 dialog width, InfoTabs spans 1/3
              md: "minmax(0, 1fr) / 2fr 1fr",
            },
          }}
        >
          <VideoPlayer video={activeVideo} />
          <InfoTabsContainer video={activeVideo} />
        </StyledDialogContent>
      )}
      <BottomNavigation
        sx={{
          flex: "none",
          borderTop: "1px solid #ddd",
          height: "60px",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ height: "100%", borderRadius: 0 }}
          onClick={onBack}
          color="inherit"
        >
          {t("back")}
        </Button>
        <Typography
          variant="body1"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "80%",
            textAlign: "left",
            paddingLeft: "8px",
            paddingRight: "8px",
          }}
        >
          {activeVideo?.title}
        </Typography>
      </BottomNavigation>
    </Dialog>
  );
};

// Container component for the entire VideoModal
export const VideoModal: React.FC = () => {
  const _router = useRouter();
  const { activeVideo, popVideo, clearVideos } = useVideoModalContext();

  // Clear video modal on url changes
  useEffect(() => {
    clearVideos();
  }, [clearVideos]);

  return (
    <VideoModalPresenter
      isOpen={activeVideo !== undefined}
      activeVideo={activeVideo}
      onClose={clearVideos}
      onBack={popVideo}
    />
  );
};
