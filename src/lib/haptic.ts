/**
 * Rung phản hồi nhẹ khi chạm (Android/PWA hỗ trợ navigator.vibrate).
 * iOS Safari chưa hỗ trợ → tự động bỏ qua, không gây lỗi.
 */
export function haptic(ms = 8) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(ms);
    } catch {
      /* trình duyệt chặn — bỏ qua */
    }
  }
}
