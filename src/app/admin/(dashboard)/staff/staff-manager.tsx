"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaff, deleteStaff, setStaffPay, updateStaff } from "./actions";

interface Staff {
  id: string;
  name: string;
  active: boolean;
  baseSalary: number; // lương cứng VND/tháng
  commissionPct: number; // % ăn chia
  sortOrder: number;
}

const vnd = new Intl.NumberFormat("vi-VN");

/** Tóm tắt cách tính lương để hiện trên nút. */
function paySummary(base: number, pct: number): string {
  const parts: string[] = [];
  if (base > 0) parts.push(`${vnd.format(base)}đ`);
  if (pct > 0) parts.push(`ăn chia ${pct}%`);
  return parts.length ? parts.join(" + ") : "Đặt lương";
}

export function StaffManager({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  // Row đang mở chỉnh lương + giá trị nhập.
  const [payId, setPayId] = useState<string | null>(null);
  const [payBase, setPayBase] = useState("");
  const [payPct, setPayPct] = useState("");

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
        baseSalary: s.baseSalary,
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

  const togglePay = (s: Staff) => {
    if (payId === s.id) {
      setPayId(null);
      return;
    }
    setPayId(s.id);
    setPayBase(String(s.baseSalary));
    setPayPct(String(s.commissionPct));
  };

  const handleSavePay = (s: Staff) => {
    const base = Number(payBase) || 0;
    const pct = Number(payPct) || 0;
    if (pct > 100) {
      toast.error("Ăn chia tối đa 100%");
      return;
    }
    startTransition(async () => {
      const result = await setStaffPay(s.id, base, pct);
      if (result.ok) {
        toast.success("Đã lưu cách tính lương");
        setPayId(null);
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
                        variant={payId === s.id ? "default" : "outline"}
                        onClick={() => togglePay(s)}
                        disabled={isPending}
                      >
                        {paySummary(s.baseSalary, s.commissionPct)}
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

                {/* Bảng cách tính lương: lương cứng + ăn chia % */}
                {payId === s.id && editingId !== s.id && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      Cách tính lương — điền 0 cho phần không dùng.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Lương cứng (đ/tháng)</Label>
                        <Input
                          inputMode="numeric"
                          value={payBase}
                          onChange={(e) =>
                            setPayBase(e.target.value.replace(/\D/g, "").slice(0, 10))
                          }
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ăn chia (%)</Label>
                        <Input
                          inputMode="numeric"
                          value={payPct}
                          onChange={(e) =>
                            setPayPct(e.target.value.replace(/\D/g, "").slice(0, 3))
                          }
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={isPending}
                      onClick={() => handleSavePay(s)}
                    >
                      Lưu cách tính lương
                    </Button>
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
