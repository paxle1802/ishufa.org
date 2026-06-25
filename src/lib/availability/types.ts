/** Một khoảng làm việc trong ngày, giờ địa phương "HH:mm". */
export interface WorkingInterval {
  open: string; // "09:00"
  close: string; // "12:00"
}

/** Một booking đã chiếm chỗ (thời điểm UTC). */
export interface BookingInterval {
  startAt: Date;
  endAt: Date;
}

export interface ComputeSlotsInput {
  /** Ngày cần tính, dạng "yyyy-MM-dd" theo giờ địa phương. */
  date: string;
  /** Thời điểm hiện tại (UTC) để áp lead time + chặn quá khứ. */
  now: Date;
  /** Các khoảng làm việc của weekday tương ứng (giờ địa phương). */
  workingIntervals: WorkingInterval[];
  /** Ngày này có bị đánh dấu nghỉ không. */
  isClosed: boolean;
  /** Tổng thời lượng dịch vụ khách chọn (phút). */
  totalDurationMin: number;
  /** Bước nhảy slot (phút). */
  slotIntervalMin: number;
  /** Số chỗ song song của shop. */
  capacity: number;
  /** Booking confirmed giao với ngày này (UTC). */
  bookings: BookingInterval[];
  /** Không cho đặt trong vòng X phút tới. */
  minLeadMin: number;
  /** Đặt trước xa nhất (ngày). */
  maxAdvanceDays: number;
}
