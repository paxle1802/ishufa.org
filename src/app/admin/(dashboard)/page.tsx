import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Trang "Hôm nay" — tạm thời ở Phase 3 (shell + auth).
 * Bookings/dịch vụ/lịch sẽ thêm ở Phase 4 & 6.
 */
export default function AdminTodayPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Hôm nay</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan lịch hẹn trong ngày.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Chưa có dữ liệu</CardTitle>
          <CardDescription>
            Phần quản lý booking sẽ được bổ sung ở các phase tiếp theo.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Đăng nhập thành công. Khung quản trị đã sẵn sàng.
        </CardContent>
      </Card>
    </div>
  );
}
