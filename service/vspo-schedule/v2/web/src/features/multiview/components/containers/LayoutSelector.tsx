// Removed notistack dependency - using console.log for feedback
import { useTranslation } from "next-i18next";
import type React from "react";
import { useCallback } from "react";
import type { LayoutType } from "../../hooks/useMultiviewLayout";
import { LayoutSelectorPresenter } from "../presenters/LayoutSelectorPresenter";

export type LayoutSelectorProps = {
  selectedLayout: LayoutType;
  availableLayouts: LayoutType[];
  streamCount: number;
  onLayoutChange: (layout: LayoutType) => void;
  showNotifications?: boolean;
};

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  selectedLayout,
  availableLayouts,
  streamCount,
  onLayoutChange,
  showNotifications = true,
}) => {
  const { t } = useTranslation("multiview");

  // Placeholder for notification system wrapped in useCallback
  const enqueueSnackbar = useCallback(
    (message: string, options?: { variant?: string }) => {
      console.log(`${options?.variant?.toUpperCase() || "INFO"}: ${message}`);
    },
    [],
  );

  const getLayoutDisplayName = useCallback(
    (layoutType: LayoutType) => {
      switch (layoutType) {
        case "1x1":
          return t("layout.single", "シングル");
        case "2x1":
          return t("layout.side-by-side", "サイドバイサイド");
        case "1x2":
          return t("layout.stacked", "スタック");
        case "2x2":
          return t("layout.quad", "クアッド");
        case "3x3":
          return t("layout.nine", "9分割");
        case "picture-in-picture":
          return t("layout.pip", "ピクチャーインピクチャー");
        default:
          return t("layout.auto", "自動");
      }
    },
    [t],
  );

  const handleLayoutChange = useCallback(
    (layout: LayoutType) => {
      onLayoutChange(layout);

      if (showNotifications) {
        const layoutName = getLayoutDisplayName(layout);
        enqueueSnackbar(
          t("layout.changed", "レイアウトを{{layout}}に変更しました", {
            layout: layoutName,
          }),
          {
            variant: "success",
          },
        );
      }
    },
    [
      onLayoutChange,
      showNotifications,
      getLayoutDisplayName,
      enqueueSnackbar,
      t,
    ],
  );

  const handleKeyboardShortcut = useCallback(
    (key: string) => {
      if (showNotifications) {
        enqueueSnackbar(
          t("layout.shortcut-used", "ショートカット Ctrl+{{key}} を使用", {
            key: key.toUpperCase(),
          }),
          {
            variant: "info",
          },
        );
      }
    },
    [showNotifications, enqueueSnackbar, t],
  );

  return (
    <LayoutSelectorPresenter
      selectedLayout={selectedLayout}
      availableLayouts={availableLayouts}
      streamCount={streamCount}
      onLayoutChange={handleLayoutChange}
      onKeyboardShortcut={handleKeyboardShortcut}
    />
  );
};
