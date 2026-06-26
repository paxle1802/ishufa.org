import { requireAdmin } from "@/lib/auth/require-admin";

import { CheckinScanner } from "./checkin-scanner";

/** Màn quét QR đặt chỗ của khách khi tới salon. */
export default async function CheckinPage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Quét QR khách</h1>
        <p className="text-sm text-muted-foreground">
          Quét mã QR khách đưa để xem thông tin lịch hẹn.
        </p>
      </div>
      <CheckinScanner />
    </div>
  );
}
