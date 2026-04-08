"use client";

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
  type SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import type { FavoriteSearchCondition } from "../../../types/favorite";

// Type for date search form data
export type DateSearchFormData = {
  selectedDate: Date | null;
  memberType: string;
  platform: string;
};

type DateSearchDialogProps = {
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
  onLoadFavorite: _onLoadFavorite,
  onDeleteFavorite,
}) => {
  const t = useTranslations("schedule");

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{t("search.title")}</DialogTitle>
      <DialogContent>
        <FormGroup sx={{ mt: 1 }}>
          <FormControl fullWidth margin="normal">
            <TextField
              label={t("search.selectDate")}
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
              {t("search.memberTypeLabel")}
            </InputLabel>
            <Select
              labelId="member-type-select-label"
              id="member-type-select"
              value={formData.memberType}
              label={t("search.memberTypeLabel")}
              onChange={onMemberTypeChange}
            >
              <MenuItem value="vspo_all">{t("search.memberType.all")}</MenuItem>
              <MenuItem value="vspo_jp">{t("search.memberType.jp")}</MenuItem>
              <MenuItem value="vspo_en">{t("search.memberType.en")}</MenuItem>
              <MenuItem value="vspo_ch">{t("search.memberType.ch")}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="platform-select-label">
              {t("search.platformLabel")}
            </InputLabel>
            <Select
              labelId="platform-select-label"
              id="platform-select"
              value={formData.platform}
              label={t("search.platformLabel")}
              onChange={onPlatformChange}
            >
              <MenuItem value="">{t("search.platform.all")}</MenuItem>
              <MenuItem value="youtube">
                {t("search.platform.youtube")}
              </MenuItem>
              <MenuItem value="twitch">{t("search.platform.twitch")}</MenuItem>
              <MenuItem value="twitcasting">
                {t("search.platform.twitcasting")}
              </MenuItem>
              <MenuItem value="niconico">
                {t("search.platform.niconico")}
              </MenuItem>
            </Select>
          </FormControl>
        </FormGroup>

        {/* Favorites management section */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("search.favorites.save")}
          </Typography>

          {!hasFavorite ? (
            <Button
              variant="outlined"
              onClick={onSaveFavorite}
              disabled={!isSaveEnabled}
              startIcon={<Star />}
              fullWidth
            >
              {t("search.favorites.saveButton")}
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
                    {t("search.favorites.saved")}
                  </Typography>
                  <Typography variant="body1">
                    {`${t(`search.memberType.${favorite?.memberType === "vspo_all" ? "all" : favorite?.memberType?.replace("vspo_", "")}`)} | ${favorite?.platform ? t(`search.platform.${favorite.platform}`) : t("search.platform.all")}`}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={onSaveFavorite}
                  disabled={!isSaveEnabled}
                  sx={{ flex: 1 }}
                >
                  {t("search.favorites.saveButton")}
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
        <Button onClick={onClear}>{t("search.clear")}</Button>
        <Button onClick={onClose}>{t("search.cancel")}</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="primary"
          disabled={!isSearchEnabled}
        >
          {t("search.search")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
