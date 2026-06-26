import { requireAdmin } from "@/lib/auth/require-admin";
import { getWorkingHours, getClosures, getShopById } from "@/lib/db/queries";
import { WorkingHoursEditor } from "./working-hours-editor";
import { ClosuresManager } from "./closures-manager";
import { BookingSettingsForm } from "./booking-settings-form";

export default async function SchedulePage() {
  const { shopId } = await requireAdmin();

  const [workingHours, closures, shop] = await Promise.all([
    getWorkingHours(shopId),
    getClosures(shopId),
    getShopById(shopId),
  ]);

  if (!shop) {
    return (
      <p className="text-sm text-muted-foreground">Không tìm thấy shop.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Lịch &amp; cấu hình</h1>
        <p className="text-sm text-muted-foreground">
          Giờ mở cửa, ngày nghỉ và cài đặt đặt lịch.
        </p>
      </div>

      <WorkingHoursEditor initial={workingHours} />
      <ClosuresManager closures={closures} />
      <BookingSettingsForm shop={shop} />
    </div>
  );
}
