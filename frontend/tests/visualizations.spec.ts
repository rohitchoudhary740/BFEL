import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Rohit/.gemini/antigravity-ide/brain/fbe1378d-5184-4964-bd06-346aae6f7ca4';

test.describe('BFEL FLOW — Phase 3.2 Advanced Operational Visualizations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('Part 1: Truck Cargo Cutaway Visualization States (0, Partial, Full, Overload 401 & 501)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to landing page capacity section
    await page.goto('/#capacity');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Scroll to the capacity section on landing page
    const capacitySection = page.locator('#capacity');
    await capacitySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // 1. Verify trailer SVG elements exist
    await expect(page.locator('#truckCab')).toBeVisible();
    await expect(page.locator('#trailerFrame')).toBeVisible();
    await expect(page.locator('text=R1').first()).toBeVisible();
    await expect(page.locator('text=R10').first()).toBeVisible();

    // 2. State 1: Empty (0 bags)
    const emptyBtn = page.locator('button:has-text("0 Bags (Empty)")');
    await expect(emptyBtn).toBeVisible();
    await emptyBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=0 / 400').first()).toBeVisible();
    await expect(page.locator('text=0.00 / 20 MT').first()).toBeVisible();
    await expect(page.locator('text=0 kg').first()).toBeVisible();
    await expect(page.locator('text=400 bags remaining').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_truck_empty.png'), fullPage: false });

    // 3. State 2: Partial load (50% = 200 bags on 20 MT)
    const partialBtn = page.locator('button:has-text("50% Load")');
    await partialBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=200 / 400').first()).toBeVisible();
    await expect(page.locator('text=10.00 / 20 MT').first()).toBeVisible();
    await expect(page.locator('text=10,000 kg').first()).toBeVisible();
    await expect(page.locator('text=200 bags remaining').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_truck_partial.png'), fullPage: false });

    // 4. State 3: Full 20 MT truck (400 bags)
    const fullBtn = page.locator('button:has-text("100% Full Load")');
    await fullBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=400 / 400').first()).toBeVisible();
    await expect(page.locator('text=20.00 / 20 MT').first()).toBeVisible();
    await expect(page.locator('text=20,000 kg').first()).toBeVisible();
    await expect(page.locator('text=0 bags remaining').first()).toBeVisible();
    await expect(page.locator('text=Full Truckload (FTL)').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_truck_full_20mt.png'), fullPage: false });

    // 5. State 4: Overload 20 MT truck (401+ bags)
    const overloadBtn = page.locator('button:has-text("Test Overload Alert")');
    await overloadBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Overload Alert').first()).toBeVisible();
    await expect(page.locator('text=Capacity limit exceeded:').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_truck_overload_401.png'), fullPage: false });

    // 6. Switch to 25 MT Heavy Haul
    const btn25MT = page.locator('button:has-text("25 MT Heavy")');
    await btn25MT.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=25 MT HEAVY').first()).toBeVisible();

    // 7. State 5: Full 25 MT truck (500 bags)
    await fullBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=500 / 500').first()).toBeVisible();
    await expect(page.locator('text=25.00 / 25 MT').first()).toBeVisible();
    await expect(page.locator('text=25,000 kg').first()).toBeVisible();
    await expect(page.locator('text=0 bags remaining').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_truck_full_25mt.png'), fullPage: false });

    // 8. State 6: Overload 25 MT truck (520 bags)
    await overloadBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=520 / 500').first()).toBeVisible();
    await expect(page.locator('text=26.00 / 25 MT').first()).toBeVisible();
    await expect(page.locator('text=26,000 kg').first()).toBeVisible();
    await expect(page.locator('text=Overload Alert (+20 bags)').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_truck_overload_501.png'), fullPage: false });
  });

  test('Part 2: Central Admin Interactive Geographic Distribution Map (Phase C)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Authenticate as Central Admin
    await page.locator('button:has-text("Central Admin")').click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Navigate to Delivery Tracking tab (contains OperationalMap)
    await page.locator('button:has-text("Delivery Tracking"), a:has-text("Delivery Tracking")').first().click();
    await page.waitForTimeout(800);

    // Verify Map Title, Regional Contours, and Highway Network
    await expect(page.locator('text=Central India Consignment & Mandi Geographic Map').first()).toBeVisible();
    await expect(page.locator('text=Malwa-Nimar Corridor').first()).toBeVisible();
    await expect(page.locator('#highwayNetwork')).toBeVisible();

    // Screenshot Admin Overview Map
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_map_admin_overview.png'), fullPage: false });

    // Click on Central Plant quick focus button to open Detail Inspector
    const plantFocusBtn = page.locator('button:has-text("Manglia Industrial Area"), button:has-text("Manglia")').first();
    await plantFocusBtn.click();
    await page.waitForTimeout(400);

    // Verify Inspector Details
    await expect(page.locator('text=Primary Manufacturing Plant').first()).toBeVisible();
    await expect(page.locator('text=Manglia Industrial Area, Indore').first()).toBeVisible();
    await expect(page.locator('text=ACTIVE_DISPATCH').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_map_admin_marker_selected.png'), fullPage: false });

    // Test Map/List View Toggle (Facility Ledger Table)
    const listToggleBtn = page.locator('button:has-text("Facility Ledger")');
    await expect(listToggleBtn).toBeVisible();
    await listToggleBtn.click();
    await page.waitForTimeout(400);

    // Verify Ledger Table
    await expect(page.locator('th:has-text("Facility / Consignment")')).toBeVisible();
    await expect(page.locator('td:has-text("Patel Agro Agency")').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_map_admin_list_mode.png'), fullPage: false });
  });

  test('Part 3: Dealer Workspace Delivery Route Map (Phase D)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Authenticate as Dealer
    await page.locator('button:has-text("Dealer")').click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Dealer overview contains the route schematic to their godown
    await expect(page.locator('text=Consignment Transit Route (Manglia Mill to Dewas Godown)').first()).toBeVisible();
    await expect(page.locator('text=Dewas Mandi Yard').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_map_dealer_shipment.png'), fullPage: false });
  });

  test('Part 4: Sales Agent Workspace Territory Map (Phase E)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Authenticate as Sales Agent
    await page.locator('button:has-text("Sales Agent")').click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Navigate to Dealerships tab
    await page.locator('button:has-text("My Assigned Dealerships"), a:has-text("My Assigned Dealerships")').first().click();
    await page.waitForTimeout(800);

    // Verify Territory Map
    await expect(page.locator('text=Assigned Territory Dealership Map').first()).toBeVisible();
    await expect(page.locator('text=Dewas, Khargone, Sanwer, and Ujjain').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_map_sales_agent.png'), fullPage: false });
  });

  test('Part 5: Distributor Workspace Dealer Network Map (Phase F)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Authenticate as Distributor
    await page.locator('button:has-text("Distributor")').click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Navigate to Dealer Network tab
    await page.locator('button:has-text("Dealer Network"), a:has-text("Dealer Network")').first().click();
    await page.waitForTimeout(800);

    // Verify Network Map
    await expect(page.locator('text=Distributor Retail Dealer Network Map').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_map_distributor.png'), fullPage: false });
  });

  test('Part 6: Loading Operator Terminal Live Cutaway Cargo Visualization', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Authenticate as Bay Operator
    await page.locator('button:has-text("Bay Operator")').click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Verify Live Truck Cutaway Trailer in Terminal
    await expect(page.locator('text=Active Bay Live Cargo Bed Elevation').first()).toBeVisible();
    await expect(page.locator('#truckCab').first()).toBeVisible();
    await expect(page.locator('text=Industrial Trailer Cutaway Elevation').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_loading_terminal_truck.png'), fullPage: false });
  });

  test('Part 7: Return to Home Screen Option & Right Side Click on Login Page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify "Back to Home Screen" button on the right side panel is visible
    const backBtn = page.locator('button:has-text("Back to Home Screen")');
    await expect(backBtn).toBeVisible();

    // 2. Click the "Back to Home Screen" button
    await backBtn.click();
    await page.waitForTimeout(600);

    // 3. Verify user is returned to the public home screen
    await expect(page.locator('text=One Connected Flow.').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_return_home_success.png'), fullPage: false });

    // 4. Return to /login and test clicking anywhere on the right-side panel
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const rightPanel = page.locator('div[title="Click to return to home screen"]');
    await expect(rightPanel).toBeVisible();
    await rightPanel.click();
    await page.waitForTimeout(600);

    // 5. Verify returned to home screen again
    await expect(page.locator('text=One Connected Flow.').first()).toBeVisible();
  });

  test('Part 8: Enhanced Operational Map Features (Quick Focus, Badges, Scale, Telemetry)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Authenticate as Central Admin
    await page.locator('button:has-text("Central Admin")').click();
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Go to Delivery Tracking
    await page.locator('button:has-text("Delivery Tracking"), a:has-text("Delivery Tracking")').first().click();
    await page.waitForTimeout(800);

    // Verify Telemetry status strip
    await expect(page.locator('text=Manglia Extraction Mill: Online').first()).toBeVisible();
    await expect(page.locator('text=Avery Scale ±100kg').first()).toBeVisible();

    // Verify Highway shields
    await expect(page.locator('text=NH-52').first()).toBeVisible();
    await expect(page.locator('text=SH-27').first()).toBeVisible();
    await expect(page.locator('text=NH-347BG').first()).toBeVisible();

    // Test Quick Focus button for Dewas
    const dewasFocusBtn = page.locator('button:has-text("Dewas Mandi")').first();
    await expect(dewasFocusBtn).toBeVisible();
    await dewasFocusBtn.click();
    await page.waitForTimeout(400);

    // Verify Dewas marker opened in Inspector
    await expect(page.locator('text=Patel Agro Agency').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase3_2_map_quick_focus_dewas.png'), fullPage: false });
  });
});
