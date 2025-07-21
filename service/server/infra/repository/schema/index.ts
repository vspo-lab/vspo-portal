import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Creator information table
export const creatorTable = pgTable("creator", {
  id: text("id").primaryKey(), // Unique identifier for the creator
  memberType: text("member_type").notNull(), // Member type
  representativeThumbnailUrl: text("representative_thumbnail_url").notNull(), // Thumbnail image URL
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(), // Last updated date and time
});

export const creatorTranslationTable = pgTable(
  "creator_translation",
  {
    id: text("id").primaryKey(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorTable.id, { onDelete: "cascade" }),
    languageCode: text("lang_code").notNull(), // ISO 639-1 language code or [default]
    name: text("name").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueCreatorLang: unique().on(t.creatorId, t.languageCode),
    langCodeIdx: index("creator_translation_lang_code_idx").on(t.languageCode),
    creatorIdIdx: index("creator_translation_creator_id_idx").on(t.creatorId),
    defaultLangCreatorIdx: index(
      "creator_translation_default_lang_creator_idx",
    ).on(t.languageCode, t.creatorId),
  }),
);

// Creator clip fetch status table
export const creatorClipFetchStatusTable = pgTable(
  "creator_clip_fetch_status",
  {
    id: text("id").primaryKey(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorTable.id, { onDelete: "cascade" }),
    lastFetchedAt: timestamp("last_fetched_at", {
      withTimezone: true,
      mode: "date",
    }),
    fetchCount: integer("fetch_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    creatorIdIdx: unique().on(t.creatorId),
    lastFetchedAtIdx: index("creator_clip_fetch_status_last_fetched_at_idx").on(
      t.lastFetchedAt.asc().nullsFirst(),
    ),
  }),
);

// Channel information table
export const channelTable = pgTable(
  "channel",
  {
    id: text("id").primaryKey(), // Unique identifier
    platformChannelId: text("platform_channel_id").notNull().unique(), // Channel ID on the platform
    creatorId: text("creator_id")
      .notNull()
      .references(() => creatorTable.id, { onDelete: "cascade" }), // Creator ID
    platformType: text("platform_type").notNull(), // Platform type
    title: text("title").notNull(), // Channel title
    description: text("description").notNull(), // Channel description
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(), // Channel creation date and time
    subscriberCount: integer("subscriber_count").notNull(), // Number of channel subscribers
    thumbnailUrl: text("thumbnail_url").notNull(), // Channel's thumbnail URL
  },
  (table) => ({
    platformChannelIdIdx: index("channel_platform_channel_id_idx").on(
      table.platformChannelId,
    ),
    creatorIdIdx: index("channel_creator_id_idx").on(table.creatorId),
  }),
);

// Video information table
export const videoTable = pgTable(
  "video",
  {
    id: text("id").primaryKey(), // Unique identifier
    rawId: text("raw_id").notNull().unique(), // Video ID on the platform
    channelId: text("channel_id")
      .notNull()
      .references(() => channelTable.platformChannelId, {
        onDelete: "cascade",
      }), // Channel ID
    platformType: text("platform_type").notNull(), // Platform type
    videoType: text("video_type").notNull(), // Type of video(vspo_stream, clip(short, clip))
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(), // Publication date and time
    tags: text("tags").notNull(), // Video tags
    thumbnailUrl: text("thumbnail_url").notNull(), // Video's thumbnail URL
    link: text("link"), // Video's link
    deleted: boolean("deleted").notNull().default(false), // Deleted flag
    duration: integer("duration"), // Duration in seconds
  },
  (table) => ({
    videoTypeIdx: index("video_video_type_idx").on(table.videoType),
    deletedIdx: index("video_deleted_idx").on(table.deleted),
    videoTypeDeletedIdx: index("video_type_deleted_idx").on(
      table.videoType,
      table.deleted,
    ),
    clipsFilterIdx: index("video_clips_filter_idx").on(
      table.videoType,
      table.deleted,
      table.platformType,
      table.publishedAt,
    ),
    publishedAtIdx: index("video_published_at_idx").on(table.publishedAt),
  }),
);

// Clip statistics and metadata table
export const clipStatsTable = pgTable(
  "clip_stats",
  {
    id: text("id").primaryKey(), // Unique identifier
    videoId: text("video_id")
      .notNull()
      .references(() => videoTable.rawId, { onDelete: "cascade" })
      .unique(), // Video ID
    viewCount: integer("view_count").notNull(), // View count
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(), // Last updated date and time
  },
  (table) => ({
    viewCountIdx: index("clip_stats_view_count_desc_idx").on(
      table.viewCount.desc(),
    ),
    videoIdIdx: index("clip_stats_video_id_idx").on(table.videoId),
  }),
);

