import { auth } from "@/lib/auth/server";

/** Hash/verify mật khẩu khách — tái dùng hasher của Better Auth (đồng nhất với admin). */
export async function hashPassword(password: string): Promise<string> {
  const ctx = await auth.$context;
  return ctx.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const ctx = await auth.$context;
  return ctx.password.verify({ password, hash });
}
