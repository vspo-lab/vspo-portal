import type { Platform } from "../domain/video";

/**
 * Gets the chat embed URL for the livestream in the given color scheme.
 * Requires access to the document object.
 * @param livestream - The livestream to generate the chat embed URL for.
 * @param isDarkMode - Whether the chat embed should use dark mode.
 * @returns The chat embed URL for the livestream in the given color scheme.
 */
export const convertChatPlayerLink = (
  chatPlayerLink: string | undefined,
  platform: Platform,
  isDarkMode: boolean,
) => {
  if (!chatPlayerLink) {
    return undefined;
  }
  const domain = document.location.hostname;
  const chatEmbedUrl = chatPlayerLink;
  if (platform === "twitch") {
    return isDarkMode
      ? `${chatEmbedUrl}&darkpopout&parent=${domain}`
      : `${chatEmbedUrl}&parent=${domain}`;
  }
  return isDarkMode
    ? `${chatEmbedUrl}&dark_theme=1&embed_domain=${domain}`
    : `${chatEmbedUrl}&embed_domain=${domain}`;
};

export const convertVideoPlayerLink = ({
  videoPlayerLink,
  platform,
}: { videoPlayerLink: string; platform: Platform }) => {
  const domain = document.location.hostname;
  if (platform === "twitch") {
    return `${videoPlayerLink}&parent=${domain}&autoplay=false`;
  }
  return videoPlayerLink;
};
