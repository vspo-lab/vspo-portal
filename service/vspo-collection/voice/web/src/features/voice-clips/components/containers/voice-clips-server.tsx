import {
  getCategories,
  getMembers,
  getNewClips,
  getTrendingClips,
  getVoiceClips,
} from "../../domain/services/voice-clip.service";
import { VoiceClipsClient } from "./voice-clips-client";

export async function VoiceClipsServerContainer() {
  // Fetch all data on the server
  const [clips, members, categories, trendingClips, newClips] =
    await Promise.all([
      getVoiceClips(),
      getMembers(),
      getCategories(),
      getTrendingClips(),
      getNewClips(),
    ]);

  return (
    <VoiceClipsClient
      initialClips={clips}
      members={members}
      categories={categories}
      trendingClips={trendingClips}
      newClips={newClips}
    />
  );
}
