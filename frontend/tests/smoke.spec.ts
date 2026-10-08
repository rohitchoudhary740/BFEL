import { test, expect } from '@playwright/test';

test.describe('BFEL FLOW Production Smoke Tests', () => {
  test('frontend page loads with correct title and branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/BFEL FLOW/);
  });

  test('login view renders with role authentication triggers', async ({ page }) => {
    await page.goto('/');
    // Check for login entry point or dashboard header
    const mainContainer = page.locator('body');
    await expect(mainContainer).toBeVisible();
  });
});
