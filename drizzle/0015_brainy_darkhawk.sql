ALTER TABLE "bookings" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'confirmed'::text;--> statement-breakpoint
DROP TYPE "public"."booking_status";--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'arrived', 'cancelled', 'completed');--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'confirmed'::"public"."booking_status";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "status" SET DATA TYPE "public"."booking_status" USING "status"::"public"."booking_status";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "access_token" text;--> statement-breakpoint
UPDATE "customers" SET "access_token" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') WHERE "access_token" IS NULL;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "access_token" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_access_token_uniq" ON "customers" USING btree ("access_token");
