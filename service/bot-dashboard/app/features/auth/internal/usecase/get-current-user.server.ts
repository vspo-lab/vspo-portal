import type { Result } from "@vspo-lab/error";
import { AppError, Err, Ok } from "@vspo-lab/error";
import type { DiscordUserType } from "../domain/discord-user";
import { DiscordUser } from "../domain/discord-user";
import type { SessionType } from "../domain/session";
import { Session } from "../domain/session";
import { DiscordApiRepository } from "../repository/discord-api.server";
import { SessionStore } from "../repository/session-store.server";

type GetCurrentUserResult = {
  user: DiscordUserType;
  session: SessionType;
};

/**
 * リクエストからセッションを取得し、ユーザー情報を返す
 * @precondition 有効なセッション cookie が必要
 * @postcondition セッション有効ならユーザー情報を返す。無効なら Err を返す
 */
const execute = async (
  request: Request,
  sessionSecret: string,
): Promise<Result<GetCurrentUserResult, AppError>> => {
  const sessionResult = await SessionStore.get(request, sessionSecret);
  if (sessionResult.err) return sessionResult;

  const session = sessionResult.val;
  if (!session) {
    return Err(
      new AppError({ message: "No session found", code: "UNAUTHORIZED" }),
    );
  }

  if (Session.isExpired(session)) {
    return Err(
      new AppError({ message: "Session expired", code: "UNAUTHORIZED" }),
    );
  }

  const userResult = await DiscordApiRepository.getCurrentUser(
    session.accessToken,
  );
  if (userResult.err) return userResult;

  const parsedUser = DiscordUser.fromApiResponse(userResult.val);
  if (parsedUser.err) return parsedUser;

  return Ok({ user: parsedUser.val, session });
};

export const GetCurrentUserUsecase = {
  execute,
} as const;
