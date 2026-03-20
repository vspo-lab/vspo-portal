import { Livestream } from "@/features/shared/domain";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  styled,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { useState } from "react";
import { convertChatPlayerLink } from "@/features/shared/utils";
import { useColorScheme } from "@mui/material/styles";

const ChatContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: "200px",
  maxWidth: "100%",
  backgroundColor: "white",
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
  },
  borderRadius: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  border: "none",
  boxShadow: "none",
  "&:hover .chat-header": {
    opacity: 1,
  },
  [theme.breakpoints.down("md")]: {
    minHeight: "150px",
  },
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  backgroundColor: "rgba(0,0,0,0.7)",
  padding: theme.spacing(0.5, 1),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "grab",
  opacity: 0,
  transition: "opacity 0.2s ease",
  "&:active": {
    cursor: "grabbing",
  },
}));

const DragHandle = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  cursor: "grab",
  "&:active": {
    cursor: "grabbing",
  },
  marginRight: theme.spacing(0.5),
  padding: theme.spacing(0.25),
}));

const HeaderActions = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 4,
});

const StreamInfo = styled(Box)(({ theme }) => ({
  color: theme.palette.common.white,
  flex: 1,
  minWidth: 0,
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.5)",
  "&:hover": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.2)"
        : "rgba(0, 0, 0, 0.7)",
  },
  marginLeft: theme.spacing(1),
}));

const ChatFrame = styled("iframe")({
  width: "100%",
  height: "100%",
  border: "none",
  flex: 1,
});

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: theme.palette.text.primary,
  [theme.getColorSchemeSelector("dark")]: {
    color: "white",
  },
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  textAlign: "center",
  [theme.getColorSchemeSelector("dark")]: {
    color: "white",
  },
}));

const NoChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  textAlign: "center",
  [theme.getColorSchemeSelector("dark")]: {
    color: "white",
  },
}));

export type ChatCellPresenterProps = {
  stream: Livestream;
  onRemove: () => void;
};

/**
 * Presenter component that renders a live chat iframe for a stream.
 * Supports YouTube live chat and Twitch chat embeds with dark mode.
 */
export const ChatCellPresenter: React.FC<ChatCellPresenterProps> = React.memo(
  ({ stream, onRemove }) => {
    const { t } = useTranslation("multiview");
    const { colorScheme } = useColorScheme();
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const isDarkMode = colorScheme === "dark";

    const chatEmbedUrl = convertChatPlayerLink(
      stream.chatPlayerLink,
      stream.platform,
      isDarkMode,
    );

    const handleLoad = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    return (
      <ChatContainer>
        <ChatHeader
          className="chat-header drag-handle"
          aria-label={t(
            "chat.dragHandle.ariaLabel",
            `Drag to move ${stream.channelTitle}'s chat`,
          )}
        >
          <StreamInfo>
            <Typography
              variant="caption"
              noWrap
              sx={{
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: "0.75rem",
                lineHeight: 1.3,
              }}
            >
              <ChatIcon sx={{ fontSize: "0.85rem" }} />
              {t("chat.header.title", "Chat")}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                display: "block",
                fontSize: "0.65rem",
                opacity: 0.8,
                lineHeight: 1.2,
              }}
            >
              {stream.channelTitle}
            </Typography>
          </StreamInfo>
          <HeaderActions>
            <DragHandle
              size="small"
              className="drag-handle"
              aria-label={t("chat.dragHandle.tooltip", "Move chat")}
              title={t("chat.dragHandle.tooltip", "Move chat")}
            >
              <DragIndicatorIcon fontSize="small" />
            </DragHandle>
            <CloseButton
              className="no-drag"
              size="small"
              onClick={onRemove}
              aria-label={t("chat.close.ariaLabel", "Close chat")}
            >
              <CloseIcon fontSize="small" />
            </CloseButton>
          </HeaderActions>
        </ChatHeader>

        {hasError ? (
          <ErrorContainer role="alert">
            <ErrorOutlineIcon sx={{ fontSize: 48, mb: 2, opacity: 0.7 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t("chat.error.title", "Failed to load chat")}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {t(
                "chat.error.description",
                "Please try again later",
              )}
            </Typography>
          </ErrorContainer>
        ) : chatEmbedUrl ? (
          <>
            {isLoading && (
              <LoadingContainer role="status" aria-label={t("chat.loading", "Loading chat")}>
                <CircularProgress size={40} />
              </LoadingContainer>
            )}
            <ChatFrame
              src={chatEmbedUrl}
              title={`${stream.channelTitle} - ${t("chat.header.title", "Chat")}`}
              onLoad={handleLoad}
              onError={handleError}
              style={{
                visibility: isLoading ? "hidden" : "visible",
              }}
            />
          </>
        ) : (
          <NoChatContainer role="status">
            <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.7 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t("chat.noChat.title", "Chat unavailable")}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {t(
                "chat.noChat.description",
                "Chat embedding is not supported for this stream",
              )}
            </Typography>
          </NoChatContainer>
        )}
      </ChatContainer>
    );
  },
);

ChatCellPresenter.displayName = "ChatCellPresenter";
