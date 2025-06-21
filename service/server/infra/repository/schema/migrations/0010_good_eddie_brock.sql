CREATE TABLE "creator_clip_fetch_status" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"fetch_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_clip_fetch_status_creator_id_unique" UNIQUE("creator_id")
);
--> statement-breakpoint
ALTER TABLE "creator_clip_fetch_status" ADD CONSTRAINT "creator_clip_fetch_status_creator_id_creator_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "creator_clip_fetch_status_last_fetched_at_idx" ON "creator_clip_fetch_status" USING btree ("last_fetched_at" NULLS FIRST);