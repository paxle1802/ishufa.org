import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">ShufaBook</h1>
        <p className="text-muted-foreground">
          Nền tảng đặt lịch cho salon cắt tóc &amp; gội đầu. Mỗi cửa hàng có
          trang riêng và mã QR để khách đặt chỗ ngay trên điện thoại.
        </p>
      </div>
      <Button render={<Link href="/admin" />}>Trang quản trị</Button>
    </main>
  );
}
