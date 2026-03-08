import { SessionStore } from "../repository/session-store.server";

/**
 * セッションを破棄する
 * @postcondition セッション cookie がクリアされる
 */
const execute = (): string => {
  return SessionStore.destroy();
};

export const LogoutUsecase = {
  execute,
} as const;
