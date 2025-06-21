import { ClipsPageClient } from "../../src/features/clips/components/ClipsPageClient";
import { getAllClips } from "../../src/lib/services/clips-service";

export const metadata = {
  title: "切り抜き - VSPO Portal",
  description:
    "VSPOメンバーの最新切り抜きをプラットフォーム別・カテゴリ別に探索",
};

export default async function ClipsPage() {
  // Fetch data server-side
  const clips = await getAllClips();

  return <ClipsPageClient initialClips={clips} />;
}
