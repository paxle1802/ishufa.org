"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createStaff, deleteStaff, setStaffCommission, updateStaff } from "./actions";

interface Staff {
  id: string;
  name: string;
  active: boolean;
  commissionPct: number; // % thợ hưởng
  sortOrder: number;
}

// Tỷ lệ Chủ–Thợ; lưu theo % THỢ hưởng.
const RATIOS = [
  { owner: 30, staff: 70 },
  { owner: 40, staff: 60 },
  { owner: 50, staff: 50 },
];

export function StaffManager({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [ratioId, setRatioId] = useState<string | null>(null); // row đang mở chọn tỷ lệ

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createStaff({ name });
      if (result.ok) {
        toast.success("Đã thêm thợ");
        setNewName("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const startEdit = (s: Staff) => {
    setEditingId(s.id);
    setEditName(s.name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };
  const commitEdit = (s: Staff) => {
    const name = editName.trim();
    if (!name || name === s.name) {
      cancelEdit();
      return;
    }
    startTransition(async () => {
      const result = await updateStaff(s.id, {
        name,
        active: s.active,
        commissionPct: s.commissionPct,
        sortOrder: s.sortOrder,
      });
      if (result.ok) {
        toast.success("Đã cập nhật tên");
        cancelEdit();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleSetRatio = (s: Staff, staffPct: number) => {
    startTransition(async () => {
      const result = await setStaffCommission(s.id, staffPct);
      if (result.ok) {
        toast.success(`Tỷ lệ chủ–thợ ${100 - staffPct}–${staffPct}`);
        setRatioId(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = (s: Staff) => {
    if (!window.confirm(`Xóa thợ "${s.name}"? Hành động không thể hoàn tác.`)) return;
    startTransition(async () => {
      const result = await deleteStaff(s.id);
      if (result.ok) {
        toast.success("Đã xóa thợ");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Tên thợ mới..."
          className="flex-1"
          disabled={isPending}
        />
        <Button type="submit" size="sm" disabled={isPending || !newName.trim()}>
          <PlusIcon />
          Thêm thợ
        </Button>
      </form>

      {staff.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Chưa có thợ nào. Thêm thợ đầu tiên bên trên.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {staff.map((s) => (
            <Card key={s.id} className="shadow-sm">
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  {editingId === s.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitEdit(s);
                          }
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="h-8 flex-1 text-sm"
                        autoFocus
                        disabled={isPending}
                      />
                      <Button size="icon-sm" variant="ghost" onClick={() => commitEdit(s)} disabled={isPending} title="Lưu">
                        <CheckIcon />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={cancelEdit} disabled={isPending} title="Hủy">
                        <XIcon />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                      <Button
                        size="sm"
                        variant={ratioId === s.id ? "default" : "outline"}
                        onClick={() => setRatioId(ratioId === s.id ? null : s.id)}
                        disabled={isPending}
                      >
                        Tỷ lệ {100 - s.commissionPct}–{s.commissionPct}
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(s)} disabled={isPending} title="Sửa tên">
                        <PencilIcon />
                      </Button>
                      <Button size="icon-sm" variant="destructive" onClick={() => handleDelete(s)} disabled={isPending} title="Xóa">
                        <Trash2Icon />
                      </Button>
                    </>
                  )}
                </div>

                {/* Bảng chọn tỷ lệ ăn chia (Chủ – Thợ) */}
                {ratioId === s.id && editingId !== s.id && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Tỷ lệ ăn chia (Chủ – Thợ):
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {RATIOS.map((r) => {
                        const active = s.commissionPct === r.staff;
                        return (
                          <button
                            key={r.staff}
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSetRatio(s, r.staff)}
                            className={cn(
                              "rounded-xl border py-3 text-center transition-colors disabled:opacity-50",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:bg-muted/60",
                            )}
                          >
                            <span className="block text-base font-bold">
                              {r.owner}–{r.staff}
                            </span>
                            <span className="block text-[11px] opacity-80">
                              Chủ {r.owner}% · Thợ {r.staff}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
