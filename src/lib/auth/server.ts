import { Pool } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";

/**
 * Better Auth cần transaction (tạo user + account) nên dùng neon-serverless
 * (Pool qua websocket) — khác db chính dùng neon-http (stateless, no transaction).
 */
const pool = new Pool({ connectionString: env.DATABASE_URL });
const authDb = drizzle(pool, { schema });

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(authDb, {
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
