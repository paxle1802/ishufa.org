/**
 * Lưu ảnh: ưu tiên Web Share API (iOS → share sheet "Save Image" vào Photos),
 * fallback tải file (desktop / không hỗ trợ chia sẻ file).
 * Trả về true nếu đã chia sẻ/tải, false nếu người dùng huỷ.
 */
export async function saveOrShareImage(
  blob: Blob,
  filename: string,
  title: string,
): Promise<boolean> {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return false;
      // Lỗi khác → rơi xuống tải file.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
