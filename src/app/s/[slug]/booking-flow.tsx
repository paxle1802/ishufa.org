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
      {/* Shop header */}
      <header className="px-4 pb-5 pt-6">
        {shop.logoUrl && (
          <img
            src={shop.logoUrl}
            alt={`Logo ${shop.name}`}
            className="mb-3 h-14 w-14 rounded-xl object-cover"
          />
        )}
        <h1 className="text-xl font-bold leading-snug">{shop.name}</h1>
        {shop.address && (
          <p className="mt-0.5 text-sm text-muted-foreground">{shop.address}</p>
        )}
        {shop.description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {shop.description}
          </p>
        )}
      </header>

      <div className="flex flex-col gap-6">
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
