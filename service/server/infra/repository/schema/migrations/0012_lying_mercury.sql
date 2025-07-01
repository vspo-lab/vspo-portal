-- Add selected_member_ids column to discord_channel table
ALTER TABLE "discord_channel" ADD COLUMN "selected_member_ids" text;