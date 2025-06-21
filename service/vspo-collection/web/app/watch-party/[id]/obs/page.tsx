import { OBSOverlaySyncContainer } from "../../../../src/features/watch-party/pages/OBSOverlay/syncContainer";

export default function OBSOverlayPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Convert searchParams to config object
  const config = {
    position: searchParams.position as string | undefined,
    theme: searchParams.theme as string | undefined,
    showChat: searchParams.showChat as string | undefined,
    showReactions: searchParams.showReactions as string | undefined,
    showViewers: searchParams.showViewers as string | undefined,
    showVideo: searchParams.showVideo as string | undefined,
    opacity: searchParams.opacity as string | undefined,
    scale: searchParams.scale as string | undefined,
  };

  return <OBSOverlaySyncContainer roomId={params.id} config={config} />;
}