import { formatInTimeZone } from "date-fns-tz";
import { describe, expect, it } from "vitest";
import { APP_TIME_ZONE } from "@/lib/tz";
import { computeSlots } from "./compute-slots";
import type { ComputeSlotsInput, WorkingInterval } from "./types";

// Asia/Saigon cố định UTC+7, không DST → dùng offset +07:00 trực tiếp.
const utc = (local: string) => new Date(`${local}+07:00`);
const label = (d: Date) => formatInTimeZone(d, APP_TIME_ZONE, "HH:mm");
const labels = (ds: Date[]) => ds.map(label);

const DATE = "2026-07-01"; // thứ Tư
const FULL_DAY: WorkingInterval[] = [{ open: "09:00", close: "12:00" }];

function baseInput(overrides: Partial<ComputeSlotsInput> = {}): ComputeSlotsInput {
  return {
    date: DATE,
    now: utc("2026-06-30T08:00:00"), // hôm trước → không vướng lead time
    workingIntervals: FULL_DAY,
    isClosed: false,
    totalDurationMin: 30,
    slotIntervalMin: 30,
    capacity: 1,
    bookings: [],
    minLeadMin: 30,
    maxAdvanceDays: 30,
    ...overrides,
  };
}

describe("computeSlots", () => {
  it("sinh slot cơ bản trong 1 khoảng", () => {
    const slots = computeSlots(baseInput());
    expect(labels(slots)).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });

  it("ngày nghỉ → rỗng", () => {
    expect(computeSlots(baseInput({ isClosed: true }))).toEqual([]);
  });

  it("nghỉ trưa: không sinh slot giữa 2 khoảng", () => {
    const slots = computeSlots(
      baseInput({
        workingIntervals: [
          { open: "09:00", close: "12:00" },
          { open: "13:30", close: "20:00" },
        ],
        totalDurationMin: 60,
        slotIntervalMin: 60,
      }),
    );
    const ls = labels(slots);
    expect(ls).toEqual([
      "09:00",
      "10:00",
      "11:00",
      "13:30",
      "14:30",
      "15:30",
      "16:30",
      "17:30",
      "18:30",
    ]);
    // không có slot trong khoảng nghỉ trưa
    expect(ls.some((l) => l >= "12:00" && l < "13:30")).toBe(false);
  });

  it("dịch vụ dài hơn khoảng làm việc → rỗng", () => {
    const slots = computeSlots(baseInput({ totalDurationMin: 240 }));
    expect(slots).toEqual([]);
  });

  it("biên đúng giờ đóng cửa: slot cuối kết thúc đúng close", () => {
    const slots = computeSlots(
      baseInput({
        workingIntervals: [{ open: "09:00", close: "10:00" }],
        totalDurationMin: 60,
        slotIntervalMin: 30,
      }),
    );
    expect(labels(slots)).toEqual(["09:00"]); // 09:30+60=10:30 > close
  });

  it("capacity: slot đầy bị loại, slot kề không bị overlap nhầm", () => {
    const slots = computeSlots(
      baseInput({
        workingIntervals: [{ open: "09:00", close: "10:00" }],
        capacity: 2,
        bookings: [
          { startAt: utc(`${DATE}T09:00:00`), endAt: utc(`${DATE}T09:30:00`) },
          { startAt: utc(`${DATE}T09:00:00`), endAt: utc(`${DATE}T09:30:00`) },
        ],
      }),
    );
    // 09:00 đầy (2/2) bị loại; 09:30 không giao booking (booking kết thúc đúng 09:30)
    expect(labels(slots)).toEqual(["09:30"]);
  });

  it("booking kề sát không gây overlap sai", () => {
    const slots = computeSlots(
      baseInput({
        workingIntervals: [{ open: "09:00", close: "10:00" }],
        capacity: 1,
        bookings: [
          { startAt: utc(`${DATE}T09:30:00`), endAt: utc(`${DATE}T10:00:00`) },
        ],
      }),
    );
    expect(labels(slots)).toEqual(["09:00"]); // 09:30 bị booking chiếm
  });

  it("lead time loại slot quá sát hiện tại", () => {
    const slots = computeSlots(
      baseInput({
        now: utc(`${DATE}T09:15:00`), // cùng ngày
        workingIntervals: [{ open: "09:00", close: "11:00" }],
        minLeadMin: 30, // earliest = 09:45
      }),
    );
    expect(labels(slots)).toEqual(["10:00", "10:30"]);
  });

  it("ngày quá khứ → rỗng", () => {
    const slots = computeSlots(
      baseInput({ now: utc("2026-07-02T08:00:00") }), // hôm sau ngày query
    );
    expect(slots).toEqual([]);
  });

  it("ngoài cửa sổ đặt trước → rỗng", () => {
    const slots = computeSlots(
      baseInput({
        now: utc("2026-01-01T08:00:00"),
        maxAdvanceDays: 30, // 01/07 cách 01/01 ~181 ngày
      }),
    );
    expect(slots).toEqual([]);
  });
});
