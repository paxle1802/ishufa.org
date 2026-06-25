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

/** Format theo giờ địa phương, ví dụ formatLocal(d, "HH:mm dd/MM/yyyy"). */
export function formatLocal(date: Date, fmt: string): string {
  return formatInTimeZone(date, APP_TIME_ZONE, fmt);
}
