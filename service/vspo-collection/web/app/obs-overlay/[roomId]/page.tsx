import { Suspense } from "react";
import { OBSOverlayContainer } from "../../../src/features/watch-party/pages/OBSOverlay/container";
import { OBSOverlayLoading } from "../../../src/features/watch-party/pages/OBSOverlay/loading";

interface OBSOverlayPageProps {
  params: {
    roomId: string;
  };
  searchParams: {
    position?: string;
    theme?: string;
    showChat?: string;
    showReactions?: string;
    showViewers?: string;
    showVideo?: string;
    opacity?: string;
    scale?: string;
  };
}

export default function OBSOverlayPage({
  params,
  searchParams,
}: OBSOverlayPageProps) {
  return (
    <Suspense fallback={<OBSOverlayLoading />}>
      <OBSOverlayContainer roomId={params.roomId} config={searchParams} />
    </Suspense>
  );
}

export const metadata = {
  title: "OBS Overlay",
  robots: "noindex, nofollow",
};
