CREATE TYPE "public"."role" AS ENUM('general', 'admin');--> statement-breakpoint
CREATE TYPE "public"."scope" AS ENUM('global', 'domain', 'full-path');--> statement-breakpoint
CREATE TABLE "highlight_table" (
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
CREATE TABLE "node_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"local_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"target_url" varchar NOT NULL,
	"domain" varchar NOT NULL,
	"markdown" text NOT NULL,
	"scope" "scope" NOT NULL,
	"pos_x" integer NOT NULL,
	"pos_y" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"google_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"roles" "role"[] NOT NULL,
	"profile_url" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "user_table_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "highlight_table" ADD CONSTRAINT "highlight_table_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_table" ADD CONSTRAINT "node_table_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_id_target_url_selector_highlights_idx" ON "highlight_table" USING btree ("user_id","target_url","selector") WHERE "highlight_table"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "local_id_user_id_target_url_nodes_idx" ON "node_table" USING btree ("local_id","user_id","target_url") WHERE "node_table"."deleted_at" is null;