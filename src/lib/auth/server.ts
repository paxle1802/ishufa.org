import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { pooledDb } from "@/lib/db/pooled";
import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";

/**
 * Better Auth cần transaction (tạo user + account) nên dùng pooledDb
 * (neon-serverless/websocket) — khác db chính neon-http (no transaction).
 */
export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(pooledDb, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // MVP: admin onboard thủ công, không cho signup công khai.
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      // Gắn admin với 1 shop; input:false để client không tự set được.
      shopId: { type: "string", required: false, input: false },
    },
  },
  plugins: [nextCookies()],
});
