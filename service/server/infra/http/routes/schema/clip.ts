import { z } from "@hono/zod-openapi";
import { ClipSchema } from "../../../../domain/clip";
import { PlatformSchema } from "../../../../domain/stream";
import { PaginationQuerySchema, PaginationResponseSchema } from "./common";

const ClipResponseSchema = ClipSchema.openapi({
  description: "Clip",
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
    platform: "youtube",
    tags: ["APEX", "ぶいすぽっ！", "藍沢エマ", "三清傑"],
    viewCount: 125000,
    thumbnailURL: "https://i.ytimg.com/vi/O0XCK3NhzqE/hqdefault_live.jpg",
    creatorName: "藍沢エマ",
    creatorThumbnailURL:
      "https://yt3.googleusercontent.com/oIps6UVvqtpJykcdjYYyRvhdcyVoR1wAdH8CnTp4msMaKYdn8XMLj4FHsLoqfWaJzbLJKSPjCg=s176-c-k-c0x00ffffff-no-rj",
    deleted: false,
    translated: false,
    type: "clip",
  },
});

const ListClipRequestSchema = PaginationQuerySchema.merge(
  z.object({
    platform: PlatformSchema.optional().openapi({
      description: "Platform",
      example: "youtube",
      param: {
        name: "platform",
        in: "query",
      },
    }),
    clipType: z.enum(["clip", "short"]).default("clip").openapi({
      description: "Clip Type",
      example: "clip",
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
    orderKey: z
      .enum(["publishedAt", "viewCount"])
      .default("publishedAt")
      .openapi({
        description: "Order Key",
        example: "publishedAt",
      }),
    afterPublishedAtDate: z.string().optional().openapi({
      description: "After Published At Date",
      example: "2023-05-20T12:00:00.000Z",
    }),
    beforePublishedAtDate: z.string().optional().openapi({
      description: "Before Published At Date",
      example: "2023-05-20T12:00:00.000Z",
    }),
  }),
);

const ListClipResponseSchema = z.object({
  clips: z.array(ClipResponseSchema),
  pagination: PaginationResponseSchema,
});

type ListClipResponse = z.infer<typeof ListClipResponseSchema>;
type ListClipRequest = z.infer<typeof ListClipRequestSchema>;

export {
  ListClipRequestSchema,
  ListClipResponseSchema,
  type ListClipRequest,
  type ListClipResponse,
  ClipResponseSchema,
};
