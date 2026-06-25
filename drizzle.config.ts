import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit chạy ngoài Next nên tự nạp .env.local
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
