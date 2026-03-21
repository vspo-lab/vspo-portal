"use client";

import {
  type Breakpoint,
  Container,
  type ContainerTypeMap,
  GlobalStyles,
} from "@mui/material";
import type { OverridableComponent } from "@mui/material/OverridableComponent";
import { styled } from "@mui/material/styles";
import type React from "react";
import { useEffect, useState } from "react";
import { AlertSnackbar } from "../Elements";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { CustomBottomNavigation } from "./Navigation";

/**
 * Global CSS to hide layout chrome (header, footer, bottom nav) when immersive mode is active.
 * Toggled via `document.documentElement.dataset.immersive = "true"` from page components.
 */
const immersiveStyles = (
  <GlobalStyles
    styles={{
      'html[data-immersive="true"] [data-layout-header]': {
        display: "none !important",
      },
      'html[data-immersive="true"] [data-layout-footer]': {
        display: "none !important",
      },
      'html[data-immersive="true"] [data-layout-bottom-nav]': {
        display: "none !important",
      },
    }}
  />
);

type ContentLayoutProps = {
  children: React.ReactNode;
  title: string;
  lastUpdateTimestamp?: number;
  description?: string;
  path?: string;
  footerMessage?: string;
  maxPageWidth?: Breakpoint | false;
  padTop?: boolean;
};

type StyledContainerProps = Pick<ContentLayoutProps, "padTop">;

const StyledContainer = styled(Container, {
  shouldForwardProp: (prop) => prop !== "padTop",
})<StyledContainerProps>(({ theme, padTop }) => ({
  padding: theme.spacing(3),
  paddingTop: padTop ? theme.spacing(4) : 0,

  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    paddingTop: padTop ? theme.spacing(3) : 0,
  },

  // Minimal padding for multiview page
  "&.multiview-container": {
    padding: 0,
    paddingTop: 0,
  },
})) as OverridableComponent<ContainerTypeMap<StyledContainerProps>>;

export const ContentLayout = ({
  children,
  title,
  lastUpdateTimestamp,
  description,
  path,
  footerMessage,
  maxPageWidth,
  padTop,
}: ContentLayoutProps) => {
  const [alertOpen, setAlertOpen] = useState(false);

  const handleAlertClose = () => {
    setAlertOpen(false);
    localStorage.setItem("alertSeen-discordBot", "true");
  };

  useEffect(() => {
    const hasSeenAlert = localStorage.getItem("alertSeen-discordBot");

    if (!hasSeenAlert) {
      setAlertOpen(true);
    }
  }, []);

  return (
    <>
      {immersiveStyles}
      <div data-layout-header>
        <Header title={title} />
      </div>
      <AlertSnackbar open={alertOpen} onClose={handleAlertClose} />
      <StyledContainer
        component="main"
        maxWidth={maxPageWidth}
        padTop={padTop}
        className={path === "/multiview" ? "multiview-container" : ""}
      >
        {children}
      </StyledContainer>
      <div data-layout-footer>
        <Footer
          lastUpdateTimestamp={lastUpdateTimestamp}
          description={footerMessage}
        />
      </div>
      <div data-layout-bottom-nav>
        <CustomBottomNavigation />
      </div>
    </>
  );
};
