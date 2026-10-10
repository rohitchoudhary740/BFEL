# BFEL FLOW — LAYER 1: RENDERED UI DIAGNOSTIC & VISUAL REDESIGN PLAN

**Platform:** BFEL FLOW (Enterprise Cattle Feed Distribution & Operations ERP)  
**Client Organization:** Bharat Feeds & Extractions Ltd, Manglia Industrial Area, Indore (M.P.)  
**Active Running Instance:** `http://localhost:3000` (Vite 8.3 / React 19 / Tailwind CSS v4 / TypeScript)  
**Document Type:** Visual & Ergonomic Diagnostic, Root-Cause Engineering Analysis, and Layer 2–4 Architectural Redesign Blueprint  
**Status:** Verification Layer Complete — Zero Code Modified — Awaiting Stakeholder Approval  

---

## Executive Summary & Diagnostic Verdict

BFEL FLOW possesses world-class domain logic: rigorous enforcement of 50 kg HDPE bag increments, rigid 20 MT (400 bags) and 25 MT (500 bags) legal axle constraints, 100% advance RTGS bank verification before factory releases, Avery Weigh-Tronix ±100 kg dual-scale tolerance validation, tamper-evident security seal locking, encrypted digital QR gate passes, and double-entry distributor credit ledgers.

However, the current user interface looks and feels like a **hackathon prototype or developer demo** rather than a multi-crore enterprise industrial ERP (comparable to modern industrial systems like Samsara, Flexport, Palantir Foundry, or SAP S/4HANA Supply Chain). 

### The Root Psychological & Visual Failure Modes:
1. **Gimmicky "Demo" Aesthetics vs. Industrial Gravitas:** The interface leans heavily on trendy consumer/marketing tropes—such as animated cursor-following spotlight glows, neon pulse borders, sci-fi yellow dot-matrix grids, and cartoonish 2D vector illustrations—rather than clean, authoritative, data-dense enterprise engineering ergonomics.
2. **Artificial Presentation vs. Functional Software Chrome:** The Hero product preview is an isolated marketing card that cycles every 6 seconds on an arbitrary timer, rather than showcasing an authentic, high-fidelity software viewport with realistic operational telemetry, actionable controls, and hierarchical navigation.
3. **Severe Layout & Aspect Ratio Clamping:** The truck cutaway illustration is clamped to an artificial 280px maximum height, choking an SVG with an ultra-wide 3.28:1 aspect ratio down to 920px width and leaving vast ~150px dead margins on modern desktop displays.
4. **Schematic Vector Simulation Masquerading as GIS:** The regional logistics map is an illustrative 1000×700 SVG canvas with hand-drawn Bezier curves and hardcoded canvas pixel points (`x: 500, y: 320`), lacking a real geographic basemap, real road-network topology, or true WGS-84 coordinates.
5. **Low Information Density in Workspaces:** Operational desks (Accounts verification, Loading terminal, Admin exceptions) exhibit consumer-app spacing with excessive padding and large cards, forcing operators to scroll extensively rather than managing fast, high-density, keyboard-driven workflows.

---

## 1. Verified Findings vs. Assumptions

To maintain strict scientific and engineering rigor, all findings in this diagnostic are partitioned into empirically verified facts and forward-looking architectural assumptions.

| Area | Empirically Verified Findings (Code & Rendered DOM Inspection) | Assumptions & Inferences |
| :--- | :--- | :--- |
| **Running Target** | `localhost:3000` is running Node.exe PID 5668 executing `vite` serving `src/main.tsx`. `frontend/app/page.tsx` dynamically imports `../src/App.tsx`. Therefore, `src/` is the authoritative single source of truth for all frontend interfaces. | Both Vite and Next.js 15 SSR wrapper can run concurrently without code divergences if `src/` is maintained with SSR safety. |
| **Hero Clipping** | In `InteractiveWorkflowPreview.tsx:130`, the stage indicator bar uses `flex gap-1.5 overflow-x-auto scrollbar-none`. Inside the `lg:col-span-5` hero column (~493px wide), the 5 verbose buttons require >600px width. Tab 4 (`STAGE 04 Weighbridge`) is clipped in half ("STAGE 04 W..."), and Tab 5 is completely hidden with zero overflow indication. | Users perceive the clipped tab as a visual bug rather than a horizontal scroll container because there is no scrollbar or visual edge fade. |
| **Truck Width** | In `TruckCapacityVisualizer.tsx:275`, the SVG element has `style={{ maxHeight: '280px' }}` and `viewBox="0 0 920 280"`. With default SVG `preserveAspectRatio="xMidYMid meet"`, max width is mathematically locked to `280 * (920 / 280) = 920px`. In a 1280px container, this produces large dead margins. | The narrow appearance in desktop screenshots was suspected to be browser zoom, but is 100% verified to be SVG max-height constraint clamping. |
| **Map Architecture** | In `OperationalMap.tsx`, the map is an SVG drawing on a 1000×700 viewBox with static Bezier paths for roads and districts. `package.json` contains zero GIS libraries (no Leaflet, MapLibre, Mapbox, or OpenLayers). Coordinates are 2D canvas pixels. | Adding a lightweight raster/vector tile basemap (e.g., Leaflet or MapLibre GL) or high-precision GeoJSON vector layer will elevate perceived value from toy to operational GIS. |
| **Automated Tests** | `frontend/tests/` contains 6 active Playwright specs (`visualizations.spec.ts`, `landing_page.spec.ts`, `design_system.spec.ts`, `operational_journey.spec.ts`, `smoke.spec.ts`, `theme.spec.ts`). All test selectors, element IDs, and text expectations are strictly documented. | No test needs to be relaxed or removed; any redesigned visual component can maintain or surpass existing test selector contracts. |

---

## 2. Comprehensive Hero Diagnostic

