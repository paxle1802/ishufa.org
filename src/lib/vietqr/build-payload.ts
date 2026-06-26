/**
 * Dựng chuỗi VietQR (Napas247) theo chuẩn EMVCo để render ra mã QR.
 * Khách quét QR sẽ thấy sẵn số tài khoản + số tiền + nội dung chuyển khoản.
 */

/** TLV: id (2) + độ dài (2) + giá trị. */
function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/** CRC16-CCITT (XModem): poly 0x1021, init 0xFFFF — chuẩn của VietQR (tag 63). */
function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Nội dung chuyển khoản chỉ nên gồm chữ/số/khoảng trắng (bỏ dấu tiếng Việt). */
function sanitizeInfo(raw: string): string {
  // NFD tách dấu khỏi ký tự; bộ lọc cuối loại mọi dấu + ký tự lạ.
  return raw
    .normalize("NFD")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 25);
}

export interface VietQrInput {
  bankBin: string;
  accountNumber: string;
  amount?: number; // VND (số nguyên); bỏ trống = QR không gắn sẵn số tiền
  addInfo?: string; // nội dung chuyển khoản
}

export function buildVietQrPayload({
  bankBin,
  accountNumber,
  amount,
  addInfo,
}: VietQrInput): string {
  // Tag 38: thông tin tài khoản thụ hưởng (GUID Napas + BIN/STK + dịch vụ).
  const merchant = tlv(
    "38",
    tlv("00", "A000000727") +
      tlv("01", tlv("00", bankBin) + tlv("01", accountNumber)) +
      tlv("02", "QRIBFTTA"),
  );

  let payload =
    tlv("00", "01") + // Payload format indicator
    tlv("01", "11") + // Point of initiation: static (chấp nhận gắn số tiền)
    merchant +
    tlv("52", "0000") + // Merchant category code
    tlv("53", "704") + // Tiền tệ: VND
    (amount && amount > 0 ? tlv("54", String(Math.round(amount))) : "") +
    tlv("58", "VN"); // Quốc gia

  if (addInfo) {
    const info = sanitizeInfo(addInfo);
    if (info) payload += tlv("62", tlv("08", info));
  }

  payload += "6304"; // Tag CRC + độ dài cố định 4, CRC tính trên cả phần này.
  return payload + crc16(payload);
}
