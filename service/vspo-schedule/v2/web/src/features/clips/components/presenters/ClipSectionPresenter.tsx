import type { Clip } from "@/features/shared/domain";
import { useVideoModalContext } from "@/hooks/video-modal";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "next-i18next";
import type React from "react";

// Styled components
const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(4),
  position: "relative",
  display: "inline-block",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: -5,
    left: 0,
    width: "100%",
    height: 3,
    background: theme.vars.palette.primary.main,
    borderRadius: theme.shape.borderRadius,
  },
}));

const ViewMoreButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  alignSelf: "flex-end",
}));

const SectionContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
}));

// Single row container with horizontal scroll
const SingleRowContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    display: "none",
  },
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(1),
}));

// Modern card style
const ModernCard = styled(Card)(({ theme }) => ({
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius * 2,
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  height: "100%",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 12px 20px rgba(0, 0, 0, 0.15)",
  },
}));

const CardMediaWrapper = styled(Box)(() => ({
  position: "relative",
  overflow: "hidden",
}));

const CardOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
  padding: theme.spacing(1, 2),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "white",
}));

const ShortsCard = styled(Card)(({ theme }) => ({
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius * 2,
  height: "100%",
  aspectRatio: "9/16",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 12px 20px rgba(0, 0, 0, 0.15)",
  },
}));

export type ClipSectionPresenterProps = {
  title: string;
  clips: Clip[];
  type?: "youtube" | "shorts" | "twitch";
  onViewMore?: () => void;
  singleRow?: boolean;
};

export const ClipSectionPresenter: React.FC<ClipSectionPresenterProps> = ({
  title,
  clips,
  type = "youtube",
  onViewMore,
  singleRow = false,
}) => {
  const { pushVideo } = useVideoModalContext();
  const { t } = useTranslation("clips");

  const renderShortsInSingleRow = () => {
    return (
      <SingleRowContainer>
        {clips.map((clip) => (
          <Box key={clip.id} sx={{ width: "180px", flexShrink: 0 }}>
            <ShortsCard>
              <CardActionArea onClick={() => pushVideo(clip)}>
                <CardMedia
                  component="img"
                  height="320px"
                  image={clip.thumbnailUrl}
                  alt={clip.title}
                  sx={{ aspectRatio: "9/16" }}
                />
                <CardOverlay>
                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption">
                      {typeof clip.viewCount === "number"
                        ? clip.viewCount.toLocaleString()
                        : clip.viewCount}
                    </Typography>
                  </Box>
                </CardOverlay>
              </CardActionArea>
            </ShortsCard>
          </Box>
        ))}
      </SingleRowContainer>
    );
  };

  const renderClipsInSingleRow = () => {
    return (
      <SingleRowContainer>
        {clips.map((clip) => (
          <Box key={clip.id} sx={{ width: "280px", flexShrink: 0 }}>
            <ModernCard>
              <CardActionArea onClick={() => pushVideo(clip)}>
                <CardMediaWrapper>
                  <CardMedia
                    component="img"
                    height="158px"
                    image={
                      clip.thumbnailUrl || "/images/placeholder-thumbnail.jpg"
                    }
                    alt={clip.title}
                  />
                  <CardOverlay>
                    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                      <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption">
                        {typeof clip.viewCount === "number"
                          ? clip.viewCount.toLocaleString()
                          : clip.viewCount}
                      </Typography>
                    </Box>
                  </CardOverlay>
                </CardMediaWrapper>
                <CardContent>
                  <Typography
                    gutterBottom
                    variant="subtitle2"
                    component="div"
                    noWrap
                  >
                    {clip.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {clip.channelTitle}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </ModernCard>
          </Box>
        ))}
      </SingleRowContainer>
    );
  };

  const renderClips = () => {
    if (singleRow) {
      return type === "shorts"
        ? renderShortsInSingleRow()
        : renderClipsInSingleRow();
    }

    if (type === "shorts") {
      return (
        <Grid container spacing={2}>
          {clips.map((clip) => (
            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={clip.id}>
              <ShortsCard>
                <CardActionArea onClick={() => pushVideo(clip)}>
                  <CardMedia
                    component="img"
                    height="100%"
                    image={
                      clip.thumbnailUrl || "/images/placeholder-thumbnail.jpg"
                    }
                    alt={clip.title}
                    sx={{ aspectRatio: "9/16" }}
                  />
                  <CardOverlay>
                    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                      <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption">
                        {typeof clip.viewCount === "number"
                          ? clip.viewCount.toLocaleString()
                          : clip.viewCount}
                      </Typography>
                    </Box>
                  </CardOverlay>
                </CardActionArea>
              </ShortsCard>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Grid container spacing={3}>
        {clips.map((clip) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={clip.id}>
            <ModernCard>
              <CardActionArea onClick={() => pushVideo(clip)}>
                <CardMediaWrapper>
                  <CardMedia
                    component="img"
                    height="180"
                    image={
                      clip.thumbnailUrl || "/images/placeholder-thumbnail.jpg"
                    }
                    alt={clip.title}
                  />
                  <CardOverlay>
                    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                      <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption">
                        {typeof clip.viewCount === "number"
                          ? clip.viewCount.toLocaleString()
                          : clip.viewCount}
                      </Typography>
                    </Box>
                  </CardOverlay>
                </CardMediaWrapper>
                <CardContent>
                  <Typography
                    gutterBottom
                    variant="subtitle1"
                    component="div"
                    noWrap
                  >
                    {clip.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {clip.channelTitle}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </ModernCard>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <SectionContainer>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <SectionTitle variant="h5">{title}</SectionTitle>
        {onViewMore && (
          <ViewMoreButton
            endIcon={<ArrowForwardIcon />}
            onClick={onViewMore}
            color="primary"
          >
            {t("home.viewMore", "View More")}
          </ViewMoreButton>
        )}
      </Box>
      {renderClips()}
    </SectionContainer>
  );
};
