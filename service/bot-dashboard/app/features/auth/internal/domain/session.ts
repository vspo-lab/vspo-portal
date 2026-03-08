import { z } from "zod";

const SessionSchema = z.object({
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
});

type Session = z.infer<typeof SessionSchema>;

const Session = {
  schema: SessionSchema,

  /** セッションが有効期限切れか判定する */
  isExpired: (session: Session): boolean => Date.now() > session.expiresAt,

  /** リフレッシュが必要か判定する (有効期限5分前) */
  needsRefresh: (session: Session): boolean =>
    Date.now() > session.expiresAt - 5 * 60 * 1000,

  /** OAuth2 トークンレスポンスからセッションを生成する */
  fromTokenResponse: (
    userId: string,
    token: { access_token: string; refresh_token: string; expires_in: number },
  ): Session => ({
    userId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  }),
} as const;

export { Session, type Session as SessionType };