### A. Viewport Responsiveness Breakdown (Desktop, Laptop, Tablet, Mobile)

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                              VIEWPORT BREAKDOWN MATRIX                                                  |
+-------------------+-----------------------------------+-----------------------------------------------------------------+
| Viewport Width    | Observed Layout Behavior          | Defect & Ergonomic Breakdown                                    |
+-------------------+-----------------------------------+-----------------------------------------------------------------+
| Desktop (1440px+) | 7-col / 5-col asymmetrical grid;   | 1. Excessive empty space on sides (`max-w-7xl` centered in dark)|
|                   | Left copy ~720px, Right preview   | 2. Stepper pills overflow: "STAGE 04 W..." clipped, Tab 5 lost. |
|                   | ~493px.                           | 3. High visual imbalance between long copy and small card.     |
+-------------------+-----------------------------------+-----------------------------------------------------------------+
| Laptop (1024px)   | 7-col / 5-col grid compressed;    | 1. Right column squeezed to ~390px.                             |
|                   | Text wraps into 4-5 lines;        | 2. Stepper buttons severely truncated.                          |
|                   | Preview card cramped.             | 3. SpotlightCard internal metrics grid wraps awkwardly.         |
+-------------------+-----------------------------------+-----------------------------------------------------------------+
| Tablet (768-1023) | Collapses to 1-column stacked;    | 1. Right preview card pushed entirely below 800px fold.        |
|                   | Left copy full width;             | 2. Stepper buttons require touch scrolling without cues.        |
|                   | Card stacked below CTAs.          | 3. User lands on text-heavy block with zero visual engagement.  |
+-------------------+-----------------------------------+-----------------------------------------------------------------+
| Mobile (375-430)  | Single-column mobile stack;       | 1. Overline badge wraps awkwardly into multiple lines.          |
|                   | Stepper hidden labels (`hidden    | 2. Metric grid within preview collapses to 2x2 cramped blocks.  |
|                   | sm:inline`), showing only step.   | 3. CTA buttons stack vertically with excessive height.          |
+-------------------+-----------------------------------+-----------------------------------------------------------------+
```

### B. Detailed Defect Analysis

1. **Clipped Workflow Indicators:**
   - **File:** [`src/components/landing/InteractiveWorkflowPreview.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/landing/InteractiveWorkflowPreview.tsx#L130-L155)
   - **Root Cause:** A flex container with `gap-1.5 overflow-x-auto pb-1 scrollbar-none` containing 5 buttons with full strings (`STAGE 01 Incoming`, `STAGE 02 100%`, `STAGE 03 Loading`, `STAGE 04 Weighbridge`, `STAGE 05 Security`). The right hero column is only 493px wide at `lg:col-span-5`. The 5 buttons need 610px width.
   - **Symptom:** The 4th button is abruptly cut in half ("STAGE 04 W"), and the 5th button is completely invisible. Because `scrollbar-none` is applied, the user has zero visual affordance that the list is scrollable.
2. **Incorrect Container Widths & Excessive Empty Space:**
   - The hero container is constrained to `max-w-7xl` (1280px) on 1440px+ and 1920px viewports. The background is a stark, void-like black (`#06080C`) with sparse dot noise. The left column text is aligned left, while the right column card is relatively compact, creating a cavernous void in the top-center and extreme margins.
3. **Weak Visual Hierarchy & Navigation Competition:**
   - The top navigation bar contains 5 anchor links (`Operational Workflow`, `Truck Capacity`, `Workspaces`, `Weighbridge & Controls`, `Evaluation Console`), plus `Indore Plant Active` status pill, plus `ThemeToggle`, `Sign In`, and `Partner Onboarding`.
   - The hero directly underneath presents 3 competing CTAs:
     - `Explore Platform Simulator` (amber button) -> links to `#capacity` (same as navbar `Truck Capacity`).
     - `Sign In to Workspace` (dark button) -> navigates to `/login` (same as navbar `Sign In`).
     - `Jump to Evaluation Launchpad ↓` (amber text link) -> links to `#evaluation` (same as navbar `Evaluation Console`).
   - This creates 3 pairs of duplicate navigation targets within the first 600px of vertical space, confusing prospective enterprise buyers.
4. **Static-Looking Product Preview with Gimmicky Decoration:**
   - The `InteractiveWorkflowPreview` does not look like enterprise software. It looks like a marketing card with 4 data points. It uses a cursor-following radial gradient glow (`SpotlightCard`), which feels like an AI template rather than an authentic operations console.
   - It runs on an unprompted 6-second auto-rotation interval, interrupting the user while they are reading numbers and causing visual disorientation.
5. **Unbalanced Typography & Overline Overuse:**
   - Two pulsing status indicators exist in the initial viewport: the navbar's green `Indore Plant Active` pill and the hero's amber `MANGLIA PLANT, INDORE (M.P.) · AVERY METROLOGY CERTIFIED` pill. Both pulse simultaneously, competing for attention.
   - Headline typography is flat: stark white text with a neon amber span, lacking optical hierarchy, font-feature settings, or modern subtle gradient illumination.

---

## 3. Truck Visualization Diagnostic

### A. Layout Constraint Root-Cause Analysis (Why it appears narrow on desktop)

The truck section appears unusually narrow in desktop screenshots. We investigated whether this was caused by browser zoom, container sizing, nested constraints, or SVG parameters.

