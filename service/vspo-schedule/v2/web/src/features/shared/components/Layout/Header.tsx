import { faGithub, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import {
  AppBar,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { Box } from "@mui/system";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type React from "react";
import { Link } from "../Elements";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.vars.palette.customColors.vspoPurple,
  zIndex: 1300,

  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.darkGray,
  },
}));
const StyledTypography = styled(Typography)({
  fontFamily:
    "'Hiragino Kaku Gothic Pro', 'ヒラギノ角ゴ Pro', 'Hiragino Mincho Pro', 'ヒラギノ明朝 Pro', 'Hiragino Maru Gothic Pro', 'ヒラギノ丸ゴ Pro', sans-serif",
  fontWeight: "bold",
  fontSize: "0.9rem",
});
const StyledSubtitle = styled(Typography)({
  fontFamily:
    "'Hiragino Kaku Gothic Pro', 'ヒラギノ角ゴ Pro', 'Hiragino Mincho Pro', 'ヒラギノ明朝 Pro', 'Hiragino Maru Gothic Pro', 'ヒラギノ丸ゴ Pro', sans-serif",
  fontWeight: "normal",
  fontSize: "0.5rem",
  paddingLeft: "0px",
});

const HeaderTabs = styled(Tabs)({
  "& .MuiTab-root": {
    color: "rgba(255,255,255,0.7)",
    minHeight: "auto",
    padding: "8px 16px",
    fontSize: "0.875rem",
    fontWeight: 500,
    textTransform: "none",
  },
  "& .Mui-selected": {
    color: "white",
  },
  "& .MuiTabs-indicator": {
    backgroundColor: "white",
  },
});

const SocialIconNextLink: React.FC<{
  url: string;
  icon: React.ReactNode;
  label: string;
}> = ({ url, icon, label }) => {
  const clickTargetSize = "24px";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        width: clickTargetSize,
        height: clickTargetSize,
        fontSize: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </a>
  );
};

const AppBarOffset = styled("div")(({ theme }) => theme.mixins.toolbar);

type Props = {
  title: string;
  drawerOpen: boolean;
  onDrawerToggle: () => void;
};
export const Header: React.FC<Props> = ({ title, onDrawerToggle }) => {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const router = useRouter();

  const desktopNavRoutes = [
    { label: t("drawer.pages.live"), href: "/schedule/all" },
    { label: t("drawer.pages.clip"), href: "/clips" },
    { label: t("drawer.pages.freechat"), href: "/freechat" },
    { label: t("drawer.pages.multiview"), href: "/multiview" },
  ];

  /** Returns the index of the active tab based on the current route path. */
  const getActiveTab = () => {
    const path = router.asPath;
    const index = desktopNavRoutes.findIndex((route) =>
      path.startsWith(route.href.split("/").slice(0, 2).join("/")),
    );
    return index >= 0 ? index : 0;
  };

  return (
    <>
      <StyledAppBar position="fixed">
        <Toolbar>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Mobile: hamburger menu */}
            {!isDesktop && (
              <IconButton
                color="inherit"
                aria-label="toggle drawer"
                edge="start"
                onClick={onDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo + Title */}
            <Link
              sx={{
                display: "flex",
                flexShrink: 0,
              }}
              href="/schedule/all"
            >
              <Image
                src="/icon-top_transparent.png"
                alt="Page Icon"
                width={40}
                height={40}
                sizes="40px"
                priority
              />
              <Box>
                <StyledTypography variant="h6">{t("spodule")}</StyledTypography>
                <StyledSubtitle>{title}</StyledSubtitle>
              </Box>
            </Link>

            {/* Desktop: inline nav tabs */}
            {isDesktop && (
              <HeaderTabs
                value={getActiveTab()}
                onChange={(_e, newValue: number) => {
                  const route = desktopNavRoutes[newValue];
                  if (route) {
                    router.push(route.href);
                  }
                }}
                sx={{ ml: 3, flex: 1 }}
              >
                {desktopNavRoutes.map((route) => (
                  <Tab key={route.href} label={route.label} />
                ))}
              </HeaderTabs>
            )}

            {/* Spacer for mobile */}
            {!isDesktop && <Box sx={{ flex: 1 }} />}

            {/* Desktop: search icon */}
            {isDesktop && (
              <IconButton
                color="inherit"
                aria-label="search"
                onClick={() => router.push("/schedule/all")}
                sx={{ ml: 1 }}
              >
                <SearchIcon />
              </IconButton>
            )}

            {/* Social icons (both layouts) */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                ml: "12px",
              }}
            >
              <SocialIconNextLink
                url="https://github.com/sugar-cat7/vspo-portal"
                icon={<FontAwesomeIcon icon={faGithub} />}
                label="GitHub"
              />
              <SocialIconNextLink
                url="https://twitter.com/vspodule"
                icon={<FontAwesomeIcon icon={faXTwitter} />}
                label="X (Twitter)"
              />
            </Box>
          </Box>
        </Toolbar>
      </StyledAppBar>

      <AppBarOffset />
    </>
  );
};
