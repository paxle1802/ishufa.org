import { z } from "zod";

/**
 * Validate + expose typed environment variables.
 * Throws early at startup if a required variable is missing/invalid,
 * tránh lỗi ngầm khi runtime.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL phải là connection string hợp lệ"),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET cần >= 16 ký tự"),
  // Tùy chọn ở local; bắt buộc khi dùng upload logo (Vercel Blob)
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

function parseEnv() {
  const server = serverSchema.safeParse(process.env);
  const client = clientSchema.safeParse(process.env);

  if (!server.success || !client.success) {
    const issues = [
      ...(server.success ? [] : server.error.issues),
      ...(client.success ? [] : client.error.issues),
    ]
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Cấu hình môi trường không hợp lệ:\n${issues}`);
  }

  return { ...server.data, ...client.data };
}

export const env = parseEnv();
