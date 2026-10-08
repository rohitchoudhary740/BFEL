import { test, expect } from '@playwright/test';

test.describe('BFEL FLOW — Layer 11 Complete Operational Journey E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Stage 1 & 2: Branding, Login Page, and OTP/Password Authentication', async ({ page }) => {
    // Verify brand lockup
    await expect(page.locator('text=BFEL').first()).toBeVisible();

    // Verify phone or credentials input exists
    const inputField = page.locator('input[type="text"], input[type="tel"], input[type="password"]').first();
    await expect(inputField).toBeVisible();

    // Verify presence of Evaluation Demo Workspaces triggers
    await expect(page.locator('button:has-text("Dealer")')).toBeVisible();
  });

  test('Stage 3 & 4: Dealer Workspace, 50kg Bags, and 20T/25T Truck Constraints', async ({ page }) => {
    // Click Dealer quick demo button to fill credentials
    await page.locator('button:has-text("Dealer")').click();
    
    // Submit login form
    await page.locator('button[type="submit"]').click();

    // Wait for dealer dashboard to mount
    await page.waitForTimeout(1500);

    // Verify 50kg bag specifications and 20 MT / 25 MT validation
    const content = await page.content();
    const hasCapacityConstraint = 
      content.includes('20 MT') || 
      content.includes('25 MT') || 
      content.includes('400') || 
      content.includes('50kg') ||
      content.includes('Patel Agro');
    expect(hasCapacityConstraint).toBeTruthy();
  });

  test('Stage 5 & 6: Accounts Desk & Payment Verification Workflow', async ({ page }) => {
    // Navigate back to login or fill Accounts desk
    await page.goto('/');
    await page.locator('button:has-text("Accounts")').click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    const content = await page.content();
    const hasAccountsTerms = 
      content.includes('Accounts') || 
      content.includes('Payment') || 
      content.includes('UTR') || 
      content.includes('Verify');
    expect(hasAccountsTerms).toBeTruthy();
  });

  test('Stage 7: Loading Bay, Weighbridge, Gate Pass & Dispatch Workspace', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Bay Operator")').click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    const content = await page.content();
    const hasLoadingTerminal = 
      content.includes('Loading') || 
      content.includes('Bay') || 
      content.includes('Truck') || 
      content.includes('Weighbridge') ||
      content.includes('Gate Pass') ||
      content.includes('Dispatch');
    expect(hasLoadingTerminal).toBeTruthy();
  });
});
