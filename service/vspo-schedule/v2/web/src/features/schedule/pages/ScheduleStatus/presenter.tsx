import SearchIcon from "@mui/icons-material/Search";
import { Box, Container, Fab, Paper, Tab, Tabs } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "next-i18next";
import type React from "react";
import { Loading } from "@/features/shared/components/Elements/Loading/Loading";
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

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 5,
  backgroundColor: theme.vars.palette.background.default,
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.background.paper,
  },
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
        {/* Always render content but with opacity based on loading state */}
        <Box
          sx={{
            opacity: isLoading ? 0 : 1,
            visibility: isLoading ? "hidden" : "visible",
            transition: "opacity 0.2s",
          }}
        >
          <EventsContent events={events} />
          <LivestreamContent
            livestreamsByDate={livestreamsByDate}
            timeZone={timeZone}
          />
        </Box>

        {/* Loading overlay */}
        {isLoading && (
          <LoadingOverlay>
            <Loading />
          </LoadingOverlay>
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