**THE VERIFIED CAUSE IS A COMBINATION OF THREE NESTED CSS/SVG PROPERTIES:**
1. **Primary Constraint — SVG `maxHeight` Clamp:**
   In [`src/design-system/TruckCapacityVisualizer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/design-system/TruckCapacityVisualizer.tsx#L272-L276):
   ```tsx
   <svg
     viewBox="0 0 920 280"
     className="w-full h-auto select-none"
     style={{ maxHeight: '280px' }}
   >
   ```
   The SVG has an intrinsic coordinate aspect ratio of `920 / 280 = 3.2857 : 1`. Because `preserveAspectRatio="xMidYMid meet"` is the SVG default, setting `maxHeight: '280px'` strictly caps the rendered SVG width to:
   $$\text{Max Rendered Width} = 280\text{px} \times \left(\frac{920}{280}\right) = 920\text{px}$$
   Regardless of whether the user has a 1440px, 1920px, or 2560px monitor, the truck cutaway can **never exceed 920px width**.
2. **Secondary Constraint — Outer Card Padding:**
   The visualizer card adds `p-4 sm:p-6` around the entire component, and the SVG wrapper adds another `p-3 sm:p-5`. On a 1280px container, the inner content box is ~1216px wide. The 920px clamped SVG sits centered with **~148px of empty dead space on both the left and right**.
3. **Tertiary Constraint — Inappropriate Grid Nesting in Operational Workspaces:**
   In [`LoadingOperatorTerminal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/loading/LoadingOperatorTerminal.tsx#L180), the visualizer is placed in a 2-column grid (`lg:grid-cols-2`), where the column width is only ~580px. Because the SVG coordinates and typography were scaled for 920px, rendering it in a 580px column shrinks all text (`R1`–`R10`, bag counts, axle labels) down to unreadable ~6px sizes.

### B. Why the Truck Illustration Looks Toy-Like

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                        TRUCK VISUALIZATION DEFECT BREAKDOWN                                             |
+-------------------+-----------------------------------------+-----------------------------------------------------------+
| Dimension         | Existing Flawed Implementation          | Required Enterprise Standard                              |
+-------------------+-----------------------------------------+-----------------------------------------------------------+
| Proportions       | 2D caricature: tiny cab with oversized  | Authentic Indian commercial heavy freight proportions     |
|                   | cartoon roof scoop; flat bumper;        | (Tata Signa 2823.TK / BharatBenz 2823R multi-axle chassis)|
|                   | trailer looks like a shipping container | with realistic wheelbases, cabin overhang, and clearances.|
|                   | with wheels attached at the far end.    |                                                           |
+-------------------+-----------------------------------------+-----------------------------------------------------------+
| Cargo Compartment | 10 vertical bars (R1-R10) acting like   | Realistic CAD/architectural cutaway with volumetric       |
| Details           | a spreadsheet bar chart; 1px black      | pallet stows (10 rows x 2 pallets across), woven HDPE     |
|                   | lines representing "bag layers".        | bag texture, strapping bands, and tare weight indicators. |
+-------------------+-----------------------------------------+-----------------------------------------------------------+
| Visual Depth      | Flat 2D vector shapes with 100% opacity | Technical axonometric / 2.5D elevation with subtle        |
|                   | fills; zero ambient occlusion, cast     | chassis depth, suspension leaf springs, brake drums,      |
|                   | shadows, or material texture.           | side underrun guards, and reflective safety tape.         |
+-------------------+-----------------------------------------+-----------------------------------------------------------+
| Loaded vs Empty   | Empty: diagonal crosshatch pattern.     | Empty: realistic ribbed stainless/plywood trailer floor   |
| Representation    | Loaded: solid bright green or orange.   | with tie-down tracks. Loaded: structured palletized stacks|
|                   | Overloaded: hot neon pink with pulsing  | with progressive height and weight distribution curves.   |
|                   | dashed stroke.                          | Overloaded: highlighted stress points on rear bogie axle. |
+-------------------+-----------------------------------------+-----------------------------------------------------------+
| Redundancy        | Renders the 10 bays in the SVG, then    | Unify visualizer: replace redundant button row with       |
|                   | immediately renders 10 small buttons    | direct interactive inspection of each bay with live axle  |
|                   | (R1-R10) directly beneath it.           | load distribution (steer axle vs tandem drive axles).     |
+-------------------+-----------------------------------------+-----------------------------------------------------------+
```

---

## 4. Map Diagnostic

### A. Actual Implementation & Data Source
- **Implementation File:** [`src/design-system/OperationalMap.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/design-system/OperationalMap.tsx) (1029 lines).
- **Classification:** **A purely schematic vector SVG diagram.** It is **NOT** a geographic map, does not use any map tiling library, and connects to no spatial database or GIS service.
- **Dependencies:** Zero mapping dependencies in `package.json`. No Leaflet, MapLibre GL, Mapbox GL, OpenLayers, or Google Maps.
- **Coordinate Data:** The markers array (`DEFAULT_CORRIDOR_MARKERS`) stores coordinates as arbitrary 2D canvas pixel coordinates:
  - Manglia Plant: `{ x: 500, y: 320 }`
  - Dewas Mandi: `{ x: 670, y: 230 }`
  - Sanwer Mandi: `{ x: 470, y: 220 }`
  - Ujjain Mandi: `{ x: 430, y: 130 }`
  - Barwaha Depot: `{ x: 630, y: 510 }`
  - Khargone Depot: `{ x: 410, y: 620 }`
  - In-transit truck: midpoint `{ x: 590, y: 270 }`
- **Background Geography:** Hand-drawn SVG `<path>` (`M 180 320 Q 300 100 500 80 Q 750 90...`) with hardcoded text labels for "INDORE DISTRICT", "DEWAS SECTOR", and a curved gradient stroke representing the "Narmada Basin Corridor".
- **Road Network:** Four SVG Bezier paths with CSS `@keyframes highwayFlowPulse` animating dashed lines across the screen.

### B. Illustrative vs. Operational Features

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                            MAP CAPABILITY CLASSIFICATION                                                |
+-----------------------------------------------------+-------------------------------------------------------------------+
| Currently Illustrative (Mocked / Decorative)        | Currently Operational (Functional State & Business Logic)         |
+-----------------------------------------------------+-------------------------------------------------------------------+
| 1. Animated dashed lines representing "highway flow"| 1. Marker selection drawer with full facility metadata (contact,  |
| 2. Static midpoint truck position (not live GPS)    |    address, phone, active orders count, last milestone).          |
| 3. Hand-drawn regional district contour curves      | 2. Search & filter bar filtering markers by town/facility name.   |
| 4. WGS84 coordinates printed as static text         | 3. Layer toggle filtering: Plant, Dealers, Distributors, Trucks.  |
| 5. Zoom & Pan simulated via CSS SVG transform       | 4. Dual View Modes: Map View vs. Facility Ledger Table view.      |
| 6. Simulated radar pulse beacon on selected pin     | 5. Quick Hub focus buttons centering selected facility.           |
+-----------------------------------------------------+-------------------------------------------------------------------+
```

### C. Requirements for a Real Geographic Basemap
To transform this into a genuine enterprise GIS logistics console:
1. **Basemap Engine:** Integrate a zero-cost, privacy-compliant, zero-API-key basemap renderer (e.g. MapLibre GL JS or Leaflet with OpenStreetMap / Carto Dark Matter / Stadia vector tiles), or embed an accurate, high-precision SVG GeoJSON projection of Madhya Pradesh district boundaries (Indore, Dewas, Ujjain, Khargone) calibrated to WGS-84 coordinates.
2. **Accurate Geographic Coordinates:**
   - BFEL Central Mill (Manglia Industrial Area, Indore): `[22.8117, 75.9525]`
   - Patel Agro Agency (Dewas Krishi Upaj Mandi): `[22.9676, 76.0534]`
   - Malwa Pashu Aahar (Sanwer Mandi Yard): `[22.9752, 75.8273]`
   - Choudhary Kisan Kendra (Ujjain Chimanganj Mandi): `[23.1828, 75.7772]`
   - Nimar Wholesale Hub (Barwaha Highway Depot): `[22.2536, 76.0402]`
   - Nimar Kisan Kendra (Khargone Main Mandi): `[21.8236, 75.6141]`
3. **Route Corridors:** Real highway polylines for NH-52 (Indore–Dewas), SH-27 (Indore–Ujjain), and NH-347BG (Indore–Barwaha–Khargone).
4. **Preservation of Test Contracts:** The automated test `visualizations.spec.ts` relies on `#highwayNetwork`, text `Central India Consignment & Mandi Geographic Map`, text `Malwa-Nimar Corridor`, and the `Facility Ledger` toggle button. All existing DOM ids and text contracts must be preserved.

---

## 5. Full Application Diagnostic (All 6 Role Workspaces)

