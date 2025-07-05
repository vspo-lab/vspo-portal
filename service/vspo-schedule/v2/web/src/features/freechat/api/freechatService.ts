import type { IncomingMessage } from "node:http";
import { fetchFreechats } from "@/features/shared/api/freechat";
import type { Freechat } from "@/features/shared/domain";
import { serverSideTranslations } from "@/lib/i18n/server";
import { getSessionId } from "@/lib/utils";
import type { SSRConfig } from "next-i18next";

type FreechatService = {
  freechats: Freechat[];
  translations: SSRConfig;
};

type FetchFreechatServiceParams = {
  locale: string;
  req: IncomingMessage;
};

const fetchFreechatService = async (
  params: FetchFreechatServiceParams,
): Promise<FreechatService> => {
  const { locale, req } = params;

  const sessionId = getSessionId(req);

  const results = await Promise.allSettled([
    fetchFreechats({ lang: locale, sessionId }),
    serverSideTranslations(locale, ["common", "freechat"]),
  ]);

  const freechats =
    results[0].status === "fulfilled" && !results[0].value.err
      ? results[0].value.val?.freechats || []
      : [];

  const translations =
    results[1].status === "fulfilled"
      ? results[1].value
      : await serverSideTranslations(locale, ["common", "freechat"]);

  return {
    freechats,
    translations,
  };
};

export {
  fetchFreechatService,
  type FreechatService,
  type FetchFreechatServiceParams,
};
