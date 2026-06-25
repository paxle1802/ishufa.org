CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"price_snapshot" integer NOT NULL,
	"duration_snapshot" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"note" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"total_duration_min" integer NOT NULL,
	"total_price" integer NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"cancel_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"date" date NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"duration_min" integer NOT NULL,
	"description" text,
	"image_url" text,
	"category" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"description" text,
	"contact_phone" text,
	"accent_color" text DEFAULT '#0f172a' NOT NULL,
	"logo_url" text,
	"slot_interval_min" integer DEFAULT 30 NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"max_advance_days" integer DEFAULT 30 NOT NULL,
	"min_lead_min" integer DEFAULT 30 NOT NULL,
	"cancel_cutoff_min" integer DEFAULT 60 NOT NULL,
	"grace_period_min" integer DEFAULT 10 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "working_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closures" ADD CONSTRAINT "closures_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_items_booking_idx" ON "booking_items" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "bookings_shop_start_idx" ON "bookings" USING btree ("shop_id","start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_cancel_token_uniq" ON "bookings" USING btree ("cancel_token");--> statement-breakpoint
CREATE INDEX "closures_shop_date_idx" ON "closures" USING btree ("shop_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limits_key_window_uniq" ON "rate_limits" USING btree ("key","window_start");--> statement-breakpoint
CREATE INDEX "services_shop_active_idx" ON "services" USING btree ("shop_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "shops_slug_uniq" ON "shops" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "working_hours_shop_weekday_idx" ON "working_hours" USING btree ("shop_id","weekday");