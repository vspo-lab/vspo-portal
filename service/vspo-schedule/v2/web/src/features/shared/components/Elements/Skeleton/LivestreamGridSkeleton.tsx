import Grid from "@mui/material/Grid";
import { VideoCardSkeleton } from "./VideoCardSkeleton";

/** Grid of skeleton cards matching the livestream schedule layout */
export const LivestreamGridSkeleton: React.FC = () => {
  return (
    <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <Grid key={i} size={{ xs: 6, sm: 6, md: 4 }}>
          <VideoCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
};
