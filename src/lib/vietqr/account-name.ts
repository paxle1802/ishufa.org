/**
 * Chuẩn hoá tên chủ tài khoản: bỏ dấu tiếng Việt, chỉ giữ A–Z + khoảng trắng,
 * viết HOA toàn bộ (đúng cách ngân hàng hiển thị).
 */
export function normalizeAccountName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z ]/g, "") // loại dấu (đã tách qua NFD) + ký tự lạ
    .replace(/\s+/g, " ")
    .toUpperCase();
}
