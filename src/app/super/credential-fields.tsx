"use client";

import { useState } from "react";

import { CheckIcon, CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Một dòng giá trị + nút copy chỉ riêng giá trị đó (tránh app nhắn tin
 *  tự linkify cả khối email rồi chèn %20/%0A vào). */
function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 break-all font-mono text-sm font-semibold">{value}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Đã copy" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

/** Khối hiển thị email + mật khẩu, mỗi dòng có nút copy riêng. */
export function CredentialFields({
  loginEmail,
  password,
}: {
  loginEmail: string;
  password: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <CopyRow label="Email đăng nhập" value={loginEmail} />
      <CopyRow label="Mật khẩu" value={password} />
    </div>
  );
}
