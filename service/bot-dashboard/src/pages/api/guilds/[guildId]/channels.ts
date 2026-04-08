import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";

/**
 * GET /api/guilds/:guildId/channels
 * Returns all text channels in the Discord guild for the add-channel modal.
 * @precondition User must be authenticated (middleware enforces this for /api paths under /dashboard context)
 * @postcondition Returns JSON array of { id, name } pairs
 * @idempotent true
 */
export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { guildId } = params;
  if (!guildId || !/^\d{17,20}$/.test(guildId)) {
    return Response.json({ error: "Invalid guildId" }, { status: 400 });
  }

  const result = await VspoChannelApiRepository.listGuildChannels(
    env.APP_WORKER,
    guildId,
  );

  if (result.err) {
    return Response.json({ error: result.err.message }, { status: 500 });
  }

  return Response.json(result.val);
};
