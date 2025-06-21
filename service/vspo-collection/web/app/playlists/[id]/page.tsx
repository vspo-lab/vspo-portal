import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaylistDetailPageContainer } from "../../../src/features/playlists/pages/PlaylistDetailPage";
import { Services } from "../../../src/lib/services";

interface PlaylistDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Server Component for data fetching
export default async function PlaylistDetailPage({
  params,
  searchParams,
}: PlaylistDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  try {
    // Fetch playlist data on the server
    const playlistResponse = await Services.Playlist.getPlaylistById(id);

    if (!playlistResponse.success || !playlistResponse.data) {
      notFound();
    }

    const playlist = playlistResponse.data;

    // Fetch related playlists from the same creator or similar content
    const relatedPlaylistsResponse = await Services.Playlist.getPlaylists(
      {
        searchQuery: playlist.creator,
      },
      { field: "updatedAt", direction: "desc" },
      { page: 1, limit: 6 },
    );

    // Filter out the current playlist from related playlists
    const relatedPlaylists =
      relatedPlaylistsResponse.data?.filter(
        (relatedPlaylist) => relatedPlaylist.id !== id,
      ) || [];

    // Fetch trending playlists for recommendations
    const trendingPlaylistsResponse = await Services.Playlist.getPlaylists(
      { isPopular: true },
      { field: "popularity", direction: "desc" },
      { page: 1, limit: 4 },
    );
    const recommendedPlaylists =
      trendingPlaylistsResponse.data?.filter(
        (trendingPlaylist) => trendingPlaylist.id !== id,
      ) || [];

    // Parse any additional query parameters
    const autoplay = resolvedSearchParams.autoplay === "true";
    const startIndex =
      typeof resolvedSearchParams.index === "string"
        ? Number.parseInt(resolvedSearchParams.index, 10)
        : 0;

    return (
      <PlaylistDetailPageContainer
        playlist={playlist}
        relatedPlaylists={relatedPlaylists}
        recommendedPlaylists={recommendedPlaylists}
        autoplay={autoplay}
        startIndex={startIndex}
      />
    );
  } catch (err) {
    console.error("Error fetching playlist data:", err);
    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PlaylistDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const playlistResponse = await Services.Playlist.getPlaylistById(id);

    if (!playlistResponse.success || !playlistResponse.data) {
      return {
        title: "Playlist Not Found - VSPO Collection",
        description: "The requested playlist could not be found.",
      };
    }

    const playlist = playlistResponse.data;
    const title = `${playlist.title} - ${playlist.creator} | VSPO Collection`;
    const description =
      playlist.description ||
      `${playlist.creator}が作成したプレイリスト「${playlist.title}」- ${playlist.videos?.length || 0}本の動画を収録。`;

    return {
      title,
      description,
      keywords: [
        playlist.creator,
        "プレイリスト",
        "VSPO",
        "VTuber",
        "切り抜き",
        "まとめ",
        ...(playlist.tags || []),
      ],
      openGraph: {
        title,
        description,
        type: "website",
        images: playlist.thumbnail
          ? [
              {
                url: playlist.thumbnail,
                width: 1280,
                height: 720,
                alt: playlist.title,
              },
            ]
          : undefined,
        siteName: "VSPO Collection",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: playlist.thumbnail ? [playlist.thumbnail] : undefined,
      },
      alternates: {
        canonical: `/playlists/${id}`,
      },
    };
  } catch {
    return {
      title: "Playlist Not Found - VSPO Collection",
      description: "The requested playlist could not be found.",
    };
  }
}

// Optional: Generate static params for popular playlists (for static generation)
export async function generateStaticParams() {
  try {
    // Get the most popular playlists for static generation
    const playlistsResponse = await Services.Playlist.getPlaylists(
      { isPopular: true },
      { field: "popularity", direction: "desc" },
      { page: 1, limit: 10 },
    );

    if (!playlistsResponse.success || !playlistsResponse.data) {
      return [];
    }

    return playlistsResponse.data.map((playlist) => ({
      id: playlist.id,
    }));
  } catch (error) {
    console.error("Error generating static params for playlists:", error);
    return [];
  }
}
