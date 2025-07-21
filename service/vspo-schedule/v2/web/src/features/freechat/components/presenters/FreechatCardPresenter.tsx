import {
  Avatar,
  AvatarGroup,
  Card,
  CardContent,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/system";
import type React from "react";
import { VideoCard } from "@/features/shared/components/Elements/Card/VideoCard";
import type { Freechat } from "../../../shared/domain/freechat";

// Styled components
const StyledCard = styled(Card)(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  borderRadius: "8px",
  overflow: "hidden",
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  flex: "1 0 auto",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: `${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(0.5)} ${theme.spacing(1)}`,
  [theme.breakpoints.down("sm")]: {
    padding: `${theme.spacing(0.75)} ${theme.spacing(0.75)} ${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
  },
  "&:last-child": {
    paddingBottom: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      paddingBottom: theme.spacing(1.5),
    },
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 36,
  height: 36,
  [theme.breakpoints.down("sm")]: {
    width: 28,
    height: 28,
  },
}));

const StyledAvatarGroup = styled(AvatarGroup)(({ theme }) => ({
  "& .MuiAvatar-root": {
    width: 36,
    height: 36,
    marginLeft: -10,
    border: `2px solid ${theme.vars.palette.background.paper}`,
    [theme.breakpoints.down("sm")]: {
      width: 28,
      height: 28,
      marginLeft: -12,
    },
  },
}));

const TitleTypography = styled(Typography)(({ theme }) => ({
  fontSize: "0.9rem",
  fontWeight: 500,
  lineHeight: 1.2,
  height: "2.4em",
  minHeight: "2.4em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  padding: `0 ${theme.spacing(0.5)}`,
  marginBottom: theme.spacing(0.5),
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.8rem",
  },
}));

const CreatorTypography = styled(Typography)(({ theme }) => ({
  fontSize: "0.8rem",
  lineHeight: 1.2,
  color: theme.vars.palette.text.secondary,
  padding: `0 ${theme.spacing(0.5)}`,
  marginBottom: theme.spacing(0.8),
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.7rem",
    marginBottom: theme.spacing(0.5),
  },
}));

type Member = {
  name: string;
  iconUrl: string;
};

export type FreechatCardPresenterProps = {
  freechat: Freechat;
  additionalMembers?: Member[];
};

export const FreechatCardPresenter: React.FC<FreechatCardPresenterProps> = ({
  freechat,
  additionalMembers = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const title = freechat.title || "";
  const channelTitle = freechat.channelTitle || "";
  const iconUrl = freechat.channelThumbnailUrl || "";

  return (
    <VideoCard video={freechat}>
      <StyledCard>
        <StyledCardContent>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {/* Title */}
            <TitleTypography variant="body1">{title}</TitleTypography>

            {/* Creator Name */}
            <CreatorTypography variant="body2">
              {channelTitle}
            </CreatorTypography>

            {/* Icon(s) */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <Box>
                {additionalMembers.length > 0 ? (
                  <StyledAvatarGroup max={isMobile ? 3 : 4}>
                    <StyledAvatar src={iconUrl} alt={channelTitle} />
                    {additionalMembers.map((member) => (
                      <StyledAvatar
                        key={member.name}
                        src={member.iconUrl}
                        alt={member.name}
                      />
                    ))}
                  </StyledAvatarGroup>
                ) : (
                  <StyledAvatar src={iconUrl} alt={channelTitle} />
                )}
              </Box>
            </Box>
          </Box>
        </StyledCardContent>
      </StyledCard>
    </VideoCard>
  );
};
