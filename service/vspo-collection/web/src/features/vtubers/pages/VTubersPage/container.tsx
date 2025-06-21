"use client";

import { useMemo, useState } from "react";
import type { Creator, MemberType } from "../../../../common/types/creator";
import { VTubersPagePresenter } from "./presenter";

// Mock data - would typically come from API
const mockVTubers: Creator[] = [
  {
    id: "1",
    name: "橘ひなの",
    avatar: "/placeholder.svg?height=120&width=120",
    memberType: "vspo_jp",
    description: "VSPO!所属のゲーマー系VTuber。FPSとAPEXが大好き！",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://www.youtube.com/@TachibanaHinano",
        handle: "@TachibanaHinano",
        subscriberCount: 542000,
      },
      {
        platform: "twitter",
        url: "https://twitter.com/Hinano_Tachibana",
        handle: "@Hinano_Tachibana",
      },
    ],
    stats: {
      totalClips: 1247,
      totalViews: "12.3M",
      monthlyViewers: "890K",
      favoriteCount: 15678,
    },
    tags: ["FPS", "APEX", "ゲーム実況", "歌ってみた"],
    joinedDate: "2021-03-15",
    isActive: true,
    color: "#FF69B4",
  },
  {
    id: "2",
    name: "如月れん",
    avatar: "/placeholder.svg?height=120&width=120",
    memberType: "vspo_jp",
    description: "VSPO!の頼れるお姉さん。配信では可愛い一面も♡",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://www.youtube.com/@KisaragiRen",
        handle: "@KisaragiRen",
        subscriberCount: 398000,
      },
      {
        platform: "twitter",
        url: "https://twitter.com/Ren_Kisaragi",
        handle: "@Ren_Kisaragi",
      },
    ],
    stats: {
      totalClips: 892,
      totalViews: "8.7M",
      monthlyViewers: "654K",
      favoriteCount: 12456,
    },
    tags: ["雑談", "APEX", "歌ってみた", "料理"],
    joinedDate: "2021-04-10",
    isActive: true,
    color: "#9D7BBA",
  },
  {
    id: "3",
    name: "神成きゅぴ",
    avatar: "/placeholder.svg?height=120&width=120",
    memberType: "vspo_jp",
    description: "天使のような歌声とゲームスキルを持つVTuber",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://www.youtube.com/@KaminariKyupi",
        handle: "@KaminariKyupi",
        subscriberCount: 445000,
      },
      {
        platform: "twitter",
        url: "https://twitter.com/Kyupi_Kaminari",
        handle: "@Kyupi_Kaminari",
      },
    ],
    stats: {
      totalClips: 1156,
      totalViews: "9.8M",
      monthlyViewers: "723K",
      favoriteCount: 13897,
    },
    tags: ["歌ってみた", "APEX", "Minecraft", "ASMR"],
    joinedDate: "2021-05-20",
    isActive: true,
    color: "#FFB6C1",
  },
  {
    id: "4",
    name: "八雲べに",
    avatar: "/placeholder.svg?height=120&width=120",
    memberType: "vspo_jp",
    description: "赤いオオカミがトレードマーク。ゲーム愛が溢れる配信者",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://www.youtube.com/@YakumoBeni",
        handle: "@YakumoBeni",
        subscriberCount: 376000,
      },
      {
        platform: "twitter",
        url: "https://twitter.com/Beni_Yakumo",
        handle: "@Beni_Yakumo",
      },
    ],
    stats: {
      totalClips: 743,
      totalViews: "6.2M",
      monthlyViewers: "512K",
      favoriteCount: 9876,
    },
    tags: ["FPS", "ホラーゲーム", "雑談", "歌ってみた"],
    joinedDate: "2021-06-08",
    isActive: true,
    color: "#DC143C",
  },
  {
    id: "5",
    name: "小雀とと",
    avatar: "/placeholder.svg?height=120&width=120",
    memberType: "vspo_jp",
    description: "小鳥のような可愛らしさと意外なゲームセンスの持ち主",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://www.youtube.com/@KosuzumeToto",
        handle: "@KosuzumeToto",
        subscriberCount: 298000,
      },
      {
        platform: "twitter",
        url: "https://twitter.com/Toto_Kosuzume",
        handle: "@Toto_Kosuzume",
      },
    ],
    stats: {
      totalClips: 567,
      totalViews: "4.8M",
      monthlyViewers: "387K",
      favoriteCount: 7654,
    },
    tags: ["APEX", "Minecraft", "お絵描き", "歌ってみた"],
    joinedDate: "2021-07-12",
    isActive: true,
    color: "#FFE4B5",
  },
  {
    id: "6",
    name: "Amano Serafi",
    avatar: "/placeholder.svg?height=120&width=120",
    memberType: "vspo_en",
    description: "VSPO! EN's angelic streamer with incredible gaming skills",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://www.youtube.com/@AmanoSerafi",
        handle: "@AmanoSerafi",
        subscriberCount: 187000,
      },
      {
        platform: "twitter",
        url: "https://twitter.com/Serafi_Amano",
        handle: "@Serafi_Amano",
      },
      {
        platform: "twitch",
        url: "https://www.twitch.tv/amanoserafi",
        handle: "amanoserafi",
      },
    ],
    stats: {
      totalClips: 423,
      totalViews: "3.2M",
      monthlyViewers: "245K",
      favoriteCount: 5432,
    },
    tags: ["FPS", "VALORANT", "Singing", "Chatting"],
    joinedDate: "2022-01-15",
    isActive: true,
    color: "#87CEEB",
  },
  {
    id: "7",
    name: "Runie Ruse",
    avatar: "/placeholder.svg?height=120&width=120",
    memberType: "vspo_en",
    description: "The cunning fox of VSPO! EN with a love for strategy games",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://www.youtube.com/@RunieRuse",
        handle: "@RunieRuse",
        subscriberCount: 156000,
      },
      {
        platform: "twitter",
        url: "https://twitter.com/Ruse_Runie",
        handle: "@Ruse_Runie",
      },
      {
        platform: "twitch",
        url: "https://www.twitch.tv/runieruse",
        handle: "runieruse",
      },
    ],
    stats: {
      totalClips: 334,
      totalViews: "2.7M",
      monthlyViewers: "198K",
      favoriteCount: 4321,
    },
    tags: ["Strategy", "Horror", "ASMR", "Variety"],
    joinedDate: "2022-02-20",
    isActive: true,
    color: "#DDA0DD",
  },
  {
    id: "8",
    name: "Ember Amane",
    avatar: "/placeholder.svg?height=120&width=120",
    memberType: "vspo_en",
    description: "The fiery phoenix bringing energy to every stream",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://www.youtube.com/@EmberAmane",
        handle: "@EmberAmane",
        subscriberCount: 203000,
      },
      {
        platform: "twitter",
        url: "https://twitter.com/Amane_Ember",
        handle: "@Amane_Ember",
      },
    ],
    stats: {
      totalClips: 512,
      totalViews: "4.1M",
      monthlyViewers: "312K",
      favoriteCount: 6789,
    },
    tags: ["Action Games", "Singing", "Karaoke", "Collabs"],
    joinedDate: "2022-03-10",
    isActive: true,
    color: "#FF4500",
  },
];

