import { faDiscord, faTwitch } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import EventIcon from "@mui/icons-material/Event";
import GridViewIcon from "@mui/icons-material/GridView";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoIcon from "@mui/icons-material/Info";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import type { NavigationRouteId } from "@/constants/navigation";
import type { Platform } from "@/features/shared/domain/video";

const StyledFontAwesomeIcon = styled(FontAwesomeIcon)(({ theme }) => ({
  color: "black",

  [theme.getColorSchemeSelector("dark")]: {
    color: "white",
  },
}));

type PlatformIconProps = { platform: Platform };

export const PlatformIcon: React.FC<PlatformIconProps> = ({ platform }) => {
  switch (platform) {
    case "youtube":
      return (
        <Image
          src="/youtube_social_icon_red.png"
          alt="Youtube Icon"
          style={{ objectFit: "cover" }}
          height={20}
          width={28.2}
        />
      );
    case "twitch":
      return (
        <StyledFontAwesomeIcon icon={faTwitch} style={{ height: "20px" }} />
      );
    case "twitcasting":
      return (
        <Image
          src="/twitcasting-icon.png"
          alt="Twitcasting"
          width="20"
          height="20"
        />
      );
    case "niconico":
      return <Image src="/nc-icon.png" alt="niconico" width="20" height="20" />;
    default:
      return <></>;
  }
};

type DrawerIconProps = { id: NavigationRouteId };

export const DrawerIcon: React.FC<DrawerIconProps> = ({ id }) => {
  switch (id) {
    case "live":
      return <LiveTvIcon />;
    case "upcoming":
      return <CalendarTodayIcon />;
    case "archive":
      return <AllInboxIcon />;
    case "list":
      return <LiveTvIcon />;
    case "clip":
      return <ContentCutIcon />;
    case "qa":
      return <HelpOutlineIcon />;
    case "freechat":
      return <ChatBubbleOutlineIcon />;
    case "site-news":
      return <NotificationsIcon />;
    case "event":
      return <EventIcon />;
    case "about":
      return <InfoIcon />;
    case "discord":
      return <FontAwesomeIcon icon={faDiscord} style={{ height: "20px" }} />;
    case "multiview":
      return <GridViewIcon />;
    default:
      return <></>;
  }
};
