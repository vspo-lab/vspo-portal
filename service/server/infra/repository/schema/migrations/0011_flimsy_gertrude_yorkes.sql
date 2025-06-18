CREATE TABLE "clip_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"is_short" boolean NOT NULL,
	"is_vspo_clip" boolean NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"analyzed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clip_analysis_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
ALTER TABLE "clip_analysis" ADD CONSTRAINT "clip_analysis_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clip_analysis_video_id_idx" ON "clip_analysis" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "clip_analysis_is_short_idx" ON "clip_analysis" USING btree ("is_short");--> statement-breakpoint
CREATE INDEX "clip_analysis_is_vspo_clip_idx" ON "clip_analysis" USING btree ("is_vspo_clip");--> statement-breakpoint
CREATE INDEX "clip_analysis_analyzed_at_idx" ON "clip_analysis" USING btree ("analyzed_at");