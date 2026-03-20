import { styled } from "@mui/material/styles";

export const HighlightedVideoChip = styled("div", {
  shouldForwardProp: (prop) => prop !== "highlightColor" && prop !== "bold",
})<{
  highlightColor: string;
  bold: boolean;
}>(({ highlightColor, bold }) => ({
  minWidth: "78px",
  padding: "0 12px",
  color: "white",
  fontSize: "15px",
  fontWeight: bold ? "700" : "400",
  fontFamily: "Roboto, sans-serif",
  textAlign: "center",
  lineHeight: "24px",
  background: highlightColor,
  borderRadius: "12px",
}));
