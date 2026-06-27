"use client";

import { usePathname } from "next/navigation";

/**
 * Chuyển tab có hiệu ứng mờ-trượt nhẹ. key theo pathname để mỗi lần đổi route
 * là animation chạy lại. Dùng View Transitions API thật khi trình duyệt hỗ trợ
 * (Safari 18+/Chrome) để mượt hơn; còn lại rơi về animation CSS — chạy mọi nơi.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
