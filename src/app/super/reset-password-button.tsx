"use client";

import { useState, useTransition } from "react";

import { CheckIcon, CopyIcon, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetShopPassword } from "./actions";

export function ResetPasswordButton({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creds, setCreds] = useState<{ loginEmail: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleReset() {
    startTransition(async () => {
      const res = await resetShopPassword(shopId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCreds({ loginEmail: res.loginEmail, password: res.password });
      setOpen(true);
    });
  }

  function copy() {
    if (!creds) return;
    navigator.clipboard
      .writeText(`Email: ${creds.loginEmail}\nMật khẩu mới: ${creds.password}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={pending} onClick={handleReset}>
        <KeyRound />
        Reset MK
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setCreds(null);
            setCopied(false);
            router.refresh();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mật khẩu mới</DialogTitle>
          </DialogHeader>
          {creds && (
            <div className="space-y-3">
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="space-y-0.5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email đăng nhập
                  </p>
                  <p className="font-mono text-sm font-semibold">{creds.loginEmail}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Mật khẩu mới
                  </p>
                  <p className="font-mono text-sm font-semibold tracking-widest">
                    {creds.password}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Gửi cho chủ shop. Họ sẽ buộc phải đổi mật khẩu khi đăng nhập.
              </p>
              <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0">
                <Button type="button" variant="outline" size="sm" onClick={copy}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Đã sao chép" : "Copy"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