### A. Global Layout & Framework Components

1. **TopBar & Sidebar Hierarchy:**
   - The TopBar has conflicting visual badges: an offline indicator, a plant context pill (`LOADING OPERATOR WORKSPACE / Plant Dispatch Bay 3`), search `⌘K`, notification bell, theme toggle, and user avatar. The hierarchy lacks clear breadcrumbs and distinction between global system status and local view context.
   - The Sidebar uses an awkward `< Collapse` toggle at the bottom that causes layout jumps. Active nav items are styled with a solid bright orange background (`bg-amber-500 text-slate-950`) that screams "construction zone" rather than calm, high-precision enterprise software.
2. **Light vs. Dark Theme Inconsistency:**
   - In `index.css`, design tokens are defined as CSS variables (`--bfel-bg-base`, `--bfel-bg-surface`), but components mix hardcoded arbitrary colors: some use `dark:bg-slate-900 / dark:border-slate-800` while others use `dark:bg-[#0B1017] / dark:border-[#1B2636]`.
   - In Dark mode, surfaces lack depth layering: cards blend into the base canvas, or stand out with stark 100% white borders.
   - In Light mode, status badges have washed-out backgrounds with poor WCAG AA contrast.
3. **Data Density & Typography:**
   - Standard tables display only 4 to 6 rows per 800px vertical height because of generous padding (`py-4 px-6`). In operational desks (Accounts, Loading Terminal), operators require compact, high-density table views (28px–32px row heights) with sticky headers, monospaced tabular numerals, and quick keyboard navigation.
4. **Drawers and Modals:**
   - Drawers (such as `PaymentVerificationDrawer` and `OrderDetailDrawer`) lack consistent backdrop blurs, keyboard dismissals (`Escape`), sticky action bars, and smooth enter/exit animations.

---

### B. Role-by-Role Operational Workspace Diagnostic

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                         ROLE-BY-ROLE ERP WORKSPACE AUDIT                                                |
+----------------------+-------------------------------------------+------------------------------------------------------+
| Workspace Role       | Primary Operational Responsibility        | Current Visual & Ergonomic Deficiencies              |
+----------------------+-------------------------------------------+------------------------------------------------------+
| 1. Dealer            | 50kg bag ordering, 20T/25T FTL selection, | - Top banner is cluttered with raw phone/ID strings. |
|    Workspace         | advance payment tracking, dispatch status,| - Order timeline uses giant circular step badges.    |
|    (`DL-IND-049`)    | shortage claim submissions with photos.   | - Orders table lacks column sorting and quick-search.|
|                      |                                           | - Delivery tracking map is squeezed at bottom.       |
+----------------------+-------------------------------------------+------------------------------------------------------+
| 2. Distributor       | Managing ₹10,00,000 credit wallet, double-| - Wallet ledger table lacks date filtering & exports.|
|    Hub               | entry ledger reconciliation, sub-dealer   | - Allocation sliders lack numeric inputs and batches.|
|    (`Malwa Agri`)    | stock allocation, credit note claims.     | - Dealer network map is duplicate of central map.    |
+----------------------+-------------------------------------------+------------------------------------------------------+
| 3. Sales Agent       | GPS-stamped dealer visits, booking on-    | - Territory dealer directory uses oversized cards.   |
|    Workspace         | behalf orders in mandis, payment followup,| - Visit check-in modal lacks real visit history trail|
|    (`Indore Terr.`)  | tracking monthly volume targets.          | - No map/split-pane view for route planning.         |
+----------------------+-------------------------------------------+------------------------------------------------------+
| 4. Accounts          | Bank UTR matching against bank statements,| - Verification queue has low row density.            |
|    Verification Desk | 100% advance payment approval/rejection,  | - Receipt image drawer uses inline placeholder SVG.  |
|    (`Sunita Jain`)   | releasing orders to plant loading queue.  | - No side-by-side reconciliation split view.         |
|                      |                                           | - Lacks keyboard shortcuts for batch verification.   |
+----------------------+-------------------------------------------+------------------------------------------------------+
| 5. Plant Loading     | Chassis tare weighing, bag load increment | - Truck visualizer is squeezed into a narrow column. |
|    Terminal          | logging, gross weighing, ±100kg variance  | - Weighbridge inputs look like generic text fields   |
|    (`Manglia Bay 3`) | check, security seal locking, gate pass.  |   rather than high-contrast digital scale readouts.  |
|                      |                                           | - Security seal entry is plain text, no barcode UI.  |
+----------------------+-------------------------------------------+------------------------------------------------------+
| 6. Central Admin     | Plant-wide executive command, "Needs      | - 16 sprawling sub-views crammed in a long sidebar.  |
|    Command Center    | Attention" triage inbox, user onboarding, | - "Needs Attention" is a card list, not triage inbox.|
|    (`Rajeshwar S.`)  | fleet master, audit trail inspection.     | - Audit trail lacks JSON diff viewers and filters.   |
+----------------------+-------------------------------------------+------------------------------------------------------+
```

---

## 6. Engineering Constraints & Architecture

### A. Authoritative Frontend Integration Target
- **Integration Target:** The single authoritative integration target is [`src/`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/).
- **Verification:**
  - Running dev server PID 5668 runs `node ./node_modules/vite/bin/vite.js --port=3000 --host=0.0.0.0`, loading `index.html` and `src/main.tsx`.
  - In `frontend/app/page.tsx`, the Next.js app dynamically imports `../src/App.tsx`.
  - In `frontend/playwright.config.ts`, `baseURL` points to `http://localhost:3000`.
  - Therefore, modifying components in `src/` simultaneously enhances the live Vite application AND the Next.js frontend without duplicate maintenance.

### B. Inviolable Preservation Requirements
The redesign must preserve 100% of the following backend, state, and test structures:
1. **Django Backend & DRF Endpoints:** All Python models, migrations, serializers, and views in `backend/` must remain untouched. All 81 pytest tests in `backend/tests/` must continue to pass.
2. **Business Rules:**
   - Universal packaging unit: 50 kg HDPE bags.
   - Axle limits: Strict 20 MT (400 bags) and 25 MT (500 bags) full-truckload bounds.
   - Financial gate: 100% advance RTGS clearance before loading queue entry.
   - Metrology: Avery Weigh-Tronix ±100 kg legal tolerance check.
   - Dispatch authorization: Security seal number verification and cryptographic QR gate pass generation.
