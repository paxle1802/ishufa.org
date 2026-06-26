import { expect, test } from "@playwright/test";

// Cần promo "E2ESALE" tồn tại (seed trước khi chạy). SĐT dọn sau.
const TEST_PHONE = "0911222666";

test("đặt lịch có áp mã khuyến mãi", async ({ page }) => {
  await page.goto("/s/demo");
  await page.getByRole("button", { name: /Cắt tóc nam/ }).click();

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
    } catch {}
  }
  expect(found).toBeTruthy();

  await slotBtns.first().click();
  await page.locator("#customer-name").fill("Promo Test");
  await page.locator("#customer-phone").fill(TEST_PHONE);
  await page.locator("#promo-code").fill("E2ESALE");

  await page.getByRole("button", { name: "Đặt lịch ngay" }).click();

  await expect(
    page.getByRole("heading", { name: "Đặt lịch thành công!" }),
  ).toBeVisible({ timeout: 15_000 });
  // dòng khuyến mãi xuất hiện ở màn thành công
  await expect(page.getByText("Khuyến mãi")).toBeVisible();
});
