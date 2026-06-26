CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shops" ALTER COLUMN "accent_color" SET DEFAULT '#F26430';--> statement-breakpoint
ALTER TABLE "booking_items" ADD COLUMN "staff_id" uuid;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "staff_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'owner' NOT NULL;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_shop_idx" ON "staff" USING btree ("shop_id");--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_items_staff_idx" ON "booking_items" USING btree ("staff_id");