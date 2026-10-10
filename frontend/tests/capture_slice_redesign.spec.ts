import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Rohit/.gemini/antigravity-ide/brain/34f45ce9-8250-4390-9b66-1e207c31c66b';

test.describe('BFEL FLOW — Slice-Inspired Landing Page Verification & Screenshots', () => {
  test('Capture Full Responsive Screenshots across Viewports and Themes', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Desktop Standard 1440px Dark Mode (Default)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Hero Section
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_desktop_1440_hero_dark.png'), fullPage: false });

    // Click through 5 stages of product demo
    const stages = ['order', 'payment', 'loading', 'weighbridge', 'dispatch'];
    for (let i = 0; i < stages.length; i++) {
      const tab = page.locator(`#stage-tab-${stages[i]}`);
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `slice_product_demo_stage_${i + 1}_${stages[i]}.png`), fullPage: false });
      }
    }

    // Scroll to Truck Capacity section
    const capacitySection = page.locator('#capacity');
    await capacitySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_capacity_20mt_default.png'), fullPage: false });

    // Test 25 MT Heavy
    await page.locator('button:has-text("25 MT Heavy")').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_capacity_25mt_heavy.png'), fullPage: false });

    // Test Overload Alert
    await page.locator('button:has-text("Test Overload Alert")').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_capacity_overload_alert.png'), fullPage: false });

    // Test 100% Full Load
    await page.locator('button:has-text("100% Full Load")').first().click();
    await page.waitForTimeout(300);

    // Scroll to Section C: Operational Workflow
    const workflowSection = page.locator('#workflow');
    await workflowSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_section_c_workflow.png'), fullPage: false });

    // Scroll to Section D: Distribution Intelligence
    const distSection = page.locator('#distribution');
    if (await distSection.isVisible()) {
      await distSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_section_d_distribution.png'), fullPage: false });
    }

    // Scroll to Section E: Workspaces
    const workspacesSection = page.locator('#workspaces');
    await workspacesSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_section_e_workspaces.png'), fullPage: false });

    // Scroll to Section F: Metrology Controls
    const metrologySection = page.locator('#metrology');
    await metrologySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_section_f_metrology.png'), fullPage: false });

    // Scroll to Section G: Evaluation Launchpad
    const evalSection = page.locator('#evaluation');
    await evalSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_section_g_evaluation.png'), fullPage: false });

    // 2. Switch to Light Mode and capture Desktop Light Mode
    const themeBtn = page.locator('button[aria-label*="Switch to"]').first();
    await themeBtn.click();
    await page.waitForTimeout(400);

    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_desktop_1440_hero_light.png'), fullPage: false });

    await capacitySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_capacity_light_mode.png'), fullPage: false });

    // Switch back to Dark Mode (The Authoritative Visual Identity)
    await themeBtn.click();
    await page.waitForTimeout(400);

    // 3. Viewport 1920px (Desktop Large)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_viewport_1920px_hero.png'), fullPage: false });

    // 4. Viewport 1280px (Laptop)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_viewport_1280px_hero.png'), fullPage: false });

    // 5. Viewport 1024px (Tablet Landscape)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_viewport_1024px_hero.png'), fullPage: false });

    // 6. Viewport 768px (Tablet Portrait)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_viewport_768px_hero.png'), fullPage: false });

    // 7. Viewport 375px (Mobile Portrait)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_viewport_375px_mobile_hero.png'), fullPage: false });

    // Mobile capacity
    await capacitySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slice_viewport_375px_mobile_capacity.png'), fullPage: false });

    // Mobile overflow verification
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();
  });
});
