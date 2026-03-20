import SearchIcon from "@mui/icons-material/Search";
import { Box, Container, Fab, Fade, Paper, Tab, Tabs } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "next-i18next";
import type React from "react";
import { LivestreamGridSkeleton } from "@/features/shared/components/Elements/Skeleton/LivestreamGridSkeleton";
import type { Event } from "@/features/shared/domain";
import type { Livestream } from "../../../shared/domain/livestream";
import {
  DateSearchDialogContainer,
  EventsContent,
  LivestreamContent,
} from "./components";

// Header height estimation (adjust if needed based on your actual header height)
const HEADER_HEIGHT = "54px";

const FixedTabsContainer = styled(Paper)(({ theme }) => ({
  position: "sticky",
  top: HEADER_HEIGHT, // Stick to the position right below the header
  zIndex: 1100,
  width: "100%",
  backgroundColor: theme.vars.palette.background.default,
  transition: "none",

  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
  },
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  minHeight: "100px",
  backgroundColor: theme.vars.palette.background.default,
  color: theme.vars.palette.text.primary,
}));

type PresenterProps = {
  livestreamsByDate: Record<string, Livestream[]>;
  events: Event[];
  timeZone: string;
  statusFilter: "live" | "upcoming" | "all";
  onStatusFilterChange: (status: "live" | "upcoming" | "all") => void;
  isLoading: boolean;
  isSearchDialogOpen: boolean;
  onSearchDialogOpen: () => void;
  onSearchDialogClose: () => void;
  allTabLabel: string;
  isArchivePage?: boolean;
};

export const ScheduleStatusPresenter: React.FC<PresenterProps> = ({
  livestreamsByDate,
  events,
  timeZone,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  isSearchDialogOpen,
  onSearchDialogOpen,
  onSearchDialogClose,
  allTabLabel,
  isArchivePage = false,
}) => {
  const { t } = useTranslation("streams");

  return (
    <Container maxWidth="lg" sx={{ position: "relative", pb: 4, pl: 0, pr: 0 }}>
      {!isArchivePage && (
        <FixedTabsContainer elevation={2}>
          <Tabs
            value={statusFilter}
            onChange={(_, newValue) =>
              onStatusFilterChange(newValue as "all" | "live" | "upcoming")
            }
            aria-label="livestream status tabs"
            variant="fullWidth"
          >
            <Tab label={allTabLabel} value="all" />
            <Tab label={t("status.live")} value="live" />
            <Tab label={t("status.upcoming")} value="upcoming" />
          </Tabs>
        </FixedTabsContainer>
      )}

      <ContentContainer sx={{ mt: 4 }}>
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            <LivestreamGridSkeleton />
          </Box>
        ) : (
          <Fade in timeout={300}>
            <Box>
              <EventsContent events={events} />
              <LivestreamContent
                livestreamsByDate={livestreamsByDate}
                timeZone={timeZone}
              />
            </Box>
          </Fade>
        )}
      </ContentContainer>

      {/* Floating search button */}
      <Fab
        color="primary"
        aria-label={t("search.dateSearch", "Search by Date")}
        onClick={onSearchDialogOpen}
        sx={{
          position: "fixed",
          bottom: 72,
          right: 32,
          zIndex: 1000,
          boxShadow: 3,
        }}
      >
        <SearchIcon />
      </Fab>

      <DateSearchDialogContainer
        open={isSearchDialogOpen}
        onClose={onSearchDialogClose}
      />
    </Container>
  );
};
