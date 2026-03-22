"use client";

import { Box, Skeleton } from "@mui/material";

export const FreechatSkeleton = () => (
  <Box sx={{ py: 2 }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton
        key={`freechat-skeleton-${i}`}
        variant="rectangular"
        height={120}
        sx={{ mb: 2, borderRadius: 1 }}
      />
    ))}
  </Box>
);
