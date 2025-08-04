import type {
  Category,
  Member,
  SearchResult,
  VoiceClip,
} from "../models/voice-clip.model";

// Mock data - in production, this would come from a database
const mockMembers: Member[] = [
  { id: "all", name: "すべて", color: "#000", avatar: "" },
  { id: "nose", name: "花芽すみれ", color: "#FF6B6B", avatar: "NS" },
  { id: "beni", name: "小雀とと", color: "#4ECDC4", avatar: "TT" },
  { id: "runa", name: "一ノ瀬うるは", color: "#45B7D1", avatar: "IU" },
  { id: "mimi", name: "胡桃のあ", color: "#F7DC6F", avatar: "KN" },
  { id: "lisa", name: "英リサ", color: "#BB8FCE", avatar: "HL" },
];

const mockCategories: Category[] = [
  { id: "all", name: "すべて" },
  { id: "greeting", name: "挨拶" },
  { id: "reaction", name: "リアクション" },
  { id: "gaming", name: "ゲーム" },
  { id: "singing", name: "歌" },
  { id: "laugh", name: "笑い声" },
];

const mockVoiceClips: VoiceClip[] = [
  {
    id: 1,
    title: "おはよう配信",
    memberId: "nose",
    categories: ["greeting", "reaction"],
    views: 15420,
    likes: 892,
    duration: "0:03",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example1",
    clipUrl: "https://youtube.com/watch?v=clip1",
    timestamp: "1:23:45",
    uploaderComment:
      "すみれちゃんの朝の挨拶が可愛すぎて何度も聞いてしまいます！みんなも朝はこれを聞いて元気出していこう！",
    uploadedAt: new Date("2025-01-29T08:00:00"),
    tags: ["朝", "挨拶", "かわいい", "元気"],
  },
  {
    id: 2,
    title: "勝利の叫び",
    memberId: "beni",
    categories: ["gaming", "reaction"],
    views: 23100,
    likes: 1205,
    duration: "0:02",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example2",
    clipUrl: null,
    timestamp: "0:45:20",
    uploaderComment: "激戦の末の勝利！ととちゃんの全力の喜びが伝わってきます",
    uploadedAt: new Date("2025-01-28T15:30:00"),
    tags: ["勝利", "ゲーム", "叫び", "テンション高い"],
  },
  {
    id: 3,
    title: "かわいい笑い声",
    memberId: "runa",
    categories: ["laugh", "reaction"],
    views: 31200,
    likes: 2103,
    duration: "0:04",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example3",
    clipUrl: "https://youtube.com/watch?v=clip3",
    timestamp: "2:15:30",
    uploaderComment:
      "うるはちゃんの笑い声は世界の宝物。疲れた時に聞くと癒されます",
    uploadedAt: new Date("2025-01-27T20:00:00"),
    tags: ["笑い声", "かわいい", "癒し", "宝物"],
  },
  {
    id: 4,
    title: "びっくりリアクション",
    memberId: "mimi",
    categories: ["reaction"],
    views: 8900,
    likes: 567,
    duration: "0:02",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example4",
    clipUrl: null,
    timestamp: "0:30:15",
    uploaderComment: "のあちゃんのリアクションは本当に最高！何度見ても飽きない",
    uploadedAt: new Date("2025-01-30T10:00:00"),
    tags: ["びっくり", "リアクション", "最高"],
  },
  {
    id: 5,
    title: "歌ってみた",
    memberId: "lisa",
    categories: ["singing"],
    views: 42300,
    likes: 3421,
    duration: "0:15",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example5",
    clipUrl: "https://youtube.com/watch?v=clip5",
    timestamp: "1:45:00",
    uploaderComment: "リサちゃんの歌声は天使のよう。フルバージョンも聞きたい！",
    uploadedAt: new Date("2025-01-25T18:00:00"),
    tags: ["歌", "天使", "歌声", "感動"],
  },
  {
    id: 6,
    title: "ゲームオーバー",
    memberId: "nose",
    categories: ["gaming", "reaction", "laugh"],
    views: 12300,
    likes: 890,
    duration: "0:03",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example6",
    clipUrl: null,
    timestamp: "0:55:40",
    uploaderComment: "悔しがるすみれちゃんも可愛い。次は絶対勝てる！",
    uploadedAt: new Date("2025-01-29T22:00:00"),
    tags: ["ゲーム", "悔しい", "かわいい"],
  },
  {
    id: 7,
    title: "みんなこんにちは！",
    memberId: "beni",
    categories: ["greeting"],
    views: 19800,
    likes: 1523,
    duration: "0:02",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example7",
    clipUrl: null,
    timestamp: "0:01:30",
    uploaderComment: "ととちゃんの元気な挨拶で一日が始まる！",
    uploadedAt: new Date("2025-01-30T07:00:00"),
    tags: ["挨拶", "元気", "こんにちは"],
  },
  {
    id: 8,
    title: "面白い瞬間",
    memberId: "runa",
    categories: ["laugh", "gaming", "reaction"],
    views: 28900,
    likes: 1987,
    duration: "0:05",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example8",
    clipUrl: "https://youtube.com/watch?v=clip8",
    timestamp: "1:10:20",
    uploaderComment: "この配信は神回でした。うるはちゃんのツッコミが最高すぎる",
    uploadedAt: new Date("2025-01-26T19:00:00"),
    tags: ["面白い", "神回", "ツッコミ"],
  },
  {
    id: 9,
    title: "ナイスプレイ！",
    memberId: "mimi",
    categories: ["gaming", "reaction"],
    views: 16700,
    likes: 1234,
    duration: "0:03",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example9",
    clipUrl: null,
    timestamp: "0:40:50",
    uploaderComment: "のあちゃんのスーパープレイ！これは何度見ても鳥肌立つ",
    uploadedAt: new Date("2025-01-30T14:00:00"),
    tags: ["ナイスプレイ", "スーパープレイ", "鳥肌"],
  },
  {
    id: 10,
    title: "ありがとう",
    memberId: "lisa",
    categories: ["greeting", "singing"],
    views: 21500,
    likes: 1876,
    duration: "0:02",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example10",
    clipUrl: null,
    timestamp: "2:30:00",
    uploaderComment: "リサちゃんからの感謝の言葉。こちらこそありがとう！",
    uploadedAt: new Date("2025-01-28T21:00:00"),
    tags: ["ありがとう", "感謝", "言葉"],
  },
  {
    id: 11,
    title: "やったー！",
    memberId: "nose",
    categories: ["reaction", "gaming"],
    views: 18900,
    likes: 1456,
    duration: "0:02",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example11",
    clipUrl: null,
    timestamp: "1:15:25",
    uploaderComment: "喜ぶすみれちゃんを見てるとこっちまで嬉しくなる",
    uploadedAt: new Date("2025-01-30T16:00:00"),
    tags: ["やったー", "喜び", "嬉しい"],
  },
  {
    id: 12,
    title: "おやすみなさい",
    memberId: "beni",
    categories: ["greeting"],
    views: 14200,
    likes: 998,
    duration: "0:03",
    audioUrl: "/test/audio/sea.mp3",
    sourceUrl: "https://youtube.com/watch?v=example12",
    clipUrl: "https://youtube.com/watch?v=clip12",
    timestamp: "3:45:50",
    uploaderComment:
      "ととちゃんのおやすみボイスで安眠できます。みんなも良い夢を！",
    uploadedAt: new Date("2025-01-29T23:00:00"),
    tags: ["おやすみ", "安眠", "良い夢"],
  },
];

