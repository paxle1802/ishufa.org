import { randomBytes } from "crypto";

/**
 * Sinh token truy cập "Trang của tôi" cho khách — chuỗi bí mật, URL-safe,
 * không đoán được (32 byte → base64url ~43 ký tự). Dùng làm khoá cho /kh/[token].
 */
export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}
