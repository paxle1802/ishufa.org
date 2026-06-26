"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkingHour } from "@/lib/db/schema";
import { saveWorkingHours } from "./actions";

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

type Interval = { openTime: string; closeTime: string };
type DayIntervals = Record<number, Interval[]>;

function trimTime(t: string): string {
  // "HH:MM:SS" → "HH:MM"
  return t.slice(0, 5);
}

function buildInitialState(rows: WorkingHour[]): DayIntervals {
  const state: DayIntervals = {};
  for (let d = 0; d < 7; d++) state[d] = [];
  for (const row of rows) {
    state[row.weekday] = [
      ...(state[row.weekday] ?? []),
      { openTime: trimTime(row.openTime), closeTime: trimTime(row.closeTime) },
    ];
  }
  return state;
}

interface Props {
  initial: WorkingHour[];
}

export function WorkingHoursEditor({ initial }: Props) {
  const [days, setDays] = useState<DayIntervals>(() =>
    buildInitialState(initial),
  );
  const [isPending, startTransition] = useTransition();

  function addInterval(weekday: number) {
    setDays((prev) => ({
      ...prev,
      [weekday]: [...(prev[weekday] ?? []), { openTime: "09:00", closeTime: "17:00" }],
    }));
  }

  function removeInterval(weekday: number, idx: number) {
    setDays((prev) => ({
      ...prev,
      [weekday]: (prev[weekday] ?? []).filter((_, i) => i !== idx),
    }));
  }

  function updateInterval(
    weekday: number,
    idx: number,
    field: keyof Interval,
    value: string,
  ) {
    setDays((prev) => {
      const intervals = [...(prev[weekday] ?? [])];
      intervals[idx] = { ...intervals[idx]!, [field]: value };
      return { ...prev, [weekday]: intervals };
    });
  }

  function handleSave() {
    const intervals = Object.entries(days).flatMap(([wd, ivs]) =>
      ivs.map((iv) => ({ weekday: Number(wd), ...iv })),
    );
    startTransition(async () => {
      const result = await saveWorkingHours(intervals);
      if (result.ok) {
        toast.success("Đã lưu giờ mở cửa");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giờ mở cửa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {WEEKDAY_LABELS.map((label, weekday) => {
          const intervals = days[weekday] ?? [];
          return (
            <div key={weekday} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-8 text-sm font-medium">{label}</span>
                <button
                  type="button"
                  onClick={() => addInterval(weekday)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="size-3" />
                  Thêm
                </button>
              </div>

              {intervals.length === 0 && (
                <p className="text-xs text-muted-foreground pl-8">Nghỉ cả ngày</p>
              )}

              {intervals.map((iv, idx) => (
                <div key={idx} className={cn("flex items-center gap-2 pl-8")}>
                  <input
                    type="time"
                    value={iv.openTime}
                    onChange={(e) =>
                      updateInterval(weekday, idx, "openTime", e.target.value)
                    }
                    className="h-8 rounded-md border px-2 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">–</span>
                  <input
                    type="time"
                    value={iv.closeTime}
                    onChange={(e) =>
                      updateInterval(weekday, idx, "closeTime", e.target.value)
                    }
                    className="h-8 rounded-md border px-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeInterval(weekday, idx)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? "Đang lưu…" : "Lưu giờ mở cửa"}
        </Button>
      </CardContent>
    </Card>
  );
}
