import { Box, Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";

const SkeletonCard = styled(Box)(({ theme }) => ({
  borderRadius: "12px",
  overflow: "hidden",
  backgroundColor: theme.vars.palette.background.paper,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
}));

const SkeletonContent = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(1.5)}`,
  [theme.breakpoints.down("sm")]: {
    padding: `${theme.spacing(0.75)} ${theme.spacing(0.75)} ${theme.spacing(1)}`,
  },
}));

/** Skeleton placeholder matching VideoCard + LivestreamCard layout (16:9 thumbnail, title, creator, avatar/time) */
export const VideoCardSkeleton: React.FC = () => {
  return (
    <SkeletonCard>
      {/* 16:9 thumbnail area */}
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{ paddingTop: "56.25%", width: "100%" }}
      />
      <SkeletonContent>
        {/* Title - 2 lines matching TitleTypography height */}
        <Skeleton animation="wave" height={16} width="90%" sx={{ mb: 0.5 }} />
        <Skeleton animation="wave" height={16} width="65%" sx={{ mb: 0.75 }} />
        {/* Creator name */}
        <Skeleton animation="wave" height={14} width="45%" sx={{ mb: 1 }} />
        {/* Avatar + time row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Skeleton
            variant="circular"
            animation="wave"
            width={36}
            height={36}
            sx={{
              flexShrink: 0,
              width: { xs: 28, sm: 36 },
              height: { xs: 28, sm: 36 },
            }}
          />
          <Skeleton animation="wave" height={14} width={60} />
        </Box>
      </SkeletonContent>
    </SkeletonCard>
  );
};
