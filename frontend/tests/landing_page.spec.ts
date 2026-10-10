import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Rohit/.gemini/antigravity-ide/brain/fbe1378d-5184-4964-bd06-346aae6f7ca4';

test.describe('Phase 3 Public Landing Page Visual & Responsive Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('Desktop (1440px): Hero, Truck Capacity Sandbox, Workflow, Roles, & Evaluation Launchpad', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);

    // 1. Verify title & brand lockup
    await expect(page).toHaveTitle(/BFEL FLOW/);
    await expect(page.locator('text=BFEL FLOW').first()).toBeVisible();
    await expect(page.locator('text=Every Feed Order.').first()).toBeVisible();

    // 2. Screenshot Hero
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_desktop_hero.png'), fullPage: false });

    // 3. Scroll to Truck Capacity section and test interactive states
    const capacitySection = page.locator('#capacity');
    await capacitySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Verify default 20 MT (400 bags)
    await expect(page.locator('text=20.00 / 20 MT').first()).toBeVisible();

    // Switch to 25 MT
    await page.locator('button:has-text("25 MT Heavy")').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=25.00 / 25 MT').first()).toBeVisible();

    // Click Overload preset
    const overloadBtn = page.locator('button:has-text("Test Overload Alert")');
    await expect(overloadBtn).toBeVisible();
    await overloadBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Overload Alert').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_desktop_capacity_overload.png'), fullPage: false });

    // Return to valid 500 bags
    const validBtn = page.locator('button:has-text("100% Full Load")');
    await expect(validBtn).toBeVisible();
    await validBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_desktop_capacity_valid.png'), fullPage: false });

    // 4. Scroll to Workflow & capture
    const workflowSection = page.locator('#workflow');
    await workflowSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_desktop_workflow.png'), fullPage: false });

    // 5. Scroll to Workspaces & capture
    const workspacesSection = page.locator('#workspaces');
    await workspacesSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_desktop_workspaces.png'), fullPage: false });

    // 6. Scroll to Metrology & Evaluation Launchpad
    const evalSection = page.locator('#evaluation');
    await evalSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_desktop_evaluation_launchpad.png'), fullPage: false });
  });

  test('Mobile (375px): Responsiveness, Zero Horizontal Overflow, & Touch Adaptations', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);

    // Verify zero horizontal overflow on mobile root
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    // Screenshot Mobile Hero
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_mobile_hero.png'), fullPage: false });

    // Scroll to Truck Capacity section on mobile
    const capacitySection = page.locator('#capacity');
    await capacitySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Verify no overflow when scrolled
    const hasCapacityOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasCapacityOverflow).toBeFalsy();

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_mobile_capacity.png'), fullPage: false });

    // Scroll to Workflow on mobile
    const workflowSection = page.locator('#workflow');
    await workflowSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_mobile_workflow.png'), fullPage: false });
  });

  test('Dark and Light Theme Switching on Public Landing Page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);

    // Default dark mode
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_theme_dark.png'), fullPage: false });

    // Switch to light mode
    const themeBtn = page.locator('button[aria-label*="Switch to"]').first();
    await themeBtn.click();
    await page.waitForTimeout(400);

    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_theme_light.png'), fullPage: false });
  });
});
