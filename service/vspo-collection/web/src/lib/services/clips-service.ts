// Platform types
export type Platform =
  | "all"
  | "youtube"
  | "twitch"
  | "twitcasting"
  | "niconico";
export type ClipType = "all" | "clips" | "shorts";
export type SortBy = "views" | "recent" | "likes";

import type { Clip } from "../../common/types/schemas";

// Extended Clip type with platform info
export interface ExtendedClip extends Clip {
  platform: Platform;
  clipType: ClipType;
  uploadedAt: string;
}

// Server-side data fetching function for clips
export async function getAllClips(): Promise<ExtendedClip[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const platforms: Platform[] = [
    "youtube",
    "twitch",
    "twitcasting",
    "niconico",
  ];
  const clipTypes: ClipType[] = ["clips", "shorts"];
  const vtubers = [
    "🦄 みおちゃん",
    "🌺 ひまりちゃん",
    "🌸 さくらちゃん",
    "🎨 あやちゃん",
    "🌙 るなちゃん",
    "⭐ ななちゃん",
    "🍑 ももちゃん",
    "☁️ そらちゃん",
    "🌟 ゆめちゃん",
    "🎀 りこちゃん",
  ];

  const clippers = [
    "切り抜きマスター",
    "面白切り抜き",
    "ASMR切り抜き",
    "アート系まとめ",
    "ゲーム切り抜き専門",
    "事故系まとめ",
    "神回コレクター",
    "感動シーンまとめ",
    "てぇてぇ切り抜き",
    "歌ってみた専門",
  ];

  const titles = [
    "【神回】泣ける感動シーンまとめ",
    "【爆笑】ゲーム実況で大失敗www",
    "【歌ってみた】圧倒的歌唱力に視聴者騒然",
    "【ASMR】癒やしボイスで安眠確定",
    "【コラボ】推し同士の絡みがてぇてぇすぎる",
    "【ホラゲ】可愛い悲鳴集めました",
    "【雑談】深夜のまったりトーク切り抜き",
    "【お絵描き】神絵師の制作過程",
    "【料理配信】失敗からの大成功まで",
    "【FPS】エイムが神すぎる瞬間集",
  ];

  const clips: ExtendedClip[] = [];

  for (let i = 1; i <= 50; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const clipType = clipTypes[Math.floor(Math.random() * clipTypes.length)];
    const viewCount = Math.floor(Math.random() * 500000) + 10000;
    const likes = Math.floor(viewCount * (Math.random() * 0.1 + 0.05));
    const comments = Math.floor(likes * (Math.random() * 0.3 + 0.1));

    clips.push({
      id: i,
      title: titles[Math.floor(Math.random() * titles.length)],
      vtuber: vtubers[Math.floor(Math.random() * vtubers.length)],
      thumbnail: `/placeholder.svg?height=180&width=320&text=Clip${i}`,
      duration:
        clipType === "shorts"
          ? `0:${Math.floor(Math.random() * 50) + 10}`
          : `${Math.floor(Math.random() * 20) + 1}:${Math.floor(
              Math.random() * 60,
            )
              .toString()
              .padStart(2, "0")}`,
      views:
        viewCount > 1000000
          ? `${(viewCount / 1000000).toFixed(1)}M`
          : viewCount > 1000
            ? `${Math.floor(viewCount / 1000)}K`
            : viewCount.toString(),
      clipper: clippers[Math.floor(Math.random() * clippers.length)],
      isExclusive: Math.random() > 0.7,
      likes,
      comments,
      watchPartyActive: Math.random() > 0.8,
      platform,
      clipType,
      uploadedAt: new Date(
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      ).toISOString(),
    });
  }

  return clips;
}
