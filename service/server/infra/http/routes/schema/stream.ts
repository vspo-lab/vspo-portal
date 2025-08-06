import { z } from "@hono/zod-openapi";
import { MemberTypeSchema } from "../../../../domain/creator";
import {
  PlatformSchema,
  StatusSchema,
  StreamSchema,
} from "../../../../domain/stream";
import { PaginationQuerySchema, PaginationResponseSchema } from "./common";

const StreamResponseSchema = StreamSchema.openapi({
  description: "Stream",
  example: {
    id: "O0XCK3NhzqE",
    rawId: "O0XCK3NhzqE",
    title:
      "【APEX】ランドマークは溶岩になった！！#三清傑WIN w/まつりちゃん,えるちゃん【ぶいすぽっ！/ 藍沢エマ】",
    languageCode: "ja",
    rawChannelID: "UCPkKpOHxEDcwmUAnRpIu-Ng",
    description:
      "ぶいすぽっ！所属の藍沢エマです！\nApexの配信をします！\nチャンネル登録、高評価よろしくお願いします！",
    publishedAt: "2023-05-20T12:00:00.000Z",
    startedAt: "2023-05-20T12:00:00.000Z",
    endedAt: "2023-05-20T15:30:00.000Z",
    platform: "youtube",
    status: "ended",
    tags: ["APEX", "ぶいすぽっ！", "藍沢エマ", "三清傑"],
    viewCount: 125000,
    thumbnailURL: "https://i.ytimg.com/vi/O0XCK3NhzqE/hqdefault_live.jpg",
    creatorName: "藍沢エマ",
    creatorThumbnailURL:
      "https://yt3.googleusercontent.com/oIps6UVvqtpJykcdjYYyRvhdcyVoR1wAdH8CnTp4msMaKYdn8XMLj4FHsLoqfWaJzbLJKSPjCg=s176-c-k-c0x00ffffff-no-rj",
    deleted: false,
    translated: false,
    videoPlayerLink: "https://www.youtube.com/embed/O0XCK3NhzqE",
    chatPlayerLink: "https://www.youtube.com/live_chat?v=O0XCK3NhzqE",
  },
});

const ListStreamRequestSchema = PaginationQuerySchema.merge(
  z.object({
    platform: PlatformSchema.optional().openapi({
      description: "Platform",
      example: "youtube",
      param: {
        name: "platform",
        in: "query",
      },
    }),
    status: StatusSchema.optional().openapi({
      description: "Status",
      example: "live",
      param: {
        name: "status",
        in: "query",
      },
    }),
    memberType: MemberTypeSchema.optional().openapi({
      description: "Member Type",
      example: "vspo_all",
      param: {
        name: "memberType",
        in: "query",
      },
    }),
    startDateFrom: z
      .string()
      .optional()
      .openapi({
        description: "Started At",
        example: "2022-01-01T00:00:00.000Z",
        param: {
          name: "startDateFrom",
          in: "query",
        },
      }),
    startDateTo: z
      .string()
      .optional()
      .openapi({
        description: "Start Date To",
        example: "2022-01-01T00:00:00.000Z",
        param: {
          name: "startDateTo",
          in: "query",
        },
      }),
    endedAt: z
      .string()
      .optional()
      .openapi({
        description: "Ended At",
        example: "2022-01-01T00:00:00.000Z",
        param: {
          name: "endedAt",
          in: "query",
        },
      }),
    languageCode: z
      .string()
      .default("default")
      .openapi({
        description: "Language Code",
        example: "en",
        param: {
          name: "languageCode",
          in: "query",
        },
      }),
    orderBy: z
      .enum(["asc", "desc"])
      .default("desc")
      .openapi({
        description: "Order By",
        example: "desc",
        param: {
          name: "orderBy",
          in: "query",
        },
      }),
  }),
);

const ListStreamResponseSchema = z.object({
  streams: z.array(StreamResponseSchema),
  pagination: PaginationResponseSchema,
});

type ListStreamResponse = z.infer<typeof ListStreamResponseSchema>;
type ListStreamRequest = z.infer<typeof ListStreamRequestSchema>;

export {
  ListStreamRequestSchema,
  ListStreamResponseSchema,
  type ListStreamRequest,
  type ListStreamResponse,
  StreamResponseSchema,
};
