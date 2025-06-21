import { z } from "zod";

// Platform link schemas
export const PlatformLinkSchema = z.object({
  platform: z.enum([
    "youtube",
    "twitch",
    "twitcasting",
    "niconico",
    "bilibili",
    "twitter",
    "x",
  ]),
  url: z.string().url(),
  handle: z.string(),
  subscriberCount: z.number().optional(),
});

// Extended Creator schema for frontend
export const CreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().url(),
  memberType: z.enum(["vspo_jp", "vspo_en", "vspo_ch", "vspo_all", "general"]),
  description: z.string().optional(),
  platformLinks: z.array(PlatformLinkSchema),
  stats: z
    .object({
      totalClips: z.number(),
      totalViews: z.string(),
      monthlyViewers: z.string(),
      favoriteCount: z.number(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  joinedDate: z.string().optional(),
  isActive: z.boolean().default(true),
  color: z.string().optional(), // Hex color for theming
});

export const CreatorsSchema = z.array(CreatorSchema);

// Member type metadata
export const MemberTypeMetadata = {
  vspo_jp: {
    label: "VSPO! JP",
    color: "#FF006E",
    description: "VSPO! Japan Members",
  },
  vspo_en: {
    label: "VSPO! EN",
    color: "#00B4D8",
    description: "VSPO! English Members",
  },
  vspo_ch: {
    label: "VSPO! CH",
    color: "#FF4B3A",
    description: "VSPO! Chinese Members",
  },
  vspo_all: {
    label: "VSPO! ALL",
    color: "#7209B7",
    description: "All VSPO! Members",
  },
  general: {
    label: "その他",
    color: "#666666",
    description: "Other VTubers",
  },
} as const;

// Inferred types
export type Creator = z.infer<typeof CreatorSchema>;
export type PlatformLink = z.infer<typeof PlatformLinkSchema>;
export type MemberType = keyof typeof MemberTypeMetadata;
