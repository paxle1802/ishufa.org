import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * DB qua neon-serverless (Pool/websocket) — HỖ TRỢ transaction.
 * Dùng cho Better Auth và luồng đặt lịch (chống đặt trùng).
 * Khác `db` chính (neon-http, stateless, không transaction).
 */
const pool = new Pool({ connectionString: env.DATABASE_URL });

export const pooledDb = drizzle(pool, { schema });
