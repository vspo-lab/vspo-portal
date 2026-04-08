"use client";

import { Box, Container, Skeleton } from "@mui/material";

export const ScheduleSkeleton = () => (
  <Container maxWidth="lg" sx={{ pt: 2, pb: 4, pl: 0, pr: 0 }}>
    <Skeleton variant="rectangular" height={48} sx={{ mb: 4 }} />
    {Array.from({ length: 6 }).map((_, i) => (
      <Box key={`schedule-skeleton-${i}`} sx={{ mb: 2 }}>
        <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton
              key={`schedule-card-${i}-${j}`}
              variant="rectangular"
              width={200}
              height={150}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Box>
      </Box>
    ))}
  </Container>
);
