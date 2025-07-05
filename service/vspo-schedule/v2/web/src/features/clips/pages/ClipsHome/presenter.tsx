import { Loading } from "@/features/shared/components/Elements";
import type { Clip } from "@/features/shared/domain";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Box,
  ButtonBase,
  Container,
  Grid,
  Paper,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useState } from "react";
import { ClipCarousel, ClipSection } from "../../components/containers";

// Add responsive styled title component
const ResponsiveSectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(1),
  fontSize: "1.5rem",
  [theme.breakpoints.down("sm")]: {
    fontSize: "1.2rem",
  },
}));

// Styled container for filter section
const FilterContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  // Use theme-aware boxShadow
  boxShadow: theme.shadows[1],
  // Use theme background
  background: theme.vars.palette.background.paper,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

// Filter title with icon
const FilterTitle = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  color: theme.vars.palette.text.primary,
}));

// Period filter button
const PeriodButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5, 2),
  fontWeight: 500,
  transition: "all 0.2s ease",
  cursor: "pointer",
  height: 48,
  textAlign: "center",
  justifyContent: "center",
  display: "flex",
  alignItems: "center",
  minWidth: 100,
  width: "100%", // Use full width for better mobile layout
  // Dynamic color based on theme mode and active state
  backgroundColor: active
    ? "#3474db" // Specific blue color for active state
    : theme.palette.mode === "dark"
      ? "#333333" // Dark grey for inactive buttons in dark mode
      : "#e0e0e0", // Light grey for inactive buttons in light mode
  color:
    active || theme.palette.mode === "dark"
      ? theme.palette.common.white // White text for active buttons and dark mode
      : theme.vars.palette.grey[800], // Dark text for inactive buttons in light mode
  "&:hover": {
    backgroundColor: active
      ? "#2a5cb8" // Slightly darker blue for hover on active
      : theme.palette.mode === "dark"
        ? "#444444" // Slightly lighter gray for hover in dark mode
        : "#cccccc", // Darker gray for hover in light mode
  },
  // Mobile-specific styles
  [theme.breakpoints.down("sm")]: {
    minWidth: "auto",
    fontSize: "0.875rem",
    padding: theme.spacing(1, 1.5),
  },
}));

// Clock icon styling
const StyledClockIcon = styled(AccessTimeIcon)(({ theme }) => ({
  marginRight: theme.spacing(1),
  fontSize: "1.2rem",
  opacity: 0.8,
  [theme.breakpoints.down("sm")]: {
    fontSize: "1rem",
    marginRight: theme.spacing(0.5),
  },
}));

export type DateFilterOption = {
  label: string;
  value: string;
  showIcon?: boolean;
};

export type ClipsHomePresenterProps = {
  popularYoutubeClips: Clip[];
  popularShortsClips: Clip[];
  popularTwitchClips: Clip[];
  // vspoMembers: Channel[];
  isProcessing: boolean;
  currentPeriod: string;
};

