"use client";

import { useState, useTransition } from "react";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CredentialFields } from "./credential-fields";
import { resetShopPassword } from "./actions";

export function ResetPasswordButton({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creds, setCreds] = useState<{ loginEmail: string; password: string } | null>(null);
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
              <CredentialFields loginEmail={creds.loginEmail} password={creds.password} />
              <p className="text-xs text-muted-foreground">
                Gửi cho chủ shop. Họ sẽ buộc phải đổi mật khẩu khi đăng nhập.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
