"use client";

import { useRouter } from "next/navigation";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import { useNavigation } from "../../hooks/useNavigation";
import { NavigationHeaderPresenter } from "./presenter";

export const NavigationHeaderContainer = () => {
  const router = useRouter();
  const { userProfile } = useUserProfile();
  const {
    navItems,
    activeNav,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    handleNavClick,
    goToPath,
  } = useNavigation();

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearchClick = () => {
    goToPath("/search");
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    goToPath("/profile");
    setIsMobileMenuOpen(false);
  };

  return (
    <NavigationHeaderPresenter
      navItems={navItems}
      activeNav={activeNav}
      isMobileMenuOpen={isMobileMenuOpen}
      userProfile={{
        name: userProfile.username,
        level: userProfile.level,
        badge: userProfile.badges?.[0]?.icon || "🌟",
        avatar: userProfile.avatar,
      }}
      onNavClick={(nav, href) => handleNavClick(nav, href)}
      onMobileMenuToggle={handleMobileMenuToggle}
      onSearchClick={handleSearchClick}
      onProfileClick={handleProfileClick}
    />
  );
};
