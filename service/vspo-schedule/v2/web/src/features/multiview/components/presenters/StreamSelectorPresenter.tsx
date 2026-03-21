"use client";

import { Livestream } from "@/features/shared/domain";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ChatIcon from "@mui/icons-material/Chat";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

const SelectorContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: "white",
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
  },
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  overflow: "hidden",
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const TabsContainer = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StreamList = styled(List)({
  maxHeight: "500px",
  overflowY: "auto",
  padding: 0,
});

const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => {
  const backgroundColor =
    status === "live" ? theme.palette.error.main : theme.palette.warning.main;
  const textColor = theme.palette.getContrastText(backgroundColor);

  return {
    fontSize: "0.75rem",
    height: "24px",
    backgroundColor,
    color: textColor,
    "& .MuiChip-icon": {
      color: textColor,
    },
  };
});

export type StreamSelectorPresenterProps = {
  filteredStreams: Livestream[];
  selectedStreams: Livestream[];
  searchQuery: string;
  statusFilter: "all" | "live" | "upcoming";
  chatStreamIds: ReadonlySet<string>;
  onStreamClick: (stream: Livestream) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: "all" | "live" | "upcoming") => void;
  onToggleChat: (streamId: string) => void;
};

export const StreamSelectorPresenter: React.FC<
  StreamSelectorPresenterProps
> = ({
  filteredStreams,
  selectedStreams,
  searchQuery,
  statusFilter,
  chatStreamIds,
  onStreamClick,
  onSearchChange,
  onStatusFilterChange,
  onToggleChat,
}) => {
  const t = useTranslations("multiview");
  const theme = useTheme();

  const isStreamSelected = (streamId: string) => {
    return selectedStreams.some((s) => s.id === streamId);
  };

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const maxStreams = isMobile ? 4 : 12;
  const canSelectMore = selectedStreams.length < maxStreams;

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    onStatusFilterChange(newValue as "all" | "live" | "upcoming");
  };

  const formatStreamTitle = (title: string) => {
    return title.length > 60 ? `${title.substring(0, 60)}...` : title;
  };

  return (
    <SelectorContainer elevation={1}>
      {/* Search */}
      <SearchContainer>
        <TextField
          fullWidth
          size="small"
          placeholder={t("selector.search.placeholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={t("selector.search.ariaLabel")}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
            ),
          }}
        />
      </SearchContainer>

      {/* Filter Tabs */}
      <TabsContainer>
        <Tabs
          value={statusFilter}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ minHeight: 48 }}
        >
          <Tab
            label={t("selector.tabs.all")}
            value="all"
            sx={{ minHeight: 48 }}
          />
          <Tab
            label={t("selector.tabs.live")}
            value="live"
            icon={<LiveTvIcon />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            label={t("selector.tabs.upcoming")}
            value="upcoming"
            icon={<ScheduleIcon />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </TabsContainer>

      {/* Stream List */}
      <StreamList>
        {filteredStreams.length === 0 ? (
          <ListItem>
            <ListItemText
              primary={
                <Typography color="text.secondary" align="center">
                  {t("selector.noResults")}
                </Typography>
              }
            />
          </ListItem>
        ) : (
          filteredStreams.map((stream) => {
            const isSelected = isStreamSelected(stream.id);
            const isDisabled = !canSelectMore && !isSelected;

            const supportsChatEmbed =
              stream.platform === "youtube" || stream.platform === "twitch";
            const hasChatOpen = chatStreamIds.has(stream.id);

            return (
              <ListItem
                key={stream.id}
                disablePadding
                secondaryAction={
                  isSelected && supportsChatEmbed ? (
                    <Tooltip
                      title={
                        hasChatOpen
                          ? t("selector.chat.close")
                          : t("selector.chat.open")
                      }
                    >
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleChat(stream.id);
                        }}
                        aria-label={
                          hasChatOpen
                            ? t("selector.chat.close")
                            : t("selector.chat.open")
                        }
                        aria-pressed={hasChatOpen}
                        sx={{
                          color: hasChatOpen
                            ? theme.palette.primary.main
                            : theme.palette.common.white,
                          [theme.getColorSchemeSelector("light")]: {
                            color: hasChatOpen
                              ? theme.palette.primary.main
                              : theme.palette.text.secondary,
                          },
                        }}
                      >
                        {hasChatOpen ? <ChatIcon /> : <ChatBubbleOutlineIcon />}
                      </IconButton>
                    </Tooltip>
                  ) : undefined
                }
              >
                <ListItemButton
                  onClick={() => onStreamClick(stream)}
                  disabled={isDisabled}
                  selected={isSelected}
                  sx={{
                    opacity: isDisabled ? 0.5 : 1,
                    backgroundColor: isSelected
                      ? theme.palette.action.selected
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isSelected
                        ? theme.palette.action.selected
                        : theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{ width: 40, height: 40 }}
                    >
                      <Image
                        src={stream.channelThumbnailUrl}
                        alt={stream.channelTitle}
                        width={40}
                        height={40}
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                      />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {stream.channelTitle}
                        </Typography>
                        <StatusChip
                          status={stream.status}
                          icon={
                            stream.status === "live" ? (
                              <LiveTvIcon />
                            ) : (
                              <ScheduleIcon />
                            )
                          }
                          label={
                            stream.status === "live"
                              ? t("selector.status.live")
                              : t("selector.status.upcoming")
                          }
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        {formatStreamTitle(stream.title)}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })
        )}
      </StreamList>
    </SelectorContainer>
  );
};
