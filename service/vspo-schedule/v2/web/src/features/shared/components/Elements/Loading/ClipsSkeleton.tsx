"use client";

import { Box, Skeleton } from "@mui/material";

export const ClipsSkeleton = () => (
  <Box sx={{ py: 2 }}>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={`clip-skeleton-${i}`}
          variant="rectangular"
          width={280}
          height={160}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Box>
  </Box>
);