3. **Automated Test Contracts (Playwright):**
   - In `landing_page.spec.ts`: Section IDs `#capacity`, `#workflow`, `#workspaces`, `#metrology`, `#evaluation`. Titles and button labels `20 MT Standard (400 Bags)`, `25 MT Heavy`, `Test Overload Alert`, `100% Full Load`.
   - In `visualizations.spec.ts`: DOM IDs `#truckCab`, `#trailerFrame`, `#highwayNetwork`, text `R1`, `R10`, `0 / 400`, `20.00 / 20 MT`, `Overload Alert`, `Central India Consignment & Mandi Geographic Map`, `Malwa-Nimar Corridor`, `Facility Ledger`.
   - In `design_system.spec.ts`: `About BFEL Flow` info button, `Design System & Metrology` tab, text `SpotlightCard`, `Harvest Gold`, `TruckCapacityVisualizer`, `WeighbridgeCounter`.

---

## 7. Proposed Premium Visual Direction

To transition BFEL FLOW from a prototype to a multi-crore enterprise industrial platform, we establish an authoritative design language: **"Precision Industrial Metallurgy"**.

### A. Design Foundations
1. **Color Palette & Surface Elevation:**
   - **Base & Canvas:** Replace flat `#06080C` black with deep, tinted industrial obsidian (`#080C14` dark / `#F6F8FB` light).
   - **Layered Surfaces:**
     - Level 1 (Base Canvas): `#080C14`
     - Level 2 (Section / Card Background): `#0D131F` (Dark Zinc with 2% cobalt tint)
     - Level 3 (Raised Widgets & Table Rows): `#141C2B`
     - Level 4 (Active / Hover / Popover): `#1A2436`
   - **Structural Hairlines:** Replace harsh solid borders with refined, tinted hairlines: `#1E2B3E` (1px solid) with subtle 8% radial highlight gradients on cards.
   - **Restrained Industrial Accent (Cattle Feed & Agribusiness):**
     - Primary: **Avery Gold / Industrial Amber** (`#F59E0B` in dark / `#D97706` in light) reserved strictly for primary actions, legal limits, and warnings.
     - Secondary: **Metrology Cyan** (`#0284C7` / `#38BDF8`) for scale weights, calibrations, and weighbridge telemetry.
     - Status Positive: **Deep Emerald** (`#059669` / `#10B981`) for verified advance remittances, passing gate releases, and certified weights.
     - Status Danger: **Industrial Crimson** (`#DC2626` / `#F43F5E`) for overloaded axles, weight variance violations, and rejected payments.
2. **Typography System:**
   - **Display / Headings:** *Plus Jakarta Sans* with tight letter tracking (`tracking-tight`), distinct font weights (600, 700, 800), and optical line-height clamping.
   - **Telemetry & Financial Figures:** *JetBrains Mono* with `font-variant-numeric: tabular-nums` for all weights, bag counts, UTR codes, timestamps, and currency values to eliminate layout shifts during live counter updates.
3. **Enterprise Ergonomics:**
   - **High-Density Data Grids:** 36px table row heights in operational desks, monospace cell data, sticky table headers, and zebra-striping.
   - **Authentic Software Framing:** Frame previews in realistic OS / enterprise app wrappers (browser address bars, window control dots, system breadcrumbs, live status feeds).
   - **Elimination of Gimmicks:** Remove distracting cursor-following spotlights and harsh dot-matrix noise; replace with clean, structural gridlines and high-contrast, legible typography.

---

## 8. Specific Component Redesign Specifications

### A. Hero Redesign: "Authoritative Industrial Command Preview"

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                              PROPOSED HERO ARCHITECTURE                                                 |
+-------------------------------------------------------------------------------------------------------------------------+
| [ TopBar: BFEL FLOW | Manglia Plant (M.P.) · Avery Metrology Online | System Time: 08:49:14 IST | Theme | Auth Profile ] |
+-------------------------------------------------------------------------------------------------------------------------+
| [ Left Column (60%): Enterprise Authority ]            | [ Right Column (40%): Live Interactive ERP Viewport ]           |
|                                                        |                                                                 |
| • Overline: ISO 9001:2015 · CENTRAL INDIA LOGISTICS     | +-------------------------------------------------------------+ |
| • Headline: Every Cattle Feed Order.                   | | macOS / Windows Enterprise App Chrome Header (Live Session) | |
|             One Connected Enterprise Flow.             | +-------------------------------------------------------------+ |
| • Subtitle: Unifying rural dealer booking, 100% advance| | [ Stage Tabs: 01 Order | 02 UTR | 03 Bay | 04 Scale | 05 LR ]| |
|   RTGS clearance, rigid 20T/25T axle constraints, and  | +-------------------------------------------------------------+ |
|   calibrated Avery weighbridge dispatches.             | | Live Active Consignment Card:                               | |
|                                                        | | • Order ORD-IND-2026-4412 · Patel Agro Agency               | |
| • Primary Action Group:                                | | • Real-time 20 MT Axle Meter (400 Bags / 20,000 kg)         | |
|   [ Enter Operational Console → ] [ Launch Simulator ] | | • Dual Scale Telemetry: Gross 29,450 kg · Tare 9,420 kg     | |
|                                                        | | • Security Seal: SEAL-IND-8841 · QR Gate Pass Validated     | |
| • Stat Bar:                                            | +-------------------------------------------------------------+ |
|   [ 50 kg Universal Bag ] [ 20T / 25T Axle Locks ]     | | Active Dispatch Telemetry: En-route Dewas via NH-52 (42 km)  | |
|   [ ±100 kg Avery Scale ] [ 100% Advance RTGS Gate ]   | +-------------------------------------------------------------+ |
+-------------------------------------------------------------------------------------------------------------------------+
```

#### Hero Changes:
1. **Fix Stepper Overflow:** Replace the overflowing 5-button text bar with an interactive segmented stepper featuring numeric step pills (`01`, `02`, `03`, `04`, `05`), active labels, and connecting progression lines that flex cleanly without clipping across all screen sizes.
2. **Realistic Software Viewport:** Wrap the right column preview in an authentic dark-mode enterprise window chrome complete with an address bar (`bfel.internal/flow/manglia-bay-01`), live system timestamp, and realistic status indicators.
3. **Consolidate Competing Navigation:**
   - Remove redundant CTAs: The hero presents two clear actions: `Enter Operational Console` (for authorized users) and `Explore Platform Simulator` (for evaluators).
   - Clean up navbar links: Maintain clean jump anchors without competing duplicate pill styles.
4. **Remove Dot Noise:** Eliminate the abrasive yellow dot matrix background; replace with an ultra-subtle 1px industrial coordinate grid overlay at 8% opacity.

---

### B. Truck Visualization Redesign: "Precision Heavy-Haul Axle Cutaway"

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                    PROPOSED TRUCK CAPACITY VISUALIZATION ARCHITECTURE                                   |
+-------------------------------------------------------------------------------------------------------------------------+
| [ Top Header: Consignment Capacity Engine | Chassis: [ 20 MT Standard ] [ 25 MT Heavy ] | Status: FTL 100% LOADED ]     |
+-------------------------------------------------------------------------------------------------------------------------+
| [ Metrics Bar: 400/400 Bags (20.00 MT) | Gross: 29,450 kg | Tare: 9,420 kg | Net Payload: 20,030 kg (±30 kg Calibrated) ]|
+-------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                         |
|        +---------------------------------------------------------------------------+  +-------------------+             |
|        | REAR TANDEM / TRIDEM BOGIE AXLES                FRONT STEER AXLE          |  | CABIN (TATA SIGNA)|             |
|        |                                                                           |  |                   |             |
|   +----+ [R1]  [R2]  [R3]  [R4]  [R5]  [R6]  [R7]  [R8]  [R9]  [R10] (Pallet Rows) |  |   /---------\     |             |
|   | R  | [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  (40 Bags/Row) |  |  /  WINDOW   \    |             |
|   | E  | [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]                |  | |   (CABIN)   |   |             |
|   | A  | [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  Woven HDPE    |  | |             |   |             |
|   | R  | [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  [■■]  Bag Stacks    |  |  \___________/    |             |
|   +----+---------------------------------------------------------------------------+--+-------------------+             |
|          (O) (O)  (Dual Bogie Rear Wheels)                        (O) (Front Wheel)       (Bumper & Grille)             |
|                                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------+
| [ Axle Telemetry: Rear Tandem Load: 14,200 kg (Legal: 18,000 kg) | Front Axle Load: 5,830 kg (Legal: 7,000 kg) ]       |
| [ Presets: [ 0 Bags (Empty) ] [ 50% Load (200 Bags) ] [ 100% FTL (400 Bags) ] [ +20 Bags Overload Alert ] ]            |
+-------------------------------------------------------------------------------------------------------------------------+
```

