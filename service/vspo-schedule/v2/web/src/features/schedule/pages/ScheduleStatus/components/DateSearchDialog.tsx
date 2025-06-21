import { Delete, Star } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React from "react";
import type { FavoriteSearchCondition } from "../../../types/favorite";

// Type for date search form data
export type DateSearchFormData = {
  selectedDate: Date | null;
  memberType: string;
  platform: string;
};

export type DateSearchDialogProps = {
  open: boolean;
  onClose: () => void;
  dateInputValue: string;
  formData: DateSearchFormData;
  isSearchEnabled: boolean;
  favorite: FavoriteSearchCondition | null;
  hasFavorite: boolean;
  isSaveEnabled: boolean;
  onDateInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMemberTypeChange: (event: SelectChangeEvent) => void;
  onPlatformChange: (event: SelectChangeEvent) => void;
  onSubmit: () => void;
  onClear: () => void;
  onSaveFavorite: () => void;
  onLoadFavorite: () => void;
  onDeleteFavorite: () => void;
};

export const DateSearchDialog: React.FC<DateSearchDialogProps> = ({
  open,
  onClose,
  dateInputValue,
  formData,
  isSearchEnabled,
  favorite,
  hasFavorite,
  isSaveEnabled,
  onDateInputChange,
  onMemberTypeChange,
  onPlatformChange,
  onSubmit,
  onClear,
  onSaveFavorite,
  onLoadFavorite,
  onDeleteFavorite,
}) => {
  const { t } = useTranslation("schedule");

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{t("search.title", "Date Search")}</DialogTitle>
      <DialogContent>
        <FormGroup sx={{ mt: 1 }}>
          <FormControl fullWidth margin="normal">
            <TextField
              label={t("search.selectDate", "Select Date")}
              type="date"
              value={dateInputValue}
              onChange={onDateInputChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                max: "2030-12-31",
                min: "2020-01-01",
              }}
            />
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="member-type-select-label">
              {t("search.memberType", "Member Type")}
            </InputLabel>
            <Select
              labelId="member-type-select-label"
              id="member-type-select"
              value={formData.memberType}
              label={t("search.memberType", "Member Type")}
              onChange={onMemberTypeChange}
            >
              <MenuItem value="vspo_all">
                {t("search.memberType.all", "All Members")}
              </MenuItem>
              <MenuItem value="vspo_jp">
                {t("search.memberType.jp", "Japanese")}
              </MenuItem>
              <MenuItem value="vspo_en">
                {t("search.memberType.en", "English")}
              </MenuItem>
              <MenuItem value="vspo_ch">
                {t("search.memberType.ch", "Chinese")}
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="platform-select-label">
              {t("search.platform", "Platform")}
            </InputLabel>
            <Select
              labelId="platform-select-label"
              id="platform-select"
              value={formData.platform}
              label={t("search.platform", "Platform")}
              onChange={onPlatformChange}
            >
              <MenuItem value="">
                {t("search.platform.all", "All Platforms")}
              </MenuItem>
              <MenuItem value="youtube">
                {t("search.platform.youtube", "YouTube")}
              </MenuItem>
              <MenuItem value="twitch">
                {t("search.platform.twitch", "Twitch")}
              </MenuItem>
              <MenuItem value="twitcasting">
                {t("search.platform.twitcasting", "TwitCasting")}
              </MenuItem>
              <MenuItem value="niconico">
                {t("search.platform.niconico", "Niconico")}
              </MenuItem>
            </Select>
          </FormControl>
        </FormGroup>

        {/* お気に入り管理セクション */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("search.favorites.save", "Favorite Search Conditions")}
          </Typography>

          {!hasFavorite ? (
            <Button
              variant="outlined"
              onClick={onSaveFavorite}
              disabled={!isSaveEnabled}
              startIcon={<Star />}
              fullWidth
            >
              {t("search.favorites.saveButton", "Save Current Conditions")}
            </Button>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Star color="primary" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("search.favorites.saved", "Saved Conditions")}
                  </Typography>
                  <Typography variant="body1">
                    {`${t(`search.memberType.${favorite?.memberType === "vspo_all" ? "all" : favorite?.memberType?.replace("vspo_", "")}`, favorite?.memberType || "")} | ${favorite?.platform ? t(`search.platform.${favorite.platform}`, favorite.platform) : t("search.platform.all", "All Platforms")}`}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={onLoadFavorite}
                  sx={{ flex: 1 }}
                >
                  {t("search.favorites.loadButton", "Load")}
                </Button>
                <Button
                  variant="outlined"
                  onClick={onSaveFavorite}
                  disabled={!isSaveEnabled}
                  sx={{ flex: 1 }}
                >
                  {t("search.favorites.saveButton", "Update")}
                </Button>
                <IconButton onClick={onDeleteFavorite} color="error">
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClear}>{t("search.clear", "Clear")}</Button>
        <Button onClick={onClose}>{t("search.cancel", "Cancel")}</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="primary"
          disabled={!isSearchEnabled}
        >
          {t("search.search", "Search")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
