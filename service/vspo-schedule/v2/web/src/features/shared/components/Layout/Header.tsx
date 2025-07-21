import { faGithub, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/system";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import type React from "react";
import { useState } from "react";
import { CustomDrawer, Link } from "../Elements";

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

const SocialIconNextLink: React.FC<{
  url: string;
  icon: React.ReactNode;
}> = ({ url, icon }) => {
  const clickTargetSize = "24px";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
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
};
export const Header: React.FC<Props> = ({ title }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation("common");
  const toggleDrawerOpen = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
      <StyledAppBar position="fixed">
        <Toolbar>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={toggleDrawerOpen}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Link
              sx={{
                display: "flex",
                width: "100%",
              }}
              href={"/schedule/all"}
            >
              <Image
                src="/icon-top_transparent.png"
                alt="Page Icon"
                width={40}
                height={40}
              />
              <Box>
                <StyledTypography variant="h6">{t("spodule")}</StyledTypography>
                <StyledSubtitle>{title}</StyledSubtitle>
              </Box>
            </Link>
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginLeft: "12px",
              }}
            >
              <SocialIconNextLink
                url="https://github.com/sugar-cat7/vspo-portal"
                icon={<FontAwesomeIcon icon={faGithub} />}
              />
              <SocialIconNextLink
                url="https://twitter.com/vspodule"
                icon={<FontAwesomeIcon icon={faXTwitter} />}
              />
            </Box>
          </div>
        </Toolbar>
      </StyledAppBar>

      <AppBarOffset />

      <CustomDrawer
        open={drawerOpen}
        onOpen={toggleDrawerOpen}
        onClose={toggleDrawerOpen}
      />
    </>
  );
};
