import { VTubersPageClient } from "../../src/features/vtubers/components/VTubersPageClient";
import { getAllVTubers } from "../../src/lib/services/vtubers-service";

export const metadata = {
  title: "VTuber一覧 - VSPO Portal",
  description: "VSPOメンバーの詳細情報・チャンネル・統計データを確認",
};

export default async function VTubersPage() {
  // Fetch data server-side
  const vtubers = await getAllVTubers();

  return <VTubersPageClient initialVTubers={vtubers} />;
}
