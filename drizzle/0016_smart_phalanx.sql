ALTER TABLE "customer_packages" ALTER COLUMN "sessions_total" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customer_packages" ALTER COLUMN "sessions_remaining" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customer_packages" ADD COLUMN "kind" text DEFAULT 'combo' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_packages" ADD COLUMN "balance_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_packages" ADD COLUMN "balance_remaining" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "kind" text DEFAULT 'combo' NOT NULL;