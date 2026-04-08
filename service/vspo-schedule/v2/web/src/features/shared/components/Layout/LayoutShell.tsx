"use client";

import { GlobalStyles } from "@mui/material";
import type React from "react";
import { useEffect, useState } from "react";
import { PageMetaProvider, usePageMeta } from "@/context/PageMetaContext";
import { AlertSnackbar } from "../Elements";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { CustomBottomNavigation } from "./Navigation";

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

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pageMeta } = usePageMeta();
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("alertSeen-discordBot")) {
      setAlertOpen(true);
    }
  }, []);

  const handleAlertClose = () => {
    setAlertOpen(false);
    localStorage.setItem("alertSeen-discordBot", "true");
  };

  return (
    <>
      {immersiveStyles}
      <div data-layout-header>
        <Header title={pageMeta.title} />
      </div>
      <AlertSnackbar open={alertOpen} onClose={handleAlertClose} />
      {children}
      <div data-layout-footer>
        <Footer
          lastUpdateTimestamp={pageMeta.lastUpdateTimestamp}
          description={pageMeta.footerMessage}
        />
      </div>
      <div data-layout-bottom-nav>
        <CustomBottomNavigation />
      </div>
    </>
  );
};

/**
 * Wraps children with persistent Header/Footer/BottomNav.
 * Split into Shell + Provider because Shell must read from PageMetaContext.
 */
export const LayoutShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <PageMetaProvider>
    <Shell>{children}</Shell>
  </PageMetaProvider>
);
