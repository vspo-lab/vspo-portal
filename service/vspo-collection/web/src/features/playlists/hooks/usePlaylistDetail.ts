import { useEffect, useState } from "react";
import type { PlaylistDetail, PlaylistVideo } from "../types";

// Mock data generator
const generateMockPlaylistDetail = (id: string): PlaylistDetail => {
  const mockVideos: PlaylistVideo[] = [
    {
      id: 1,
      title: "【VSPO】エペ大会で魅せた神プレイ集",
      vtuber: "🎮 るなちゃん",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "15:24",
      views: "89.3K",
      clipper: "FPSまとめ",
      isExclusive: true,
      likes: 2341,
      comments: 156,
      watchPartyActive: true,
      addedAt: "2024-01-15",
      orderIndex: 0,
    },
    {
      id: 2,
      title: "【感動】3Dライブで涙腺崩壊の瞬間",
      vtuber: "🎤 みおちゃん",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "8:32",
      views: "126.5K",
      clipper: "ライブ切り抜き",
      isExclusive: false,
      likes: 4567,
      comments: 234,
      watchPartyActive: false,
      addedAt: "2024-01-14",
      orderIndex: 1,
    },
    {
      id: 3,
      title: "【爆笑】マイクラ建築対決の珍プレー",
      vtuber: "🏗️ ひまりちゃん",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "12:15",
      views: "98.7K",
      clipper: "マイクラまとめ",
      isExclusive: true,
      likes: 3421,
      comments: 189,
      watchPartyActive: true,
      addedAt: "2024-01-13",
      orderIndex: 2,
    },
    {
      id: 4,
      title: "【ASMR】深夜の囁き声で安眠導入",
      vtuber: "🌙 さくらちゃん",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "45:30",
      views: "67.2K",
      clipper: "ASMR専門",
      isExclusive: false,
      likes: 1890,
      comments: 78,
      watchPartyActive: false,
      addedAt: "2024-01-12",
      orderIndex: 3,
    },
    {
      id: 5,
      title: "【料理配信】初めてのケーキ作りで大惨事",
      vtuber: "🍰 ななちゃん",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "18:45",
      views: "145.3K",
      clipper: "料理まとめ",
      isExclusive: true,
      likes: 5678,
      comments: 345,
      watchPartyActive: false,
      addedAt: "2024-01-11",
      orderIndex: 4,
    },
  ];

  const playlistTitles = [
    "VSPOメンバー最強ゲーミングモーメント集",
    "癒やしボイスASMR完全版",
    "VSPOコラボ配信名場面集2024",
    "神歌ってみた集 - ボカロ編",
    "お絵描き配信タイムラプス集",
  ];

  const descriptions = [
    "VSPOメンバーのゲーム配信から、最も印象的で技術的に優れたプレイを厳選しました。FPS、アクション、パズルなど様々なジャンルから集めた神プレイをお楽しみください！",
    "深夜の配信で聴ける癒やしボイスを集めました。勉強や作業のBGM、睡眠導入にも最適です。イヤホン推奨でお楽しみください。",
    "VSPOメンバー同士のコラボ配信から爆笑必至の名場面を集めました。仲良しメンバーたちの掛け合いをお楽しみください！",
    "歌唱力に定評のあるメンバーたちによるボカロカバー集です。原曲とは違った魅力をお楽しみください。",
    "イラストレーターとしても活躍するメンバーたちのお絵描き配信をタイムラプスでまとめました。",
  ];

  const index = Number.parseInt(id) % 5;

  return {
    id: Number.parseInt(id),
    title: playlistTitles[index],
    creator: [
      "ゲーム切り抜き師",
      "ASMR愛好家",
      "コラボまとめ職人",
      "歌ってみたファン",
      "イラスト好き",
    ][index],
    creatorBadge: ["🎮", "🎧", "🤝", "🎵", "🎨"][index],
    creatorAvatar: "/placeholder.svg?height=40&width=40",
    creatorLevel: Math.floor(Math.random() * 50) + 10,
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: mockVideos.length,
    views: "234.5K",
    topVideo: mockVideos[0].title,
    isHot: index < 3,
    likes: 5678,
    watchPartyCount: 12,
    tags: [
      ["ゲーム実況", "APEX", "FPS"],
      ["ASMR", "癒やし", "睡眠導入"],
      ["コラボ", "マイクラ", "爆笑"],
      ["歌ってみた", "ボカロ", "音楽"],
      ["お絵描き", "イラスト", "アート"],
    ][index],
    description: descriptions[index],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
    totalDuration: "1時間34分",
    isFollowing: index < 2,
    videos: mockVideos,
  };
};

export const usePlaylistDetail = (playlistId: string) => {
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        const data = generateMockPlaylistDetail(playlistId);
        setPlaylist(data);
      } catch {
        setError("プレイリストの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  const toggleFollow = () => {
    if (playlist) {
      setPlaylist({
        ...playlist,
        isFollowing: !playlist.isFollowing,
      });
    }
  };

  const addToQueue = (video: PlaylistVideo) => {
    // In real app, would add to playback queue
    console.log("Added to queue:", video.title);
  };

  const removeVideo = (videoId: number) => {
    if (playlist) {
      setPlaylist({
        ...playlist,
        videos: playlist.videos.filter((v) => v.id !== videoId),
        videoCount: playlist.videoCount - 1,
      });
    }
  };

  const reorderVideos = (fromIndex: number, toIndex: number) => {
    if (playlist) {
      const newVideos = [...playlist.videos];
      const [removed] = newVideos.splice(fromIndex, 1);
      newVideos.splice(toIndex, 0, removed);

      // Update order indices
      newVideos.forEach((video, index) => {
        video.orderIndex = index;
      });

      setPlaylist({
        ...playlist,
        videos: newVideos,
      });
    }
  };

  return {
    playlist,
    isLoading,
    error,
    toggleFollow,
    addToQueue,
    removeVideo,
    reorderVideos,
  };
};