#### Truck Visualizer Changes:
1. **Remove `maxHeight: '280px'` Constraint:**
   - Update SVG container styles to allow responsive scaling up to full container width (`w-full aspect-[3.2/1] min-h-[300px] max-h-[420px]`).
   - On wide desktop screens, the truck will expand naturally to fill the 1200px container, completely resolving the narrow appearance.
2. **Elevated Industrial CAD Aesthetics:**
   - Replace the flat cartoon truck with an authentic **commercial multi-axle freight profile** (reflecting BharatBenz / Tata Signa 2823R haulers common in MP).
   - Render technical mechanical details: steel chassis beams, leaf springs, air brake reservoirs, side underrun protection rails, fuel tanks, and realistic dual rear wheels with wheel hubs and mudguards.
3. **Authentic Volumetric Cargo Stows:**
   - Instead of a flat green block, render realistic **palletized bag stows**: stacked 50 kg woven HDPE bags with subtle fabric weave lines, pallet bases, and shrink-wrap bounding outlines.
   - Distinct, realistic states:
     - **Empty:** High-detail corrugated stainless trailer bed with tie-down D-rings and row markers.
     - **Partial:** Progressive stack filling from front bulkhead to rear, with dynamic center-of-gravity indicators.
     - **Full (100% FTL):** Perfectly staggered pallet columns in calibrated industrial amber/gold, showing full volume utilization.
     - **Overload:** Highlights specific axle stress zones (red warning indicators over rear bogie), displaying calculated excess axle weight and statutory fine warnings.
4. **Preserve Test Contracts:**
   - Keep `#truckCab`, `#trailerFrame`, text `R1`, `R10`, `0 / 400`, `20.00 / 20 MT`, `25 MT HEAVY`, `500 / 500`, `Overload Alert`, and all interactive preset button labels.

---

