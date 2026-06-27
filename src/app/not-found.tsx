import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
      <p className="text-sm text-muted-foreground">
        Liên kết có thể sai hoặc salon không còn hoạt động.
      </p>
      <Button render={<Link href="/">Về trang chủ</Link>} />
    </main>
  );
}
