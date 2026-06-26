import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./server";

/**
 * Bảo vệ route admin: lấy session từ cookie; chưa login hoặc chưa gán shop
 * → redirect login. Trả { user, shopId } để loader/action scope theo tenant.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  const shopId = session?.user
    ? (session.user as { shopId?: string | null }).shopId
    : null;

  if (!session?.user || !shopId) {
    redirect("/admin/login");
  }

  return { user: session.user, shopId };
}
