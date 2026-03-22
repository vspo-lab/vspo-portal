"use client";

import { Box, Skeleton } from "@mui/material";

export const MultiviewSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Box
      sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={`multiview-skeleton-${i}`}
          variant="rectangular"
          height={200}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Box>
  </Box>
);
