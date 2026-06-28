import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

/** Múi giờ cố định của toàn hệ thống (MVP single-TZ). */
export const APP_TIME_ZONE = "Asia/Saigon";

/** Đổi thời điểm "giờ địa phương" (Asia/Saigon) → Date UTC để lưu DB. */
export function zonedToUtc(localDate: Date): Date {
  return fromZonedTime(localDate, APP_TIME_ZONE);
}

/** Đổi Date UTC (từ DB) → Date theo giờ địa phương để tính toán/hiển thị. */
export function utcToZoned(utcDate: Date): Date {
  return toZonedTime(utcDate, APP_TIME_ZONE);
}

/** Format theo giờ địa phương, ví dụ formatLocal(d, "HH:mm dd-MM-yyyy"). */
export function formatLocal(date: Date, fmt: string): string {
  return formatInTimeZone(date, APP_TIME_ZONE, fmt);
}

/**
 * Định dạng ngày THỐNG NHẤT toàn app: "dd-MM-yyyy".
 * Nhận chuỗi "yyyy-MM-dd" (cột date) → "dd-MM-yyyy" (giữ nguyên ngày lịch, không lệch TZ).
 */
export function formatDateStr(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return d && m && y ? `${d}-${m}-${y}` : isoDate;
}

/** Khoảng [from, to) UTC của 1 ngày "yyyy-MM-dd" theo giờ địa phương. */
export function dayRange(date: string): { from: Date; to: Date } {
  const from = fromZonedTime(`${date}T00:00:00`, APP_TIME_ZONE);
  return { from, to: new Date(from.getTime() + 86_400_000) };
}

/** Khoảng [from, to) UTC của 1 tháng "yyyy-MM" theo giờ địa phương. */
export function monthRange(month: string): { from: Date; to: Date } {
  const [y, m] = month.split("-").map(Number);
  const from = fromZonedTime(`${month}-01T00:00:00`, APP_TIME_ZONE);
  const nextMonth =
    m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const to = fromZonedTime(`${nextMonth}-01T00:00:00`, APP_TIME_ZONE);
  return { from, to };
}

/** Khoảng [from, to) UTC của 1 năm "yyyy" theo giờ địa phương. */
export function yearRange(year: string): { from: Date; to: Date } {
  const y = Number(year);
  const from = fromZonedTime(`${year}-01-01T00:00:00`, APP_TIME_ZONE);
  const to = fromZonedTime(`${y + 1}-01-01T00:00:00`, APP_TIME_ZONE);
  return { from, to };
}
