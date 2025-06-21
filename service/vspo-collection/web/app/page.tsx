import { HomePageClient } from "../src/features/home/components/HomePageClient";
import {
  getCategories,
  getPopularClips,
  getRecommendations,
  getSpecialEvent,
  getTrendingPlaylists,
} from "../src/lib/services/home-service";

export const metadata = {
  title: "VSPO Portal - VTuber切り抜きコレクション",
  description:
    "VSPOメンバーの最新切り抜き・プレイリスト・配信情報をまとめてチェック",
};

export default async function HomePage() {
  // Fetch data server-side
  const [
    specialEvent,
    categories,
    trendingPlaylists,
    popularClips,
    recommendations,
  ] = await Promise.all([
    getSpecialEvent(),
    getCategories(),
    getTrendingPlaylists(),
    getPopularClips(),
    getRecommendations(),
  ]);

  return (
    <HomePageClient
      specialEvent={specialEvent}
      categories={categories}
      trendingPlaylists={trendingPlaylists}
      popularClips={popularClips}
      recommendations={recommendations}
    />
  );
}
