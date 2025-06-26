// Re-export all from platformUtils except generateEmbedUrl (conflict with urlParser)
export {
  generateEmbedUrl as generatePlatformEmbedUrl,
  parseVideoUrl as parsePlatformVideoUrl,
  getPlatformConfig,
  isValidMultiviewUrl,
  type PlatformConfig,
} from "./platformUtils";

// Re-export from urlParser (excluding ERROR_MESSAGES to avoid conflict)
export {
  generateEmbedUrl,
  parseUrl,
  detectPlatform,
  extractYouTubeVideoId,
  extractTwitchId,
  determineStreamType,
  generateChatUrl,
  isValidUrl,
  type ParsedUrl,
} from "./urlParser";
