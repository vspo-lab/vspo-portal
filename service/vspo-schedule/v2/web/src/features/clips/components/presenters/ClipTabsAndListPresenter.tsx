import { Box, Grid, Pagination, Tab, Tabs } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "next-i18next";
import type React from "react";
import type {
  Clip,
  Pagination as PaginationType,
} from "../../../shared/domain/clip";
import { ClipCardPresenter } from "./ClipCardPresenter";

export type TabOption = {
  value: string;
  label: string;
};

export type ClipTabsAndListPresenterProps = {
  tabOptions: TabOption[];
  selectedTabIndex: number;
  onTabChange: (index: number) => void;
  clips: Clip[];
  pagination: PaginationType;
  onPageChange: (page: number) => void;
  isMobile?: boolean;
};

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(6),

  [theme.breakpoints.down("sm")]: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(4),
  },
}));

export const ClipTabsAndListPresenter: React.FC<
  ClipTabsAndListPresenterProps
> = ({
  tabOptions,
  selectedTabIndex,
  onTabChange,
  clips,
  pagination,
  onPageChange,
  isMobile = false,
}) => {
  const { t } = useTranslation("clips");
  const { t: tCommon } = useTranslation("common");

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    // Convert from 1-indexed UI to 0-indexed API
    onPageChange(value - 1);
  };

  // UI page is always backend page + 1 (to convert from 0-indexed to 1-indexed)
  const displayPage = pagination.currentPage + 1;

  return (
    <>
      <StyledTabs value={selectedTabIndex} onChange={handleTabChange} centered>
        {tabOptions.map((option) => (
          <Tab
            key={option.value}
            label={`${t(`clipLabels.${option.value}`)}`}
            sx={{
              fontSize: isMobile ? "0.875rem" : "inherit",
              padding: isMobile ? "6px 12px" : undefined,
            }}
          />
        ))}
      </StyledTabs>

      {/* Clip List Section */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ width: "100%" }}>
        {clips.map((clip) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={clip.id}>
            <ClipCardPresenter clip={clip} />
          </Grid>
        ))}
      </Grid>

      {/* Pagination Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: isMobile ? "0.75rem" : "1rem",
        }}
      >
        {pagination.totalPages > 1 && (
          <Pagination
            count={pagination.totalPages}
            page={displayPage}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? "small" : "medium"}
            showFirstButton
            showLastButton
            sx={{
              "& .MuiPaginationItem-root.Mui-selected": {
                backgroundColor: "primary.main",
                color: "white",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
            getItemAriaLabel={(type, page) => {
              if (type === "page") {
                return tCommon("pagination.goToPage", { page });
              }
              return type === "first"
                ? tCommon("pagination.firstPage")
                : type === "last"
                  ? tCommon("pagination.lastPage")
                  : type === "next"
                    ? tCommon("pagination.nextPage")
                    : tCommon("pagination.previousPage");
            }}
          />
        )}
        {pagination.totalPages <= 1 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            {/* Spacer when no pagination needed */}
          </Box>
        )}
      </Box>
    </>
  );
};
