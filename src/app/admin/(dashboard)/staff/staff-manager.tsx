"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon, CheckIcon, XIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createStaff, updateStaff, deleteStaff } from "./actions";

interface Staff {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

interface StaffManagerProps {
  staff: Staff[];
}

export function StaffManager({ staff }: StaffManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createStaff({ name, active: true, sortOrder: 0 });
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
    if (!name || name === s.name) { cancelEdit(); return; }
    startTransition(async () => {
      const result = await updateStaff(s.id, { name, active: s.active, sortOrder: s.sortOrder });
      if (result.ok) {
        toast.success("Đã cập nhật tên");
        cancelEdit();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggleActive = (s: Staff) => {
    startTransition(async () => {
      const result = await updateStaff(s.id, {
        name: s.name,
        active: !s.active,
        sortOrder: s.sortOrder,
      });
      if (result.ok) {
        toast.success(s.active ? "Đã tắt thợ" : "Đã bật thợ");
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

      {/* Staff list */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Chưa có thợ nào. Thêm thợ đầu tiên bên trên.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {staff.map((s) => (
            <Card key={s.id} className={cn("shadow-sm", !s.active && "opacity-60")}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  {editingId === s.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitEdit(s); }
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="flex-1 h-7 text-sm"
                        autoFocus
                        disabled={isPending}
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => commitEdit(s)}
                        disabled={isPending}
                        title="Lưu"
                      >
                        <CheckIcon />
                        <span className="sr-only">Lưu</span>
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        disabled={isPending}
                        title="Hủy"
                      >
                        <XIcon />
                        <span className="sr-only">Hủy</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{s.name}</span>
                        {!s.active && (
                          <Badge variant="outline" className="shrink-0 text-xs">Tắt</Badge>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => startEdit(s)}
                          disabled={isPending}
                          title="Sửa tên"
                        >
                          <PencilIcon />
                          <span className="sr-only">Sửa</span>
                        </Button>
                        <Button
                          size="sm"
                          variant={s.active ? "outline" : "secondary"}
                          onClick={() => handleToggleActive(s)}
                          disabled={isPending}
                        >
                          {s.active ? "Tắt" : "Bật"}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          onClick={() => handleDelete(s)}
                          disabled={isPending}
                          title="Xóa"
                        >
                          <Trash2Icon />
                          <span className="sr-only">Xóa</span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
