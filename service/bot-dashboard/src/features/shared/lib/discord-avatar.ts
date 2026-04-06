/**
 * Builds an optimized Discord CDN avatar URL.
 * @param userId - Discord user ID
 * @param avatarHash - Avatar hash from Discord API (nullable)
 * @param size - Image size in pixels (default 128)
 * @returns Optimized avatar URL with size parameter and WebP format, or null
 */
export const discordAvatarUrl = (
  userId: string,
  avatarHash: string | null,
  size = 128,
): string | null => {
  if (!avatarHash) return null;
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp?size=${size}`;
};
