import { test, expect } from '@playwright/test';

test.describe('BFEL FLOW — Light and Dark Mode Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to test default behavior cleanly
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('Theme toggle is present on Login page and switches between Dark and Light mode', async ({ page }) => {
    // Verify default is dark mode
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Verify ThemeToggle button exists with aria-label
    const themeToggleBtn = page.locator('button[aria-label*="Switch to"]').first();
    await expect(themeToggleBtn).toBeVisible();

    // Click toggle to switch to Light mode
    await themeToggleBtn.click();
    await page.waitForTimeout(300);

    // Verify html class no longer contains 'dark'
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Verify localStorage has 'light'
    const storedTheme = await page.evaluate(() => localStorage.getItem('bfel_theme'));
    expect(storedTheme).toBe('light');

    // Click toggle again to switch back to Dark mode
    await themeToggleBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('html')).toHaveClass(/dark/);

    const storedThemeDark = await page.evaluate(() => localStorage.getItem('bfel_theme'));
    expect(storedThemeDark).toBe('dark');
  });

  test('Theme preference persists across page reloads', async ({ page }) => {
    const themeToggleBtn = page.locator('button[aria-label*="Switch to"]').first();
    await themeToggleBtn.click();
    await page.waitForTimeout(300);

    // Expect light mode
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem('bfel_theme'))).toBe('light');

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Verify light mode persists after reload
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    const storedTheme = await page.evaluate(() => localStorage.getItem('bfel_theme'));
    expect(storedTheme).toBe('light');
  });

  test('TopBar in authenticated workspace includes theme toggle and functions seamlessly', async ({ page }) => {
    // Sign in as Dealer
    await page.locator('button:has-text("Dealer")').click();
    await page.locator('button[type="submit"]').click();

    // Wait for authenticated header to mount
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('header button[aria-label*="Switch to"]')).toBeVisible({ timeout: 10000 });

    // Locate TopBar theme toggle
    const topBarToggle = page.locator('header button[aria-label*="Switch to"]');

    // Toggle theme from TopBar
    await topBarToggle.click();
    await page.waitForTimeout(300);

    // Verify theme changed in authenticated workspace
    const currentTheme = await page.evaluate(() => localStorage.getItem('bfel_theme'));
    expect(currentTheme).toBe('light');
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Toggle again
    await topBarToggle.click();
    await page.waitForTimeout(300);
    const finalStoredTheme = await page.evaluate(() => localStorage.getItem('bfel_theme'));
    expect(finalStoredTheme).toBe('dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('User Profile menu provides Appearance toggle', async ({ page }) => {
    // Sign in as Dealer
    await page.locator('button:has-text("Dealer")').click();
    await page.locator('button[type="submit"]').click();

    // Wait for authenticated header to mount
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });

    // Open Profile dropdown
    const profileBtn = page.locator('header button:has-text("Ramesh Patel"), header button:has(div:has-text("R"))').first();
    await expect(profileBtn).toBeVisible({ timeout: 10000 });
    await profileBtn.click();

    // Verify Appearance row is in dropdown
    const appearanceBtn = page.locator('button:has-text("Appearance")');
    await expect(appearanceBtn).toBeVisible();

    // Click Appearance
    await appearanceBtn.click();
    await page.waitForTimeout(300);

    const storedTheme = await page.evaluate(() => localStorage.getItem('bfel_theme'));
    expect(storedTheme).toBe('light');
  });
});
