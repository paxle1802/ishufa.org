# ShufaBook

SaaS đặt lịch salon đa tenant, mobile-first. Khách quét QR → chọn dịch vụ → đặt lịch không cần đăng nhập; chủ salon quản trị qua trang admin.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn (Base UI) · Drizzle ORM · Neon Postgres · Better Auth · Vercel Blob · date-fns-tz (Asia/Saigon).

## Yêu cầu

- Node 20+ và `pnpm`
- Một Neon Postgres database (lấy `DATABASE_URL`)

## Chạy local

```bash
pnpm install
cp .env.example .env.local        # rồi điền các biến bên dưới
pnpm db:migrate                   # tạo bảng trên Neon
pnpm seed                         # tạo shop demo + admin demo
pnpm dev                          # http://localhost:3000
```

### Biến môi trường (`.env.local`)

| Biến | Bắt buộc | Ghi chú |
|------|----------|---------|
| `DATABASE_URL` | ✅ | Neon connection string (pooled) |
| `BETTER_AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` (local) / `https://ishufa.org` (prod) |
| `BLOB_READ_WRITE_TOKEN` | ⛔ tuỳ chọn | Cần khi upload logo (Vercel → Storage → Blob) |

## Tài khoản & trang chính

- Admin demo (sau khi seed): `admin@demo.shufabook` / `admin12345`
- Trang khách: `/s/demo` · Admin: `/admin` (login `/admin/login`) · Huỷ lịch: `/huy/[token]`

> Không có signup công khai — admin được tạo thủ công khi seed (xem `scripts/seed.ts`).

## Tạo shop mới (vận hành)

Sửa `scripts/seed.ts` (slug, tên, dịch vụ, giờ mở cửa, admin email/mật khẩu) rồi chạy `pnpm seed`, hoặc thêm dữ liệu trực tiếp rồi tạo admin gắn `shopId` tương ứng. Sau đăng nhập, chủ salon tự cấu hình dịch vụ/giờ/branding/QR trong `/admin`.

## Scripts

| Lệnh | Việc |
|------|------|
| `pnpm dev` / `pnpm build` | chạy dev / build production |
| `pnpm db:generate` / `pnpm db:migrate` | sinh / áp migration Drizzle |
| `pnpm seed` | seed shop + admin demo |
| `pnpm test` | unit test (Vitest) — engine tính slot |
| `pnpm test:e2e` | e2e (Playwright) — luồng đặt lịch |

## Kiến trúc (tóm tắt)

- **DB clients:** `src/lib/db/index.ts` (neon-http, query thường) và `src/lib/db/pooled.ts` (neon-serverless, transaction — dùng cho auth + đặt lịch).
- **Multi-tenant:** mọi bảng nghiệp vụ gắn `shop_id`; truy vấn luôn scope theo shop.
- **Chống đặt trùng:** `src/lib/booking/create-booking.ts` — advisory lock theo shop + kiểm capacity trong transaction.
- **Slot engine:** `src/lib/availability/` (thuần, có unit test).

## Deploy (Vercel)

```bash
vercel link                       # liên kết repo với project
vercel env pull .env.local        # kéo env từ Vercel về local
vercel --prod                     # deploy production
```

Env production cần: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL=https://ishufa.org`, `BLOB_READ_WRITE_TOKEN`. Chạy `pnpm db:migrate` + `pnpm seed` trên DB production. Domain `ishufa.org` trỏ DNS sang Vercel.
