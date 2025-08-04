import {
  ChevronDown,
  Clock,
  ExternalLink,
  Filter,
  Heart,
  Link2,
  Menu,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Volume2,
  X,
} from "lucide-react";
import React, { useState } from "react";

const VspoVoiceClips = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMember, setSelectedMember] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [likedClips, setLikedClips] = useState(new Set());
  const [favoriteClips, setFavoriteClips] = useState(new Set());
  const [playingClip, setPlayingClip] = useState(null);
  const [selectedClip, setSelectedClip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: "",
    sourceUrl: "",
    clipUrl: "",
    xUrl: "",
    comment: "",
  });
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Vspoメンバーのデータ
  const members = [
    { id: "all", name: "すべて", color: "#000" },
    { id: "nose", name: "花芽すみれ", color: "#FF6B6B", avatar: "NS" },
    { id: "beni", name: "小雀とと", color: "#4ECDC4", avatar: "TT" },
    { id: "runa", name: "一ノ瀬うるは", color: "#45B7D1", avatar: "IU" },
    { id: "mimi", name: "胡桃のあ", color: "#F7DC6F", avatar: "KN" },
    { id: "lisa", name: "英リサ", color: "#BB8FCE", avatar: "HL" },
  ];

  const categories = [
    { id: "all", name: "すべて" },
    { id: "greeting", name: "挨拶" },
    { id: "reaction", name: "リアクション" },
    { id: "gaming", name: "ゲーム" },
    { id: "singing", name: "歌" },
    { id: "laugh", name: "笑い声" },
  ];

  // 人気の検索キーワード
  const popularSearches = [
    "おはよう",
    "ナイスプレイ",
    "笑い声",
    "歌ってみた",
    "かわいい",
  ];

  // 音声クリップのデータ（拡張版）
  const [voiceClips] = useState([
    {
      id: 1,
      title: "おはよう配信",
      member: "nose",
      categories: ["greeting", "reaction"],
      views: 15420,
      likes: 892,
      duration: "0:03",
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
      member: "beni",
      categories: ["gaming", "reaction"],
      views: 23100,
      likes: 1205,
      duration: "0:02",
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
      member: "runa",
      categories: ["laugh", "reaction"],
      views: 31200,
      likes: 2103,
      duration: "0:04",
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
      member: "mimi",
      categories: ["reaction"],
      views: 8900,
      likes: 567,
      duration: "0:02",
      sourceUrl: "https://youtube.com/watch?v=example4",
      clipUrl: null,
      timestamp: "0:30:15",
      uploaderComment:
        "のあちゃんのリアクションは本当に最高！何度見ても飽きない",
      uploadedAt: new Date("2025-01-30T10:00:00"),
      tags: ["びっくり", "リアクション", "最高"],
    },
    {
      id: 5,
      title: "歌ってみた",
      member: "lisa",
      categories: ["singing"],
      views: 42300,
      likes: 3421,
      duration: "0:15",
      sourceUrl: "https://youtube.com/watch?v=example5",
      clipUrl: "https://youtube.com/watch?v=clip5",
      timestamp: "1:45:00",
      uploaderComment:
        "リサちゃんの歌声は天使のよう。フルバージョンも聞きたい！",
      uploadedAt: new Date("2025-01-25T18:00:00"),
      tags: ["歌", "天使", "歌声", "感動"],
    },
    {
      id: 6,
      title: "ゲームオーバー",
      member: "nose",
      categories: ["gaming", "reaction", "laugh"],
      views: 12300,
      likes: 890,
      duration: "0:03",
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
      member: "beni",
      categories: ["greeting"],
      views: 19800,
      likes: 1523,
      duration: "0:02",
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
      member: "runa",
      categories: ["laugh", "gaming", "reaction"],
      views: 28900,
      likes: 1987,
      duration: "0:05",
      sourceUrl: "https://youtube.com/watch?v=example8",
      clipUrl: "https://youtube.com/watch?v=clip8",
      timestamp: "1:10:20",
      uploaderComment:
        "この配信は神回でした。うるはちゃんのツッコミが最高すぎる",
      uploadedAt: new Date("2025-01-26T19:00:00"),
      tags: ["面白い", "神回", "ツッコミ"],
    },
    {
      id: 9,
      title: "ナイスプレイ！",
      member: "mimi",
      categories: ["gaming", "reaction"],
      views: 16700,
      likes: 1234,
      duration: "0:03",
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
      member: "lisa",
      categories: ["greeting", "singing"],
      views: 21500,
      likes: 1876,
      duration: "0:02",
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
      member: "nose",
      categories: ["reaction", "gaming"],
      views: 18900,
      likes: 1456,
      duration: "0:02",
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
      member: "beni",
      categories: ["greeting"],
      views: 14200,
      likes: 998,
      duration: "0:03",
      sourceUrl: "https://youtube.com/watch?v=example12",
      clipUrl: "https://youtube.com/watch?v=clip12",
      timestamp: "3:45:50",
      uploaderComment:
        "ととちゃんのおやすみボイスで安眠できます。みんなも良い夢を！",
      uploadedAt: new Date("2025-01-29T23:00:00"),
      tags: ["おやすみ", "安眠", "良い夢"],
    },
  ]);

  const handleLike = (clipId) => {
    const newLikedClips = new Set(likedClips);
    if (likedClips.has(clipId)) {
      newLikedClips.delete(clipId);
    } else {
      newLikedClips.add(clipId);
    }
    setLikedClips(newLikedClips);
  };

  const handleFavorite = (clipId) => {
    const newFavoriteClips = new Set(favoriteClips);
    if (favoriteClips.has(clipId)) {
      newFavoriteClips.delete(clipId);
    } else {
      newFavoriteClips.add(clipId);
    }
    setFavoriteClips(newFavoriteClips);
  };

  const handlePlay = (clipId) => {
    setPlayingClip(playingClip === clipId ? null : clipId);
  };

  const handleCardClick = (clip) => {
    setSelectedClip(clip);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClip(null);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchInput("");
  };

  const handleRequestSubmit = () => {
    // ここで実際のAPI送信処理を行う
    console.log("リクエスト送信:", requestForm);
    alert("リクエストを送信しました！");
    setShowRequestModal(false);
    setRequestForm({
      title: "",
      sourceUrl: "",
      clipUrl: "",
      xUrl: "",
      comment: "",
    });
  };

  const handleRequestInputChange = (field, value) => {
    setRequestForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 検索スコアリング（簡易的なRAGシミュレーション）
  const getSearchScore = (clip, term) => {
    const lowerTerm = term.toLowerCase();
    let score = 0;

    // タイトルマッチ
    if (clip.title.toLowerCase().includes(lowerTerm)) score += 10;

    // メンバー名マッチ
    const memberName = members.find((m) => m.id === clip.member).name;
    if (memberName.toLowerCase().includes(lowerTerm)) score += 8;

    // タグマッチ
    clip.tags.forEach((tag) => {
      if (tag.includes(lowerTerm)) score += 5;
    });

    // カテゴリマッチ
    clip.categories.forEach((catId) => {
      const category = categories.find((c) => c.id === catId);
      if (category?.name.toLowerCase().includes(lowerTerm)) score += 3;
    });

    // コメントマッチ
    if (clip.uploaderComment.toLowerCase().includes(lowerTerm)) score += 2;

    return score;
  };

  // 検索結果の取得
  const getSearchResults = () => {
    if (!searchTerm) return { exact: [], related: [], recommended: [] };

    const allClips = voiceClips.map((clip) => ({
      ...clip,
      score: getSearchScore(clip, searchTerm),
    }));

    const scoredClips = allClips
      .filter((clip) => clip.score > 0)
      .sort((a, b) => b.score - a.score);

    // 完全一致（スコア10以上）
    const exact = scoredClips.filter((clip) => clip.score >= 10);

    // 関連（スコア3-9）
    const related = scoredClips.filter(
      (clip) => clip.score >= 3 && clip.score < 10,
    );

    // おすすめ（同じメンバーや同じカテゴリから）
    const recommended = [];
    if (exact.length > 0) {
      const topResult = exact[0];
      const sameMembers = voiceClips
        .filter(
          (clip) =>
            clip.member === topResult.member && clip.id !== topResult.id,
        )
        .slice(0, 3);
      const sameCategories = voiceClips
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
  };

  const searchResults = getSearchResults();
  const hasSearchResults =
    searchTerm &&
    (searchResults.exact.length > 0 || searchResults.related.length > 0);

  const trendingClips = [...voiceClips]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);
  const newClips = [...voiceClips]
    .sort((a, b) => b.uploadedAt - a.uploadedAt)
    .slice(0, 8);

  // 時間前を計算する関数
  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}日前`;
    if (hours > 0) return `${hours}時間前`;
    return "1時間以内";
  };

  // クリップカードコンポーネント
  const ClipCard = ({ clip, size = "normal", showScore = false }) => {
    const member = members.find((m) => m.id === clip.member);
    const isLiked = likedClips.has(clip.id);
    const isPlaying = playingClip === clip.id;

    return (
      <div
        className={`bg-zinc-800 border border-amber-600/20 rounded-lg ${size === "small" ? "p-3" : "p-3 md:p-4"} hover:border-amber-600/40 transition-all cursor-pointer relative`}
        onClick={() => handleCardClick(clip)}
      >
        {showScore && clip.score && (
          <div className="absolute -top-2 -right-2 bg-amber-600 text-zinc-900 text-xs font-bold px-2 py-1 rounded-full">
            適合度 {Math.round(clip.score * 10)}%
          </div>
        )}
        <div className="flex items-start space-x-2 md:space-x-3 mb-3">
          <div
            className={`${size === "small" ? "w-8 h-8" : "w-8 h-8 md:w-10 md:h-10"} rounded-full flex items-center justify-center text-zinc-900 font-bold text-xs md:text-sm flex-shrink-0`}
            style={{ backgroundColor: member.color }}
          >
            {member.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium ${size === "small" ? "text-sm" : "text-sm md:text-base"} truncate text-amber-100`}
            >
              {clip.title}
            </h3>
            <p className="text-xs md:text-sm text-zinc-400 truncate">
              {member.name}
            </p>
          </div>
        </div>

        {size === "normal" && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {clip.categories.slice(0, 5).map((categoryId) => {
                const category = categories.find((c) => c.id === categoryId);
                return category ? (
                  <span
                    key={categoryId}
                    className="px-2 py-0.5 text-xs rounded-full bg-amber-600/20 text-amber-400 border border-amber-600/30"
                  >
                    {category.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className="text-xs md:text-sm text-zinc-500 mb-2">
          <div className="flex items-center justify-between">
            <span>{clip.views.toLocaleString()} 回</span>
            <span>{clip.duration}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-zinc-500">
            {clip.likes.toLocaleString()} いいね
          </span>
          <div className="flex items-center space-x-1 md:space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlay(clip.id);
              }}
              className={`p-1.5 md:p-2 rounded-full transition-colors ${
                isPlaying
                  ? "bg-amber-600 text-zinc-900"
                  : "bg-zinc-700 text-amber-100 hover:bg-zinc-600"
              }`}
            >
              <Play
                className="w-3.5 h-3.5 md:w-4 md:h-4"
                fill={isPlaying ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike(clip.id);
              }}
              className={`p-1.5 md:p-2 rounded-full transition-colors ${
                isLiked
                  ? "bg-amber-600/20 text-amber-500"
                  : "bg-zinc-700 text-amber-100 hover:bg-zinc-600"
              }`}
            >
              <Heart
                className="w-3.5 h-3.5 md:w-4 md:h-4"
                fill={isLiked ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* ヘッダー */}
      <header className="bg-zinc-900 border-b border-amber-600/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
              <h1 className="text-lg md:text-2xl font-bold text-amber-100">
                Vspo! ボイス
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center space-x-1 md:space-x-2 bg-amber-600 text-zinc-900 px-3 py-2 md:px-4 rounded-lg hover:bg-amber-500 transition-colors text-sm md:text-base font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">クリップをリクエスト</span>
                <span className="md:hidden">リクエスト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* リッチな検索セクション */}
      <div className="max-w-7xl mx-auto px-4 mt-4 md:mt-6">
        <div className="bg-zinc-800 rounded-lg p-4 md:p-6 border border-amber-600/30">
          <div className="space-y-4">
            {/* 検索バー */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-5 h-5" />
                <input
                  type="text"
                  placeholder="クリップを検索..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  className="w-full pl-10 pr-12 py-3 bg-zinc-700 border border-amber-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-amber-100 placeholder-zinc-500"
                />
                <button
                  onClick={() => setShowSearchFilters(!showSearchFilters)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded hover:bg-zinc-600 transition-colors"
                >
                  <Filter className="w-4 h-4 text-amber-500" />
                </button>
              </div>
              <button
                onClick={handleSearch}
                className="px-4 md:px-6 py-3 bg-amber-600 text-zinc-900 rounded-lg hover:bg-amber-500 transition-colors font-medium"
              >
                検索
              </button>
            </div>

            {/* 人気の検索キーワード */}
            {searchFocused && searchInput === "" && (
              <div className="space-y-2">
                <p className="text-xs text-amber-200">人気の検索</p>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => setSearchInput(keyword)}
                      className="px-3 py-1 text-sm bg-zinc-700 text-amber-100 rounded-full hover:bg-zinc-600 transition-colors"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 検索フィルター */}
            {showSearchFilters && (
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-amber-600/20">
                <div>
                  <label className="text-sm text-amber-200 mb-2 block">
                    カテゴリ
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-amber-600/30 rounded-lg text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-amber-200 mb-2 block">
                    メンバー
                  </label>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-amber-600/30 rounded-lg text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 検索結果 */}
      {searchTerm && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          {hasSearchResults ? (
            <div className="space-y-6">
              {/* 検索結果のヘッダー */}
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-lg font-semibold text-amber-100">
                  「{searchTerm}」の検索結果
                </h2>
                <button
                  onClick={clearSearch}
                  className="text-sm text-amber-500 hover:text-amber-400"
                >
                  検索をクリア
                </button>
              </div>

              {/* 完全一致の結果 */}
              {searchResults.exact.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-amber-200 mb-3 flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <span>検索結果 ({searchResults.exact.length}件)</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {searchResults.exact.map((clip) => (
                      <ClipCard key={clip.id} clip={clip} showScore={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* 関連する結果 */}
              {searchResults.related.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-amber-200 mb-3 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>関連するクリップ</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {searchResults.related.map((clip) => (
                      <ClipCard key={clip.id} clip={clip} />
                    ))}
                  </div>
                </div>
              )}

              {/* おすすめ */}
              {searchResults.recommended.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-amber-200 mb-3 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>同じメンバー・カテゴリのおすすめ</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {searchResults.recommended.map((clip) => (
                      <ClipCard key={clip.id} clip={clip} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-amber-100 mb-2">
                「{searchTerm}」に一致するクリップが見つかりませんでした
              </p>
              <p className="text-zinc-500 text-sm">
                他のキーワードで検索してみてください
              </p>
              <button
                onClick={clearSearch}
                className="mt-4 text-sm text-amber-500 hover:text-amber-400"
              >
                ホームに戻る
              </button>
            </div>
          )}
        </div>
      )}

      {/* トレンドセクション */}
      {!searchTerm && (
        <>
          <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="text-base md:text-lg font-semibold text-amber-100">
                トレンド
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {trendingClips.map((clip, index) => {
                const member = members.find((m) => m.id === clip.member);
                return (
                  <div
                    key={clip.id}
                    className="relative bg-zinc-800 rounded-lg p-3 md:p-4 border border-amber-600/20 hover:border-amber-600/40 transition-all cursor-pointer"
                    onClick={() => handleCardClick(clip)}
                  >
                    <span className="absolute top-2 left-2 text-lg md:text-xl font-bold text-amber-600">
                      #{index + 1}
                    </span>
                    <div className="mt-6">
                      <h3 className="font-medium text-sm md:text-base text-amber-100 truncate">
                        {clip.title}
                      </h3>
                      <p className="text-xs md:text-sm text-zinc-400 truncate">
                        {member.name}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>{clip.views.toLocaleString()} 回</span>
                        <span>{clip.likes.toLocaleString()} ❤</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 新着セクション */}
          <div className="max-w-7xl mx-auto px-4 mt-8 pb-12">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-base md:text-lg font-semibold text-amber-100">
                新着
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {newClips.map((clip) => {
                const member = members.find((m) => m.id === clip.member);
                return (
                  <div key={clip.id} className="relative">
                    <ClipCard clip={clip} />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-zinc-900/80 rounded text-xs text-amber-400">
                      {getTimeAgo(clip.uploadedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* モーダル */}
      {showModal && selectedClip && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-zinc-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-amber-600/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="p-4 md:p-6 border-b border-amber-600/20">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-900 font-bold flex-shrink-0"
                    style={{
                      backgroundColor: members.find(
                        (m) => m.id === selectedClip.member,
                      ).color,
                    }}
                  >
                    {members.find((m) => m.id === selectedClip.member).avatar}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-amber-100">
                      {selectedClip.title}
                    </h2>
                    <p className="text-sm text-zinc-400">
                      {members.find((m) => m.id === selectedClip.member).name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedClip.categories.map((categoryId) => {
                        const category = categories.find(
                          (c) => c.id === categoryId,
                        );
                        return category ? (
                          <span
                            key={categoryId}
                            className="px-2 py-0.5 text-xs rounded-full bg-amber-600/20 text-amber-400 border border-amber-600/30"
                          >
                            {category.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <X className="w-5 h-5 text-amber-100" />
                </button>
              </div>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-4 md:p-6 space-y-6">
              {/* 再生オプション */}
              <div>
                <h3 className="text-sm font-medium text-amber-200 mb-3">
                  再生オプション
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handlePlay(selectedClip.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      playingClip === selectedClip.id
                        ? "bg-amber-600 text-zinc-900"
                        : "bg-zinc-700 text-amber-100 hover:bg-zinc-600"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {playingClip === selectedClip.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                      <span className="font-medium">
                        {playingClip === selectedClip.id ? "一時停止" : "再生"}
                      </span>
                    </div>
                    <span className="text-sm opacity-70">
                      {selectedClip.duration}
                    </span>
                  </button>
                </div>
              </div>

              {/* リンク */}
              <div>
                <h3 className="text-sm font-medium text-amber-200 mb-3">
                  関連リンク
                </h3>
                <div className="space-y-2">
                  <a
                    href={selectedClip.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg text-amber-100 hover:bg-zinc-600 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Link2 className="w-5 h-5" />
                      <div>
                        <p className="font-medium">元配信を見る</p>
                        <p className="text-xs text-zinc-400">
                          タイムスタンプ: {selectedClip.timestamp}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {selectedClip.clipUrl && (
                    <a
                      href={selectedClip.clipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg text-amber-100 hover:bg-zinc-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Volume2 className="w-5 h-5" />
                        <p className="font-medium">切り抜き動画を見る</p>
                      </div>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* 投稿者のコメント */}
              {selectedClip.uploaderComment && (
                <div className="bg-zinc-700/50 rounded-lg p-4 border border-amber-600/20">
                  <h3 className="text-sm font-medium text-amber-200 mb-2 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>投稿者より</span>
                  </h3>
                  <p className="text-sm text-amber-100/90 leading-relaxed">
                    {selectedClip.uploaderComment}
                  </p>
                </div>
              )}

              {/* アクション */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleLike(selectedClip.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg font-medium transition-colors ${
                      likedClips.has(selectedClip.id)
                        ? "bg-amber-600/20 text-amber-500"
                        : "bg-zinc-700 text-amber-100 hover:bg-zinc-600"
                    }`}
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={
                        likedClips.has(selectedClip.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                    <span>いいね</span>
                  </button>

                  <button
                    onClick={() => handleFavorite(selectedClip.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg font-medium transition-colors ${
                      favoriteClips.has(selectedClip.id)
                        ? "bg-amber-600 text-zinc-900"
                        : "bg-zinc-700 text-amber-100 hover:bg-zinc-600"
                    }`}
                  >
                    <Star
                      className="w-5 h-5"
                      fill={
                        favoriteClips.has(selectedClip.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                    <span>お気に入り</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    const memberName = members.find(
                      (m) => m.id === selectedClip.member,
                    ).name;
                    const shareText = `${memberName}の「${selectedClip.title}」を聴いています！ #Vspo #ぶいすぽ`;
                    const shareUrl =
                      selectedClip.clipUrl || selectedClip.sourceUrl;
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                    window.open(twitterUrl, "_blank", "width=550,height=420");
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-zinc-700 rounded-lg text-amber-100 hover:bg-zinc-600 font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Xでシェア</span>
                </button>
              </div>

              {/* 統計情報 */}
              <div className="pt-4 border-t border-amber-600/20">
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-2xl font-bold text-amber-100">
                      {selectedClip.views.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">再生回数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-100">
                      {selectedClip.likes.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">いいね</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* リクエストモーダル */}
      {showRequestModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRequestModal(false)}
        >
          <div
            className="bg-zinc-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-amber-600/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="p-4 md:p-6 border-b border-amber-600/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-amber-100">
                    ボイスクリップをリクエスト
                  </h2>
                </div>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-2 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <X className="w-5 h-5 text-amber-100" />
                </button>
              </div>
            </div>

            {/* リクエストフォーム */}
            <div className="p-4 md:p-6 space-y-6">
              <div className="text-sm text-amber-100/80 mb-4">
                <p>Vspo!メンバーの音声クリップをリクエストできます。</p>
                <p className="mt-1 text-zinc-400">
                  できるだけ詳しい情報を入力してください。
                </p>
              </div>

              {/* タイトル */}
              <div>
                <label className="text-sm font-medium text-amber-200 mb-2 block">
                  音声のタイトル <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={requestForm.title}
                  onChange={(e) =>
                    handleRequestInputChange("title", e.target.value)
                  }
                  placeholder="例: すみれちゃんの「やったー！」"
                  className="w-full px-3 py-2 bg-zinc-700 border border-amber-600/30 rounded-lg text-amber-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {/* 元配信URL */}
              <div>
                <label className="text-sm font-medium text-amber-200 mb-2 block">
                  元配信のURL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={requestForm.sourceUrl}
                  onChange={(e) =>
                    handleRequestInputChange("sourceUrl", e.target.value)
                  }
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-zinc-700 border border-amber-600/30 rounded-lg text-amber-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  YouTubeなどの元配信のURLを入力してください
                </p>
              </div>

              {/* 切り抜きURL */}
              <div>
                <label className="text-sm font-medium text-amber-200 mb-2 block">
                  切り抜き動画のURL（任意）
                </label>
                <input
                  type="url"
                  value={requestForm.clipUrl}
                  onChange={(e) =>
                    handleRequestInputChange("clipUrl", e.target.value)
                  }
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-zinc-700 border border-amber-600/30 rounded-lg text-amber-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  切り抜き動画がある場合は入力してください
                </p>
              </div>

              {/* X（Twitter）のURL */}
              <div>
                <label className="text-sm font-medium text-amber-200 mb-2 block">
                  X（Twitter）のURL（任意）
                </label>
                <input
                  type="url"
                  value={requestForm.xUrl}
                  onChange={(e) =>
                    handleRequestInputChange("xUrl", e.target.value)
                  }
                  placeholder="https://x.com/..."
                  className="w-full px-3 py-2 bg-zinc-700 border border-amber-600/30 rounded-lg text-amber-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  関連するXの投稿がある場合は入力してください
                </p>
              </div>

              {/* コメント */}
              <div>
                <label className="text-sm font-medium text-amber-200 mb-2 block">
                  投稿者からのコメント
                </label>
                <textarea
                  value={requestForm.comment}
                  onChange={(e) =>
                    handleRequestInputChange("comment", e.target.value)
                  }
                  placeholder="この音声の魅力や、どんな場面での音声なのか教えてください"
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-700 border border-amber-600/30 rounded-lg text-amber-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  このクリップの魅力を伝えてください
                </p>
              </div>

              {/* 送信ボタン */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-700 text-amber-100 rounded-lg hover:bg-zinc-600 transition-colors font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleRequestSubmit}
                  disabled={!requestForm.title || !requestForm.sourceUrl}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    requestForm.title && requestForm.sourceUrl
                      ? "bg-amber-600 text-zinc-900 hover:bg-amber-500"
                      : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>リクエストを送信</span>
                </button>
              </div>

              <p className="text-xs text-zinc-500 text-center">
                ※リクエストは運営による確認後、サイトに追加されます
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VspoVoiceClips;
