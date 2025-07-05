import { GoogleTagManager as NextGoogleTagManager } from "@next/third-parties/google";
import type { FC } from "react";

export const GoogleTagManager: FC = () => {
  const gtmId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;

  if (!gtmId || gtmId === "") {
    return null;
  }

  return <NextGoogleTagManager gtmId={gtmId} />;
};
