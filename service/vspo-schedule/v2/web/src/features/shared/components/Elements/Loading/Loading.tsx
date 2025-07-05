import { CircularProgress } from "@mui/material";
import { Box } from "@mui/system";
import type React from "react";

export const Loading: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
};
