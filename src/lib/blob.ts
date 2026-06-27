import { put } from "@vercel/blob";

import { env } from "./env";

/**
 * Upload logo shop lên Vercel Blob (public). Cần BLOB_READ_WRITE_TOKEN.
 * Trả URL công khai để lưu vào shops.logo_url.
 */
export async function uploadLogo(file: File, shopSlug: string): Promise<string> {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Chưa cấu hình BLOB_READ_WRITE_TOKEN — không thể upload logo. Lấy token ở Vercel → Storage → Blob.",
    );
  }

  return uploadImage(file, `logos/${shopSlug}`);
}

/**
 * Upload ảnh minh hoạ (logo, ảnh dịch vụ...) lên Vercel Blob (public).
 * `pathPrefix` là đường dẫn không kèm đuôi file, vd "services/<slug>".
 */
export async function uploadImage(file: File, pathPrefix: string): Promise<string> {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Chưa cấu hình BLOB_READ_WRITE_TOKEN — không thể upload ảnh. Lấy token ở Vercel → Storage → Blob.",
    );
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const blob = await put(`${pathPrefix}.${ext}`, file, {
    access: "public",
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true,
    contentType: file.type || "image/png",
  });

  return blob.url;
}