export async function getVoiceClips(): Promise<VoiceClip[]> {
  // In production, this would be a database query
  return mockVoiceClips;
}

export async function getMembers(): Promise<Member[]> {
  return mockMembers;
}

export async function getCategories(): Promise<Category[]> {
  return mockCategories;
}

export async function getTrendingClips(limit = 4): Promise<VoiceClip[]> {
  const clips = await getVoiceClips();
  return [...clips].sort((a, b) => b.views - a.views).slice(0, limit);
}

export async function getNewClips(limit = 8): Promise<VoiceClip[]> {
  const clips = await getVoiceClips();
  return [...clips]
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(0, limit);
}

export async function searchClips(searchTerm: string): Promise<SearchResult> {
  const clips = await getVoiceClips();
  const members = await getMembers();
  const categories = await getCategories();

  if (!searchTerm) {
    return { exact: [], related: [], recommended: [] };
  }

  const lowerTerm = searchTerm.toLowerCase();

  const scoredClips = clips.map((clip) => {
    let score = 0;

    // Title match
    if (clip.title.toLowerCase().includes(lowerTerm)) score += 10;

    // Member name match
    const member = members.find((m) => m.id === clip.memberId);
    if (member?.name.toLowerCase().includes(lowerTerm)) score += 8;

    // Tags match
    for (const tag of clip.tags) {
      if (tag.includes(lowerTerm)) score += 5;
    }

    // Category match
    for (const catId of clip.categories) {
      const category = categories.find((c) => c.id === catId);
      if (category?.name.toLowerCase().includes(lowerTerm)) score += 3;
    }

    // Comment match
    if (clip.uploaderComment.toLowerCase().includes(lowerTerm)) score += 2;

    return { ...clip, score };
  });

  const filteredClips = scoredClips
    .filter((clip) => clip.score > 0)
    .sort((a, b) => b.score - a.score);

  const exact = filteredClips.filter((clip) => clip.score >= 10);
  const related = filteredClips.filter(
    (clip) => clip.score >= 3 && clip.score < 10,
  );

  const recommended: VoiceClip[] = [];
  if (exact.length > 0) {
    const topResult = exact[0];
    const sameMembers = clips
      .filter(
        (clip) =>
          clip.memberId === topResult.memberId && clip.id !== topResult.id,
      )
      .slice(0, 3);
    const sameCategories = clips
      .filter(
        (clip) =>
          clip.categories.some((cat) => topResult.categories.includes(cat)) &&
          clip.id !== topResult.id &&
          !sameMembers.includes(clip),
      )
      .slice(0, 3);
    recommended.push(...sameMembers, ...sameCategories);
  }

  return { exact, related, recommended };
}
