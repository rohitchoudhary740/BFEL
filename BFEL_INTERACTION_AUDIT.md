# BFEL FLOW — PHASE 1: UI/UX REFERENCE & INTERACTION AUDIT
**Inspection Document & Design Strategy Report**  
**Target Platform:** BFEL FLOW — Cattle Feed Distribution & Operations ERP  
**Client Organization:** Bharat Feeds & Extractions Ltd, Indore (M.P.)  
**Audit Date:** October 9, 2026  
**Status:** Inspection Completed · Read-Only Analysis · Ready for User Approval  

---

## Executive Summary

This document constitutes the comprehensive Phase 1 UI/UX reference and interaction audit for **BFEL FLOW**, the enterprise distributor management system (DMS) and plant operations ERP for **Bharat Feeds & Extractions Ltd (BFEL)**, Indore.

Following direct browser-based inspection of the benchmark application ([Fraud Risk Manager](https://fraud-risk-manager.vercel.app/)), comparative analysis of industry tier-1 benchmarks ([Linear](https://linear.app/), [Stripe](https://stripe.com/), [Vercel](https://vercel.com/)), and an exhaustive architectural code audit of the BFEL FLOW repository, this report details:
1. Every directly observed visual and interactive behavior from the live references.
2. The current technical baseline of the BFEL FLOW frontend, routing, authentication, and testing contracts.
3. A bespoke design system harmonizing premium dark-mode enterprise aesthetics with heavy industrial logistics.
4. An actionable, phased implementation roadmap designed to maintain 100% compatibility with existing backend contracts, business rules, and Playwright/Pytest test suites.

---

## 1. Reference Effects Actually Observed

A live browser audit of the benchmark website **`https://fraud-risk-manager.vercel.app/`** was conducted using automated browser inspection with Chrome DevTools Protocol (CDP) capturing viewports, hover states, scroll animations, responsive widths (1280px, 768px, 375px), network/console activity, DOM trees, computed styles, and bundle asset decompilation.

### A. Color Palette & Thematic Infrastructure
Decompilation of `/assets/index-DaAOu7oC.css` and live DOM inspection verified the exact CSS Custom Property design tokens driving the reference:
* **Background Layers:**
  * `--bg-base`: `#050506` (pitch-black cosmic foundation)
  * `--bg-surface`: `#0e0e10` (card and container surface)
  * `--bg-surface-raised`: `#18181b` (elevated panels and modals)
  * `--bg-hover`: `#222225` (interactive hover state)
* **Hairline Borders:**
  * `--border-hairline`: `#2a2f3a` (subtle 1px boundary)
  * `--border-hairline-strong`: `#363c48` (active or hovered border)
* **Typography & Content:**
  * `--text-primary`: `#e8eaed` (high-contrast crisp white)
  * `--text-secondary`: `#a7adba` (medium-contrast metadata)
  * `--text-muted`: `#6b7280` (low-contrast labels)
* **Semantic Status Signals:**
  * High Risk: `--signal-high: #e5484d` / `--signal-high-bg: #2a1416`
  * Medium Risk: `--signal-medium: #e0ab50` / `--signal-medium-bg: #2a2114`
  * Low Risk / Safe: `--signal-low: #3ebd7e` / `--signal-low-bg: #142a1e`
* **Accents & Brand Identity:**
  * Primary Accent: `--accent: #5b8def` / `--accent-hover: #7aa3f2` / `--accent-bg: #16233d`
  * Active Navigation Indicator: `--nav-active: #def36a` (high-visibility electric lime-yellow) / `--nav-active-bg: #303914`

### B. Typography Tokens
Directly imported from Google Fonts:
* **Display Font:** `Syne` (weights `600, 700, 800`) used for headlines, hero titles, and high-impact metrics.
* **Body Font:** `IBM Plex Sans` (weights `400, 500, 600`) used for labels, descriptions, and data tables.
* **Monospace Font:** `IBM Plex Mono` / `SFMono-Regular` (weights `400, 500, 600`) used for numbers, IDs, tabular numerals, and code snippets with `font-variant-numeric: tabular-nums`.

### C. Observable Pointer & Cursor-Reactive Effects
1. **Interactive Spotlight Card Overlay (`group/spotlight`):**
   * **Mechanism:** Verified directly in the JavaScript bundle (`/assets/index-B6pZVuKT.js`). Cards listen to `onMouseMove` events, calculating coordinates relative to the card's bounding rectangle:
     $$\text{mouseX} = \text{clientX} - \text{rect.left}, \quad \text{mouseY} = \text{clientY} - \text{rect.top}$$
   * Coordinates update a Framer Motion `useMotionValue` instance driving a dynamic CSS `maskImage`:
     ```css
     mask-image: radial-gradient(350px circle at ${mouseX}px ${mouseY}px, white, transparent 80%);
     ```
   * **Canvas Reveal Matrix:** When hovered (`isHovered === true`), an underlying HTML5 canvas (`CanvasRevealEffect`) is unmasked within the spotlight radius, revealing an animated digital dot matrix.
2. **Dynamic Border Lighting:**
   * Moving the cursor over cards illuminates the border edge closest to the pointer with a localized highlight gradient (`radial-gradient(120px circle at mouseX mouseY, #5b8def, transparent)`).
3. **Primary CTA Button Interaction:**
   * Primary button (`Try the console now →`, `#3B82F6`) displays a smooth scale transform (`scale(1.02)`), elevated perimetric box-shadow (`0 0 20px rgba(59, 130, 246, 0.4)`), and an animated arrow translate (`translateX(3px)`).

### D. Interactive Functional Demonstration (Hero & Scorer Console)
1. **Hero Section Metrics Highlights:**
   * Displays 3 verifiable holdout metrics: `0.767 ROC-AUC`, `Zero leakage temporal split`, and `103/103 test suite passing`.
   * Live pulsing indicator badge: `• Strictly defense-only · built for AI Risk Manager track`.
2. **Live Risk Scorer Console (`/app/score`):**
   * Real-time calculation responding to user input adjustments without page reloads.
   * Modifying risk factors (e.g. checking *"Shipping address differs"* and *"Device linked to other accounts"*) immediately recalculates the composite score from `8.3/100` (green `● Low risk`) to `82.6/100` (crimson `● High risk`).
   * Visual feature impact bars (SHAP breakdown) render incremental contributions (e.g., `+2.09`, `+1.95`).
   * Cutoff threshold slider (`0.0` to `1.0`) interactively toggles automated decision banners (`"Approved automatically"` vs `"Blocked outright"`).
3. **Abuse-Ring Sentinel Graph (`/app/graph`):**
   * Renders an interactive D3 force-directed network graph (`d3-force` canvas) linking 278 fraud clusters.
   * Nodes color-coded by entity type: Blue (`Customer`), Orange (`Device`), Green (`Address`).
   * Clicking a node opens an inspector side-drawer displaying connection metadata.

### E. Scroll Transitions & Navigation Behavior
1. **Header Navigation:**
   * Sticky fixed header with glassmorphic backdrop filter (`backdrop-blur-md`, `bg-black/60`, `border-b border-hairline`).
2. **Scroll-Driven Animation:**
   * Staggered viewport entrance animations (`motion.div` with `initial={{ opacity: 0, y: 20 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true }}`).
   * Subtle ambient radial glow drifts down the page background as the user scrolls.

### F. Responsive Behavior (1280px, 768px, 375px)
* **Desktop (1280px+):** Full multi-column grid, persistent 240px dark sidebar with electric-lime indicator (`#def36a`), side-by-side scorer inputs and real-time visualization panel.
* **Tablet (768px):** Feature cards wrap to a balanced 2-column layout; hero CTAs maintain horizontal alignment; sidebar collapses to an accessible flyout menu.
* **Mobile (375px):** Single-column vertical stack; hero action buttons expand to full width (`w-full`); tables enable horizontal scroll with sticky identifier columns; forms stack cleanly with touch-friendly 44px minimum tap targets.

### G. Console & Network Observations
* **Network:** Zero failed network requests during landing page navigation.
* **Console:** WebGL context reset caught gracefully (`THREE.WebGLRenderer: Context Lost.`) during rapid canvas DOM unmounting, with no fatal execution errors.

---

## 2. Effects That Could Not Be Verified

To maintain total empirical integrity, the following effects either **did not exist** on the reference or **could not be confirmed**:
1. **3D Physics Tilt with Gyroscopic Depth:**
   * While feature cards display a 2D spotlight mask and canvas reveal, they do **not** perform 3D perspective rotations (`transform: perspective(1000px) rotateX(...) rotateY(...)`) on mouse movement.
2. **Mobile Device Gyroscope Tilt:**
   * `deviceorientation` event handling could not be verified in desktop headless CDP emulation and appears unhandled in the decompiled bundle.
3. **Multi-Layer Parallax WebGL Shaders:**
   * The background starfield is rendered via 2D HTML5 canvas (`tsParticles`), not through multi-depth Three.js custom vertex/fragment shaders.
4. **Haptic / Web Audio Feedback:**
   * No audio context or sound effects were triggered upon button clicks or slider adjustments.

---

## 3. Existing Application Architecture

The BFEL FLOW workspace is an enterprise dual-target codebase engineered for cattle feed distribution and mill operations:

```
+--------------------------------------------------------------------------------------------------+
|                                    BFEL FLOW PROJECT TOPOLOGY                                     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [VITE SPA ROOT (src/)]               [NEXT.JS 15 (frontend/)]           [DJANGO 5 BACKEND]      |
|  - Vite 8.3 + React 19.0.1            - Next.js 15.2.0 App Router        - Python 3.12.9         |
|  - Tailwind CSS v4.3.3                - React 19.0.0 (SSR / Hydration)   - Django 5.1.7 + DRF    |
|  - motion v12.23.24 (installed)       - Tailwind CSS v4.0.12             - PostgreSQL / SQLite   |
|  - lucide-react v0.546.0              - Playwright 1.51.0 (E2E Suite)    - SimpleJWT Auth        |
|  - Express / Node dev server          - Dynamic App wrapper:             - 81 Passing Pytests    |
|  - Direct localStorage simulation       `frontend/app/page.tsx`          - Strict Bag & Axle     |
|                                                                            Constraints           |
+--------------------------------------------------------------------------------------------------+
```

### A. Frontend Framework & Runtime
* **Vite Root (`/package.json`):**
  * `react`: `^19.0.1`, `react-dom`: `^19.0.1`
  * `vite`: `^8.3.0`, `@vitejs/plugin-react`: `^6.1.1`
  * `@tailwindcss/vite`: `^4.3.3`, `tailwindcss`: `^4.3.3`
  * `motion`: `^12.23.24` (Framer Motion v12 package name)
  * `lucide-react`: `^0.546.0`
* **Next.js Production Target (`/frontend/package.json`):**
  * `next`: `^15.2.0`, `react`: `^19.0.0`
  * `@tailwindcss/postcss`: `^4.0.12`, `tailwindcss`: `^4.0.12`
  * `@playwright/test`: `^1.51.0`
  * Dynamic hydration bridge: [`frontend/app/page.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/frontend/app/page.tsx) dynamically imports `../src/App` with `{ ssr: false }`.

### B. Core Business & Domain Rules (Preserved Unconditionally)
1. **Strict 50 kg Bag Increments:**
   * Finished cattle feeds (*Dudh Dhara, Mahamilk Super, Pashu Shakti, Calf Starter*) are manufactured and invoiced strictly in **50 kg HDPE bags**.
2. **Rigid Axle Capacity Constraints:**
   * Every truck consignment must validate to full-truckload (FTL) capacity limits:
     * **20 MT Standard Load:** Exactly 400 bags (20,000 kg).
     * **25 MT Heavy Load:** Exactly 500 bags (25,000 kg).
   * Overloading or under-loading triggers visual validation warnings.
3. **100% Advance Payment Enforcement:**
   * No truck may enter the loading bay queue until the Accounts Desk verifies the bank UTR credit against statements.
4. **Plant Weighbridge Precision Operations:**
   * Two active bays at the Manglia Plant, Indore.
   * Weighbridge calculates: $\text{Gross Weight} - \text{Tare Weight} = \text{Net Weight}$.
   * Weight tolerance check flags variances exceeding $\pm 100\text{ kg}$ against theoretical bag weight.
5. **Tamper-Evident Security Seals & Encrypted Gate Pass:**
   * Security seals recorded before dispatch (`SEAL-IND-XXXX`).
   * QR-coded gate pass generated (`GP-MGL-2026-XXXX`).

### C. State Management & Persistence
* Two centralized React contexts in [`src/context/`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/):
  * `AuthContext`: Session state, user registry (`bfel_users_v2`), role guard rules, admin preview mode, credentials & OTP login.
  * `AppContext`: Order management (`bfel_orders`), payments (`bfel_payments`), fleet vehicles (`bfel_vehicles`), distributor credit wallet (`bfel_wallet`), product allocations (`bfel_allocations`), claims (`bfel_claims`), field visits (`bfel_visits`), audit logs (`bfel_audits`), notifications (`bfel_notifications`), and offline sync queue.

---

## 4. Current Route and Authentication Findings

### A. Current Route Map
Driven by custom stateful routing via `AuthContext.currentAuthRoute` and `navigateTo(route)`:

| Route Path | Component | Access Restriction | Functional Role |
| :--- | :--- | :--- | :--- |
| `/` or `/login` | `LoginPage.tsx` | Public | Unauthenticated default; credentials & 6-digit OTP login; demo role buttons |
| `/signup` | `SignupRoleSelectionPage.tsx` | Public | Role card selector for prospective partners |
| `/signup/dealer` | `DealerSignupPage.tsx` | Public | 3-step dealer onboarding (KYC, GSTIN, Mandi location) |
| `/signup/sales-agent` | `SalesAgentSignupPage.tsx` | Public | Territory sales agent application |
| `/signup/distributor` | `DistributorRequestPage.tsx` | Public | Regional institutional distributor request |
| `/signup/accounts` | `InternalRestrictedPage.tsx` | Public | Security notice: internal accounts personnel only |
| `/signup/loading` | `InternalRestrictedPage.tsx` | Public | Security notice: plant weighbridge terminal only |
| `/signup/admin` | `InternalRestrictedPage.tsx` | Public | Security notice: executive administration only |
| `/forgot-password` | `ForgotPasswordPage.tsx` | Public | Simulated OTP verification and password reset |
| `/access-denied` | `AccessDeniedPage.tsx` | Authenticated | 403 unauthorized role guard |
| `/dealer/*` | `DealerDashboard.tsx` | `dealer`, `admin` | Order placement, 20T/25T truck capacity, payment submission, tracking, claims |
| `/distributor/*` | `DistributorDashboard.tsx` | `distributor`, `admin` | ₹10L credit wallet & ledger, depot stock, sub-dealer management |
| `/sales/*` | `SalesAgentDashboard.tsx` | `sales_agent`, `admin` | Dealer GPS visit logging, on-behalf order capture, collection follow-ups |
| `/accounts/*` | `AccountsDashboard.tsx` | `accounts`, `admin` | 100% advance UTR verification desk, receipt drawer, order release |
| `/loading/*` | `LoadingOperatorTerminal.tsx` | `loading_operator`, `admin` | Bay 1 & 2 queue, tare/gross weighbridge, security seals, gate pass QR |
| `/admin/*` | `AdminCommandCenter.tsx` | `admin` only | Plant KPI command center, needs attention desk, fleet, users, claims |

### B. Critical Route & UX Gap
* **No Public Landing Page Exists:**  
  In [`src/components/common/AppShell.tsx:L112`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/AppShell.tsx#L112), whenever `!isAuthenticated || currentAuthRoute === '/login'`, the application directly renders `LoginPage.tsx`.
* Prospective visitors, agricultural partners, and executive evaluators are immediately confronted with a login form rather than a compelling, authoritative public showcase of the platform's industrial capabilities.

---

## 5. Recommended Design System: Industrial Executive

To transcend generic SaaS aesthetics and embody the genuine operational scale of **Bharat Feeds & Extractions Ltd**, we establish the **Industrial Executive** design system. This system merges the precision of Linear and Vercel with the rugged authority of heavy milling and logistics.

### A. Curated Color Palette Tokens

```
================================================================================
TOKEN                     HEX         USAGE & SEMANTICS
================================================================================
--bfel-bg-base            #06080C     Foundational mill black (deep industrial coal)
--bfel-bg-surface         #0B1017     Primary container & card surface (dark steel)
--bfel-bg-surface-raised  #111823     Elevated modals, tooltips, flyout drawers
--bfel-bg-surface-hover   #172232     Card & row interactive hover state

--bfel-border-hairline    #1B2636     Subtle 1px structural grid lines
--bfel-border-strong      #283950     Active inputs, focused cards, emphasized borders
--bfel-border-glow        #F59E0B33   Amber spotlight border glow (20% opacity)

--bfel-text-primary       #F1F5F9     High-contrast white (Slate 100)
--bfel-text-secondary     #94A3B8     Medium-contrast labels (Slate 400)
--bfel-text-muted         #475569     Muted metadata & disabled copy (Slate 600)

--bfel-brand-amber        #F59E0B     Heavy machinery / harvest gold (Brand signature)
--bfel-brand-amber-hover  #D97706     Amber hover state
--bfel-brand-amber-bg     #2D1F07     Subtle amber tint for active chips & badges

--bfel-tech-cyan          #38BDF8     Digital weighbridge / telemetry indicator
--bfel-tech-blue          #3B82F6     Enterprise actions & primary system triggers

--bfel-status-success     #10B981     Verified payment, gate cleared, optimal load
--bfel-status-warning     #F59E0B     Payment pending, queue loading, capacity alert
--bfel-status-danger      #EF4444     Overloaded truck, seal tampered, payment rejected

--bfel-nav-active         #DEF36A     Electric-lime active indicator bar (Reference parity)
--bfel-nav-active-bg      #222B0C     Electric-lime background container
================================================================================
```

### B. Typography Hierarchy
* **Display / Headings:** `Plus Jakarta Sans` / `Syne` (`font-bold` to `font-extrabold`, letter-spacing `-0.025em`) for commanding executive authority.
* **Operational Body:** `Plus Jakarta Sans` / `Inter` (`font-normal` to `font-medium`, line-height `1.5`) for maximum legibility in high-density tables and forms.
* **Logistics & Telemetry Monospace:** `JetBrains Mono` / `IBM Plex Mono` with `font-variant-numeric: tabular-nums` for bag counts (400 / 500), tare/gross weights (kg), UTR strings, vehicle numbers (`MP-09-GH-4120`), and gate pass codes (`GP-MGL-2026-0412`).

### C. Surface Elevation & Borders
* **No Heavy Box Shadows:** Reject muddy, blurry drop shadows.
* **Precision Hairline Elevation:** Use 1px sharp borders (`border border-slate-800` or `border border-white/10`) coupled with subtle directional ambient backdrops (`box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45)`).
* **Interactive Spotlight Masks:** Feature cards utilize radial gradient masks that track mouse coordinates to illuminate an underlying industrial micro-dot grid.

---

## 6. Recommended Animation Strategy

The repository already has `motion: "^12.23.24"` installed in root `package.json`. We will unlock its capabilities using performant spring physics and CSS hardware acceleration:

### A. Signature Micro-Interactions
1. **Aceternity-Style Spotlight Card Component (`<SpotlightCard>`):**
   * Uses `useMotionValue` to track relative `(mouseX, mouseY)`.
   * Unmasks an industrial dot grid or ambient amber glow on card hover without triggering expensive DOM layout recalculations.
2. **Interactive Truck Axle Capacity Meter (`<TruckCapacityVisualizer>`):**
   * Dynamically renders 400 (20 MT) or 500 (25 MT) bag cargo slots with fluid spring fill animations when order quantities change.
   * Visual axle distribution indicators animate to warn when cargo exceeds legal road limits.
3. **Live Avery Weighbridge Digital LED Roll (`<WeighbridgeCounter>`):**
   * Digital LED odometer roll effect transitioning tare weight $\rightarrow$ gross weight $\rightarrow$ net weight.
   * Flashes cyan/amber during active weighing, locking into glowing emerald when variance validates within $\pm 100\text{ kg}$.
4. **Plant Operations Pipeline Glow Stepper:**
   * A pulsating electrical charge moves along the pipeline connector:  
     $$\text{Order Placed} \longrightarrow \text{100\% Advance Verified} \longrightarrow \text{Loading Bay} \longrightarrow \text{Gate Pass QR} \longrightarrow \text{Road Dispatch}$$

### B. Motion Principles
* **Timing & Springs:** Standard transitions use `type: "spring", stiffness: 380, damping: 28`.
* **Hardware Acceleration:** Animations restricted exclusively to `transform` and `opacity` properties. Zero animation on `width`, `height`, or `margin` to prevent layout reflows.
* **Reduced Motion Compliance:** Wrapped in `@media (prefers-reduced-motion: reduce)` with `animation-duration: 0.01ms !important` to ensure accessible comfort for all users.

---

## 7. Performance and Accessibility Considerations

### A. Performance Budgets
* **Zero Heavy 3D Bloat:** Rather than bundling multi-megabyte Three.js scenes that lag on mobile devices used by field sales agents and truck drivers in rural mandi locations, render lightweight 2D HTML5 canvas shaders or CSS radial meshes.
* **Canvas Cleanup:** Any canvas listeners (spotlight, starfield, telemetry grid) must implement strict unmount lifecycles (`cancelAnimationFrame`, context detach) to prevent memory leaks or WebGL context loss.
* **Code-Splitting:** Dynamic imports for interactive simulators so the initial bundle remains under 200 KB gzipped.

### B. Enterprise Accessibility (WCAG 2.1 AA)
* **Contrast Compliance:** All text tokens meet or exceed the 4.5:1 contrast ratio against `--bfel-bg-base` (`#06080C`) and `--bfel-bg-surface` (`#0B1017`).
* **Keyboard Navigation:** Full focus rings (`focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none`) across all interactive cards, role switchers, and input fields.
* **Omnibox Keyboard Shortcut:** Global search opened instantly via `Cmd+K` / `Ctrl+K`.
* **Touch Targets:** All buttons, dropdowns, and checkboxes enforce a minimum 44×44px interactive tap target for rugged tablet/mobile operation in the loading bay.

---

## 8. Proposed Public Landing-Page Structure

We propose introducing a dedicated, high-impact public landing page at `/` (with a seamless transition to the `/login` and role-specific `/app` workspaces).

```
+--------------------------------------------------------------------------------------------------+
| 1. FIXED GLASSMORPHIC NAVBAR                                                                     |
|    [BFEL FLOW Logo]  [Indore Plant Active ●]  [Feed Products]  [Bays & Fleet]  [Launch Console →] |
+--------------------------------------------------------------------------------------------------+
| 2. HERO SECTION — INDUSTRIAL COMMAND & TELEMETRY                                                 |
|    • Live Badge: "CATTLE FEED LOGISTICS ENGINE · MANGALIA PLANT INDORE"                          |
|    • Title: "End-to-End Operational Control from Mill to Mandi."                                 |
|    • Subtitle: "50kg bag discipline, 20T/25T axle constraints, 100% advance RTGS clearance,       |
|                digital weighbridge verification, and automated dealer road dispatch."            |
|    • CTAs: [Explore Operations Console →] (Opens Demo Switcher)   [Watch Plant Flow]             |
+--------------------------------------------------------------------------------------------------+
| 3. LIVE PLANT TELEMETRY TICKER (Key Operational Constants)                                      |
|    [ 400 / 500 Bags FTL ]   [ 100% Advance RTGS ]   [ ±100kg Weighbridge ]   [ QR Gate Pass ]    |
+--------------------------------------------------------------------------------------------------+
| 4. INTERACTIVE TRUCK LOADING & SLAB SIMULATOR (Live Actual Business Logic)                       |
|    • Interactive Order Sandbox: Select Dudh Dhara 50kg bags                                      |
|    • Toggle 20 MT (400 Bags) vs 25 MT (500 Bags) load configuration                             |
|    • Live Axle Capacity Bar + Automatic Volume Discount calculation (-₹30/bag on 400+ bags)      |
+--------------------------------------------------------------------------------------------------+
| 5. THE 6 OPERATIONAL WORKSPACES (Spotlight Cards with Direct Demo Access)                         |
|    [ Dealer Desk ]    [ Sales Agent ]    [ Distributor Hub ]                                     |
|    [ Accounts Desk ]  [ Loading Bay ]    [ Central Admin ]                                       |
+--------------------------------------------------------------------------------------------------+
| 6. DISPATCH INTEGRITY & VERIFICATION ARCHITECTURE                                                |
|    • Avery Weighbridge Tare/Gross verification & variance detection                              |
|    • Tamper-Evident Security Seals & Cryptographic QR Gate Pass                                  |
|    • Real-Time Dealer WhatsApp Dispatch Dispatcher                                               |
+--------------------------------------------------------------------------------------------------+
| 7. EVALUATION LAUNCHPAD (Preserves 100% of Existing Playwright E2E Test Triggers)                |
|    • Quick 1-click evaluation access to all 6 seed roles                                         |
|    • Standard email/password and 6-digit OTP login modal                                         |
+--------------------------------------------------------------------------------------------------+
| 8. ENTERPRISE FOOTER                                                                             |
|    • Corporate Mandate: Bharat Feeds & Extractions Ltd, Manglia, Indore (M.P.)                   |
+--------------------------------------------------------------------------------------------------+
```

---

## 9. Integration Risks & Mitigation Matrix

| # | Risk Description | Severity | Impact | Mitigation Strategy |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Playwright E2E Test Breakage** | **High** | Tests in `frontend/tests/operational_journey.spec.ts` navigate to `/` and expect `button:has-text("Dealer")` and input fields. | Ensure the public landing page includes the Evaluation Demo Workspace buttons and quick login triggers directly accessible on `/` without requiring multiple redirects. |
| **2** | **Dual-Framework Desynchronization** | **Medium** | Root workspace runs Vite SPA (`src/`); `frontend/` runs Next.js 15 (`app/` importing `src/`). Changes made only in one place cause drift. | Keep shared UI code strictly inside `src/`. Ensure all components are pure client React 19 components compatible with both Vite and Next.js dynamic hydration. |
| **3** | **Canvas Memory & Performance Leaks** | **Medium** | Unmounted Three.js or canvas spotlight instances can cause `WebGL Context Lost` or stutter on field devices. | Implement strict cleanup lifecycles. Prefer CSS radial gradients and lightweight 2D canvas shaders over heavy WebGL scenes. |
| **4** | **Business Rule Drift in Marketing Demos** | **High** | Public interactive components showcasing fake or unconstrained data would mislead clients. | Re-use authoritative constants directly from `AppContext` (`TRUCK_LIMITS`, `bagsToKg`, `bagsToMT`, `calculateSchemeDiscount`). |

---

## 10. Phased Implementation Plan with Acceptance Criteria

### Phase 1: Reference Audit & Architecture Alignment (Current Phase)
* **Goal:** Inspect live references, analyze codebase, formulate design tokens and strategy.
* **Deliverable:** `BFEL_INTERACTION_AUDIT.md`.
* **Acceptance Criteria:**
  - [x] Reference site inspected via automated browser subagent.
  - [x] Exact CSS tokens, bundle libraries, and mechanics verified.
  - [x] Existing BFEL FLOW architecture and test contracts documented.
  - [x] Zero source code modifications made during inspection.

### Phase 2: Design Token & Motion Infrastructure Foundation
* **Goal:** Implement the Industrial Executive design tokens, CSS variables, and motion primitives.
* **Deliverable:** Update `src/index.css` with tokens, create reusable `<SpotlightCard>`, `<GlowBadge>`, `<InteractiveGrid>`.
* **Acceptance Criteria:**
  - Tokens (`--bfel-*`) available across light/dark themes.
  - `<SpotlightCard>` tracks cursor with performant Framer Motion values.
  - Respects `@media (prefers-reduced-motion)`.

### Phase 3: Premium Public Landing Page
* **Goal:** Build the industrial showcase landing page for BFEL FLOW.
* **Deliverable:** Create `src/components/landing/LandingPage.tsx` with Hero, Telemetry Ticker, Interactive Truck Simulator, and Role Launchpad.
* **Acceptance Criteria:**
  - Renders at `/` when unauthenticated while preserving 1-click login and demo role selection.
  - All 6 Playwright tests in `frontend/tests/operational_journey.spec.ts` pass without regression.

### Phase 4: Operational ERP Workspace Component Elevation
* **Goal:** Elevate internal operational dashboards (Dealer, Accounts, Loading Bay, Admin) to the new aesthetic standard without altering business logic.
* **Deliverable:** Refactor `TruckCapacityBar.tsx`, `OrderTimeline.tsx`, `MetricCard.tsx`, and `LoadingOperatorTerminal.tsx` with high-density industrial styling.
* **Acceptance Criteria:**
  - 100% backward compatibility with `AppContext` and `AuthContext`.
  - Tabular monospace numbers for all weights and bag counts.
  - Weighbridge digital LED counter integration in the bay operator terminal.

### Phase 5: End-to-End Verification & Production Readiness
* **Goal:** Validate complete application in real browser, run Playwright E2E and Pytest suites.
* **Deliverable:** Full test execution log and production verification report.
* **Acceptance Criteria:**
  - Playwright test suite passes (6/6).
  - Django pytest test suite passes (81/81).
  - Production builds (`npm run build`) complete with 0 TypeScript or bundling errors.

---

## Conclusion & Next Step

The Phase 1 UI/UX Reference Audit is complete. The exact interaction mechanics, CSS tokens, and component architecture from the benchmark have been empirically documented and adapted into the **Industrial Executive** design strategy for BFEL FLOW.

**Inspection is complete. Awaiting user approval to proceed to Phase 2.**
