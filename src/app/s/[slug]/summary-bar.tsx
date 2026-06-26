"use client";

const vnd = new Intl.NumberFormat("vi-VN");

interface SummaryBarProps {
  serviceCount: number;
  totalDurationMin: number;
  totalPrice: number;
  canBook: boolean;
  submitting: boolean;
  onBook: () => void;
}

export function SummaryBar({
  serviceCount,
  totalDurationMin,
  totalPrice,
  canBook,
  submitting,
  onBook,
}: SummaryBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/70 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-3">
        {/* Summary text */}
        <div className="flex-1 min-w-0">
          {serviceCount > 0 ? (
            <>
              <p className="truncate text-sm font-medium text-muted-foreground">
                {serviceCount} dịch vụ · {totalDurationMin} phút
              </p>
              <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
                {vnd.format(totalPrice)}đ
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Chọn dịch vụ để đặt lịch</p>
          )}
        </div>

        {/* CTA button */}
        <button
          type="button"
          disabled={!canBook || submitting}
          onClick={onBook}
          aria-label="Đặt lịch ngay"
          className="flex h-12 min-w-[120px] shrink-0 items-center justify-center rounded-xl px-5 text-base font-bold text-white shadow-lg transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Đang đặt...
            </span>
          ) : (
            "Đặt lịch"
          )}
        </button>
      </div>
    </div>
  );
}
