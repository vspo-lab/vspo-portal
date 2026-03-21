"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, Grid, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type React from "react";
import type { Livestream } from "@/features/shared/domain/livestream";
import { usePathname, useRouter } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";
import { groupLivestreamsByTimeBlock } from "../../utils";
import { LivestreamCard } from "./LivestreamCard";

const ContentSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  backgroundColor: theme.vars.palette.background.paper,
}));

const DateHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.vars.palette.divider}`,
}));

const DateNavigation = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
}));

const NavButton = styled(Button)(({ theme }) => ({
  fontSize: "0.75rem",
  padding: theme.spacing(0.3, 0.8),
  minWidth: "auto",
  display: "flex",
  alignItems: "center",
  gap: "1px",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.7rem",
    padding: theme.spacing(0.2, 0.8),
  },
}));

const LivestreamGrid = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0),
  },
}));

const TimeBlockHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.vars.palette.background.paper,
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.grey[800],
  },
  borderRadius: theme.shape.borderRadius,
  borderLeft: `4px solid ${theme.vars.palette.primary.main}`,
  display: "flex",
  alignItems: "center",
}));

type LivestreamContentProps = {
  livestreamsByDate: Record<string, Livestream[]>;
  timeZone: string;
};

export const LivestreamContentPresenter: React.FC<LivestreamContentProps> = ({
  livestreamsByDate,
  timeZone,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("schedule");
  const livestreamsByTimeBlock = groupLivestreamsByTimeBlock(
    livestreamsByDate,
    timeZone,
  );
  const hasLivestreams = Object.keys(livestreamsByTimeBlock).length > 0;
  const selectedDate =
    searchParams.get("date") ??
    format(utcToZonedTime(new Date(), timeZone), "yyyy-MM-dd");

  const navigateToDate = (date: string, daysToAdd: number) => {
    const currentDate = new Date(date);
    const zonedDate = utcToZonedTime(currentDate, timeZone);
    const newDate = new Date(zonedDate);
    newDate.setDate(newDate.getDate() + daysToAdd);

    const formattedDate = format(newDate, "yyyy-MM-dd");

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formattedDate);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!hasLivestreams) {
    return (
      <ContentSection>
        <DateHeader>
          <Typography
            variant="h5"
            sx={(theme) => ({
              fontWeight: 600,
              color: theme.vars.palette.text.primary,
            })}
          >
            {formatDate(selectedDate, "MM/dd (EEE)", { timeZone })}
          </Typography>
          <DateNavigation>
            <NavButton
              size="small"
              variant="outlined"
              onClick={() => navigateToDate(selectedDate, -1)}
              startIcon={<ChevronLeftIcon fontSize="small" />}
            >
              {t("navigation.previousDay")}
            </NavButton>
            <NavButton
              size="small"
              variant="outlined"
              onClick={() => navigateToDate(selectedDate, 1)}
              endIcon={<ChevronRightIcon fontSize="small" />}
            >
              {t("navigation.nextDay")}
            </NavButton>
          </DateNavigation>
        </DateHeader>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body1" color="text.secondary">
            {t("noLivestreams")}
          </Typography>
        </Box>
      </ContentSection>
    );
  }

  return (
    <Box>
      {Object.entries(livestreamsByTimeBlock).map(
        ([date, timeBlocks], dateIndex) => (
          <ContentSection key={date}>
            <DateHeader>
              <Typography
                variant="h5"
                sx={(theme) => ({
                  fontWeight: 600,
                  color: theme.vars.palette.text.primary,
                })}
              >
                {formatDate(date, "MM/dd (EEE)", { timeZone })}
              </Typography>
              <DateNavigation>
                <NavButton
                  size="small"
                  variant="outlined"
                  onClick={() => navigateToDate(date, -1)}
                  startIcon={<ChevronLeftIcon fontSize="small" />}
                >
                  {t("navigation.previousDay")}
                </NavButton>
                <NavButton
                  size="small"
                  variant="outlined"
                  onClick={() => navigateToDate(date, 1)}
                  endIcon={<ChevronRightIcon fontSize="small" />}
                >
                  {t("navigation.nextDay")}
                </NavButton>
              </DateNavigation>
            </DateHeader>

            {Object.entries(timeBlocks).map(([timeBlock, livestreams]) => (
              <Box key={`${date}-${timeBlock}`}>
                <TimeBlockHeader sx={{ mt: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    {timeBlock}
                  </Typography>
                </TimeBlockHeader>

                <LivestreamGrid container spacing={{ xs: 1, sm: 2, md: 3 }}>
                  {livestreams.map((livestream, index) => (
                    <Grid size={{ xs: 6, sm: 6, md: 4 }} key={livestream.id}>
                      {/* Prioritize first 4 above-the-fold cards for LCP */}
                      <LivestreamCard
                        livestream={livestream}
                        isFreechat={false}
                        timeZone={timeZone}
                        priority={dateIndex === 0 && index < 4}
                      />
                    </Grid>
                  ))}
                </LivestreamGrid>
              </Box>
            ))}
          </ContentSection>
        ),
      )}
    </Box>
  );
};