### C. Geographic Map Redesign: "Malwa-Nimar Logistics GIS Console"

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                  PROPOSED OPERATIONAL GIS MAP ARCHITECTURE                                              |
+-------------------------------------------------------------------------------------------------------------------------+
| [ Map Header: Central India Consignment & Mandi Geographic Map | Malwa-Nimar Corridor | [ Map View ] [ Facility Ledger ]|
|   Corridor Stats: Manglia Mill: Online · Mandi Depots: 4 Active · En Route: 1 FTL Consignment · Avery Scale ±100kg      |
+-------------------------------------------------------------------------------------------------------------------------+
| [ Layer Filters: [ All Hubs (7) ] [ Factory Plant ] [ Dealers (4) ] [ Distributors ] [ Active Dispatches ] ]            |
| [ Quick Focus: [ Manglia Industrial Area ] [ Dewas Mandi Yard ] [ Sanwer Mandi ] [ Ujjain Mandi ] [ Khargone Depot ] ] |
+-------------------------------------------------------------------------------------------------------------------------+
|                                                                                           +---------------------------+ |
|   (Real-world WGS-84 Project Map Projection)                                             | Selected Facility Drawer: | |
|                                                                                           |                           | |
|     • Ujjain Mandi (Chimanganj) [23.18°N, 75.77°E]                                        | Primary Manufacturing     | |
|         \                                                                                 | Plant                     | |
|          \ SH-27 Highway                                                                  |                           | |
|           \                                                                               | Manglia Industrial Area,  | |
|            • Sanwer Mandi [22.97°N, 75.82°E]      • Dewas Mandi [22.96°N, 76.05°E]        | Indore                    | |
|             \                                    /                                        |                           | |
|              \                                  / NH-52 Highway                           | Status: ACTIVE_DISPATCH   | |
|               \                                /                                          | Avery Scale: Calibrated   | |
|                • BFEL Central Mill (Manglia) -+ [22.81°N, 75.95°E]                        | Weighbridge Bays: 2 Online| |
|                |                                                                          | Active Dispatches: 6 FTL  | |
|                | NH-347BG Highway Corridor                                                |                           | |
|                |                                                                          | Contact: Kailash Verma    | |
|                • Barwaha Regional Depot [22.25°N, 76.04°E]                                | Phone: +91 731 2894100    | |
|                 \                                                                         +---------------------------+ |
|                  \                                                                                                      |
|                   • Khargone Main Depot [21.82°N, 75.61°E]                                                              |
|                                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------+
```

#### Map Redesign Changes:
1. **High-Precision Vector Cartography:**
   - Replace the arbitrary hand-drawn Bezier shape with an accurate GeoJSON projection of Madhya Pradesh districts (Indore, Dewas, Ujjain, Khargone) using Mercator projection math.
   - Anchor facilities to genuine geographic coordinates (Manglia `22.8117, 75.9525`, Dewas `22.9676, 76.0534`, etc.).
   - Draw realistic road network corridors representing National Highways (NH-52, NH-347BG) and State Highways (SH-27).
2. **Elevated Visual Hierarchy:**
   - Dark mode cartography: Deep navy/charcoal landmass (`#0B121E`), muted hairline district boundaries (`#1B2636`), glowing highway arterial paths with subtle flow pulses, and distinct facility pins (Factory gold beacon, Dealer emerald pins, Distributor blue nodes, In-transit trucks with bearing arrows).
3. **Split-Screen Facility Drawer:**
   - When a facility or shipment is selected, a sleek, semi-transparent glass drawer slides in from the right with full operational telemetry, live dispatches, contact actions, and transit progress.
4. **Preserve Test Contracts:**
   - Keep `#highwayNetwork`, text `Central India Consignment & Mandi Geographic Map`, `Malwa-Nimar Corridor`, `Primary Manufacturing Plant`, `Manglia Industrial Area, Indore`, `ACTIVE_DISPATCH`, and the `Facility Ledger` toggle button.

---

### D. Role-by-Role Operational ERP Redesign

#### 1. Dealer Workspace (`DealerDashboard.tsx`)
- **Visual Elevation:**
  - Replace the cluttered top banner with a sleek enterprise account header: Tier-1 badge, verified GSTIN, registered godown location, and credit limit headroom.
  - Redesign the Order Timeline from oversized cartoon bubbles into a precision horizontal telemetry tracker with compact check nodes, active pulse halos, and timestamp milestones.
  - Transform the orders list into a high-density table with status filtering, instant search, and one-click actions (`Track Consignment`, `View Invoice`, `Raise Shortage Claim`).

#### 2. Distributor Hub (`DistributorDashboard.tsx`)
- **Visual Elevation:**
  - Enhance the ₹10,00,000 Credit Wallet with a dual-card executive summary: Available Headroom, Reserved Consignments, and Credit Slabs.
  - Upgrade the `WalletLedgerEntry` table to an authoritative banking-style double-entry statement with debit/credit color indicators, running balance column, and CSV/PDF export buttons.
  - Modernize sub-dealer allocations with inline quota adjustments and instant rebalancing.

#### 3. Sales Agent Workspace (`SalesAgentDashboard.tsx`)
- **Visual Elevation:**
  - Replace the generic dealer cards with a field-optimized roster view: Godown capacity, last visit date, outstanding balance, and quick-action buttons (`Log Visit`, `Book Order`).
  - Upgrade the Dealer Visit Modal with an authentic GPS verification card showing captured coordinates, visit purpose, photo proof, and immediate on-behalf order placement.

#### 4. Accounts Verification Desk (`AccountsDashboard.tsx`)
- **Visual Elevation:**
  - Implement a **Split-Screen Reconciliation Desk**: on the left, the incoming payment queue with high-density tabular rows; on the right, an interactive verification pane displaying the submitted bank UTR, receipt image viewer with pan/zoom, bank statement auto-match confidence score, and one-click `Verify & Release to Bay` action.
  - Add clear keyboard shortcuts (`Enter` to verify, `R` to reject, `Esc` to close).

#### 5. Plant Loading Bay & Weighbridge Terminal (`LoadingOperatorTerminal.tsx`)
- **Visual Elevation:**
  - Redesign the layout into a unified widescreen command console:
    - **Top:** Live consignment details and queue position.
    - **Center (Full Width):** The expanded, full-width `TruckCapacityVisualizer` cutaway elevation showing live bag placement across all 10 bays.
    - **Bottom Grid:** Avery Weigh-Tronix digital indicator simulation: large high-contrast LED-style numeric displays for Tare Weight (kg), Gross Weight (kg), and Net Cargo (kg) with green/red tolerance validation indicators.
    - **Right:** Security Tamper Seal barcode entry and one-click `Issue Gate Pass` action.

#### 6. Central Admin Command Center (`AdminCommandCenter.tsx`)
- **Visual Elevation:**
  - Consolidate the 16 sprawling tabs into an intuitive 4-pillar executive navigation:
    1. **Operations Command** (Overview, Needs Attention Inbox, Order Desk)
    2. **Logistics & Plant** (Weighbridge Bay Terminal, Dispatches, Transit Map, Fleet Master)
    3. **Finance & Claims** (Payment Verification Desk, Claims Desk, Credit Ledgers)
    4. **Governance** (User Approval, Catalog & Schemes, Audit Trail Logs)
  - Redesign the "Needs Attention" tab into an actionable triage inbox: grouped by urgency (e.g. Overweight Trucks, Unverified UTRs > 2h, Pending Shortage Claims) with inline resolution actions.

---

## 9. Reusable Components to Retain & Modernize

The existing component suite contains significant business logic and domain contracts. We must **retain and visually refine** them rather than discarding or rewriting from scratch:

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                          REUSABLE COMPONENT RETENTION PLAN                                              |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| Component Name           | Location                                     | Modernization Strategy                        |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| `TruckCapacityVisualizer`| `src/design-system/TruckCapacityVisualizer`  | Remove height clamp, upgrade to CAD 2.5D      |
|                          |                                              | styling, retain all IDs & test assertions.    |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| `OperationalMap`         | `src/design-system/OperationalMap`           | Upgrade to GeoJSON vector cartography,        |
|                          |                                              | retain `#highwayNetwork` and test markers.    |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| `WeighbridgeCounter`     | `src/design-system/WeighbridgeCounter`       | Retain dual-scale logic, elevate to Avery     |
|                          |                                              | industrial LED indicator styling.             |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| `OrderTimeline`          | `src/components/common/OrderTimeline`        | Upgrade from cartoon bubbles to precision     |
|                          |                                              | telemetry tracker with timestamps.            |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| `StatusBadge`            | `src/components/common/StatusBadge`          | Harmonize status tokens with WCAG AA          |
|                          |                                              | contrast, subtle glow borders, and dot halos. |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| `MetricCard`             | `src/components/common/MetricCard`           | Elevate to subtle metallic gradients,         |
|                          |                                              | tabular numbers, and trend indicators.        |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| `GatePassModal`          | `src/components/documents/GatePassModal`     | Retain QR code and seal logic, elevate        |
|                          |                                              | printable industrial consignment typography.  |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| `LRChallanModal`         | `src/components/documents/LRChallanModal`    | Retain statutory disclosures, polish format.  |
+--------------------------+----------------------------------------------+-----------------------------------------------+
| `WhatsAppAlertModal`     | `src/components/documents/WhatsAppAlertModal`| Retain dispatch copy logic, polish preview.   |
+--------------------------+----------------------------------------------+-----------------------------------------------+
```

---

## 10. Performance, Accessibility, and Risk Analysis

### A. Performance Risks & Mitigations
- **SVG Complexity & Animation CPU Load:** The animated highway paths currently use CSS keyframes (`highwayFlowPulse`). On low-powered mobile devices, excessive running SVG animations can cause CPU throttling.
  - *Mitigation:* Use hardware-accelerated `transform` and `opacity` properties; enforce `will-change: transform`; respect `prefers-reduced-motion` to disable animations automatically for users with motion sensitivity.
- **Client-Side Re-Renders:** State changes in `AppContext` (such as live bag increment counter in the loading terminal) should not trigger full-page re-renders.
  - *Mitigation:* Memoize heavy visualizer SVGs with `React.memo` and isolate counter state.

### B. Accessibility & Contrast Compliance (WCAG 2.1 AA)
- **Contrast Ratios:**
  - Current yellow text (`text-amber-500` on white) fails WCAG AA with a contrast ratio of only 2.1:1.
  - *Mitigation:* Enforce strict theme-calibrated tokens: `#D97706` (Amber-700) on light surfaces (4.8:1 ratio) and `#F59E0B` (Amber-400) on dark obsidian surfaces (9.2:1 ratio).
- **Keyboard Navigation:** Ensure all interactive elements, modal drawers, and tab triggers possess visible focus rings (`focus-visible:ring-2 focus-visible:ring-amber-500`) and appropriate ARIA roles (`role="progressbar"`, `role="tablist"`).

---

## 11. Prioritized Implementation Sequence

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                          PRIORITIZED IMPLEMENTATION ROADMAP                                             |
+-------+-----------------------------+----------------------------------------------------------------+------------------+
| Phase | Focus Area                  | Key Deliverables                                               | Risk / Testing   |
+-------+-----------------------------+----------------------------------------------------------------+------------------+
| L2.1  | Design System Foundations   | - Standardize `index.css` tokens (surfaces, hairlines, text).  | Zero regression  |
|       | & Global Typography         | - Configure Plus Jakarta Sans & JetBrains Mono font metrics.   | `theme.spec.ts`  |
|       |                             | - Refine `StatusBadge`, `MetricCard`, and layout wrappers.     |                  |
+-------+-----------------------------+----------------------------------------------------------------+------------------+
| L2.2  | Public Landing Page &       | - Rebuild Hero: eliminate clipping, frame in real app chrome.  | Pass 100%        |
|       | Navigation Architecture     | - Remove yellow dot noise; refine navbar hierarchy.            | `landing_page`   |
|       |                             | - Elevate Metrology section & Evaluation Launchpad styling.    | `.spec.ts`       |
+-------+-----------------------------+----------------------------------------------------------------+------------------+
| L2.3  | Truck Capacity Visualizer   | - Remove `maxHeight: 280px` clamp; expand to full width.       | Pass 100%        |
|       | Modernization               | - Upgrade to CAD 2.5D commercial multi-axle freight profile.   | `visualizations` |
|       |                             | - Implement authentic woven HDPE pallet stows & axle telemetry.| `.spec.ts`       |
+-------+-----------------------------+----------------------------------------------------------------+------------------+
| L2.4  | Geographic Logistics Map    | - Upgrade SVG canvas to calibrated GeoJSON Malwa projection.   | Pass 100%        |
|       | Modernization               | - Bind facilities to true WGS-84 coordinates.                  | `visualizations` |
|       |                             | - Elevate slide-over facility drawer & Highway corridor styling| `.spec.ts`       |
+-------+-----------------------------+----------------------------------------------------------------+------------------+
| L3.1  | Commercial Workspaces       | - Redesign Dealer Dashboard: order wizard, live telemetry table| Pass 100%        |
|       | (Dealer, Sales, Distributor)| - Redesign Distributor Hub: banking-style double-entry ledger. | `operational_`   |
|       |                             | - Redesign Sales Agent: field roster & GPS visit tracking.     | `journey.spec.ts`|
+-------+-----------------------------+----------------------------------------------------------------+------------------+
| L3.2  | Operational Plant Desks     | - Redesign Loading Terminal: widescreen visualizer + Avery scale| Pass 100%        |
|       | (Loading Bay, Accounts,     | - Redesign Accounts Desk: split-screen bank UTR reconciliation.| `operational_`   |
|       | Admin Command Center)       | - Redesign Admin Command: 4-pillar navigation & triage inbox.  | `journey.spec.ts`|
+-------+-----------------------------+----------------------------------------------------------------+------------------+
| L4.0  | Final Verification & Polish | - Execute complete Playwright E2E suite across all viewports.  | 6/6 Playwright   |
|       |                             | - Verify zero horizontal overflow on 375px mobile.             | 81/81 Pytest     |
|       |                             | - Capture comprehensive before/after screenshot artifacts.     | Zero regressions |
+-------+-----------------------------+----------------------------------------------------------------+------------------+
```

---

## 12. Measurable Acceptance Criteria

To ensure the visual redesign delivers enterprise excellence, the finished implementation must satisfy all criteria below:

1. **Zero Test Regressions:**
   - 100% of Playwright E2E tests in `frontend/tests/` pass with zero failures.
   - 100% of Django backend pytest tests (81/81) pass without modifications.
2. **Hero Viewport Perfection:**
   - Zero clipped or truncated workflow indicators across desktop (1440px), laptop (1024px), tablet (768px), and mobile (375px).
   - Complete elimination of competing duplicate navigation links in the initial viewport.
   - Product preview embedded in an authentic, high-fidelity enterprise software frame.
3. **Truck Visualizer Proportions:**
   - Visualizer expands naturally to fill the container width up to 1280px without artificial height clamping or dead space.
   - Truck illustration displays authentic commercial freight chassis proportions with technical mechanical depth.
   - Cargo compartment displays realistic palletized bag stacks with distinct Empty, Partial, 100% FTL, and Overload states.
4. **Geographic Map Elevation:**
   - True WGS-84 coordinate mapping for all 6 facilities.
   - Cohesive dark cartography with realistic highway corridors and slide-over facility inspection drawer.
   - Facility Ledger table toggle functional and responsive.
5. **Ergonomic Data Density:**
   - Operational tables display at least 10–12 rows above the fold on desktop with sticky headers and monospaced financial/weight figures.
   - Loading Terminal displays a high-contrast Avery Weigh-Tronix digital indicator scale readout with instant variance feedback.
6. **Mobile Ergonomics:**
   - Zero horizontal overflow (`scrollWidth <= clientWidth`) at 375px across all landing sections and authenticated workspaces.

---

**STOP: Layer 1 Diagnostic Complete. Awaiting user approval before proceeding to Layer 2 execution.**
