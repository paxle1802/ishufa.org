import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Drizzle client qua Neon serverless HTTP driver.
 * neon-http phù hợp serverless functions (không giữ connection lâu).
 */
const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });
