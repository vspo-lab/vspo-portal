import type {
  Clip,
  Playlist,
  Recommendation,
  SpecialEvent,
} from "../../common/types/schemas";

// Server-side data fetching functions for HomePage
export async function getSpecialEvent(): Promise<SpecialEvent> {
  // In a real app, this would fetch from an API
  return {
    title: "🎉 推しコレ1周年記念イベント開催中！",
    description: "限定バッジがもらえるチャンス",
    timeLeft: "あと2日",
    isActive: true,
  };
}

export async function getCategories(): Promise<string[]> {
  return [
    "🔥 トレンド",
    "🎵 歌ってみた",
    "🎮 ゲーム実況",
    "💬 雑談",
    "🎨 お絵描き",
    "🎭 ASMR",
    "🎪 コラボ",
  ];
}

export async function getTrendingPlaylists(): Promise<Playlist[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return [
    {
      id: 1,
      title: "みおちゃんの神回まとめ",
      creator: "ファン太郎",
      creatorBadge: "💎",
      thumbnail: "/placeholder.svg?height=80&width=120",
      videoCount: 12,
      views: "89.2K",
      topVideo: "【歌ってみた】新曲MV公開で大バズり中！",
      isHot: true,
      likes: 1247,
      watchPartyCount: 3,
      tags: ["歌ってみた", "新曲", "バズり中"],
    },
    {
      id: 2,
      title: "ひまりちゃんホラゲ爆笑集",
      creator: "切り抜き職人",
      creatorBadge: "⚡",
      thumbnail: "/placeholder.svg?height=80&width=120",
      videoCount: 8,
      views: "76.5K",
      topVideo: "【ホラゲ実況】可愛すぎる悲鳴で視聴者悶絶",
      isHot: false,
      likes: 892,
      watchPartyCount: 5,
      tags: ["ゲーム実況", "ホラー", "面白い"],
    },
    {
      id: 3,
      title: "さくらちゃんASMR癒やし集",
      creator: "癒やし系まとめ",
      creatorBadge: "🌸",
      thumbnail: "/placeholder.svg?height=80&width=120",
      videoCount: 15,
      views: "54.3K",
      topVideo: "【ASMR】耳元で囁く天使の声",
      isHot: true,
      likes: 756,
      watchPartyCount: 2,
      tags: ["ASMR", "癒やし", "睡眠導入"],
    },
  ];
}

export async function getPopularClips(): Promise<Clip[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  return [
    {
      id: 1,
      title: "【みおちゃん】天使の歌声に涙腺崩壊...",
      vtuber: "🦄 みおちゃん",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "2:34",
      views: "125K",
      clipper: "切り抜きマスター",
      isExclusive: true,
      likes: 3421,
      comments: 156,
      watchPartyActive: true,
    },
    {
      id: 2,
      title: "【ひまりちゃん】下手すぎて逆にプロ級www",
      vtuber: "🌺 ひまりちゃん",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "1:47",
      views: "98K",
      clipper: "面白切り抜き",
      isExclusive: false,
      likes: 2156,
      comments: 89,
      watchPartyActive: false,
    },
    {
      id: 3,
      title: "【さくらちゃん】この声で眠れない人いる？",
      vtuber: "🌸 さくらちゃん",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "5:12",
      views: "87K",
      clipper: "ASMR切り抜き",
      isExclusive: true,
      likes: 1987,
      comments: 234,
      watchPartyActive: true,
    },
    {
      id: 4,
      title: "【あやちゃん】神絵師すぎて言葉が出ない",
      vtuber: "🎨 あやちゃん",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "3:28",
      views: "76K",
      clipper: "アート系まとめ",
      isExclusive: false,
      likes: 1543,
      comments: 67,
      watchPartyActive: false,
    },
    {
      id: 5,
      title: "【るなちゃん】FPSの天才現る！敵が見えてる説",
      vtuber: "🌙 るなちゃん",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "4:15",
      views: "156K",
      clipper: "ゲーム切り抜き専門",
      isExclusive: true,
      likes: 4532,
      comments: 298,
      watchPartyActive: true,
    },
    {
      id: 6,
      title: "【ななちゃん】料理配信で大爆発www消防車呼んだ？",
      vtuber: "⭐ ななちゃん",
      thumbnail: "/placeholder.svg?height=80&width=120",
      duration: "3:02",
      views: "203K",
      clipper: "事故系まとめ",
      isExclusive: false,
      likes: 5678,
      comments: 412,
      watchPartyActive: false,
    },
  ];
}

export async function getRecommendations(): Promise<Recommendation[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return [
    {
      id: 1,
      title: "【ももちゃん】新人とは思えない歌唱力",
      vtuber: "🍑 ももちゃん",
      thumbnail: "/placeholder.svg?height=60&width=80",
      duration: "3:21",
      views: "42K",
      reason: "歌が好きなあなたに",
      isPersonalized: true,
    },
    {
      id: 2,
      title: "【ゆめちゃん】深夜雑談で本音トーク",
      vtuber: "🌙 ゆめちゃん",
      thumbnail: "/placeholder.svg?height=60&width=80",
      duration: "7:18",
      views: "38K",
      reason: "雑談系がお好み？",
      isPersonalized: true,
    },
    {
      id: 3,
      title: "【そらちゃん】デビュー配信が可愛すぎる",
      vtuber: "☁️ そらちゃん",
      thumbnail: "/placeholder.svg?height=60&width=80",
      duration: "2:45",
      views: "35K",
      reason: "新人Vtuber!",
      isPersonalized: false,
    },
  ];
}
