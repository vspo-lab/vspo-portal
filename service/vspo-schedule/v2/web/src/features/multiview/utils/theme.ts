import type { Theme } from "@mui/material";

/**
 * Scales the theme's border radius by the given factor.
 * Handles both numeric and string-based borderRadius values.
 */
export const scaledBorderRadius = (theme: Theme, scale: number) =>
  typeof theme.shape.borderRadius === "number"
    ? theme.shape.borderRadius * scale
    : `calc(${theme.shape.borderRadius} * ${scale})`;
