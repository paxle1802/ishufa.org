/**
 * Better Auth yêu cầu định danh dạng email, nhưng chủ shop đăng nhập bằng SĐT.
 * Ta lưu nội bộ SĐT dưới dạng `<digits>@ishufa.app` và quy đổi qua lại.
 */
const PHONE_DOMAIN = "ishufa.app";

/** Chuẩn hoá ô đăng nhập: nếu là email thật thì giữ nguyên, nếu là SĐT thì đổi sang email nội bộ. */
export function resolveLoginEmail(raw: string): string {
  const id = raw.trim();
  if (id.includes("@")) return id;
  const digits = id.replace(/\D/g, "");
  return `${digits}@${PHONE_DOMAIN}`;
}

/** Tạo email nội bộ từ SĐT (chỉ lấy chữ số). */
export function phoneToLoginEmail(phone: string): string {
  return `${phone.replace(/\D/g, "")}@${PHONE_DOMAIN}`;
}

/** Định danh chủ shop dùng để đăng nhập (SĐT nếu là tài khoản nội bộ, ngược lại là email). */
export function loginIdentifierFromEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (domain === PHONE_DOMAIN && /^\d+$/.test(local)) return local;
  return email;
}
