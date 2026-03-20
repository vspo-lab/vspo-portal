import { keyframes, styled } from "@mui/material/styles";

const livePulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

export const HighlightedVideoChip = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "highlightColor" && prop !== "bold" && prop !== "isLive",
})<{
  highlightColor: string;
  bold: boolean;
  isLive?: boolean;
}>(({ highlightColor, bold, isLive }) => ({
  minWidth: "78px",
  padding: "0 12px",
  color: "white",
  fontSize: "0.75rem",
  fontWeight: bold ? "700" : "400",
  fontFamily: "Roboto, sans-serif",
  textAlign: "center",
  lineHeight: "24px",
  background: highlightColor,
  borderRadius: "12px",
  ...(isLive && {
    animation: `${livePulse} 2s ease-in-out infinite`,
  }),
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
}));
