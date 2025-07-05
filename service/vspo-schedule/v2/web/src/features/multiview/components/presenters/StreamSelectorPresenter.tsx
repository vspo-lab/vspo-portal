import type { Livestream } from "@/features/shared/domain";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Box,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  styled,
  useTheme,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import type React from "react";

const SelectorContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: "white",
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  overflow: "hidden",
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
  },
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
  onStreamClick: (stream: Livestream) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: "all" | "live" | "upcoming") => void;
};

export const StreamSelectorPresenter: React.FC<
  StreamSelectorPresenterProps
> = ({
  filteredStreams,
  selectedStreams,
  searchQuery,
  statusFilter,
  onStreamClick,
  onSearchChange,
  onStatusFilterChange,
}) => {
  const { t } = useTranslation("multiview");
  const theme = useTheme();

  const isStreamSelected = (streamId: string) => {
    return selectedStreams.some((s) => s.id === streamId);
  };

  const canSelectMore = selectedStreams.length < 9;

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
          placeholder={t("selector.search.placeholder", "配信を検索...")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
            label={t("selector.tabs.all", "すべて")}
            value="all"
            sx={{ minHeight: 48 }}
          />
          <Tab
            label={t("selector.tabs.live", "ライブ")}
            value="live"
            icon={<LiveTvIcon />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            label={t("selector.tabs.upcoming", "予定")}
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
                  {t("selector.noResults", "該当する配信がありません")}
                </Typography>
              }
            />
          </ListItem>
        ) : (
          filteredStreams.map((stream) => {
            const isSelected = isStreamSelected(stream.id);
            const isDisabled = !canSelectMore && !isSelected;

            return (
              <ListItem key={stream.id} disablePadding>
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
                      src={stream.channelThumbnailUrl}
                      alt={stream.channelTitle}
                      sx={{ width: 40, height: 40 }}
                    />
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
                              ? t("selector.status.live", "LIVE")
                              : t("selector.status.upcoming", "予定")
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
