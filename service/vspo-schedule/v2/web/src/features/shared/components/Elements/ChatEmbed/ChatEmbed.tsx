import type { Freechat } from "@/features/shared/domain/freechat";
import type { Livestream } from "@/features/shared/domain/livestream";
import { convertChatPlayerLink } from "@/features/shared/utils";
import { styled, useColorScheme } from "@mui/material/styles";
import React from "react";
import { Loading } from "..";

// Styled components
const ResponsiveChatIframeWrapper = styled("div")({
  overflow: "hidden",
  width: "100%",
  height: "100%",
});

const ResponsiveChatIframe = styled("iframe")({
  width: "100%",
  height: "100%",
  border: "0",
});

// Type for chat-enabled video (includes both Livestream and Freechat)
type ChatEnabledVideo = Livestream | Freechat;

// Presenter component props
interface ChatEmbedPresenterProps {
  chatEmbedUrl: string | null | undefined;
  platform: string;
  isLoading: boolean;
  onLoad: () => void;
}

// Presenter component for chat embed
const ChatEmbedPresenter: React.FC<ChatEmbedPresenterProps> = ({
  chatEmbedUrl,
  platform,
  isLoading,
  onLoad,
}) => {
  return (
    <>
      {(isLoading || !chatEmbedUrl) && <Loading />}
      <ResponsiveChatIframeWrapper
        style={{ display: isLoading ? "none" : "block" }}
      >
        {chatEmbedUrl && (
          <ResponsiveChatIframe
            src={chatEmbedUrl}
            title={`${platform} chat embed`}
            onLoad={onLoad}
          />
        )}
      </ResponsiveChatIframeWrapper>
    </>
  );
};

// Container component for chat embed
export const ChatEmbed: React.FC<{
  livestream: ChatEnabledVideo;
}> = ({ livestream }) => {
  const { colorScheme } = useColorScheme();
  const [isLoading, setIsLoading] = React.useState(true);

  const isDarkMode = colorScheme === "dark";
  const chatEmbedUrl = convertChatPlayerLink(
    livestream.chatPlayerLink,
    livestream.platform,
    isDarkMode,
  );

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <ChatEmbedPresenter
      chatEmbedUrl={chatEmbedUrl}
      platform={livestream.platform}
      isLoading={isLoading}
      onLoad={handleLoad}
    />
  );
};
