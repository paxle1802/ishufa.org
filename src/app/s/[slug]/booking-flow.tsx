"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { getSlotsAction, createBookingAction } from "./actions";
import type { BookingSummary } from "./actions";
import type { BookingFlowProps } from "./types";
import { ServicePicker } from "./service-picker";
import { DateStrip } from "./date-strip";
import { SlotGrid } from "./slot-grid";
import { CustomerForm } from "./customer-form";
import { SummaryBar } from "./summary-bar";
import { BookingSuccess } from "./booking-success";

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

export function BookingFlow({ shop, services }: BookingFlowProps) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState<string>(todayVn);
  const [slots, setSlots] = useState<string[]>([]);
  const [totalDurationMin, setTotalDurationMin] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<BookingSummary | null>(null);

  // Latest-wins guard: track a counter so stale responses are ignored
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (selectedServiceIds.length === 0) {
      setSlots([]);
      setTotalDurationMin(0);
      setTotalPrice(0);
      setSelectedSlot(null);
      return;
    }

    const myId = ++reqIdRef.current;
    setSlotsLoading(true);

    getSlotsAction({ slug: shop.slug, date, serviceIds: selectedServiceIds })
      .then((result) => {
        if (myId !== reqIdRef.current) return; // stale — discard
        if (!result.ok) {
          toast.error(result.error);
          setSlots([]);
          setTotalDurationMin(0);
          setTotalPrice(0);
          setSelectedSlot(null);
          return;
        }
        setSlots(result.slots);
        setTotalDurationMin(result.totalDurationMin);
        setTotalPrice(result.totalPrice);
        // Reset selected slot if it no longer appears in new slots
        setSelectedSlot((prev) =>
          prev && result.slots.includes(prev) ? prev : null
        );
      })
      .catch(() => {
        if (myId !== reqIdRef.current) return;
        toast.error("Không thể tải khung giờ, vui lòng thử lại.");
        setSlots([]);
      })
      .finally(() => {
        if (myId !== reqIdRef.current) return;
        setSlotsLoading(false);
      });
  }, [selectedServiceIds, date, shop.slug]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleFieldChange(
    field: "name" | "phone" | "note" | "promoCode",
    value: string,
  ) {
    if (field === "name") setName(value);
    else if (field === "phone") setPhone(value);
    else if (field === "note") setNote(value);
    else setPromoCode(value);
  }

  const canBook =
    selectedServiceIds.length > 0 &&
    selectedSlot !== null &&
    name.trim().length > 0 &&
    phone.trim().length > 0;

  async function handleBook() {
    if (!canBook || !selectedSlot) return;
    setSubmitting(true);
    try {
      const result = await createBookingAction({
        slug: shop.slug,
        serviceIds: selectedServiceIds,
        startAt: selectedSlot,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        note: note.trim() || undefined,
        promoCode: promoCode.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSuccess(result.booking);
    } catch {
      toast.error("Đặt lịch thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  // Show success screen instead of flow
  if (success) {
    return <BookingSuccess booking={success} shop={shop} />;
  }

  return (
    <div className="mx-auto max-w-md pb-28">
      {/* Shop header — thẻ gradient cam-đào, chữ trắng */}
      <header className="px-4 pt-5">
        <div className="brand-gradient relative overflow-hidden rounded-3xl p-5 text-white shadow-lg">
          {shop.logoUrl && (
            <img
              src={shop.logoUrl}
              alt={`Logo ${shop.name}`}
              className="mb-3 h-12 w-12 rounded-2xl object-cover ring-2 ring-white/40"
            />
          )}
          <p className="text-sm font-medium text-white/80">Đặt lịch tại</p>
          <h1 className="mt-1 text-2xl font-bold leading-snug">{shop.name}</h1>
          {shop.address && (
            <p className="mt-1.5 text-sm text-white/90">{shop.address}</p>
          )}
          {shop.description && (
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              {shop.description}
            </p>
          )}
        </div>
      </header>

      {/* Thông báo lưu ý cho khách ngay khi vào trang */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3.5 text-sm leading-relaxed text-amber-900">
          <p className="font-semibold">⏰ Vui lòng có mặt trước giờ hẹn ít nhất 5 phút.</p>
          <p className="mt-0.5 text-amber-800">
            Lịch hẹn sẽ tự huỷ nếu bạn đến muộn quá 10 phút so với giờ đặt.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-6">
        <ServicePicker
          services={services}
          selectedIds={selectedServiceIds}
          onToggle={toggleService}
        />

        <DateStrip
          selected={date}
          maxAdvanceDays={shop.maxAdvanceDays}
          onSelect={(d) => setDate(d)}
        />

        <SlotGrid
          slots={slots}
          selected={selectedSlot}
          loading={slotsLoading}
          onSelect={(s) => setSelectedSlot(s)}
        />

        <CustomerForm
          name={name}
          phone={phone}
          note={note}
          promoCode={promoCode}
          onChange={handleFieldChange}
        />
      </div>

      <SummaryBar
        serviceCount={selectedServiceIds.length}
        totalDurationMin={totalDurationMin}
        totalPrice={totalPrice}
        canBook={canBook}
        submitting={submitting}
        onBook={handleBook}
      />
    </div>
  );
}
