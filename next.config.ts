import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Ảnh chụp từ điện thoại thường 2–5 MB; mặc định Server Action chỉ 1 MB
    // nên request bị chặn trước khi tới action → bung trang lỗi. Nâng giới hạn.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
