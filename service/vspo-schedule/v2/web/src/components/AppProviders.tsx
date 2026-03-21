"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeModeProvider } from "@/context/Theme";
import { TimeZoneContextProvider } from "@/context/TimeZoneContext";
import { VideoModalContextProvider } from "@/context/VideoModalContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
      <ThemeModeProvider>
        <TimeZoneContextProvider>
          <VideoModalContextProvider>{children}</VideoModalContextProvider>
        </TimeZoneContextProvider>
      </ThemeModeProvider>
    </AppRouterCacheProvider>
  );
}
