import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WatchPartyDetailPageContainer } from "../../../src/features/watch-party/pages/WatchPartyDetailPage";
import { Services } from "../../../src/lib/services";

interface WatchPartyDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Server Component for data fetching
export default async function WatchPartyDetailPage({
  params,
  searchParams,
}: WatchPartyDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  try {
    // Parse watch party ID - could be clip-based or standalone
    const isClipWatchParty = id.startsWith("clip-");
    const actualId = isClipWatchParty ? id.replace("clip-", "") : id;

    let watchParty;
    let clip = null;

    if (isClipWatchParty) {
      // For clip-based watch parties, fetch the clip data
      const clipId = Number.parseInt(actualId, 10);
      if (Number.isNaN(clipId)) {
        notFound();
      }

      const clipResponse = await Services.Clip.getClipById(clipId);
      if (!clipResponse.success || !clipResponse.data) {
        notFound();
      }

      clip = clipResponse.data;

      // Create a mock watch party object for clip-based parties
      watchParty = {
        id: id,
        title: `${clip.title} - ウォッチパーティ`,
        description: `${clip.vtuber}の「${clip.title}」をみんなで一緒に視聴しよう！`,
        hostName: "システム",
        currentViewers: Math.floor(Math.random() * 50) + 10,
        maxViewers: 100,
        isActive: clip.watchPartyActive,
        content: {
          type: "clip" as const,
          clipId: clipId,
          clip: clip,
        },
        startTime: new Date().toISOString(),
        settings: {
          chatEnabled: true,
          reactionsEnabled: true,
          moderated: false,
        },
      };
    } else {
      // For standalone watch parties, fetch from watch party service
      const watchPartyResponse =
        await Services.WatchParty.getWatchPartyById(id);
      if (!watchPartyResponse.success || !watchPartyResponse.data) {
        notFound();
      }
      watchParty = watchPartyResponse.data;
    }

    // Fetch related content based on watch party type
    let relatedClips: unknown[] = [];
    if (clip) {
      const relatedResponse = await Services.Clip.getClipsByVTuber(
        clip.vtuber,
        { page: 1, limit: 6 },
      );
      relatedClips =
        relatedResponse.data?.filter((c) => c.id !== clip.id) || [];
    }

    // Parse additional query parameters
    const roomCode =
      typeof resolvedSearchParams.room === "string"
        ? resolvedSearchParams.room
        : null;
    const joinAsGuest = resolvedSearchParams.guest === "true";

    return (
      <WatchPartyDetailPageContainer
        watchParty={watchParty}
        clip={clip}
        relatedClips={relatedClips}
        roomCode={roomCode}
        joinAsGuest={joinAsGuest}
      />
    );
  } catch (err) {
    console.error("Error fetching watch party data:", err);
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: WatchPartyDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const isClipWatchParty = id.startsWith("clip-");
    const actualId = isClipWatchParty ? id.replace("clip-", "") : id;

    if (isClipWatchParty) {
      const clipId = Number.parseInt(actualId, 10);
      if (Number.isNaN(clipId)) {
        return {
          title: "Watch Party Not Found - VSPO Collection",
          description: "The requested watch party could not be found.",
        };
      }

      const clipResponse = await Services.Clip.getClipById(clipId);
      if (!clipResponse.success || !clipResponse.data) {
        return {
          title: "Watch Party Not Found - VSPO Collection",
          description: "The requested watch party could not be found.",
        };
      }

      const clip = clipResponse.data;
      const title = `${clip.title} - ウォッチパーティ | VSPO Collection`;
      const description = `${clip.vtuber}の「${clip.title}」をみんなで一緒に視聴しよう！リアルタイムでコメントや反応を共有できるウォッチパーティです。`;

      return {
        title,
        description,
        keywords: [
          "ウォッチパーティ",
          "リアルタイム視聴",
          clip.vtuber,
          "VSPO",
          "VTuber",
          "切り抜き",
          "みんなで視聴",
        ],
        openGraph: {
          title,
          description,
          type: "video.other",
          images: [
            {
              url: clip.thumbnail,
              width: 1280,
              height: 720,
              alt: `${clip.title} - ウォッチパーティ`,
            },
          ],
          siteName: "VSPO Collection",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [clip.thumbnail],
        },
        alternates: {
          canonical: `/watch-party/${id}`,
        },
      };
    }
    // For standalone watch parties
    const watchPartyResponse = await Services.WatchParty.getWatchPartyById(id);
    if (!watchPartyResponse.success || !watchPartyResponse.data) {
      return {
        title: "Watch Party Not Found - VSPO Collection",
        description: "The requested watch party could not be found.",
      };
    }

    const watchParty = watchPartyResponse.data;
    return {
      title: `${watchParty.title} | VSPO Collection`,
      description: watchParty.description,
      keywords: ["ウォッチパーティ", "リアルタイム視聴", "VSPO", "VTuber"],
      openGraph: {
        title: watchParty.title,
        description: watchParty.description,
        type: "website",
        siteName: "VSPO Collection",
      },
      alternates: {
        canonical: `/watch-party/${id}`,
      },
    };
  } catch {
    return {
      title: "Watch Party Not Found - VSPO Collection",
      description: "The requested watch party could not be found.",
    };
  }
}
