ALTER TABLE "staff" ALTER COLUMN "commission_pct" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "base_salary" integer DEFAULT 0 NOT NULL;