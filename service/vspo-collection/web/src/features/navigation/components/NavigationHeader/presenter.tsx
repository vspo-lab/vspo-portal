import { Menu, Search, User, Video, X } from "lucide-react";
import Link from "next/link";
import { Button } from "../../../../shared/components/presenters/Button";
import type { NavItem } from "../../hooks/useNavigation";

interface NavigationHeaderPresenterProps {
  navItems: NavItem[];
  activeNav: string;
  isMobileMenuOpen: boolean;
  userProfile: {
    name: string;
    level: number;
    badge: string;
    avatar?: string;
  };
  onNavClick: (nav: string, href: string) => void;
  onMobileMenuToggle: () => void;
  onSearchClick: () => void;
  onProfileClick: () => void;
}

export const NavigationHeaderPresenter = ({
  navItems,
  activeNav,
  isMobileMenuOpen,
  userProfile,
  onNavClick,
  onMobileMenuToggle,
  onSearchClick,
  onProfileClick,
}: NavigationHeaderPresenterProps) => {
  // Map navigation items to routes
  const navRoutes: Record<string, string> = {
    ホーム: "/",
    コレクション: "/playlists",
    さがす: "/clips",
    同時視聴: "/watch-party",
    マイページ: "/profile",
  };

  // Map navigation items to English names for URL display
  const navEnglish: Record<string, string> = {
    ホーム: "Home",
    コレクション: "Playlists",
    さがす: "Clips",
    同時視聴: "Watch Party",
    マイページ: "Profile",
  };

  // Additional navigation items
  const additionalNavItems = [
    { name: "VTubers", route: "/vtubers", icon: User, emoji: "👤" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-purple-900/95 via-pink-900/95 to-blue-900/95 backdrop-blur-xl border-b border-white/10 safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo and Site Name */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 touch-target"
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform rotate-3 transition-transform hover:rotate-6">
                <Video className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-pulse" />
            </div>
            <div className="hidden xs:block sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-white">
                VSPO Collection
              </h1>
              <p className="text-xs text-white/60">推しコレ</p>
            </div>
            {/* Mobile-only short name */}
            <div className="block xs:hidden">
              <h1 className="text-base font-bold text-white">VSPO</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.slice(0, 5).map((item) => {
              const isActive = activeNav === item.text;
              const Icon = item.icon;

              return (
                <Link
                  key={item.text}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavClick(item.text, item.href);
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {navEnglish[item.text]}
                  </span>
                </Link>
              );
            })}

            {/* Additional Navigation Items */}
            {additionalNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.route}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Button */}
            <Button
              onClick={onSearchClick}
              className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all touch-target"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline text-sm">Search</span>
            </Button>

            {/* Mobile Search Button */}
            <Button
              onClick={onSearchClick}
              className="sm:hidden flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all touch-target"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* User Profile */}
            <button
              type="button"
              onClick={onProfileClick}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all touch-target"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs text-white/80">Lv.{userProfile.level}</p>
                <p className="text-sm font-medium text-white">
                  {userProfile.name}
                </p>
              </div>
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  {userProfile.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 text-xs">
                  {userProfile.badge}
                </div>
              </div>
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-all touch-target-large"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 top-16"
            onClick={onMobileMenuToggle}
            aria-hidden="true"
          />

          {/* Menu Content */}
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 border-b border-white/10 shadow-2xl mobile-menu-backdrop z-50 safe-area-bottom">
            <div className="px-4 py-4 space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {navItems.map((item) => {
                const isActive = activeNav === item.text;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.text}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavClick(item.text, item.href);
                      onMobileMenuToggle(); // Close menu after selection
                    }}
                    className={`
                      mobile-nav-item transition-all duration-200
                      ${
                        isActive
                          ? "bg-white/20 text-white shadow-lg"
                          : "text-white/80 hover:bg-white/10 hover:text-white active:bg-white/15"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base">{item.text}</p>
                      <p className="text-sm text-white/60">
                        {navEnglish[item.text]}
                      </p>
                    </div>
                    <span className="text-xl flex-shrink-0">{item.emoji}</span>
                  </Link>
                );
              })}

              {/* Additional Navigation Items */}
              {additionalNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.route}
                    onClick={onMobileMenuToggle}
                    className="mobile-nav-item text-white/80 hover:bg-white/10 hover:text-white active:bg-white/15 transition-all duration-200"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base">{item.name}</p>
                      <p className="text-sm text-white/60">メンバー一覧</p>
                    </div>
                    <span className="text-xl flex-shrink-0">{item.emoji}</span>
                  </Link>
                );
              })}

              {/* Mobile Search */}
              <button
                type="button"
                onClick={() => {
                  onSearchClick();
                  onMobileMenuToggle();
                }}
                className="w-full mobile-nav-item bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <Search className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-base">Search</span>
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
