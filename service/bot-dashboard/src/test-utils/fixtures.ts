import type { Locale } from "~/i18n/dict";

export const mockUser = {
  id: "000000000000000000",
  username: "test-user",
  displayName: "Test User",
  avatar: null,
} as const;

export const mockLocals = (overrides?: {
  locale?: Locale;
  user?: typeof mockUser | null;
  accessToken?: string | null;
}) => ({
  locale: overrides?.locale ?? ("ja" as Locale),
  user: overrides?.user ?? mockUser,
  accessToken: overrides?.accessToken ?? "mock-token",
});
