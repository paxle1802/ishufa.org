"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Shop } from "@/lib/db/schema";

import { saveShopInfo, uploadLogoAction } from "./actions";

interface ShopBrandingFormProps {
  shop: Shop;
}

export function ShopBrandingForm({ shop }: ShopBrandingFormProps) {
  const [name, setName] = useState(shop.name);
  const [address, setAddress] = useState(shop.address ?? "");
  const [description, setDescription] = useState(shop.description ?? "");
  const [contactPhone, setContactPhone] = useState(shop.contactPhone ?? "");
  const [accentColor, setAccentColor] = useState(shop.accentColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(shop.logoUrl ?? null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, startSaving] = useTransition();
  const [isUploading, startUploading] = useTransition();

  function handleHexInput(val: string) {
    // Accept free-text; normalise to #xxxxxx when valid
    const raw = val.startsWith("#") ? val : `#${val}`;
    setAccentColor(raw);
  }

  function handleColorPicker(val: string) {
    setAccentColor(val);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    startUploading(async () => {
      const result = await uploadLogoAction(formData);
      if (result.ok) {
        toast.success("Logo đã được cập nhật");
      } else {
        toast.error(result.error);
        // Revert preview on failure
        setLogoPreview(shop.logoUrl ?? null);
      }
    });
  }

  function handleSave() {
    startSaving(async () => {
      const result = await saveShopInfo({
        name,
        address,
        description,
        contactPhone,
        accentColor,
      });
      if (result.ok) {
        toast.success("Thông tin đã được lưu");
      } else {
        toast.error(result.error);
      }
    });
  }

  const isPending = isSaving || isUploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin & thương hiệu</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo salon</Label>
          <div className="flex items-center gap-3">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo salon"
                className="h-14 w-14 rounded-lg object-cover ring-1 ring-foreground/10"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted ring-1 ring-foreground/10">
                <ImageIcon className="size-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                {isUploading && <Loader2 className="animate-spin" />}
                {isUploading ? "Đang tải lên…" : "Chọn ảnh"}
              </Button>
              <span className="text-xs text-muted-foreground">PNG, JPG — tối đa 4 MB</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="shop-name">Tên salon *</Label>
          <Input
            id="shop-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Shifa Beauty"
            disabled={isPending}
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label htmlFor="shop-address">Địa chỉ</Label>
          <Input
            id="shop-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Nguyễn Huệ, Q.1, TP.HCM"
            disabled={isPending}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="shop-description">Mô tả</Label>
          <Textarea
            id="shop-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vài dòng giới thiệu về salon…"
            disabled={isPending}
          />
        </div>

        {/* Contact phone */}
        <div className="space-y-1.5">
          <Label htmlFor="shop-phone">Số điện thoại liên hệ</Label>
          <Input
            id="shop-phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="0901234567"
            inputMode="tel"
            disabled={isPending}
          />
        </div>

        {/* Accent colour */}
        <div className="space-y-1.5">
          <Label htmlFor="shop-color-hex">Màu thương hiệu</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accentColor.match(/^#[0-9a-fA-F]{6}$/) ? accentColor : "#0f172a"}
              onChange={(e) => handleColorPicker(e.target.value)}
              disabled={isPending}
              className="h-8 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5 disabled:opacity-50"
              aria-label="Chọn màu từ bảng màu"
            />
            <Input
              id="shop-color-hex"
              value={accentColor}
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#0f172a"
              className="w-32 font-mono"
              maxLength={7}
              disabled={isPending}
            />
            <span
              className="h-8 w-8 rounded-md ring-1 ring-foreground/10"
              style={{ backgroundColor: accentColor.match(/^#[0-9a-fA-F]{6}$/) ? accentColor : "transparent" }}
              aria-hidden
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="w-full gap-2"
        >
          {isSaving && <Loader2 className="animate-spin" />}
          {isSaving ? "Đang lưu…" : "Lưu"}
        </Button>
      </CardFooter>
    </Card>
  );
}
