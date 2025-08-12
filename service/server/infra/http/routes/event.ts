import { createRoute } from "@hono/zod-openapi";
import { createVspoEvent } from "../../../domain/event";

import { openApiErrorResponses } from "../../../pkg/errors";
import type { App } from "../hono";
import {
  CreateEventRequestSchema,
  GetEventParamsSchema,
  ListEventRequestSchema,
  ListEventResponseSchema,
  VspoEventSchema,
} from "./schema/event";

const listEventsRoute = createRoute({
  tags: ["Event"],
  operationId: "listEvents",
  method: "get" as const,
  path: "/api/events",
  security: [{ apiKeyAuth: [] }],
  request: {
    query: ListEventRequestSchema,
  },
  responses: {
    200: {
      description: "List of events",
      content: {
        "application/json": {
          schema: ListEventResponseSchema,
        },
      },
    },
    ...openApiErrorResponses,
  },
});

const getEventRoute = createRoute({
  tags: ["Event"],
  operationId: "getEvent",
  method: "get" as const,
  path: "/api/events/{id}",
  security: [{ apiKeyAuth: [] }],
  request: {
    params: GetEventParamsSchema,
  },
  responses: {
    200: {
      description: "Event details",
      content: {
        "application/json": {
          schema: VspoEventSchema,
        },
      },
    },
    ...openApiErrorResponses,
  },
});

const createEventRoute = createRoute({
  tags: ["Event"],
  operationId: "createEvent",
  method: "post" as const,
  path: "/api/events",
  security: [{ apiKeyAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateEventRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Event created successfully",
      content: {
        "application/json": {
          schema: VspoEventSchema,
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export const registerEventListApi = (app: App) =>
  app.openapi(listEventsRoute, async (c) => {
    const p = ListEventRequestSchema.parse(c.req.query());

    const r = await c.env.EVENT_QUERY_SERVICE.list({
      limit: Number.parseInt(p.limit),
      page: Number.parseInt(p.page),
      orderBy: p.orderBy,
      visibility: p.visibility ?? "public",
      startedDateFrom: p.startedDateFrom,
      startedDateTo: p.startedDateTo,
    });

    if (r.err) {
      throw r.err;
    }

    return c.json(ListEventResponseSchema.parse(r.val), 200);
  });

export const registerEventGetApi = (app: App) =>
  app.openapi(getEventRoute, async (c) => {
    const { id } = GetEventParamsSchema.parse(c.req.param());

    const r = await c.env.EVENT_QUERY_SERVICE.get(id);

    if (r.err) {
      throw r.err;
    }

    if (!r.val) {
      throw new Error("Event not found");
    }

    return c.json(VspoEventSchema.parse(r.val), 200);
  });

export const registerEventCreateApi = (app: App) =>
  app.openapi(createEventRoute, async (c) => {
    const p = CreateEventRequestSchema.parse(await c.req.json());

    const event = createVspoEvent({
      title: p.title,
      storageFileId: p.storageFileId,
      startedDate: p.startedDate,
      visibility: p.visibility,
    });

    const r = await c.env.EVENT_COMMAND_SERVICE.upsert(event);

    if (r.err) {
      throw r.err;
    }

    return c.json(VspoEventSchema.parse(r.val), 201);
  });
