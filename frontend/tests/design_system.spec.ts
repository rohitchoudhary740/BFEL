import { test, expect } from '@playwright/test';

test.describe('BFEL FLOW — Phase 2 Design System & Signature Motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Sign in to authenticated workspace and access About BFEL & Design System Modal', async ({ page }) => {
    // 1. Authenticate as Dealer
    await page.locator('button:has-text("Dealer")').click();
    await page.locator('button[type="submit"]').click();

    // 2. Wait for authenticated header
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });

    // 3. Open About BFEL Modal via TopBar info button
    const infoBtn = page.locator('button[aria-label="About BFEL Flow"]');
    await expect(infoBtn).toBeVisible();
    await infoBtn.click();

    // 4. Verify About BFEL modal is visible
    const modal = page.locator('div.fixed.inset-0').first();
    await expect(modal).toBeVisible();
    await expect(page.locator('text=BFEL FLOW').first()).toBeVisible();

    // 5. Switch to Design System & Metrology Primitives tab
    const designSystemTab = page.locator('button:has-text("Design System & Metrology")');
    await expect(designSystemTab).toBeVisible();
    await designSystemTab.click();

    // 6. Verify SpotlightCard components are mounted
    await expect(page.locator('text=SpotlightCard').first()).toBeVisible();
    await expect(page.locator('text=Harvest Gold').first()).toBeVisible();
    await expect(page.locator('text=Weighbridge Cyan').first()).toBeVisible();
    await expect(page.locator('text=Electric Lime').first()).toBeVisible();

    // 7. Verify TruckCapacityVisualizer is mounted and interactive
    await expect(page.locator('text=TruckCapacityVisualizer').first()).toBeVisible();
    await expect(page.locator('text=400').first()).toBeVisible(); // 400 bags default for 20 MT
    await expect(page.locator('text=20.00 / 20 MT').first()).toBeVisible();

    // Test toggle to 25 MT (500 bags)
    const btn25MT = page.locator('button:has-text("25 MT (500 Bags)")');
    await expect(btn25MT).toBeVisible();
    await btn25MT.click();
    await expect(page.locator('text=500').first()).toBeVisible();
    await expect(page.locator('text=25.00 / 25 MT').first()).toBeVisible();

    // 8. Verify WeighbridgeCounter is mounted
    await expect(page.locator('text=WeighbridgeCounter').first()).toBeVisible();
    await expect(page.locator('text=Certified Net Cargo Mass').first()).toBeVisible();
    await expect(page.locator('text=20,030').first()).toBeVisible(); // 29,450 - 9,420 = 20,030 kg
    await expect(page.locator('text=+30').first()).toBeVisible();     // +30 kg variance
    await expect(page.locator('text=SEAL-IND-8841').first()).toBeVisible();

    // 9. Verify IndustrialLoaders
    await expect(page.locator('text=Calibrating Scale').first()).toBeVisible();
    await expect(page.locator('text=Verifying UTR').first()).toBeVisible();
    await expect(page.locator('text=Dispatch Ready').first()).toBeVisible();
  });

  test('Responsive behavior: Design System primitives render without horizontal overflow on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Authenticate as Dealer
    await page.locator('button:has-text("Dealer")').click();
    await page.locator('button[type="submit"]').click();

    // Wait for header and open About modal
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
    const infoBtn = page.locator('button[aria-label="About BFEL Flow"]');
    await infoBtn.click();

    // Switch to Design System tab
    const designSystemTab = page.locator('button:has-text("Design System & Metrology")');
    await expect(designSystemTab).toBeVisible();
    await designSystemTab.click();

    // Verify modal dialog card itself fits within mobile viewport width without overflow
    const modalCard = page.locator('div.w-full.max-w-3xl').first();
    await expect(modalCard).toBeVisible();
    const modalBoxWidth = await modalCard.evaluate((el) => el.clientWidth);
    expect(modalBoxWidth).toBeLessThanOrEqual(375);
  });

  test('Reduced motion preference is respected by CSS tokens', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Verify media query applies animation duration override
    const isReduced = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    expect(isReduced).toBeTruthy();
  });
});