// Stream status table
export const streamStatusTable = pgTable(
  "stream_status",
  {
    id: text("id").primaryKey(), // Unique identifier
    videoId: text("video_id")
      .notNull()
      .references(() => videoTable.rawId, { onDelete: "cascade" })
      .unique(), // Video ID
    status: text("status").notNull(), // Stream status
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }), // Start date and time
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }), // End date and time
    viewCount: integer("view_count").notNull(), // View count
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(), // Last updated date and time
  },
  (table) => ({
    videoIdIdx: index("stream_status_video_id_idx").on(table.videoId),
    startedAtIdx: index("stream_status_started_at_idx").on(table.startedAt),
  }),
);

export const videoTranslationTable = pgTable(
  "video_translation",
  {
    id: text("id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => videoTable.rawId, { onDelete: "cascade" }),
    languageCode: text("lang_code").notNull(), // ISO 639-1 language code or [default]
    title: text("title").notNull(),
    description: text("description").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueVideoLang: unique().on(t.videoId, t.languageCode),
    langCodeIdx: index("video_translation_lang_code_idx").on(t.languageCode),
    langCodeVideoIdx: index("video_translation_lang_video_idx").on(
      t.languageCode,
      t.videoId,
    ),
  }),
);

/**
 * Discord server table
 * - Manages a single Discord server (guild) entry
 * - The server name can be changed by the user
 */
