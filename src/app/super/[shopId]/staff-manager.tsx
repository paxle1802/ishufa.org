"use client";

import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Staff } from "@/lib/db/schema";
import { createStaff, deleteStaff, updateStaff } from "./actions";

interface Props {
  shopId: string;
  staff: Staff[];
}

interface EditState {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

export function StaffManager({ shopId, staff }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await createStaff(shopId, { name, active: true, sortOrder: 0 });
      if (res.ok) {
        setNewName("");
        toast.success("Đã thêm thợ");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete(staffId: string, name: string) {
    if (!window.confirm(`Xoá thợ "${name}"? Thao tác không thể hoàn tác.`)) return;
    startTransition(async () => {
      const res = await deleteStaff(shopId, staffId);
      if (res.ok) {
        toast.success("Đã xoá thợ");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function startEdit(s: Staff) {
    setEditing({ id: s.id, name: s.name, active: s.active, sortOrder: s.sortOrder });
  }

  function handleSaveEdit() {
    if (!editing) return;
    startTransition(async () => {
      const res = await updateStaff(shopId, editing.id, {
        name: editing.name,
        active: editing.active,
        sortOrder: editing.sortOrder,
      });
      if (res.ok) {
        setEditing(null);
        toast.success("Đã cập nhật");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thợ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new staff */}
        <div className="flex gap-2">
          <Input
            placeholder="Tên thợ mới..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            disabled={isPending}
          />
          <Button onClick={handleAdd} disabled={isPending || !newName.trim()} size="sm">
            <Plus className="size-4" />
            Thêm thợ
          </Button>
        </div>

        {/* Staff list */}
        {staff.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có thợ nào.</p>
        )}
        <ul className="divide-y divide-border/50">
          {staff.map((s) => (
            <li key={s.id} className="py-2.5">
              {editing?.id === s.id ? (
                <div className="space-y-2">
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    disabled={isPending}
                    autoFocus
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={editing.active}
                        onChange={(e) =>
                          setEditing({ ...editing, active: e.target.checked })
                        }
                        disabled={isPending}
                        className="size-4 accent-primary"
                      />
                      Đang làm việc
                    </label>
                    <div className="ml-auto flex gap-1">
                      <Button
                        size="icon-sm"
                        onClick={handleSaveEdit}
                        disabled={isPending || !editing.name.trim()}
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setEditing(null)}
                        disabled={isPending}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium">{s.name}</span>
                  {!s.active && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Nghỉ
                    </span>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => startEdit(s)}
                    disabled={isPending}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
