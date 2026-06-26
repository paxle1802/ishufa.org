import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./server";

type SessionUser = { shopId?: string | null; role?: string | null };

/**
 * Bảo vệ route admin chủ shop: chưa login → login; super_admin → khu /super;
 * chưa gán shop → login. Trả { user, shopId }.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/admin/login");

  const u = session.user as SessionUser;
  if (u.role === "super_admin") redirect("/super");
  if (!u.shopId) redirect("/admin/login");

  return { user: session.user, shopId: u.shopId };
}

/** Bảo vệ khu super admin (toàn nền tảng). */
export async function requireSuperAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/admin/login");
  if ((session.user as SessionUser).role !== "super_admin") redirect("/admin");
  return { user: session.user };
}
