import { fromZonedTime } from "date-fns-tz";
import { formatInTimeZone } from "date-fns-tz";
import { APP_TIME_ZONE } from "@/lib/tz";
import type { BookingInterval, ComputeSlotsInput } from "./types";

const MS_PER_MIN = 60_000;
const MS_PER_DAY = 86_400_000;

/** "yyyy-MM-dd" + "HH:mm" (giờ địa phương) → Date UTC. */
function localToUtc(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, APP_TIME_ZONE);
}

/** Số ngày lệch giữa 2 ngày địa phương (date - base), theo lịch. */
function dayDiffLocal(date: string, base: string): number {
  const a = fromZonedTime(`${date}T00:00:00`, APP_TIME_ZONE).getTime();
  const b = fromZonedTime(`${base}T00:00:00`, APP_TIME_ZONE).getTime();
  return Math.round((a - b) / MS_PER_DAY);
}

/** Hai khoảng [aStart,aEnd) và [bStart,bEnd) có giao nhau không. */
function overlaps(
  aStart: number,
  aEnd: number,
  b: BookingInterval,
): boolean {
  return aStart < b.endAt.getTime() && b.startAt.getTime() < aEnd;
}

/**
 * Tính các thời điểm bắt đầu khả dụng (UTC) cho 1 ngày + tổng thời lượng.
 * Pure/deterministic — không IO. Quyết định cuối khi đặt vẫn nằm trong
 * transaction (engine chỉ để hiển thị slot).
 */
export function computeSlots(input: ComputeSlotsInput): Date[] {
  const {
    date,
    now,
    workingIntervals,
    isClosed,
    totalDurationMin,
    slotIntervalMin,
    capacity,
    bookings,
    minLeadMin,
    maxAdvanceDays,
  } = input;

  if (isClosed) return [];
  if (totalDurationMin <= 0 || slotIntervalMin <= 0 || capacity <= 0) return [];

  // Cổng cửa sổ ngày: không quá khứ, không quá advance window.
  const today = formatInTimeZone(now, APP_TIME_ZONE, "yyyy-MM-dd");
  const diff = dayDiffLocal(date, today);
  if (diff < 0 || diff > maxAdvanceDays) return [];

  const durationMs = totalDurationMin * MS_PER_MIN;
  const stepMs = slotIntervalMin * MS_PER_MIN;
  const earliest = now.getTime() + minLeadMin * MS_PER_MIN;

  const results: Date[] = [];

  for (const iv of workingIntervals) {
    const openMs = localToUtc(date, iv.open).getTime();
    const closeMs = localToUtc(date, iv.close).getTime();
    if (closeMs <= openMs) continue;

    for (let start = openMs; start + durationMs <= closeMs; start += stepMs) {
      const end = start + durationMs;
      if (start < earliest) continue;

      let busy = 0;
      for (const b of bookings) {
        if (overlaps(start, end, b)) busy += 1;
      }
      if (busy >= capacity) continue;

      results.push(new Date(start));
    }
  }

  results.sort((a, b) => a.getTime() - b.getTime());
  return results;
}
