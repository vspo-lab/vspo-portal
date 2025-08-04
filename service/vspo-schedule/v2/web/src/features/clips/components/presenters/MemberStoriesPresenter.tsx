import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Avatar, Box, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type React from "react";
import { useRef } from "react";
import type { Channel } from "@/features/shared/domain";

// Styled components
const StoryContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
  boxShadow: theme.shadows[1],
}));

const StoryAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  border: `3px solid ${theme.vars.palette.primary.main}`,
  boxShadow: "0 0 0 2px white",
  cursor: "pointer",
  transition: "transform 0.2s",
  "&:hover": {
    transform: "scale(1.05)",
  },
}));

const StoryAvatarInactive = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  border: `3px solid ${theme.vars.palette.grey[300]}`,
  filter: "grayscale(100%)",
  opacity: 0.7,
  boxShadow: "0 0 0 2px white",
  cursor: "pointer",
}));

const MemberName = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  textAlign: "center",
  marginTop: theme.spacing(1),
  maxWidth: 80,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export type MemberStoriesPresenterProps = {
  vspoMembers: Channel[];
};

export const MemberStoriesPresenter: React.FC<MemberStoriesPresenterProps> = ({
  vspoMembers,
}) => {
  const { t } = useTranslation("clips");
  const router = useRouter();
  const storyScrollRef = useRef<HTMLDivElement>(null);

  // Horizontal scroll handling
  const scrollStories = (direction: "left" | "right") => {
    if (storyScrollRef.current) {
      const scrollAmount = 300; // Scroll amount
      storyScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const navigateToMember = (channelId: string) => {
    router.push(`/clips/members/${channelId}`);
  };

  return (
    <StoryContainer>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
          {t("home.members.sectionTitle")}
        </Typography>
        <Box>
          <IconButton onClick={() => scrollStories("left")} size="small">
            <NavigateBeforeIcon />
          </IconButton>
          <IconButton onClick={() => scrollStories("right")} size="small">
            <NavigateNextIcon />
          </IconButton>
        </Box>
      </Box>

      <Box
        ref={storyScrollRef}
        sx={{
          display: "flex",
          overflowX: "auto",
          gap: 2,
          pb: 1,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          scrollSnapType: "x mandatory",
        }}
      >
        {vspoMembers.map((member) => (
          <Box
            key={member.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              scrollSnapAlign: "start",
            }}
            onClick={() => navigateToMember(member.id)}
          >
            {member.active ? (
              <StoryAvatar
                src={member.thumbnailURL || "/images/placeholder-avatar.jpg"}
                alt={member.name}
              />
            ) : (
              <StoryAvatarInactive
                src={member.thumbnailURL || "/images/placeholder-avatar.jpg"}
                alt={member.name}
              />
            )}
            <MemberName>{member.name}</MemberName>
          </Box>
        ))}
      </Box>
    </StoryContainer>
  );
};