export const Presenter: React.FC<ClipsHomePresenterProps> = ({
  popularYoutubeClips,
  popularShortsClips,
  popularTwitchClips,
  // vspoMembers,
  isProcessing,
  currentPeriod,
}) => {
  const { t } = useTranslation(["clips", "common"]);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Date filter state
  const [activePeriod, setActivePeriod] = useState<string>(
    currentPeriod || "week",
  );

  // Generate date filter options
  const getDateFilterOptions = (): DateFilterOption[] => {
    return [
      {
        label: isMobile
          ? t("common:all", "全て")
          : t("searchDialog.timeframes.all", "すべて"),
        value: "all",
        showIcon: false,
      },
      {
        label: isMobile ? "24h" : t("searchDialog.timeframes.1day", "24時間"),
        value: "day",
        showIcon: true,
      },
      {
        label: isMobile ? "1週" : t("searchDialog.timeframes.1week", "1週間"),
        value: "week",
        showIcon: true,
      },
      {
        label: isMobile ? "1月" : t("searchDialog.timeframes.1month", "1ヶ月"),
        value: "month",
        showIcon: true,
      },
      {
        label: isMobile ? "1年" : t("searchDialog.timeframes.year", "1年"),
        value: "year",
        showIcon: true,
      },
    ];
  };

  const dateFilterOptions = getDateFilterOptions();

  // Set initial filter based on current period from SSR
  useEffect(() => {
    if (currentPeriod) {
      setActivePeriod(currentPeriod);
    }
  }, [currentPeriod]);

  const handleDateFilterChange = (periodValue: string) => {
    setActivePeriod(periodValue);

    // Navigate to the same page with a different period query parameter
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, period: periodValue },
      },
      undefined,
      { scroll: false },
    );
  };

  const carouselClips = [...popularYoutubeClips, ...popularTwitchClips].sort(
    () => Math.random() - 0.5,
  );

  if (isProcessing) {
    return <Loading />;
  }

  const navigateToClips = (platform?: string, type?: string) => {
    const query: Record<string, string> = {};
    if (type) query.type = type;

    // Preserve the current period filter when navigating
    if (activePeriod && activePeriod !== "all") {
      query.period = activePeriod;
    }

    if (platform === "twitch") {
      router.push({
        pathname: "/clips/twitch",
        query,
      });
    } else if (platform === "youtube") {
      if (type === "shorts") {
        router.push({
          pathname: "/clips/youtube/shorts",
          query,
        });
      } else {
        router.push({
          pathname: "/clips/youtube",
          query,
        });
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Date Filter */}
      <FilterContainer elevation={1}>
        <FilterTitle>
          <FilterListIcon
            sx={{ mr: 1, color: theme.vars.palette.primary.main }}
          />
          <Typography
            variant="h6"
            fontWeight={600}
            fontSize={isMobile ? "1.1rem" : "1.25rem"}
          >
            {t("searchDialog.timeframe", "期間でフィルタ")}
          </Typography>
        </FilterTitle>

        <Grid container spacing={isMobile ? 1 : 2}>
          {dateFilterOptions.map((option) => (
            <Grid
              size={{
                xs: isMobile ? (option.value === "all" ? 4 : 4) : "auto",
              }}
              key={option.value}
            >
              <PeriodButton
                active={activePeriod === option.value}
                onClick={() => handleDateFilterChange(option.value)}
              >
                {option.showIcon && <StyledClockIcon />}
                {option.label}
              </PeriodButton>
            </Grid>
          ))}
        </Grid>
      </FilterContainer>

      {/* Carousel */}
      <ClipCarousel clips={carouselClips} />

      {/* Member Stories */}
      {/* TODO: implement */}
      {/* <MemberStories vspoMembers={vspoMembers} /> */}

      {/* YouTube Clips Section */}
      <Box sx={{ mb: 4 }}>
        <ResponsiveSectionTitle variant="h5">
          {t("home.sections.popularYoutubeClips", "人気の切り抜き")}
        </ResponsiveSectionTitle>
        <ClipSection
          title=""
          clips={popularYoutubeClips}
          type="youtube"
          onViewMore={() => navigateToClips("youtube")}
          singleRow
        />
      </Box>

      {/* YouTube Shorts Section */}
      <Box sx={{ mb: 4 }}>
        <ResponsiveSectionTitle variant="h5">
          {t("home.sections.popularShortsClips", "人気のショート動画")}
        </ResponsiveSectionTitle>
        <ClipSection
          title=""
          clips={popularShortsClips}
          type="shorts"
          onViewMore={() => navigateToClips("youtube", "shorts")}
          singleRow
        />
      </Box>

      {/* Twitch Clips Section */}
      <Box sx={{ mb: 4 }}>
        <ResponsiveSectionTitle variant="h5">
          {t("home.sections.popularTwitchClips", "人気のTwitchクリップ")}
        </ResponsiveSectionTitle>
        <ClipSection
          title=""
          clips={popularTwitchClips}
          type="twitch"
          onViewMore={() => navigateToClips("twitch")}
          singleRow
        />
      </Box>
    </Container>
  );
};
