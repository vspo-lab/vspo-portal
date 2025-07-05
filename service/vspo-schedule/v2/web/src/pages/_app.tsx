import "@fortawesome/fontawesome-svg-core/styles.css";
import "@/styles/globals.css";
import "@/styles/normalize.css";
import { ThemeModeProvider } from "@/context/Theme";
import { TimeZoneContextProvider } from "@/context/TimeZoneContext";
import { VideoModalContextProvider } from "@/context/VideoModalContext";
import { GoogleAnalytics } from "@/features/shared/components/Elements";
import { config } from "@fortawesome/fontawesome-svg-core";
import { AppCacheProvider } from "@mui/material-nextjs/v14-pagesRouter";
import type { NextPage } from "next";
import { appWithTranslation } from "next-i18next";
import type { AppProps } from "next/app";
import type { ReactElement, ReactNode } from "react";
import "@/lib/i18n";

config.autoAddCss = false;

export type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement, pageProps: P) => ReactNode;
};

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps, ...props }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <AppCacheProvider {...props}>
        <ThemeModeProvider>
          <TimeZoneContextProvider>
            <VideoModalContextProvider>
              {/* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */}
              {getLayout(<Component {...pageProps} />, pageProps)}
            </VideoModalContextProvider>
          </TimeZoneContextProvider>
        </ThemeModeProvider>
      </AppCacheProvider>
      <GoogleAnalytics />
    </>
  );
}

export default appWithTranslation(App);
