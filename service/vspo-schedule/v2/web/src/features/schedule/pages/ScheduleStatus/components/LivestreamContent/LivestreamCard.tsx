import { VideoCard } from "@/features/shared/components/Elements/Card/VideoCard";
import type { Livestream } from "@/features/shared/domain/livestream";
import { formatDate } from "@/lib/utils";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
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
import { useMemo } from "react";

// VideoCard Component
const StyledCard = styled(Card)(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  borderRadius: "8px",
  overflow: "hidden",
}));

// LivestreamCard Component
const ResponsiveTypography = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  fontSize: "1.2rem",
  fontWeight: 500,
  whiteSpace: "nowrap",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.9em",
  },
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
    paddingBottom: theme.spacing(1.5),
    [theme.breakpoints.down("sm")]: {
      paddingBottom: theme.spacing(1.0),
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

const TimeContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  color: theme.vars.palette.text.secondary,
  marginTop: "0.5em",
}));

const StyledPlayIcon = styled(PlayArrowIcon)(({ theme }) => ({
  fontSize: "1.2rem",
  // marginRight: theme.spacing(0.1),
  [theme.breakpoints.down("sm")]: {
    fontSize: "1rem",
  },
}));

// Function to determine livestream status
const getLiveStatus = (
  livestream: Livestream,
): "live" | "upcoming" | "archive" => {
  const status = livestream.status;
  if (status === "live") return "live";
  if (status === "upcoming") return "upcoming";
  return "archive";
};

type Member = {
  name: string;
  iconUrl: string;
};

type LivestreamCardProps =
  | {
      livestream: Livestream;
      isFreechat: false;
      timeZone: string;
      additionalMembers?: Member[];
    }
  | {
      livestream: Livestream;
      isFreechat: true;
      additionalMembers?: Member[];
    };

export const LivestreamCard: React.FC<LivestreamCardProps> = (props) => {
  const { livestream, isFreechat, additionalMembers = [] } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const title = livestream.title || "";
  const channelTitle = livestream.channelTitle || "";
  const scheduledStartTime = livestream.scheduledStartTime || "";
  const iconUrl = livestream.channelThumbnailUrl || "";

  const livestreamStatus = useMemo(
    () => getLiveStatus(livestream),
    [livestream],
  );
  const highlight =
    livestreamStatus === "live" || livestreamStatus === "upcoming"
      ? {
          label: livestreamStatus === "live" ? "live" : "upcoming",
          color: livestreamStatus === "live" ? "#ff0000" : "#2D4870",
          bold: true,
        }
      : undefined;

  const formattedTime =
    !isFreechat && "timeZone" in props
      ? formatDate(scheduledStartTime, "HH:mm", { timeZone: props.timeZone })
      : "";

  return (
    <VideoCard video={livestream} highlight={highlight}>
      <StyledCard>
        <StyledCardContent>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {/* Title */}
            <TitleTypography variant="body1">{title}</TitleTypography>

            {/* Creator Name */}
            <CreatorTypography variant="body2">
              {channelTitle}
            </CreatorTypography>

            {/* Icon(s) and Time side by side */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: { xs: 1, sm: 2 },
              }}
            >
              {/* Icon(s) */}
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

              {/* Time */}
              {formattedTime && (
                <TimeContainer>
                  <StyledPlayIcon />
                  <ResponsiveTypography
                    variant="body2"
                    sx={{ color: "text.secondary" }}
                  >
                    {formattedTime}~
                  </ResponsiveTypography>
                </TimeContainer>
              )}
            </Box>
          </Box>
        </StyledCardContent>
      </StyledCard>
    </VideoCard>
  );
};
