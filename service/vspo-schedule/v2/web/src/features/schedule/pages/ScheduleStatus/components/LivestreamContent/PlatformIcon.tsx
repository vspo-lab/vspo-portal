import { faTwitch } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import type { Platform } from "@/features/shared/domain/video";

const StyledFontAwesomeIcon = styled(FontAwesomeIcon)(() => ({
  color: "black",
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
