import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import {
  Box,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type React from "react";
import { useEffect, useState } from "react";
import type { Clip } from "@/features/shared/domain";
import { useVideoModalContext } from "@/hooks";

const CarouselContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  marginBottom: theme.spacing(6),
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  height: 400,
  [theme.breakpoints.down("sm")]: {
    height: 250,
    marginBottom: theme.spacing(4),
  },
}));

const CarouselSlide = styled(Box)(() => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  transition: "opacity 0.5s ease-in-out",
  "&.active": {
    opacity: 1,
    zIndex: 1,
  },
}));

const CarouselImage = styled("img")(() => ({
  width: "100%",
  height: "100%",
  objectFit: "contain",
  backgroundColor: "black",
}));

const CarouselContent = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  width: "100%",
  padding: theme.spacing(3),
  background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
  color: "white",
  zIndex: 2,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5),
  },
}));

const CarouselControls = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  zIndex: 3,
  padding: theme.spacing(0, 2),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 1),
  },
}));

const CarouselButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.common.white, 0.3),
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.5),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0.5),
    "& svg": {
      fontSize: "1.25rem",
    },
  },
}));

export type ClipCarouselPresenterProps = {
  clips: Clip[];
};

export const ClipCarouselPresenter: React.FC<ClipCarouselPresenterProps> = ({
  clips,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const { pushVideo } = useVideoModalContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % clips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [clips.length]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % clips.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + clips.length) % clips.length);
  };

  return (
    <CarouselContainer>
      {clips.map((clip, index) => (
        <CarouselSlide
          key={clip.id}
          className={index === activeSlide ? "active" : ""}
          onClick={() => pushVideo(clip)}
          sx={{ cursor: "pointer" }}
        >
          <CarouselImage src={clip.thumbnailUrl} alt={clip.title} />
          <CarouselContent>
            <Typography
              variant={isMobile ? "subtitle1" : "h5"}
              fontWeight="bold"
              gutterBottom
              sx={{
                fontSize: isMobile ? "1rem" : undefined,
                lineHeight: isMobile ? 1.2 : undefined,
              }}
            >
              {clip.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: isMobile ? "0.75rem" : undefined }}
            >
              {clip.channelTitle}
            </Typography>
          </CarouselContent>
        </CarouselSlide>
      ))}

      <CarouselControls>
        <CarouselButton onClick={handlePrevSlide}>
          <NavigateBeforeIcon />
        </CarouselButton>
        <CarouselButton onClick={handleNextSlide}>
          <NavigateNextIcon />
        </CarouselButton>
      </CarouselControls>
    </CarouselContainer>
  );
};
