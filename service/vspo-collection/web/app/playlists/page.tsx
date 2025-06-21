import { PlaylistsPageClient } from "../../src/features/playlists/components/PlaylistsPageClient";
import {
  getAllPlaylists,
  getTrendingPlaylists,
} from "../../src/lib/services/playlists-service";

export const metadata = {
  title: "プレイリスト - VSPO Portal",
  description: "VSPOメンバーのプレイリストを探索・視聴しよう",
};

export default async function PlaylistsPage() {
  // Fetch data server-side
  const [playlists, trendingPlaylists] = await Promise.all([
    getAllPlaylists(),
    getTrendingPlaylists(3),
  ]);

  return (
    <PlaylistsPageClient
      initialPlaylists={playlists}
      trendingPlaylists={trendingPlaylists}
    />
  );
}
