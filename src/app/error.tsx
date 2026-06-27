"use client";

import { Button } from "@/components/ui/button";

/** Error boundary toàn cục — hiển thị khi có lỗi runtime không bắt được. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Đã có lỗi xảy ra</h1>
      <p className="text-sm text-muted-foreground">
        Vui lòng thử lại. Nếu vẫn lỗi, hãy liên hệ salon.
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </main>
  );
}
