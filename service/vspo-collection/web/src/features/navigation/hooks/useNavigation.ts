import { BookOpen, Home, SearchIcon, Tv, User } from "lucide-react";
import { useState } from "react";

export interface NavItem {
  icon: typeof Home;
  text: string;
  emoji: string;
}

const navItems: NavItem[] = [
  { icon: Home, text: "ホーム", emoji: "🏠" },
  { icon: BookOpen, text: "コレクション", emoji: "📚" },
  { icon: SearchIcon, text: "さがす", emoji: "🔍" },
  { icon: Tv, text: "同時視聴", emoji: "📺" },
  { icon: User, text: "マイページ", emoji: "😊" },
];

export const useNavigation = () => {
  const [activeNav, setActiveNav] = useState("ホーム");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (nav: string) => {
    if (nav !== "ホーム") {
      setActiveNav(nav);
      const pageMessages = {
        コレクション: "📚 あなたの切り抜きコレクションを開きます",
        さがす: "🔍 詳細検索ページを開きます",
        同時視聴:
          "📺 同時視聴ルーム一覧を開きます\n\n・ライブ配信の同時視聴\n・過去動画の同時視聴\n・プライベートルーム作成",
        マイページ: "😊 マイページを開きます",
      };
      alert(
        pageMessages[nav as keyof typeof pageMessages] ||
          `📱 ${nav}に移動します`,
      );
    }
    setIsMobileMenuOpen(false);
  };

  return {
    navItems,
    activeNav,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    handleNavClick,
  };
};
