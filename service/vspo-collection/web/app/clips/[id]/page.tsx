import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClipDetailPageContainer } from "../../../src/features/clips/pages/ClipDetailPage";
import { Services } from "../../../src/lib/services";

interface ClipDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Server Component for data fetching
export default async function ClipDetailPage({
  params,
  searchParams,
}: ClipDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  try {
    const clipId = Number.parseInt(id, 10);
    if (Number.isNaN(clipId)) {
      notFound();
    }

    // Fetch clip data on the server
    const clipResponse = await Services.Clip.getClipById(clipId);

    if (!clipResponse.success || !clipResponse.data) {
      notFound();
    }

    const clip = clipResponse.data;

    // Fetch related clips from the same VTuber
    const relatedClipsResponse = await Services.Clip.getClipsByVTuber(
      clip.vtuber,
      { page: 1, limit: 8 },
    );

    // Filter out the current clip from related clips
    const relatedClips =
      relatedClipsResponse.data?.filter(
        (relatedClip) => relatedClip.id !== clipId,
      ) || [];

    // Fetch VTuber information
    const vtuberResponse = await Services.Creator.searchCreators(clip.vtuber, {
      page: 1,
      limit: 1,
    });
    const vtuber = vtuberResponse.data?.[0] || null;

    // Fetch trending clips for recommendations
    const trendingClipsResponse = await Services.Clip.getTrendingClips(6);
    const recommendedClips =
      trendingClipsResponse.data?.filter(
        (trendingClip) => trendingClip.id !== clipId,
      ) || [];

    // Parse any additional query parameters
    const autoplay = resolvedSearchParams.autoplay === "true";
    const startTime =
      typeof resolvedSearchParams.t === "string"
        ? Number.parseInt(resolvedSearchParams.t, 10)
        : undefined;

    return (
      <ClipDetailPageContainer
        clip={clip}
        vtuber={vtuber}
        relatedClips={relatedClips}
        recommendedClips={recommendedClips}
        autoplay={autoplay}
        startTime={startTime}
      />
    );
  } catch (err) {
    console.error("Error fetching clip data:", err);
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ClipDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const clipId = Number.parseInt(id, 10);
    if (Number.isNaN(clipId)) {
      return {
        title: "Clip Not Found - VSPO Collection",
        description: "The requested clip could not be found.",
      };
    }

    const clipResponse = await Services.Clip.getClipById(clipId);

    if (!clipResponse.success || !clipResponse.data) {
      return {
        title: "Clip Not Found - VSPO Collection",
        description: "The requested clip could not be found.",
      };
    }

    const clip = clipResponse.data;
    const title = `${clip.title} - ${clip.vtuber} | VSPO Collection`;
    const description =
      clip.description ||
      `${clip.vtuber}の切り抜き動画「${clip.title}」- ${clip.clipper}によって作成。${clip.views}回再生、${clip.likes.toLocaleString()}いいね。`;

    return {
      title,
      description,
      keywords: [
        clip.vtuber,
        clip.clipper,
        "VSPO",
        "VTuber",
        "切り抜き",
        "クリップ",
        ...(clip.tags || []),
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
            alt: clip.title,
          },
        ],
        videos: clip.url
          ? [
              {
                url: clip.url,
                type: "video/mp4",
              },
            ]
          : undefined,
        siteName: "VSPO Collection",
      },
      twitter: {
        card: "player",
        title,
        description,
        images: [clip.thumbnail],
      },
      alternates: {
        canonical: `/clips/${id}`,
      },
      other: {
        "video:duration": clip.duration,
        "video:tag": clip.tags?.join(", ") || "",
      },
    };
  } catch {
    return {
      title: "Clip Not Found - VSPO Collection",
      description: "The requested clip could not be found.",
    };
  }
}

// Optional: Generate static params for popular clips (for static generation)
export async function generateStaticParams() {
  try {
    // Get the most popular clips for static generation
    const trendingClipsResponse = await Services.Clip.getTrendingClips(20);

    if (!trendingClipsResponse.success || !trendingClipsResponse.data) {
      return [];
    }

    return trendingClipsResponse.data.map((clip) => ({
      id: clip.id.toString(),
    }));
  } catch (error) {
    console.error("Error generating static params for clips:", error);
    return [];
  }
}
