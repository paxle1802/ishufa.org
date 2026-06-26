import { expect, test } from "@playwright/test";

// SĐT đặc trưng để dọn dữ liệu test sau khi chạy.
const TEST_PHONE = "0911222333";

test("khách đặt lịch thành công trên /s/demo", async ({ page }) => {
  await page.goto("/s/demo");
  await expect(page.getByRole("heading", { name: "Salon Demo" })).toBeVisible();

  // 1) chọn dịch vụ
  await page.getByRole("button", { name: /Cắt tóc nam/ }).click();

  // 2) tìm ngày đầu tiên có slot khả dụng (demo nghỉ CN)
  const dateBtns = page.getByRole("button", { name: /^(CN|T[2-7]) \d{2}\/\d{2}$/ });
  const slotBtns = page.getByRole("button", { name: /^Chọn giờ/ });
  const dayCount = await dateBtns.count();

  let found = false;
  for (let i = 0; i < Math.min(dayCount, 10); i++) {
    await dateBtns.nth(i).click();
    try {
      await slotBtns.first().waitFor({ state: "visible", timeout: 4000 });
      found = true;
      break;
    } catch {
      // ngày này hết/nghỉ → thử ngày kế
    }
  }
  expect(found, "Phải tìm được ít nhất 1 ngày có slot").toBeTruthy();

  // 3) chọn slot + nhập thông tin
  await slotBtns.first().click();
  await page.locator("#customer-name").fill("E2E Test");
  await page.locator("#customer-phone").fill(TEST_PHONE);

  // 4) đặt lịch
  await page.getByRole("button", { name: "Đặt lịch ngay" }).click();

  // 5) màn thành công
  await expect(
    page.getByRole("heading", { name: "Đặt lịch thành công!" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Mã đặt lịch")).toBeVisible();
});
