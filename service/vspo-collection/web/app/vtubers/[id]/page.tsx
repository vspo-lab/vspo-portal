import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VTuberDetailPageContainer } from "../../../src/features/vtubers/pages/VTuberDetailPage";
import { Services } from "../../../src/lib/services";

interface VTuberDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Server Component for data fetching
export default async function VTuberDetailPage({
  params,
  searchParams,
}: VTuberDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  try {
    // Fetch VTuber data on the server
    const vtuberResponse = await Services.Creator.getCreatorById(id);

    if (!vtuberResponse.success || !vtuberResponse.data) {
      notFound();
    }

    // Fetch related clips
    const clipsResponse = await Services.Clip.getClipsByVTuber(
      vtuberResponse.data.name,
      { page: 1, limit: 12 },
    );

    // Fetch trending clips from this VTuber
    const trendingClipsResponse = await Services.Clip.getTrendingClips(6);
    const vtuberTrendingClips =
      trendingClipsResponse.data?.filter(
        (clip) => clip.vtuber === vtuberResponse.data?.name,
      ) || [];

    // Parse any additional query parameters
    const activeTab =
      typeof resolvedSearchParams.tab === "string"
        ? resolvedSearchParams.tab
        : "clips";
    const sortBy =
      typeof resolvedSearchParams.sort === "string"
        ? resolvedSearchParams.sort
        : "latest";

    return (
      <VTuberDetailPageContainer
        vtuber={vtuberResponse.data}
        clips={clipsResponse.data || []}
        trendingClips={vtuberTrendingClips}
        totalClips={clipsResponse.meta?.total || 0}
        initialActiveTab={activeTab}
        initialSortBy={sortBy}
      />
    );
  } catch (err) {
    console.error("Error fetching VTuber data:", err);
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: VTuberDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const vtuberResponse = await Services.Creator.getCreatorById(id);

    if (!vtuberResponse.success || !vtuberResponse.data) {
      return {
        title: "VTuber Not Found - VSPO Collection",
        description: "The requested VTuber could not be found.",
      };
    }

    const vtuber = vtuberResponse.data;
    const title = `${vtuber.name} - VSPO Collection`;
    const description =
      vtuber.description ||
      `${vtuber.name}の切り抜き動画をチェック！${vtuber.stats?.totalClips || 0}本の動画を配信中。`;

    // Get the primary platform subscriber count for additional context
    const primaryPlatform = vtuber.platformLinks?.[0];
    const subscriberInfo = primaryPlatform?.subscriberCount
      ? ` | ${primaryPlatform.subscriberCount.toLocaleString()}人登録`
      : "";

    return {
      title,
      description: description + subscriberInfo,
      keywords: [
        vtuber.name,
        "VSPO",
        "VTuber",
        "切り抜き",
        "クリップ",
        ...(vtuber.tags || []),
      ],
      openGraph: {
        title,
        description,
        type: "profile",
        images: vtuber.avatar
          ? [
              {
                url: vtuber.avatar,
                width: 400,
                height: 400,
                alt: `${vtuber.name}のアバター画像`,
              },
            ]
          : undefined,
        siteName: "VSPO Collection",
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: vtuber.avatar ? [vtuber.avatar] : undefined,
      },
      alternates: {
        canonical: `/vtubers/${id}`,
      },
    };
  } catch {
    return {
      title: "VTuber Not Found - VSPO Collection",
      description: "The requested VTuber could not be found.",
    };
  }
}

// Optional: Generate static params for popular VTubers (for static generation)
export async function generateStaticParams() {
  try {
    // Get the most popular VTubers for static generation
    const creatorsResponse = await Services.Creator.getTrendingCreators(10);

    if (!creatorsResponse.success || !creatorsResponse.data) {
      return [];
    }

    return creatorsResponse.data.map((creator) => ({
      id: creator.id,
    }));
  } catch (error) {
    console.error("Error generating static params for VTubers:", error);
    return [];
  }
}
