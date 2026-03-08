import { data } from "react-router";
import { ActionIntent, GuildDetailContainer } from "~/features/channel";
import {
  ListChannelsUsecase,
  ToggleChannelUsecase,
  UpdateChannelUsecase,
} from "~/features/channel/index.server";
import type { Route } from "./+types/dashboard.$guildId";

export async function loader({ params, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;

  const configResult = await ListChannelsUsecase.execute({
    apiUrl: env.VSPO_API_URL,
    apiKey: env.VSPO_API_KEY,
    guildId: params.guildId,
  });

  return {
    guildId: params.guildId,
    guildName: `Server ${params.guildId}`,
    channels: configResult.err ? [] : configResult.val.channels,
    creators: [], // TODO: Phase 5 で Creator API から取得
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const channelId = formData.get("channelId") as string;

  switch (intent) {
    case ActionIntent.UPDATE_CHANNEL: {
      const result = await UpdateChannelUsecase.execute({
        apiUrl: env.VSPO_API_URL,
        apiKey: env.VSPO_API_KEY,
        guildId: params.guildId,
        channelId,
        formData,
      });
      if (result.err) {
        return data({ ok: false, error: result.err.message }, { status: 400 });
      }
      break;
    }
    case ActionIntent.ENABLE_CHANNEL: {
      const result = await ToggleChannelUsecase.execute({
        apiUrl: env.VSPO_API_URL,
        apiKey: env.VSPO_API_KEY,
        guildId: params.guildId,
        channelId,
        enable: true,
      });
      if (result.err) {
        return data({ ok: false, error: result.err.message }, { status: 400 });
      }
      break;
    }
    case ActionIntent.DISABLE_CHANNEL: {
      const result = await ToggleChannelUsecase.execute({
        apiUrl: env.VSPO_API_URL,
        apiKey: env.VSPO_API_KEY,
        guildId: params.guildId,
        channelId,
        enable: false,
      });
      if (result.err) {
        return data({ ok: false, error: result.err.message }, { status: 400 });
      }
      break;
    }
    default:
      return data({ ok: false, error: "Unknown intent" }, { status: 400 });
  }

  return { ok: true };
}

export default function GuildDetailRoute({ loaderData }: Route.ComponentProps) {
  return (
    <GuildDetailContainer
      guildId={loaderData.guildId}
      guildName={loaderData.guildName}
      channels={loaderData.channels}
      creators={loaderData.creators}
    />
  );
}
