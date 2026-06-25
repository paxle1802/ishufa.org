import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Healthcheck: xác nhận app + kết nối DB Neon hoạt động. */
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok", db: "ok" });
  } catch (error) {
    return NextResponse.json(
      { status: "error", db: "down", message: (error as Error).message },
      { status: 503 },
    );
  }
}
