import {
  AutoAwesome,
  GridViewOutlined,
  PictureInPictureOutlined,
  ViewArrayOutlined,
  ViewColumnOutlined,
  ViewCompactOutlined,
  ViewModuleOutlined,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  alpha,
  styled,
  useMediaQuery,
  useTheme,
  type Theme,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import type { TFunction } from "next-i18next";
import React from "react";
import { LayoutType } from "../../hooks/useMultiviewLayout";

const scaledBorderRadius = (theme: Theme, scale: number) =>
  typeof theme.shape.borderRadius === "number"
    ? theme.shape.borderRadius * scale
    : `calc(${theme.shape.borderRadius} * ${scale})`;

const SelectorContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  backgroundColor: "white",
  borderRadius: scaledBorderRadius(theme, 1.5),
  boxShadow: theme.shadows[2],
  border: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
  },
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
  },
}));

const LayoutGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
  },
}));

const LayoutButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  flexDirection: "column",
  padding: theme.spacing(2),
  border: `2px solid ${
    isSelected ? theme.palette.primary.main : theme.palette.divider
  }`,
  borderRadius: scaledBorderRadius(theme, 1.5),
  backgroundColor: isSelected
    ? alpha(theme.palette.primary.main, 0.08)
    : "transparent",
  minHeight: "95px",
  minWidth: "90px",
  transition: theme.transitions.create(
    ["border-color", "background-color", "transform", "box-shadow"],
    {
      duration: theme.transitions.duration.short,
    },
  ),
  boxShadow: isSelected ? theme.shadows[2] : theme.shadows[0],
  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transform: "scale(1.05)",
    boxShadow: theme.shadows[3],
  },
  "&:disabled": {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  [theme.breakpoints.down("md")]: {
    minHeight: "75px",
    minWidth: "100%",
    padding: theme.spacing(1.5),
  },
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: isSelected
      ? alpha(theme.palette.primary.main, 0.15)
      : "transparent",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
    },
  },
}));

const LayoutPreview = styled(Box)(({ theme }) => ({
  width: "24px",
  height: "16px",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: "2px",
  marginBottom: theme.spacing(0.5),
  position: "relative",
  background: alpha(theme.palette.background.paper, 0.5),
  [theme.breakpoints.down("md")]: {
    width: "20px",
    height: "14px",
  },
}));

const LayoutDivider = styled(Box)<{ orientation: "horizontal" | "vertical" }>(
  ({ theme, orientation }) => ({
    position: "absolute",
    background: theme.palette.divider,
    ...(orientation === "horizontal"
      ? {
          width: "100%",
          height: "1px",
          top: "50%",
          transform: "translateY(-50%)",
        }
      : {
          height: "100%",
          width: "1px",
          left: "50%",
          transform: "translateX(-50%)",
        }),
  }),
);

const PipIndicator = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: "2px",
  right: "2px",
  width: "6px",
  height: "4px",
  background: theme.palette.primary.main,
  borderRadius: "1px",
}));

const ShortcutChip = styled(Chip)(({ theme }) => ({
  height: "20px",
  fontSize: "0.65rem",
  "& .MuiChip-label": {
    paddingX: theme.spacing(0.5),
  },
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const getLayoutIcon = (layoutType: LayoutType) => {
  switch (layoutType) {
    case "1x1":
      return <ViewCompactOutlined fontSize="small" />;
    case "2x1":
      return <ViewArrayOutlined fontSize="small" />;
    case "1x2":
      return <ViewColumnOutlined fontSize="small" />;
    case "2x2":
      return <GridViewOutlined fontSize="small" />;
    case "3x3":
      return <ViewModuleOutlined fontSize="small" />;
    case "picture-in-picture":
      return <PictureInPictureOutlined fontSize="small" />;
    case "auto":
    default:
      return <AutoAwesome fontSize="small" />;
  }
};

const getLayoutPreview = (layoutType: LayoutType) => {
  switch (layoutType) {
    case "1x1":
      return <LayoutPreview />;
    case "2x1":
      return (
        <LayoutPreview>
          <LayoutDivider orientation="vertical" />
        </LayoutPreview>
      );
    case "1x2":
      return (
        <LayoutPreview>
          <LayoutDivider orientation="horizontal" />
        </LayoutPreview>
      );
    case "2x2":
      return (
        <LayoutPreview>
          <LayoutDivider orientation="vertical" />
          <LayoutDivider orientation="horizontal" />
        </LayoutPreview>
      );
    case "3x3":
      return (
        <LayoutPreview>
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "1px",
              backgroundColor: "divider",
              top: "33%",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: "100%",
              height: "1px",
              backgroundColor: "divider",
              top: "66%",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              height: "100%",
              width: "1px",
              backgroundColor: "divider",
              left: "33%",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              height: "100%",
              width: "1px",
              backgroundColor: "divider",
              left: "66%",
            }}
          />
        </LayoutPreview>
      );
    case "picture-in-picture":
      return (
        <LayoutPreview>
          <PipIndicator />
        </LayoutPreview>
      );
    case "auto":
    default:
      return (
        <LayoutPreview>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "primary.main",
            }}
          />
        </LayoutPreview>
      );
  }
};

const getLayoutName = (layoutType: LayoutType, t: TFunction) => {
  switch (layoutType) {
    case "1x1":
      return t("layout.single", "Single");
    case "2x1":
      return t("layout.side-by-side", "Side by Side");
    case "1x2":
      return t("layout.stacked", "Stacked");
    case "2x2":
      return t("layout.quad", "Quad");
    case "3x3":
      return t("layout.nine", "Nine");
    case "picture-in-picture":
      return t("layout.pip", "PiP");
    case "auto":
    default:
      return t("layout.auto", "Auto");
  }
};

const getLayoutShortcut = (layoutType: LayoutType) => {
  switch (layoutType) {
    case "1x1":
      return "1";
    case "2x1":
      return "2";
    case "1x2":
      return "3";
    case "2x2":
      return "4";
    case "3x3":
      return "9";
    case "picture-in-picture":
      return "P";
    case "auto":
      return "A";
    default:
      return "";
  }
};

export type LayoutSelectorPresenterProps = {
  selectedLayout: LayoutType;
  availableLayouts: LayoutType[];
  streamCount: number;
  onLayoutChange: (layout: LayoutType) => void;
  onKeyboardShortcut?: (key: string) => void;
};

export const LayoutSelectorPresenter: React.FC<
  LayoutSelectorPresenterProps
> = ({
  selectedLayout,
  availableLayouts,
  streamCount,
  onLayoutChange,
  onKeyboardShortcut,
}) => {
  const { t } = useTranslation("multiview");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleLayoutClick = (layoutType: LayoutType) => {
    onLayoutChange(layoutType);
  };

  const isLayoutDisabled = (layoutType: LayoutType) => {
    return !availableLayouts.includes(layoutType);
  };

  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        const layoutMap: Record<string, LayoutType> = {
          "1": "1x1",
          "2": "2x1",
          "3": "1x2",
          "4": "2x2",
          "9": "3x3",
          p: "picture-in-picture",
          a: "auto",
        };

        const layoutType = layoutMap[key];
        if (layoutType && availableLayouts.includes(layoutType)) {
          event.preventDefault();
          onLayoutChange(layoutType);
          onKeyboardShortcut?.(key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [availableLayouts, onLayoutChange, onKeyboardShortcut]);

  return (
    <SelectorContainer elevation={1}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography
          variant="h6"
          sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}
        >
          {t("layout.title", "レイアウト")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("layout.streams-count", "{{count}}個の配信", {
            count: streamCount,
          })}
        </Typography>
      </Box>

      <LayoutGrid>
        {availableLayouts.map((layoutType) => {
          const isSelected = selectedLayout === layoutType;
          const isDisabled = isLayoutDisabled(layoutType);
          const shortcut = getLayoutShortcut(layoutType);

          return (
            <Box key={layoutType} position="relative">
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2">
                      {getLayoutName(layoutType, t)}
                    </Typography>
                    {!isMobile && shortcut && (
                      <Typography variant="caption" color="text.secondary">
                        {t("layout.shortcut", "ショートカット")}: Ctrl+
                        {shortcut}
                      </Typography>
                    )}
                  </Box>
                }
                placement="top"
              >
                <LayoutButton
                  isSelected={isSelected}
                  disabled={isDisabled}
                  onClick={() => handleLayoutClick(layoutType)}
                  aria-label={getLayoutName(layoutType, t)}
                >
                  {getLayoutPreview(layoutType)}
                  {getLayoutIcon(layoutType)}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: isMobile ? "0.6rem" : "0.7rem",
                      textAlign: "center",
                      lineHeight: 1,
                      mt: 0.5,
                    }}
                  >
                    {getLayoutName(layoutType, t)}
                  </Typography>
                </LayoutButton>
              </Tooltip>
              {!isMobile && shortcut && (
                <ShortcutChip
                  label={shortcut}
                  size="small"
                  variant="outlined"
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    backgroundColor: "background.paper",
                  }}
                />
              )}
            </Box>
          );
        })}
      </LayoutGrid>

      {!isMobile && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, display: "block", textAlign: "center" }}
        >
          {t("layout.keyboard-hint", "Ctrl + 数字キーでレイアウトを素早く変更")}
        </Typography>
      )}
    </SelectorContainer>
  );
};