export const discordServerTable = pgTable("discord_server", {
  id: text("id").primaryKey(),
  serverId: text("discord_server_id").notNull().unique(), // Actual guild ID in Discord
  name: text("name").notNull(), // User-customizable server name
  languageCode: text("lang_code").notNull(), // ISO 639-1 language code or [default]
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/**
 * Discord channel table
 * - Manages multiple channels under a Discord server
 * - Each server can have multiple channels for sending information
 */
export const discordChannelTable = pgTable(
  "discord_channel",
  {
    id: text("id").primaryKey(),
    channelId: text("discord_channel_id").notNull().unique(), // Actual channel ID in Discord
    serverId: text("server_id")
      .notNull()
      .references(() => discordServerTable.serverId, { onDelete: "cascade" }),
    name: text("name").notNull(), // Channel display name for internal management
    languageCode: text("lang_code").notNull(), // ISO 639-1 language code or [default]
    memberType: text("member_type").notNull().default("vspo_all"), // Member type
    selectedMemberIds: text("selected_member_ids"), // Comma-separated list of selected creator IDs
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.channelId, t.serverId)],
);

/**
 * Discord message table
 * - Manages messages sent by the bot in Discord
 * - Each message has a unique ID in Discord
 */
export const discordMessageTable = pgTable("discord_message", {
  id: text("id").primaryKey(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

/**
 * Discord admin message table
 * - Manages messages sent by Admin
 * - Each message has a unique ID in Discord
 */
export const discordAdminMessageTable = pgTable(
  "discord_admin_message",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id")
      .notNull()
      .references(() => discordChannelTable.channelId, { onDelete: "cascade" }),
    adminMessageId: text("discord_admin_message_id").notNull(), // Actual message ID in Discord
    messageId: text("message_id")
      .notNull()
      .references(() => discordMessageTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.adminMessageId, t.messageId)],
);

/**
 * Event information table
 * - Stores basic information about events
 * - Detailed content is stored in external storage files
 */
export const eventTable = pgTable("event", {
  id: text("id").primaryKey(), // Unique identifier for the event
  title: text("title").notNull(), // Event title
  storageFileId: text("storage_file_id"), // ID of the storage file containing event details
  startedDate: text("started_date").notNull(), // Event start date (eg. 2023-12-01)
  visibility: text("visibility").notNull().default("private"), // Visibility: public, private, or internal
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export type InsertCreator = typeof creatorTable.$inferInsert;
export type SelectCreator = typeof creatorTable.$inferSelect;

export type InsertChannel = typeof channelTable.$inferInsert;
export type SelectChannel = typeof channelTable.$inferSelect;

export type InsertVideo = typeof videoTable.$inferInsert;
export type SelectVideo = typeof videoTable.$inferSelect;

export type InsertStreamStatus = typeof streamStatusTable.$inferInsert;
export type SelectStreamStatus = typeof streamStatusTable.$inferSelect;

export type InsertClipStats = typeof clipStatsTable.$inferInsert;
export type SelectClipStats = typeof clipStatsTable.$inferSelect;

export type InsertCreatorTranslation =
  typeof creatorTranslationTable.$inferInsert;
export type SelectCreatorTranslation =
  typeof creatorTranslationTable.$inferSelect;

export type InsertCreatorClipFetchStatus =
  typeof creatorClipFetchStatusTable.$inferInsert;
export type SelectCreatorClipFetchStatus =
  typeof creatorClipFetchStatusTable.$inferSelect;

export type InsertVideoTranslation = typeof videoTranslationTable.$inferInsert;
export type SelectVideoTranslation = typeof videoTranslationTable.$inferSelect;

export type InsertDiscordServer = typeof discordServerTable.$inferInsert;
export type SelectDiscordServer = typeof discordServerTable.$inferSelect;

export type InsertDiscordChannel = typeof discordChannelTable.$inferInsert;
export type SelectDiscordChannel = typeof discordChannelTable.$inferSelect;

export type InsertDiscordAdminMessage =
  typeof discordAdminMessageTable.$inferInsert;
export type SelectDiscordAdminMessage =
  typeof discordAdminMessageTable.$inferSelect;

export type InsertDiscordMessage = typeof discordMessageTable.$inferInsert;
export type SelectDiscordMessage = typeof discordMessageTable.$inferSelect;

export type InsertEvent = typeof eventTable.$inferInsert;
export type SelectEvent = typeof eventTable.$inferSelect;

export const insertVideoSchema = createInsertSchema(videoTable);
export const selectVideoSchema = createSelectSchema(videoTable);
export const createInsertVideo = (data: InsertVideo) =>
  insertVideoSchema.parse(data);

export const insertCreatorSchema = createInsertSchema(creatorTable);
export const selectCreatorSchema = createSelectSchema(creatorTable);

export const insertChannelSchema = createInsertSchema(channelTable);
export const selectChannelSchema = createSelectSchema(channelTable);

export const insertStreamStatusSchema = createInsertSchema(streamStatusTable);
export const selectStreamStatusSchema = createSelectSchema(streamStatusTable);
export const createInsertStreamStatus = (data: InsertStreamStatus) =>
  insertStreamStatusSchema.parse(data);

export const insertClipStatsSchema = createInsertSchema(clipStatsTable);
export const selectClipStatsSchema = createSelectSchema(clipStatsTable);
export const createInsertClipStats = (data: InsertClipStats) =>
  insertClipStatsSchema.parse(data);

export const insertCreatorTranslationSchema = createInsertSchema(
  creatorTranslationTable,
);
export const selectCreatorTranslationSchema = createSelectSchema(
  creatorTranslationTable,
);

export const insertVideoTranslationSchema = createInsertSchema(
  videoTranslationTable,
);
export const selectVideoTranslationSchema = createSelectSchema(
  videoTranslationTable,
);

export const insertDiscordServerSchema = createInsertSchema(discordServerTable);
export const selectDiscordServerSchema = createSelectSchema(discordServerTable);
export const createInsertDiscordServer = (data: InsertDiscordServer) =>
  insertDiscordServerSchema.parse(data);

export const insertDiscordChannelSchema =
  createInsertSchema(discordChannelTable);
export const selectDiscordChannelSchema =
  createSelectSchema(discordChannelTable);
export const createInsertDiscordChannel = (data: InsertDiscordChannel) =>
  insertDiscordChannelSchema.parse(data);

export const insertDiscordAdminMessageSchema = createInsertSchema(
  discordAdminMessageTable,
);
export const selectDiscordAdminMessageSchema = createSelectSchema(
  discordAdminMessageTable,
);
export const createInsertDiscordAdminMessage = (
  data: InsertDiscordAdminMessage,
) => insertDiscordAdminMessageSchema.parse(data);

export const insertDiscordMessageSchema =
  createInsertSchema(discordMessageTable);
export const selectDiscordMessageSchema =
  createSelectSchema(discordMessageTable);

export const createInsertDiscordMessage = (data: InsertDiscordMessage) =>
  insertDiscordMessageSchema.parse(data);

export const insertEventSchema = createInsertSchema(eventTable);
export const selectEventSchema = createSelectSchema(eventTable);
export const createInsertEvent = (data: InsertEvent) =>
  insertEventSchema.parse(data);

// Re-export clip analysis table and types
export {
  clipAnalysisTable,
  createInsertClipAnalysis,
  type InsertClipAnalysis,
  insertClipAnalysisSchema,
  type SelectClipAnalysis,
  selectClipAnalysisSchema,
} from "./clipAnalysis";
