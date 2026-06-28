import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Schema multi-tenant cho ShufaBook.
 * Mọi bảng nghiệp vụ đều gắn shop_id để tách dữ liệu theo tenant.
 * Tiền lưu dạng số nguyên (VND, đồng). Thời điểm lưu timestamptz (UTC).
 * Bảng Better Auth (user/session/account/verification) ở ./auth-schema, re-export cuối file.
 * Thứ tự định nghĩa bảng tôn trọng FK: bảng được tham chiếu đứng trước.
 */

// Lưu ý: giá trị "no_show" cũ vẫn còn trong enum DB (không xoá để khỏi migration
// rủi ro) nhưng KHÔNG dùng nữa — app chỉ còn 4 trạng thái dưới đây.
export const bookingStatus = pgEnum("booking_status", [
  "confirmed",
  "arrived",
  "cancelled",
  "completed",
]);

export const discountType = pgEnum("discount_type", ["percent", "fixed"]);

export const loyaltyType = pgEnum("loyalty_type", ["earn", "redeem", "reverse"]);

// --- Shops (tenant gốc) ---
export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    address: text("address"),
    description: text("description"),
    contactPhone: text("contact_phone"),
    email: text("email"),
    accentColor: text("accent_color").notNull().default("#9a7b5f"),
    logoUrl: text("logo_url"),
    // Tài khoản nhận tiền (VietQR): BIN ngân hàng + số TK + tên chủ TK.
    bankBin: text("bank_bin"),
    bankAccountNumber: text("bank_account_number"),
    bankAccountName: text("bank_account_name"),
    slotIntervalMin: integer("slot_interval_min").notNull().default(30),
    capacity: integer("capacity").notNull().default(1),
    maxAdvanceDays: integer("max_advance_days").notNull().default(30),
    minLeadMin: integer("min_lead_min").notNull().default(15),
    cancelCutoffMin: integer("cancel_cutoff_min").notNull().default(30),
    gracePeriodMin: integer("grace_period_min").notNull().default(10),
    // Tích điểm: số điểm cộng cho mỗi 1.000đ chi tiêu (0 = tắt).
    loyaltyEarnRate: integer("loyalty_earn_rate").notNull().default(0),
    // Chế độ doanh thu chủ shop xem: 'per_staff' (chia theo thợ) | 'combined' (gộp).
    revenueMode: text("revenue_mode").notNull().default("combined"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("shops_slug_uniq").on(t.slug)],
);

// --- Thợ (nhân viên thực hiện dịch vụ) ---
export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    active: boolean("active").notNull().default(true),
    // % doanh thu thợ được hưởng (chủ shop hưởng phần còn lại). VD 60 = thợ 60 / chủ 40.
    commissionPct: integer("commission_pct").notNull().default(50),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("staff_shop_idx").on(t.shopId)],
);

/** Chi phí hằng ngày của shop (để tính lợi nhuận = doanh thu − chi phí). */
export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // yyyy-MM-dd theo giờ địa phương
    amount: integer("amount").notNull(), // VND
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("expenses_shop_date_idx").on(t.shopId, t.date)],
);
export type Expense = typeof expenses.$inferSelect;

/** Đăng ký Web Push của thiết bị chủ shop (nhận thông báo đặt/huỷ lịch). */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("push_subscriptions_endpoint_uniq").on(t.endpoint),
    index("push_subscriptions_shop_idx").on(t.shopId),
  ],
);

// --- Dịch vụ ---
export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    price: integer("price").notNull().default(0),
    durationMin: integer("duration_min").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    category: text("category"),
    // Thợ phụ trách dịch vụ này (dùng để chia doanh thu). Do super admin gán.
    staffId: uuid("staff_id").references(() => staff.id, { onDelete: "set null" }),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("services_shop_active_idx").on(t.shopId, t.active)],
);

// --- Giờ mở cửa (nhiều khoảng/ngày → nghỉ trưa) ---
export const workingHours = pgTable(
  "working_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(), // 0=CN ... 6=T7
    openTime: time("open_time").notNull(),
    closeTime: time("close_time").notNull(),
  },
  (t) => [index("working_hours_shop_weekday_idx").on(t.shopId, t.weekday)],
);

// --- Ngày nghỉ (lễ/đột xuất) ---
export const closures = pgTable(
  "closures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    reason: text("reason"),
  },
  (t) => [index("closures_shop_date_idx").on(t.shopId, t.date)],
);

// --- Khách hàng (CRM, gom theo SĐT trong từng shop) ---
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    // Token bí mật cho "Trang của tôi" công khai (/kh/[token]) — không cần login.
    accessToken: text("access_token").notNull(),
    visitCount: integer("visit_count").notNull().default(0),
    totalSpent: integer("total_spent").notNull().default(0), // int VND
    loyaltyPoints: integer("loyalty_points").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("customers_shop_phone_uniq").on(t.shopId, t.phone),
    uniqueIndex("customers_access_token_uniq").on(t.accessToken),
    index("customers_shop_name_idx").on(t.shopId, t.name),
  ],
);

