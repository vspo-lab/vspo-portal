import type { Event } from "@/features/shared/domain";
import { Box, List, ListItem, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "next-i18next";
import type React from "react";

const ContentSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  backgroundColor: theme.vars.palette.background.paper,
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.vars.palette.divider}`,
}));

const EventsList = styled(List)({
  padding: 0,
});

const EventItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.vars.palette.divider}`,
  "&:last-child": {
    borderBottom: "none",
  },
  transition: "background-color 0.2s ease",
}));

const EventTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: theme.vars.palette.text.primary,
}));

type PresenterProps = {
  events: Event[];
};

export const EventsContentPresenter: React.FC<PresenterProps> = ({
  events,
}) => {
  const { t } = useTranslation("streams");
  if (events.length === 0) {
    return <></>;
  }

  return (
    <ContentSection>
      <SectionHeader>
        <Typography variant="h5" fontWeight={600}>
          {t("events")}
        </Typography>
      </SectionHeader>

      <Paper elevation={0}>
        <EventsList>
          {events.map((event) => (
            <EventItem key={event.id} divider>
              <EventTitle variant="body1">{event.title}</EventTitle>
            </EventItem>
          ))}
        </EventsList>
      </Paper>
    </ContentSection>
  );
};
