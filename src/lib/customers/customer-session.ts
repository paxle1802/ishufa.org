import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

/**
 * Phiên đăng nhập KHÁCH HÀNG (tách biệt admin) bằng cookie ký HMAC — không cần
 * bảng session. Payload = "<customerId>.<expEpochSec>" ký bằng BETTER_AUTH_SECRET.
 */
const COOKIE = "shufa_customer";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

function sign(payload: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(payload).digest("base64url");
}

function makeToken(customerId: string, expSec: number): string {
  const payload = `${customerId}.${expSec}`;
  const body = Buffer.from(payload).toString("base64url");
  return `${body}.${sign(payload)}`;
}

function readToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const payload = Buffer.from(body, "base64url").toString();
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [customerId, exp] = payload.split(".");
  if (!customerId || !exp) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  return customerId;
}

export async function setCustomerSession(customerId: string): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const c = await cookies();
  c.set(COOKIE, makeToken(customerId, exp), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getCustomerSession(): Promise<string | null> {
  const c = await cookies();
  const v = c.get(COOKIE)?.value;
  return v ? readToken(v) : null;
}

export async function clearCustomerSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}
