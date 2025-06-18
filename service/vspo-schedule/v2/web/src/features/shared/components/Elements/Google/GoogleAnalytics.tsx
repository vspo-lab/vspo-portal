import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { FC } from "react";

export const GoogleAnalytics: FC = () => {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

  if (!gaId || gaId === "") {
    return null;
  }

  return <NextGoogleAnalytics gaId={gaId} />;
};
