import { config as loadEnv } from "dotenv";
import { defineConfig } from "@playwright/test";

// Playwright không tự nạp .env.local — nạp để webServer (next dev) + test có env.
loadEnv({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 390, height: 844 }, // mobile-first
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
