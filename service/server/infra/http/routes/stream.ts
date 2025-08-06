import { createRoute, z } from "@hono/zod-openapi";
import { convertToUTCDate } from "@vspo-lab/dayjs";
import { openApiErrorResponses } from "../../../pkg/errors";
import type { App } from "../hono";
import {
  ListStreamRequestSchema,
  ListStreamResponseSchema,
  StreamResponseSchema,
} from "./schema";

const listStreamsRoute = createRoute({
  tags: ["Stream"],
  operationId: "listStreams",
  method: "get" as const,
  path: "/api/streams",
  security: [{ apiKeyAuth: [] }],
  request: {
    query: ListStreamRequestSchema,
  },
  responses: {
    200: {
      description: "The configuration for an api",
      content: {
        "application/json": {
          schema: ListStreamResponseSchema,
        },
      },
    },
    ...openApiErrorResponses,
  },
});

const postStreamRoute = createRoute({
  tags: ["Stream"],
  operationId: "postStream",
  method: "post" as const,
  path: "/api/streams/search",
  security: [{ apiKeyAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            streamIds: z.array(z.string()),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "The configuration for an api",
      content: {
        "application/json": {
          schema: z.object({
            videos: z.array(StreamResponseSchema),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export const registerStreamListApi = (app: App) =>
  app.openapi(listStreamsRoute, async (c) => {
    const p = ListStreamRequestSchema.parse(c.req.query());
    const r = await c.env.STREAM_QUERY_SERVICE.list({
      limit: Number.parseInt(p.limit),
      page: Number.parseInt(p.page),
      platform: p.platform,
      status: p.status,
      startDateFrom: p.startDateFrom
        ? convertToUTCDate(p.startDateFrom)
        : undefined,
      startDateTo: p.startDateTo ? convertToUTCDate(p.startDateTo) : undefined,
      endedAt: p.endedAt ? convertToUTCDate(p.endedAt) : undefined,
      languageCode: p.languageCode,
      orderBy: p.orderBy,
      memberType: p.memberType,
    });

    if (r.err) {
      throw r.err;
    }

    return c.json(ListStreamResponseSchema.parse(r.val), 200);
  });

export const registerStreamPostApi = (app: App) =>
  app.openapi(postStreamRoute, async (c) => {
    const p = await c.req.json();
    const r = await c.env.STREAM_COMMAND_SERVICE.searchByStreamsIdsAndCreate({
      streamIds: p.streamIds,
    });

    if (r.err) {
      throw r.err;
    }
    return c.json(
      {
        videos: z.array(StreamResponseSchema).parse(r.val),
      },
      200,
    );
  });
