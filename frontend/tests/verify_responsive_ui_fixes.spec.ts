import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Rohit/.gemini/antigravity-ide/brain/34f45ce9-8250-4390-9b66-1e207c31c66b';

test.describe('BFEL FLOW — Direct Responsive UI Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  // =========================================================================
  // FIX 1: HOMEPAGE DISTRIBUTION MAP & KHARGONE HUB VERIFICATION
  // =========================================================================
  test('Homepage Distribution Map: Khargone Hub & All Corridors Fully Visible across Viewports', async ({ page }) => {
    const viewports = [
      { name: 'desktop_1440', width: 1440, height: 900 },
      { name: 'desktop_1024', width: 1024, height: 768 },
      { name: 'tablet_768', width: 768, height: 1024 },
      { name: 'mobile_430', width: 430, height: 932 },
      { name: 'mobile_390', width: 390, height: 844 },
      { name: 'mobile_375', width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // Scroll to Distribution Section
      const distSection = page.locator('#distribution');
      await expect(distSection).toBeVisible();
      await distSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // Verify All 5 Nodes on the Map Schematic
      await expect(distSection.locator('text=MANGLIA CENTRAL PLANT')).toBeVisible();
      await expect(distSection.locator('text=DEWAS MANDI')).toBeVisible();
      await expect(distSection.locator('text=UJJAIN GRAIN HUB')).toBeVisible();
      await expect(distSection.locator('text=SANWER RURAL MANDI')).toBeVisible();
      await expect(distSection.locator('text=KHARGONE HUB')).toBeVisible();

      // Verify Route Badges & Transits
      await expect(distSection.locator('text=NH-52 (42 km)')).toBeVisible();
      await expect(distSection.locator('text=SH-27 (56 km)')).toBeVisible();
      await expect(distSection.locator('text=NH-347BG (32 km)')).toBeVisible();
      await expect(distSection.locator('text=SH-1 (140 km)')).toBeVisible();

      // Verify All 4 Corridor Cards are Rendered
      await expect(distSection.locator('text=NH-52 Dewas (42 km)')).toBeVisible();
      await expect(distSection.locator('text=SH-27 Ujjain (56 km)')).toBeVisible();
      await expect(distSection.locator('text=NH-347BG Sanwer (32 km)')).toBeVisible();
      await expect(distSection.locator('text=SH-1 Khargone (140 km)')).toBeVisible();

      // Check Zero Horizontal Overflow
      const overflowDetails = await page.evaluate(() => {
        const clientWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        if (scrollWidth <= clientWidth) return null;
        
        const overflowing: { tag: string; id: string; className: string; scrollWidth: number; clientWidth: number; rectRight: number }[] = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.right > clientWidth + 1) {
            overflowing.push({
              tag: el.tagName,
              id: el.id,
              className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 50) : '',
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              rectRight: Math.round(rect.right),
            });
          }
        }
        return { clientWidth, scrollWidth, overflowing: overflowing.slice(0, 5) };
      });

      if (overflowDetails) {
        console.log(`[OVERFLOW in ${vp.name}]:`, JSON.stringify(overflowDetails, null, 2));
      }
      expect(overflowDetails).toBeNull();

      // Screenshot on key viewports
      if (vp.name === 'desktop_1440' || vp.name === 'mobile_375') {
        await page.screenshot({
          path: path.join(ARTIFACT_DIR, `distribution_map_${vp.name}.png`),
          fullPage: false,
        });
      }
    }
  });

  // =========================================================================
  // FIX 2: MOBILE USER MANAGEMENT & ACCESS APPROVAL DESK
  // =========================================================================
  test('User Management: Responsive Applicant Cards, No Clipping, Full Actions across Viewports', async ({ page }) => {
    // 1. Authenticate as Central Admin
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first().click();
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Central Admin")').click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // 2. Navigate to User Management
    await page.locator('button:has-text("User Management"), a:has-text("User Management")').first().click();
    await page.waitForTimeout(500);

    // Verify Title
    await expect(page.locator('text=User Management & Access Approval Desk').first()).toBeVisible();

    // Capture Desktop Table (1440px)
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'user_management_desktop_1440.png'),
      fullPage: false,
    });

    // 3. Test All 6 Viewports: 375px, 390px, 430px, 768px, 1024px, 1440px
    const allViewports = [
      { name: '1440px', width: 1440, height: 900, isMobile: false },
      { name: '1024px', width: 1024, height: 768, isMobile: false },
      { name: '768px', width: 768, height: 1024, isMobile: false },
      { name: '430px', width: 430, height: 932, isMobile: true },
      { name: '390px', width: 390, height: 844, isMobile: true },
      { name: '375px', width: 375, height: 812, isMobile: true },
    ];

    for (const vp of allViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // Verify zero horizontal overflow on root
      const overflowDetails = await page.evaluate(() => {
        const clientWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        if (scrollWidth <= clientWidth) return null;
        
        const overflowing: { tag: string; id: string; className: string; scrollWidth: number; clientWidth: number; rectRight: number }[] = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.right > clientWidth + 1) {
            overflowing.push({
              tag: el.tagName,
              id: el.id,
              className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 50) : '',
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              rectRight: Math.round(rect.right),
            });
          }
        }
        return { clientWidth, scrollWidth, overflowing: overflowing.slice(0, 5) };
      });

      if (overflowDetails) {
        console.log(`[USER MGMT OVERFLOW in ${vp.name}]:`, JSON.stringify(overflowDetails, null, 2));
      }
      expect(overflowDetails).toBeNull();

      // Verify Search field is visible and fits viewport
      const searchInput = page.locator('input[placeholder*="Search by name"]').first();
      await expect(searchInput).toBeVisible();

      // Verify Filter Tabs exist and can be switched
      const pendingTab = page.locator('button[role="tab"]:has-text("Pending Review")').first();
      const activeTab = page.locator('button[role="tab"]:has-text("Active")').first();
      await expect(pendingTab).toBeVisible();
      await expect(activeTab).toBeVisible();

      // Switch to Pending Review
      await pendingTab.click();
      await page.waitForTimeout(300);

      if (vp.isMobile) {
        // Verify Responsive Applicant Cards on Mobile
        const approveBtn = page.locator('button:has-text("Approve")').first();
        await expect(approveBtn).toBeVisible();

        const reviewBtn = page.locator('button:has-text("Review Dossier")').first();
        await expect(reviewBtn).toBeVisible();

        // Switch to Active Tab
        await activeTab.click();
        await page.waitForTimeout(300);

        // Verify Active applicant cards render organization and location
        await expect(page.locator('text=Organization / Mandi').first()).toBeVisible();
        await expect(page.locator('button:has-text("Review Dossier")').first()).toBeVisible();

        // Capture Mobile Screenshot on 375px
        if (vp.name === '375px') {
          await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'user_management_mobile_375.png'),
            fullPage: false,
          });

          // Test Drawer Opening on Mobile
          await reviewBtn.click();
          await page.waitForTimeout(400);

          // Verify Drawer Content
          await expect(page.locator('text=User Onboarding Vetting').first()).toBeVisible();
          await expect(page.locator('text=Personal & Contact Details').first()).toBeVisible();
          await page.screenshot({
            path: path.join(ARTIFACT_DIR, 'user_management_mobile_drawer_375.png'),
            fullPage: false,
          });

          // Close Drawer
          const closeBtn = page.locator('button:has(svg.lucide-x)').first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            await page.waitForTimeout(300);
          }
        }
      } else {
        // Desktop / Tablet: verify table layout is rendered
        await expect(page.locator('table').first()).toBeVisible();
        await expect(page.locator('th:has-text("Applicant")').first()).toBeVisible();
        await expect(page.locator('th:has-text("Target Role")').first()).toBeVisible();
        await expect(page.locator('th:has-text("Organization / Mandi")').first()).toBeVisible();
      }
    }
  });
});
