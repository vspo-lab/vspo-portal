import { createRoute } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../../../pkg/errors";
import type { App } from "../hono";
import {
  ListFreechatRequestSchema,
  ListFreechatResponseSchema,
} from "./schema";

const listFreechatsRoute = createRoute({
  tags: ["Freechat"],
  operationId: "listFreechats",
  method: "get" as const,
  path: "/api/freechats",
  security: [{ apiKeyAuth: [] }],
  request: {
    query: ListFreechatRequestSchema,
  },
  responses: {
    200: {
      description: "The configuration for an api",
      content: {
        "application/json": {
          schema: ListFreechatResponseSchema,
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export const registerFreechatListApi = (app: App) =>
  app.openapi(listFreechatsRoute, async (c) => {
    const p = ListFreechatRequestSchema.parse(c.req.query());
    const r = await c.env.FREECHAT_QUERY_SERVICE.list({
      limit: Number.parseInt(p.limit),
      page: Number.parseInt(p.page),
      languageCode: p.languageCode,
      orderBy: p.orderBy,
      memberType: p.memberType,
      orderKey: p.orderKey,
    });

    if (r.err) {
      throw r.err;
    }

    return c.json(ListFreechatResponseSchema.parse(r.val), 200);
  });