const memberTypeOptions: { value: MemberType | "all"; label: string }[] = [
  { value: "all", label: "全員" },
  { value: "vspo_jp", label: "VSPO! JP" },
  { value: "vspo_en", label: "VSPO! EN" },
  { value: "vspo_ch", label: "VSPO! CH" },
  { value: "vspo_all", label: "VSPO! ALL" },
  { value: "general", label: "その他" },
];

export const VTubersPageContainer = () => {
  const [selectedMemberType, setSelectedMemberType] = useState<
    MemberType | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "subscribers" | "clips" | "joined"
  >("name");

  // Filter and sort VTubers
  const filteredAndSortedVTubers = useMemo(() => {
    let filtered = mockVTubers;

    // Filter by member type
    if (selectedMemberType !== "all") {
      filtered = filtered.filter(
        (vtuber) => vtuber.memberType === selectedMemberType,
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (vtuber) =>
          vtuber.name.toLowerCase().includes(query) ||
          vtuber.description?.toLowerCase().includes(query) ||
          vtuber.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "subscribers": {
          const aSubscribers =
            a.platformLinks.find((link) => link.subscriberCount)
              ?.subscriberCount || 0;
          const bSubscribers =
            b.platformLinks.find((link) => link.subscriberCount)
              ?.subscriberCount || 0;
          return bSubscribers - aSubscribers;
        }
        case "clips":
          return (b.stats?.totalClips || 0) - (a.stats?.totalClips || 0);
        case "joined":
          return (
            new Date(b.joinedDate || "").getTime() -
            new Date(a.joinedDate || "").getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedMemberType, searchQuery, sortBy]);

  // Event handlers
  const handleMemberTypeChange = (memberType: MemberType | "all") => {
    setSelectedMemberType(memberType);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (sort: typeof sortBy) => {
    setSortBy(sort);
  };

  const handleVTuberClick = (vtuber: Creator) => {
    // Future implementation: navigate to individual VTuber page
    alert(`${vtuber.name}のページに移動します（未実装）`);
  };

  const handlePlatformClick = (vtuber: Creator, platform: string) => {
    const link = vtuber.platformLinks.find((p) => p.platform === platform);
    if (link) {
      window.open(link.url, "_blank");
    }
  };

  const handleFavoriteToggle = (vtuber: Creator) => {
    // Future implementation: toggle favorite status
    alert(`${vtuber.name}をお気に入りに追加しました！`);
  };

  return (
    <VTubersPagePresenter
      vtubers={filteredAndSortedVTubers}
      memberTypeOptions={memberTypeOptions}
      selectedMemberType={selectedMemberType}
      searchQuery={searchQuery}
      sortBy={sortBy}
      onMemberTypeChange={handleMemberTypeChange}
      onSearchChange={handleSearchChange}
      onSortChange={handleSortChange}
      onVTuberClick={handleVTuberClick}
      onPlatformClick={handlePlatformClick}
      onFavoriteToggle={handleFavoriteToggle}
    />
  );
};
