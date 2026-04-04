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
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { guildId } = params;
  if (!guildId) {
    return new Response(JSON.stringify({ error: "Missing guildId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await VspoChannelApiRepository.listGuildChannels(
    env.APP_WORKER,
    guildId,
  );

  if (result.err) {
    return new Response(JSON.stringify({ error: result.err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(result.val), {
    headers: { "Content-Type": "application/json" },
  });
};
