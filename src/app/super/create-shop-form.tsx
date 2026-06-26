"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CopyIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createShop } from "./actions";

type SuccessData = {
  shopName: string;
  slug: string;
  loginEmail: string;
  password: string;
};

type FormState = {
  shopName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
};

const EMPTY_FORM: FormState = {
  shopName: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
};

export function CreateShopForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // reset on close
      setForm(EMPTY_FORM);
      setSuccess(null);
      setCopied(false);
    }
    setOpen(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createShop(form);
      if (result.ok) {
        setSuccess(result);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCopy = () => {
    if (!success) return;
    const text = `Email đăng nhập: ${success.loginEmail}\nMật khẩu: ${success.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDone = () => {
    handleOpenChange(false);
    router.refresh();
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <PlusIcon />
        Thêm shop
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm shop mới</DialogTitle>
            {!success && (
              <DialogDescription>
                Tạo tài khoản chủ shop và cấp quyền truy cập.
              </DialogDescription>
            )}
          </DialogHeader>

          {success ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Shop <strong>{success.shopName}</strong> đã được tạo thành công.
              </p>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email đăng nhập
                  </p>
                  <p className="font-mono text-sm font-semibold">{success.loginEmail}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Mật khẩu
                  </p>
                  <p className="font-mono text-sm font-semibold tracking-widest">
                    {success.password}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Gửi thông tin này cho chủ shop (mật khẩu chỉ hiển thị 1 lần).
              </p>

              <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Đã sao chép" : "Copy"}
                </Button>
                <Button type="button" size="sm" onClick={handleDone}>
                  Xong
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cs-shop-name">Tên shop *</Label>
                <Input
                  id="cs-shop-name"
                  value={form.shopName}
                  onChange={set("shopName")}
                  placeholder="VD: Salon Hương"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cs-owner-name">Tên chủ shop *</Label>
                <Input
                  id="cs-owner-name"
                  value={form.ownerName}
                  onChange={set("ownerName")}
                  placeholder="VD: Nguyễn Thị Hương"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cs-owner-phone">SĐT chủ shop *</Label>
                <Input
                  id="cs-owner-phone"
                  type="tel"
                  value={form.ownerPhone}
                  onChange={set("ownerPhone")}
                  placeholder="VD: 0901234567"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cs-owner-email">
                  Email chủ shop{" "}
                  <span className="text-muted-foreground">(tùy chọn)</span>
                </Label>
                <Input
                  id="cs-owner-email"
                  type="email"
                  value={form.ownerEmail}
                  onChange={set("ownerEmail")}
                  placeholder="owner@example.com"
                />
              </div>

              <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0 pt-2">
                <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
                  Hủy
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Đang tạo..." : "Tạo shop"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
