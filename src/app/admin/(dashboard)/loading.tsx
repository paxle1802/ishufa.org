/**
 * Skeleton hiện NGAY khi chuyển tab (Next prefetch sẵn ranh giới loading này),
 * thay vì đứng im ở trang cũ trong lúc server truy vấn — giúp cảm giác như app native.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      {/* Tiêu đề trang */}
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-md bg-muted" />
        <div className="h-4 w-28 rounded-md bg-muted/70" />
      </div>

      {/* Vài thẻ nội dung */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted/70" />
            </div>
            <div className="h-9 w-20 shrink-0 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
