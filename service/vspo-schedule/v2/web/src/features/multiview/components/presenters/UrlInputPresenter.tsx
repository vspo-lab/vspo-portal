import { Livestream } from "@/features/shared/domain";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import LinkIcon from "@mui/icons-material/Link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React from "react";

const UrlInputContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: "white",
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
  },
}));

const InputSection = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  alignItems: "flex-start",
  marginBottom: theme.spacing(1),
}));

const SupportedPlatforms = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: "rgba(0, 0, 0, 0.03)",
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
}));

export interface UrlInputPresenterProps {
  url: string;
  isLoading: boolean;
  error: string | null;
  selectedStreams: Livestream[];
  maxStreams: number;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export const UrlInputPresenter: React.FC<UrlInputPresenterProps> = ({
  url,
  isLoading,
  error,
  selectedStreams,
  maxStreams,
  onUrlChange,
  onSubmit,
  onClear,
}) => {
  const { t } = useTranslation("multiview");

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isLoading) {
      onSubmit();
    }
  };

  const isMaxStreamsReached = selectedStreams.length >= maxStreams;

  return (
    <UrlInputContainer elevation={1}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t(
          "urlInput.description",
          "YouTube、Twitch、その他のプラットフォームのURLから直接配信を追加できます",
        )}
      </Typography>

      <InputSection>
        <TextField
          fullWidth
          placeholder={t("urlInput.placeholder", "配信URLを入力してください")}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || isMaxStreamsReached}
          error={!!error}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: url && (
              <InputAdornment position="end">
                <IconButton
                  onClick={onClear}
                  disabled={isLoading}
                  size="small"
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!url.trim() || isLoading || isMaxStreamsReached}
          startIcon={isLoading ? <CircularProgress size={16} /> : <AddIcon />}
          size="small"
          sx={{ whiteSpace: "nowrap" }}
        >
          {isLoading
            ? t("urlInput.adding", "追加中...")
            : t("urlInput.add", "追加")}
        </Button>
      </InputSection>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {/* Max streams warning */}
      {isMaxStreamsReached && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {t(
            "urlInput.maxStreamsReached",
            "最大{{count}}つまでの配信を選択できます",
            { count: maxStreams },
          )}
        </Alert>
      )}

      {/* Stream count info */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1 }}
      >
        {t("urlInput.streamCount", "{{current}}/{{max}} 配信選択中", {
          current: selectedStreams.length,
          max: maxStreams,
        })}
      </Typography>

      {/* Supported Platforms */}
      <SupportedPlatforms>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
        >
          {t("urlInput.supportedPlatforms.title", "対応プラットフォーム:")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("urlInput.supportedPlatforms.list", "YouTube")}
        </Typography>
      </SupportedPlatforms>
    </UrlInputContainer>
  );
};
