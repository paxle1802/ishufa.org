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
 */

export const bookingStatus = pgEnum("booking_status", [
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

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
    accentColor: text("accent_color").notNull().default("#0f172a"),
    logoUrl: text("logo_url"),
    slotIntervalMin: integer("slot_interval_min").notNull().default(30),
    capacity: integer("capacity").notNull().default(1),
    maxAdvanceDays: integer("max_advance_days").notNull().default(30),
    minLeadMin: integer("min_lead_min").notNull().default(30),
    cancelCutoffMin: integer("cancel_cutoff_min").notNull().default(60),
    gracePeriodMin: integer("grace_period_min").notNull().default(10),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("shops_slug_uniq").on(t.slug)],
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
    totalPrice: integer("total_price").notNull(),
    status: bookingStatus("status").notNull().default("confirmed"),
    cancelToken: text("cancel_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("bookings_shop_start_idx").on(t.shopId, t.startAt),
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
    priceSnapshot: integer("price_snapshot").notNull(),
    durationSnapshot: integer("duration_snapshot").notNull(),
  },
  (t) => [index("booking_items_booking_idx").on(t.bookingId)],
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
}));

export const servicesRelations = relations(services, ({ one }) => ({
  shop: one(shops, { fields: [services.shopId], references: [shops.id] }),
}));

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

// Bảng auth (Better Auth) — re-export để drizzle-kit + db client gom chung schema.
export * from "./auth-schema";
