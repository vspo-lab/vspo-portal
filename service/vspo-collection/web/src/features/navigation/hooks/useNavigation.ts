"use client";

import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Home,
  SearchIcon,
  Tv,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export interface NavItem {
  icon: typeof Home;
  text: string;
  emoji: string;
  href: string;
  matchPaths?: string[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, text: "ホーム", emoji: "🏠", href: "/" },
  {
    icon: BookOpen,
    text: "コレクション",
    emoji: "📚",
    href: "/playlists",
    matchPaths: ["/playlists"],
  },
  { icon: SearchIcon, text: "さがす", emoji: "🔍", href: "/search" },
  { icon: Tv, text: "同時視聴", emoji: "📺", href: "/watch-party" },
  { icon: User, text: "マイページ", emoji: "😊", href: "/profile" },
];

interface UseNavigationReturn {
  navItems: NavItem[];
  activeNav: string;
  isMobileMenuOpen: boolean;
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  setIsMobileMenuOpen: (value: boolean) => void;
  handleNavClick: (nav: string, href: string) => void;
  goToHome: () => void;
  goBack: () => void;
  goToPath: (path: string) => void;
  generateBreadcrumbs: (path: string) => BreadcrumbItem[];
  handleKeyboardNavigation: (event: KeyboardEvent) => void;
}

export const useNavigation = (): UseNavigationReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Determine active navigation based on current path
  const activeNav =
    navItems.find((item) => {
      if (item.href === pathname) return true;
      if (item.matchPaths?.some((path) => pathname.startsWith(path)))
        return true;
      return false;
    })?.text || "ホーム";

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = useCallback((path: string): BreadcrumbItem[] => {
    const segments = path.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: "ホーム", href: "/" }];

    let currentPath = "";
    for (let i = 0; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      const isLast = i === segments.length - 1;

      // Map path segments to readable labels
      const labelMap: Record<string, string> = {
        playlists: "プレイリスト",
        clips: "切り抜き",
        vtubers: "VTuber",
        search: "検索",
        profile: "マイページ",
        "watch-party": "同時視聴",
        host: "ホストダッシュボード",
        obs: "OBS配信設定",
      };

      let label = labelMap[segments[i]] || segments[i];

      // Handle dynamic routes (IDs)
      if (segments[i].match(/^[0-9]+$/) || segments[i].length > 10) {
        // This looks like an ID, try to get a more meaningful label
        if (segments[i - 1] === "playlists") {
          label = "プレイリスト詳細";
        } else if (segments[i - 1] === "clips") {
          label = "切り抜き詳細";
        } else if (segments[i - 1] === "vtubers") {
          label = "VTuber詳細";
        } else {
          label = "詳細";
        }
      }

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        isActive: isLast,
      });
    }

    return breadcrumbs;
  }, []);

  const breadcrumbs = generateBreadcrumbs(pathname);

  const handleNavClick = useCallback(
    (nav: string, href: string): void => {
      setIsMobileMenuOpen(false);
      router.push(href);
    },
    [router],
  );

  const goToHome = useCallback((): void => {
    router.push("/");
  }, [router]);

  const goBack = useCallback((): void => {
    router.back();
  }, [router]);

  const goToPath = useCallback(
    (path: string): void => {
      router.push(path);
    },
    [router],
  );

  // Keyboard navigation support
  const handleKeyboardNavigation = useCallback(
    (event: KeyboardEvent): void => {
      // Alt + Home: Go to home
      if (event.altKey && event.key === "Home") {
        event.preventDefault();
        goToHome();
        return;
      }

      // Alt + Backspace: Go back
      if (event.altKey && event.key === "Backspace") {
        event.preventDefault();
        goBack();
        return;
      }

      // Alt + 1-5: Navigate to main sections
      if (event.altKey && event.key >= "1" && event.key <= "5") {
        event.preventDefault();
        const index = Number.parseInt(event.key) - 1;
        if (navItems[index]) {
          handleNavClick(navItems[index].text, navItems[index].href);
        }
        return;
      }

      // Escape: Close mobile menu
      if (event.key === "Escape" && isMobileMenuOpen) {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        return;
      }
    },
    [goToHome, goBack, handleNavClick, isMobileMenuOpen],
  );

  // Register keyboard event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardNavigation);
    return () => {
      document.removeEventListener("keydown", handleKeyboardNavigation);
    };
  }, [handleKeyboardNavigation]);

  return {
    navItems,
    activeNav,
    isMobileMenuOpen,
    currentPath: pathname,
    breadcrumbs,
    setIsMobileMenuOpen,
    handleNavClick,
    goToHome,
    goBack,
    goToPath,
    generateBreadcrumbs,
    handleKeyboardNavigation,
  };
};