// --- Khuyến mãi (mã giảm giá theo shop) ---
export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    discountType: discountType("discount_type").notNull(),
    value: integer("value").notNull(), // percent 1..100 hoặc VND
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    usageLimit: integer("usage_limit"), // null = không giới hạn
    usedCount: integer("used_count").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("promotions_shop_code_uniq").on(t.shopId, t.code)],
);

// --- Gói combo (template theo shop) ---
export const packages = pgTable(
  "packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    price: integer("price").notNull(), // int VND
    sessions: integer("sessions").notNull(),
    validityDays: integer("validity_days").notNull(),
    serviceId: uuid("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("packages_shop_active_idx").on(t.shopId, t.active)],
);

// --- Gói combo đã mua (instance có số dư + hạn dùng) ---
export const customerPackages = pgTable(
  "customer_packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    packageId: uuid("package_id").references(() => packages.id, {
      onDelete: "set null",
    }),
    sessionsTotal: integer("sessions_total").notNull(),
    sessionsRemaining: integer("sessions_remaining").notNull(),
    pricePaid: integer("price_paid").notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("customer_packages_customer_idx").on(t.customerId)],
);

// --- Booking ---
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    note: text("note"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    totalDurationMin: integer("total_duration_min").notNull(),
    totalPrice: integer("total_price").notNull(), // NET sau giảm giá
    discountAmount: integer("discount_amount").notNull().default(0),
    appliedPromoId: uuid("applied_promo_id").references(() => promotions.id, {
      onDelete: "set null",
    }),
    customerPackageId: uuid("customer_package_id").references(
      () => customerPackages.id,
      { onDelete: "set null" },
    ),
    status: bookingStatus("status").notNull().default("confirmed"),
    cancelToken: text("cancel_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("bookings_shop_start_idx").on(t.shopId, t.startAt),
    index("bookings_shop_phone_idx").on(t.shopId, t.customerPhone),
    uniqueIndex("bookings_cancel_token_uniq").on(t.cancelToken),
  ],
);

// --- Dịch vụ trong 1 booking (snapshot giá/thời lượng) ---
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    // Snapshot thợ phụ trách lúc đặt → chia doanh thu chính xác kể cả khi đổi gán sau này.
    staffId: uuid("staff_id").references(() => staff.id, { onDelete: "set null" }),
    priceSnapshot: integer("price_snapshot").notNull(),
    durationSnapshot: integer("duration_snapshot").notNull(),
  },
  (t) => [
    index("booking_items_booking_idx").on(t.bookingId),
    index("booking_items_staff_idx").on(t.staffId),
  ],
);

// --- Sổ cái tích điểm (audit + nguồn để hoàn điểm) ---
export const loyaltyLedger = pgTable(
  "loyalty_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    type: loyaltyType("type").notNull(),
    points: integer("points").notNull(), // có dấu: earn +, redeem/reverse -
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("loyalty_ledger_customer_idx").on(t.customerId),
    index("loyalty_ledger_booking_idx").on(t.bookingId),
  ],
);

// --- Rate limit (chống spam, Postgres-based) ---
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [uniqueIndex("rate_limits_key_window_uniq").on(t.key, t.windowStart)],
);

// --- Relations ---
export const shopsRelations = relations(shops, ({ many }) => ({
  services: many(services),
  workingHours: many(workingHours),
  closures: many(closures),
  bookings: many(bookings),
  customers: many(customers),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  shop: one(shops, { fields: [services.shopId], references: [shops.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  shop: one(shops, { fields: [customers.shopId], references: [shops.id] }),
  packages: many(customerPackages),
}));

export const customerPackagesRelations = relations(
  customerPackages,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerPackages.customerId],
      references: [customers.id],
    }),
    package: one(packages, {
      fields: [customerPackages.packageId],
      references: [packages.id],
    }),
  }),
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  shop: one(shops, { fields: [bookings.shopId], references: [shops.id] }),
  items: many(bookingItems),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  service: one(services, {
    fields: [bookingItems.serviceId],
    references: [services.id],
  }),
}));

// Type helpers
export type Shop = typeof shops.$inferSelect;
export type Service = typeof services.$inferSelect;
export type WorkingHour = typeof workingHours.$inferSelect;
export type Closure = typeof closures.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookingItem = typeof bookingItems.$inferSelect;
export type BookingStatus = (typeof bookingStatus.enumValues)[number];
export type Staff = typeof staff.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type CustomerPackage = typeof customerPackages.$inferSelect;
export type LoyaltyLedger = typeof loyaltyLedger.$inferSelect;
export type DiscountType = (typeof discountType.enumValues)[number];

// Bảng auth (Better Auth) — re-export để drizzle-kit + db client gom chung schema.
export * from "./auth-schema";
