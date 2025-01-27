CREATE TABLE "highlights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"target_url" varchar NOT NULL,
	"selector" varchar NOT NULL,
	"spans" json[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "memos" (
	"id" serial PRIMARY KEY NOT NULL,
	"local_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"target_url" varchar NOT NULL,
	"domain" varchar NOT NULL,
	"markdown" text NOT NULL,
	"scope" varchar NOT NULL,
	"pos_x" integer NOT NULL,
	"pos_y" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"roles" varchar[] NOT NULL,
	"profile_url" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memos" ADD CONSTRAINT "memos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "highlights_user_id_target_url_selector_idx" ON "highlights" USING btree ("user_id","target_url","selector") WHERE "highlights"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "memos_local_id_user_id_target_url_idx" ON "memos" USING btree ("local_id","user_id","target_url") WHERE "memos"."deleted_at" is null;