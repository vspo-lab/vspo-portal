import { AppError, Err, Ok, type Result } from "@vspo-lab/error";

export type TwitcastingAuthConfig = {
  clientId: string;
  clientSecret: string;
};

export type TwitcastingAuthHeader = {
  Authorization: string;
};

export const createBasicAuthHeader = (
  config: TwitcastingAuthConfig,
): Result<TwitcastingAuthHeader, AppError> => {
  if (!config.clientId || !config.clientSecret) {
    return Err(
      new AppError({
        message: "TwitCasting Client ID or Client Secret is missing",
        code: "BAD_REQUEST",
      }),
    );
  }

  const credentials = `${config.clientId}:${config.clientSecret}`;
  const base64Credentials = btoa(credentials);

  return Ok({
    Authorization: `Basic ${base64Credentials}`,
  });
};
