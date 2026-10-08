# BFEL FLOW — LAYER 0: PROJECT IMPLEMENTATION AUDIT

**Project Name:** BFEL FLOW (Bharat Feeds & Extractions Ltd, Indore, MP)  
**System Type:** Enterprise Distributor Management System (DMS) & Plant Operations ERP  
**Audit Date:** October 2, 2026  
**Auditor:** Antigravity Engineering Agent  
**Scope:** Layer 0 Audit Only (Read & Analyze Only — No code refactoring/deletion/backend implementation in this phase)

---

## 1. Current Architecture

The existing application is structured as a **monolithic Single-Page Application (SPA)** run entirely in the browser client.

```
+------------------------------------------------------------------------+
|                          BROWSER CLIENT (SPA)                          |
|                                                                        |
|  +--------------------+   +------------------------------------------+ |
|  |    AuthContext     |   |                AppContext                | |
|  | - User Registry    |   | - Orders, Payments, Vehicles, Claims     | |
|  | - Session (mock)   |   | - Inventory, Wallet, Visits, Audit Logs  | |
|  | - Role Guard       |   | - Modal State, Toast, Offline Queue      | |
|  +---------+----------+   +--------------------+---------------------+ |
|            |                                   |                       |
|            +-----------------+   +-------------+                       |
|                              v   v                                     |
|                      +-------+---+--------+                            |
|                      |      AppShell      |                            |
|                      | (Client Router)    |                            |
|                      +-------+------------+                            |
|                              |                                         |
|      +-----------+-----------+----------+-------------+---------+      |
|      v           v           v          v             v         v      |
|   Dealer    Distributor    Sales     Accounts      Loading    Admin    |
|  Workspace   Workspace     Agent       Desk        Terminal  Command   |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  | Persistence: Browser window.localStorage                         |  |
|  | (Keys: bfel_orders, bfel_payments, bfel_wallet, bfel_users_v2...) |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
```

### Architectural Findings:
1. **Zero Real Backend Execution:** There is currently no live backend server running business transactions. While `package.json` contains dependencies for `express`, `@google/genai`, and `dotenv`, none of these are referenced or executed inside `src/`.
2. **Client-Side Simulation:** All business rules (order creation, truck capacity validation, 100% advance checks, payment approvals, weighbridge calculations, security seal verification, gate pass generation, claims credit notes, and dealer visits) execute strictly in client React state and write to browser `localStorage`.
3. **No External Network I/O:** There are zero HTTP calls (`fetch`, `axios`) or WebSocket listeners.

---

## 2. Current Frontend Framework

- **Build Tool & Bundler:** [Vite 8.3.2](https://vitejs.dev/) with `@vitejs/plugin-react` (React Fast Refresh).
- **Core Library:** [React 19.0.1](https://react.dev/) & [React-DOM 19.0.1](https://react.dev/).
- **Language & Compiler:** TypeScript 7.0.2 / ES2022 (`"jsx": "react-jsx"`, `"noEmit": true`, path alias `@/*` -> `./*`).
- **Styling Engine:** [Tailwind CSS v4.3.3](https://tailwindcss.com/) via `@tailwindcss/vite` plugin with `@theme` configurations:
  - Font families: `Plus Jakarta Sans` (UI / sans-serif) and `JetBrains Mono` (numbers, codes, weights / monospace).
  - Custom scrollbar classes defined in [`src/index.css`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/index.css).
- **Iconography:** `lucide-react` (v0.546.0).
- **Animation:** `motion` (v12.23.24) declared in `package.json`.
- **Target Production Stack Comparison:**
  - *Current Frontend:* Vite SPA + React 19 + Tailwind v4.
  - *JD Production Requirement:* Next.js 15 (App Router / SSR) + React 19 + TypeScript + Tailwind CSS.

---

## 3. Current Routes

The application does not use `react-router` or Next.js App Router. Instead, it utilizes a custom stateful client router driven by `AuthContext.currentAuthRoute` and `AuthContext.navigateTo(route)`.

### Route Map:

| Route Path | Associated Component | Access Restriction | Functionality |
| :--- | :--- | :--- | :--- |
| `/login` | [`LoginPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/LoginPage.tsx) | Public | Password & 6-digit OTP phone login; quick demo role picker |
| `/signup` | [`SignupRoleSelectionPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/SignupRoleSelectionPage.tsx) | Public | Role card selector for prospective partners |
| `/signup/dealer` | [`DealerSignupPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/DealerSignupPage.tsx) | Public | 3-step dealer onboarding (KYC, GSTIN, Mandi location) |
| `/signup/sales-agent` | [`SalesAgentSignupPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/SalesAgentSignupPage.tsx) | Public | Sales agent recruitment form (Territory, Manager) |
| `/signup/distributor` | [`DistributorRequestPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/DistributorRequestPage.tsx) | Public | Institutional distributor enterprise access form |
| `/signup/accounts` | [`InternalRestrictedPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/InternalRestrictedPage.tsx) | Public | Blocked internal-only notice for Finance Desk |
| `/signup/loading` | [`InternalRestrictedPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/InternalRestrictedPage.tsx) | Public | Blocked internal-only notice for Weighbridge Terminal |
| `/signup/admin` | [`InternalRestrictedPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/InternalRestrictedPage.tsx) | Public | Blocked notice for Command Center |
| `/forgot-password` | [`ForgotPasswordPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/ForgotPasswordPage.tsx) | Public | Simulated OTP verification and password reset |
| `/access-denied` | [`AccessDeniedPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/AccessDeniedPage.tsx) | Authenticated | Displayed on 403 unauthorized role workspace breach |
| `/dealer/*` | [`DealerDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/dealer/DealerDashboard.tsx) | `dealer`, `admin` | Tabs: `overview`, `place_order`, `orders`, `payments`, `tracking`, `claims`, `products` |
| `/distributor/*` | [`DistributorDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/distributor/DistributorDashboard.tsx) | `distributor`, `admin` | Tabs: `overview`, `orders`, `wallet`, `stock`, `dispatches`, `claims`, `dealers` |
| `/sales/*` | [`SalesAgentDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/sales/SalesAgentDashboard.tsx) | `sales_agent`, `admin` | Tabs: `overview`, `dealers`, `visits`, `create_order`, `followups`, `collections`, `territory` |
| `/accounts/*` | [`AccountsDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/accounts/AccountsDashboard.tsx) | `accounts`, `admin` | Tabs: `overview`, `payments`, `reconciliation`, `verified`, `rejected`, `audit` |
| `/loading/*` | [`LoadingOperatorTerminal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/loading/LoadingOperatorTerminal.tsx) | `loading_operator`, `admin` | Tabs: `terminal`, `queue`, `planner`, `weighbridge`, `completed`, `gate_pass` |
| `/admin/*` | [`AdminCommandCenter.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/AdminCommandCenter.tsx) | `admin` only | Tabs: `command_center`, `needs_attention`, `orders`, `place_order`, `payment_desk`, `loading`, `terminal`, `dispatches`, `tracking`, `claims`, `fleet`, `users`, `products`, `reports`, `dealers`, `audit` |

---

## 4. Current Role System

The RBAC system defines 6 operational roles with granular permissions in [`src/types/index.ts`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/types/index.ts):

```typescript
export type UserRole = 
  | 'dealer'
  | 'sales_agent'
  | 'distributor'
  | 'accounts'
  | 'loading_operator'
  | 'admin';
```

### Granular Permissions Breakdown:
1. **Dealer (`dealer`):** `dealer:orders:view`, `dealer:orders:create`, `dealer:payments:submit`, `dealer:wallet:view`, `dealer:shipments:track`, `dealer:claims:create`.
2. **Sales Agent (`sales_agent`):** `sales:dealers:view`, `sales:orders:create`, `sales:visits:record`, `sales:territory:view`.
3. **Distributor (`distributor`):** `distributor:orders:view`, `distributor:wallet:view`, `distributor:credit:view`, `distributor:allocations:view`, `distributor:dispatch:view`, `distributor:claims:create`.
4. **Accounts Desk (`accounts`):** `accounts:payments:view`, `accounts:payments:verify`, `accounts:payments:reject`, `accounts:credit_notes:create`, `accounts:ledger:view`.
5. **Loading Operator (`loading_operator`):** `loading:queue:view`, `loading:truck:view`, `loading:quantity:update`, `loading:weighbridge:record`, `loading:seal:enter`, `loading:complete`.
6. **Central Admin (`admin`):** Full superuser capabilities (`admin:users:manage`, `admin:orders:all`, `admin:payments:all`, `admin:loading:manage`, `admin:claims:review`, etc.).

### Role Switching & Preview Features:
- **Admin Preview Mode (`adminPreviewRole`):** In [`AppShell.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/AppShell.tsx), an Admin can switch into any workspace (`dealer`, `distributor`, `loading`, etc.) with a persistent sticky banner (`"You are previewing BFEL Flow as..."`), testing end-user experience without logging out.
- **Demo Quick Switcher:** Implemented in [`TopBar.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/TopBar.tsx) and [`LoginPage.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/auth/LoginPage.tsx) allowing instant role switching between seed profiles.

---

## 5. Current Data & State Architecture

The application has two central React context providers located in [`src/context/`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/):

### 1. `AuthContext` ([`AuthContext.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AuthContext.tsx))
- **Responsibilities:**
  - Manages `currentUser`, `isAuthenticated`, `currentAuthRoute`.
  - Holds `usersList` initialized with seed users (`INITIAL_USERS`) and saved in `localStorage['bfel_users_v2']`.
  - Enforces route guard rules (`navigateTo`) to reject unauthorized cross-role workspace browsing.
  - Implements account status management (`active`, `pending`, `suspended`, `rejected`) and admin approval actions (`approveUser`, `rejectUser`, `suspendUser`, `activateUser`).

### 2. `AppContext` ([`AppContext.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AppContext.tsx))
- **Responsibilities:**
  - **Orders (`orders`):** Array of `Order` objects initialized with seed orders and saved in `localStorage['bfel_orders']`.
  - **Payments (`payments`):** `PaymentRecord[]` saved in `localStorage['bfel_payments']`.
  - **Vehicles & Fleet (`vehicles`):** `Vehicle[]` saved in `localStorage['bfel_vehicles']`.
  - **Distributor Credit & Wallet (`wallet`):** `DistributorWallet` object saved in `localStorage['bfel_wallet']`.
  - **Product Allocations (`allocations`):** `ProductAllocation[]` saved in `localStorage['bfel_allocations']`.
  - **Claims (`claims`):** `Claim[]` saved in `localStorage['bfel_claims']`.
  - **Field Dealer Visits (`visits`):** `DealerVisit[]` saved in `localStorage['bfel_visits']`.
  - **Audit Logs (`auditLogs`):** `AuditEvent[]` saved in `localStorage['bfel_audits']`.
  - **Notifications (`notifications`):** `NotificationItem[]` saved in `localStorage['bfel_notifications']`.
  - **Pending Partner Signups (`pendingSignups`):** `PendingSignup[]` saved in `localStorage['bfel_signups']`.
  - **Global Modals & Drawers:** `activeModal`, `activeModalData`, `openModal`, `closeModal`.
  - **Toast Notifications:** `toastMessage`, `toastType`, `showToast`.
  - **Offline Sync Queue:** `isOfflineMode`, `offlineQueue`, `pendingSyncCount`, `syncOfflineQueue`.

---

## 6. Mock & Hardcoded Functionality

Every operational module currently relies on simulated data or in-memory React state:

| Subsystem | Existing Mock / Hardcoded Pattern | Where It Exists |
| :--- | :--- | :--- |
| **Authentication** | Passwords checked with literal string `=== 'Password123'`. Seed users stored in client state. | [`AuthContext.tsx:L485`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AuthContext.tsx#L485) |
| **OTP Generation** | Hardcoded return value `749210` or `123456`; no SMS gateway (Twilio, Gupshup, Fast2SMS) | [`AuthContext.tsx:L545`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AuthContext.tsx#L545) |
| **Payment Verification** | Bank reconciliation is mocked; accepts any UTR string; does not connect to bank statements or razorpay/cashfree webhooks. Receipt images are SVG data URLs. | [`AppContext.tsx:L974`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AppContext.tsx#L974), [`AccountsDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/accounts/AccountsDashboard.tsx) |
| **Distributor Wallet** | Static credit limit `₹10,00,000`, simulated transactions added to client state array on payment verification or claim credit note. | [`AppContext.tsx:L1061`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AppContext.tsx#L1061) |
| **Truck Loading Terminal** | Tare weight, gross weight, seal number input directly into HTML inputs; simulated 10-bag cargo grid slots. No actual weighbridge IoT / serial communication. | [`LoadingOperatorTerminal.tsx:L53`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/loading/LoadingOperatorTerminal.tsx#L53) |
| **Gate Pass & LR** | Number generator uses `Math.random()` e.g. `LR-IND-2026-9428`, `GP-MGL-2026-0412`. | [`AppContext.tsx:L1215`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AppContext.tsx#L1215) |
| **WhatsApp Dispatch Alerts** | Simulates a WhatsApp chat UI bubble and encodes a `https://api.whatsapp.com/send?text=` URL for browser opening; no WhatsApp Business Cloud API integration. | [`WhatsAppAlertModal.tsx:L13`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/documents/WhatsAppAlertModal.tsx#L13) |
| **Claims & Photo Uploads** | Uses inline SVG strings (`data:image/svg+xml;utf8,...`) to simulate uploaded photos of short shipments. | [`DealerClaimsModal.tsx:L28`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/dealer/DealerClaimsModal.tsx#L28) |
| **Field GPS & Visits** | Hardcoded coordinates `22.9676° N, 76.0534° E`; assigned dealer list is hardcoded array in local component scope. | [`SalesAgentDashboard.tsx:L53`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/sales/SalesAgentDashboard.tsx#L53) |
| **Order Scoping** | Dealer dashboard uses `const dealerOrders = orders;` without filtering by user ID in the prototype. | [`DealerDashboard.tsx:L40`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/dealer/DealerDashboard.tsx#L40) |

---

## 7. Existing Reusable Components

The UI contains an extensive suite of carefully crafted, domain-specific components:

### Common & Layout Components ([`src/components/common/`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/))
- **[`AppShell.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/AppShell.tsx):** Top-level wrapper managing layouts, active tabs, modals, error boundaries, and toast notifications.
- **[`TopBar.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/TopBar.tsx):** Global search bar trigger, factory status badge, offline toggle, notification badge, and profile menu.
- **[`Sidebar.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/Sidebar.tsx):** Collapsible navigation menu displaying role-specific sections with counter badges.
- **[`MobileBottomNav.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/MobileBottomNav.tsx):** Bottom navigation optimized for mobile devices (dealers and sales agents).
- **[`MetricCard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/MetricCard.tsx):** Key performance indicator card with trend arrows, badges, and icon indicators.
- **[`StatusBadge.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/StatusBadge.tsx):** Color-coded status chip mapping order, payment, claim, and vehicle lifecycle states.
- **[`TruckCapacityBar.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/TruckCapacityBar.tsx):** Visual meter displaying 20 MT (400 bags) vs 25 MT (500 bags) limits with overflow warnings.
- **[`OrderTimeline.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/OrderTimeline.tsx):** Multi-step step-tracker showing progression from `Order Placed` -> `100% Advance` -> `Payment Verified` -> `Loading` -> `Gate Pass Issued` -> `Dispatched` -> `Delivered`.
- **[`PageHeader.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/PageHeader.tsx):** Standardized title, breadcrumb trail, subtitle, and action button container.
- **[`ErrorBoundary.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/ErrorBoundary.tsx):** React class error boundary preventing component crashes from taking down the app.
- **[`GlobalSearchModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/GlobalSearchModal.tsx):** Omnibox search indexing orders, trucks, UTR numbers, dealers, and claims.
- **[`NotificationDrawer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/NotificationDrawer.tsx):** Flyout panel displaying event notifications with deep links.

### Enterprise Document Modals ([`src/components/documents/`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/documents/))
- **[`GatePassModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/documents/GatePassModal.tsx):** Printable factory security gate pass featuring QR code, seal verification, driver details, and weight summary.
- **[`LRChallanModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/documents/LRChallanModal.tsx):** Standard Lorry Receipt (LR) consignment note with consignee and GSTIN disclosures.
- **[`WhatsAppAlertModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/documents/WhatsAppAlertModal.tsx):** WhatsApp dispatch message preview with one-click copy and `whatsapp://` URL launcher.

### Detail Drawers & Modals ([`src/components/admin/`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/))
- **`OrderDetailDrawer.tsx`**, **`PaymentDetailDrawer.tsx`**, **`PaymentVerificationDrawer.tsx`**, **`ClaimDetailDrawer.tsx`**, **`VehicleDetailDrawer.tsx`**, **`UserDetailDrawer.tsx`**, **`AuditDetailDrawer.tsx`**, **`IssueCreditNoteModal.tsx`**, **`DealerOrderCaptureModal.tsx`**, **`DealerPaymentModal.tsx`**, **`DealerClaimsModal.tsx`**, **`DealerVisitModal.tsx`**, **`PlaceFeedOrderWizard.tsx`**.

---

## 8. Existing Authentication

- **Implementation Location:** [`src/context/AuthContext.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AuthContext.tsx)
- **State Persistence:** `localStorage.getItem('bfel_auth_current_user')` and `localStorage.getItem('bfel_users_v2')`.
- **Supported Login Methods in UI:**
  1. **Password Login:** User identifier (email or 10-digit mobile) + password.
  2. **OTP Login:** 10-digit mobile number + simulated 6-digit OTP code (`749210`).
- **Route Guard Mechanism:**
  - Evaluates `currentUser.status` (`pending`, `rejected`, `suspended` are blocked).
  - Evaluates `currentUser.role` against target path prefix. Non-admin users attempting to open `/admin`, `/accounts`, etc. are blocked and diverted to `/access-denied`.
- **Shortcomings for Production:**
  - No cryptographic password hashing (passwords stored as plaintext string properties on `User` objects).
  - No JWT (JSON Web Tokens) or secure HTTP-only session cookies.
  - No server-side session revocation.
  - OTP is static and verified purely in browser memory.

---

## 9. Existing Tests

- **Current State:** **0 Tests Found.**
- No unit tests (Vitest / Jest).
- No integration or component tests (React Testing Library).
- No end-to-end tests (Playwright / Cypress).
- No backend tests (pytest).
- `package.json` contains no `"test"` script.

---

## 10. Missing Backend Capabilities

To meet the strict JD production requirements, the following backend services must be built in Python 3.12 / Django 5 / Django REST Framework:

1. **Authentication & Session Service:**
   - Real mobile OTP generation, hashing, rate-limiting, and delivery via SMS gateway.
   - JWT token issuance (`access_token`, `refresh_token`) with role claims.
   - Password hashing with PBKDF2/Argon2.
   - Onboarding approval state machine with admin moderation endpoints.
2. **Order Management Service:**
   - 20 MT (400 bags) & 25 MT (500 bags) load enforcement.
   - Unit conversion engine: Bags (50 kg) <-> MT <-> kg.
   - Pricing & Scheme engine: Volume rebate logic (e.g. 400+ bags = ₹30/bag discount).
   - Strict order lifecycle state machine:
     `order_placed` -> `payment_submitted` -> `payment_verified` -> `loading_planned` -> `loading` -> `loading_completed` -> `dispatch_ready` -> `dispatched` -> `delivered`.
3. **Accounts & Payment Verification Desk:**
   - 100% advance payment rule: Orders cannot proceed to loading without verified payment or distributor credit reservation.
   - UTR record deduplication (prevent re-use of bank UTR numbers across orders).
   - Bank statement upload & reconciliation service.
   - Rejection workflow with audit logging.
4. **Distributor Credit & Wallet Engine:**
   - ACID-compliant ledger transactions (double-entry accounting for advance deposits, order charges, credit notes, and rebates).
   - Balance locking and atomic credit reservation.
5. **Loading Terminal & Weighbridge Operations:**
   - Physical loading queue management for plant dispatch bays.
   - Weighbridge calculations: Tare weight, Gross weight, Net weight calculation.
   - Weight variance tolerance detection (±100 kg tolerance vs expected product weight).
   - Mandatory security seal number capture before release.
   - Digital Gate Pass and Lorry Receipt (LR) generation with serial tracking.
6. **Dispatch & WhatsApp Integration:**
   - WhatsApp Business API service to send dispatch templates (Order, Truck number, LR, Seal, Driver contact, Destination).
7. **Photo-Backed Shortage & Quality Claims Engine:**
   - Direct file upload to secure media storage (S3 / MinIO / Cloud Storage).
   - Shortage math: `expected_bags - received_bags = shortage_bags` and weight equivalents.
   - Admin review workflow with credit note generation and wallet crediting.
8. **Field Sales Tracking Service:**
   - GPS check-in logging for rural dealership visits.
   - Offline sync endpoint handling queued actions from poor connectivity areas.
9. **Central Immutable Audit Trail:**
   - Comprehensive system event log capturing timestamp, actor, role, entity, action, and diff.

---

## 11. Missing Database Capabilities

Currently, all data is volatile and stored in the browser's `localStorage`. The required production relational database is **PostgreSQL 16**.

### Critical Relational Entities Needed:
- `users_user` (custom user model with mobile number as primary identifier, role enum, status enum, territory, employee details, GSTIN).
- `catalog_product` (SKU, name, category, bag_weight_kg [constant 50kg], protein_percent, fat_percent, price_per_bag, is_active).
- `distributors_distributor` & `distributors_wallet` & `distributors_wallet_transaction`.
- `dealers_dealer` (dealership name, mandi location, assigned distributor, assigned sales agent, GSTIN).
- `orders_order` & `orders_order_item` (with constraints preventing loads exceeding 20 MT / 25 MT).
- `payments_payment_record` (order foreign key, UTR unique index, amount, payment mode, bank name, receipt file, status, verified_by foreign key).
- `fleet_vehicle` (registration number unique index, capacity type, driver name, license, phone).
- `loading_load_record` (order FK, vehicle FK, tare_kg, gross_kg, net_kg, expected_kg, variance_kg, seal_number, gate_pass_number, lr_number, completed_by FK).
- `claims_claim` & `claims_claim_photo` (order FK, dealer FK, claim_type, expected_bags, received_bags, shortage_bags, credit_note_id).
- `sales_dealer_visit` (agent FK, dealer FK, gps_lat, gps_lng, stock_count_bags, notes).
- `audit_audit_event` (timestamp, user FK, role, action, entity, reference, description).

---

## 12. Recommended Migration Path

To migrate from the current Vite prototype to the required production stack without disrupting or breaking the existing frontend UI specification, we recommend a 5-phase approach:

```
+-----------------------------------------------------------------------------+
| Phase 1: Dockerized Infrastructure & Database Modeling (PostgreSQL 16)      |
| - docker-compose with Postgres 16, Redis, Python 3.12 DRF, and Next.js      |
+-----------------------------------------------------------------------------+
                                       ↓
+-----------------------------------------------------------------------------+
| Phase 2: Django 5 / DRF Backend Implementation                              |
| - Custom user auth (JWT + OTP), Service layers, Serializers, pytest suite  |
| - Advance payment verification, Truck loading rules, Claims, Wallet ledger  |
+-----------------------------------------------------------------------------+
                                       ↓
+-----------------------------------------------------------------------------+
| Phase 3: Frontend Framework Migration (Next.js 15 App Router)               |
| - Preserve 100% of existing components, layouts, colors, and styling        |
| - Convert client routing to Next.js route groups: (auth), (dealer), etc.    |
| - Introduce API client layer (typed fetch / TanStack Query) to replace mock |
+-----------------------------------------------------------------------------+
                                       ↓
+-----------------------------------------------------------------------------+
| Phase 4: API Wiring & Feature Parity Validation                             |
| - Connect UI forms, drawers, and terminals to DRF REST endpoints            |
| - Verify OTP login, advance payment flow, weighbridge calculations          |
+-----------------------------------------------------------------------------+
                                       ↓
+-----------------------------------------------------------------------------+
| Phase 5: Automated Testing & Verification                                   |
| - Backend: pytest test cases for all business rules                         |
| - Frontend: Playwright end-to-end tests for all 6 role workflows           |
+-----------------------------------------------------------------------------+
```

---

## 13. Risks

1. **Premature UI Alteration:** Refactoring or redesigning the existing UI would destroy the carefully tuned role workspaces, modals, and design specification.
2. **Business Rule Bypass:** The business logic specifies 100% advance payment before truck loading and strict truck capacity ceilings (400 bags on 20 MT, 500 bags on 25 MT). These must be validated in Django model/service layers, never trusting client input alone.
3. **Data Integrity in Ledger Operations:** The distributor wallet involves concurrent debits and credits. Without database-level locking (`select_for_update`), race conditions could corrupt wallet balances.
4. **Offline Sync Conflicts:** In rural MP mandis, field sales agents record visits and orders offline. Syncing must handle duplicate submissions gracefully.
5. **Vite to Next.js Migration Discrepancies:** Porting CSS imports, Lucide icons, and React 19 hooks into Next.js 15 requires marking interactive workspace components with `'use client'`.

---

## 14. Files That Must Be Preserved (Frontend Specification)

These files contain the exact domain design, layouts, flows, and calculations and **must be preserved**:

### Domain Types & Schemas
- [`src/types/index.ts`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/types/index.ts)

### Core Layouts & Navigation
- [`src/components/common/AppShell.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/AppShell.tsx)
- [`src/components/common/TopBar.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/TopBar.tsx)
- [`src/components/common/Sidebar.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/Sidebar.tsx)
- [`src/components/common/MobileBottomNav.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/MobileBottomNav.tsx)

### Role Workspaces
- [`src/components/dealer/DealerDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/dealer/DealerDashboard.tsx)
- [`src/components/distributor/DistributorDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/distributor/DistributorDashboard.tsx)
- [`src/components/sales/SalesAgentDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/sales/SalesAgentDashboard.tsx)
- [`src/components/accounts/AccountsDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/accounts/AccountsDashboard.tsx)
- [`src/components/loading/LoadingOperatorTerminal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/loading/LoadingOperatorTerminal.tsx)
- [`src/components/admin/AdminCommandCenter.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/AdminCommandCenter.tsx)

### Operational Views & Wizards
- [`src/components/admin/PlaceFeedOrderWizard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/PlaceFeedOrderWizard.tsx)
- [`src/components/admin/TruckLoadingPlannerView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/TruckLoadingPlannerView.tsx)
- [`src/components/admin/LoadingTerminalView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/LoadingTerminalView.tsx)
- [`src/components/admin/DispatchWorkspaceView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/DispatchWorkspaceView.tsx)
- [`src/components/admin/DeliveryTrackingView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/DeliveryTrackingView.tsx)
- [`src/components/admin/PaymentDeskView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/PaymentDeskView.tsx)
- [`src/components/admin/ClaimsDeskView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/ClaimsDeskView.tsx)
- [`src/components/admin/NeedsAttentionView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/NeedsAttentionView.tsx)
- [`src/components/admin/OrdersManagementView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/OrdersManagementView.tsx)
- [`src/components/admin/FleetMasterView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/FleetMasterView.tsx)
- [`src/components/admin/UserManagementView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/UserManagementView.tsx)
- [`src/components/admin/ProductCatalogView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/ProductCatalogView.tsx)
- [`src/components/admin/ReportsView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/ReportsView.tsx)
- [`src/components/admin/AuditTrailView.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/AuditTrailView.tsx)
- [`src/components/admin/DealerOverviewPreview.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/DealerOverviewPreview.tsx)

### Modals & Drawers
- [`src/components/dealer/DealerOrderCaptureModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/dealer/DealerOrderCaptureModal.tsx)
- [`src/components/dealer/DealerPaymentModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/dealer/DealerPaymentModal.tsx)
- [`src/components/dealer/DealerClaimsModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/dealer/DealerClaimsModal.tsx)
- [`src/components/sales/DealerVisitModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/sales/DealerVisitModal.tsx)
- [`src/components/accounts/PaymentVerificationDrawer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/accounts/PaymentVerificationDrawer.tsx)
- [`src/components/documents/GatePassModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/documents/GatePassModal.tsx)
- [`src/components/documents/LRChallanModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/documents/LRChallanModal.tsx)
- [`src/components/documents/WhatsAppAlertModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/documents/WhatsAppAlertModal.tsx)
- [`src/components/admin/OrderDetailDrawer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/OrderDetailDrawer.tsx)
- [`src/components/admin/PaymentDetailDrawer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/PaymentDetailDrawer.tsx)
- [`src/components/admin/ClaimDetailDrawer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/ClaimDetailDrawer.tsx)
- [`src/components/admin/VehicleDetailDrawer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/VehicleDetailDrawer.tsx)
- [`src/components/admin/UserDetailDrawer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/UserDetailDrawer.tsx)
- [`src/components/admin/AuditDetailDrawer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/AuditDetailDrawer.tsx)
- [`src/components/admin/IssueCreditNoteModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/admin/IssueCreditNoteModal.tsx)

### Visual Primitives & Widgets
- [`src/components/common/TruckCapacityBar.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/TruckCapacityBar.tsx)
- [`src/components/common/OrderTimeline.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/OrderTimeline.tsx)
- [`src/components/common/MetricCard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/MetricCard.tsx)
- [`src/components/common/StatusBadge.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/StatusBadge.tsx)
- [`src/components/common/PageHeader.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/PageHeader.tsx)
- [`src/components/common/GlobalSearchModal.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/GlobalSearchModal.tsx)
- [`src/components/common/NotificationDrawer.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/NotificationDrawer.tsx)

---

## 15. Files That Can Be Refactored

During subsequent implementation layers, the following files will be refactored or replaced to integrate the true backend and Next.js routing:

1. **[`src/context/AppContext.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AppContext.tsx):**
   - *Current role:* Giant state container storing all mock orders, payments, vehicles, and claims in `localStorage`.
   - *Refactored role:* Replaced or thinned into an API client layer (e.g., TanStack Query or lightweight React context) that fetches and mutates data via Django REST Framework endpoints.
2. **[`src/context/AuthContext.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/context/AuthContext.tsx):**
   - *Current role:* In-memory user registry with hardcoded OTP (`749210`) and plain-text passwords.
   - *Refactored role:* Refactored to call Django DRF `/api/v1/auth/login/`, `/api/v1/auth/otp/request/`, `/api/v1/auth/otp/verify/`, managing real JWT tokens.
3. **[`src/components/common/AppShell.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/common/AppShell.tsx):**
   - *Current role:* Monolithic router simulating routes via string matching against `currentAuthRoute`.
   - *Refactored role:* Adapted to Next.js 15 layout structure (`app/(dashboard)/layout.tsx`) while preserving TopBar, Sidebar, and Modals.
4. **[`package.json`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/package.json) & [`vite.config.ts`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/vite.config.ts):**
   - *Refactored role:* Updated when introducing the Next.js 15 structure, test runners (Playwright, pytest), and Docker scripts.
5. **Local Component Hardcoding:**
   - E.g. [`SalesAgentDashboard.tsx`](file:///c:/Users/Rohit/Downloads/remix-remix-bfel-flow---cattle-feed-distribution-&-operations-platform/src/components/sales/SalesAgentDashboard.tsx) (hardcoded `assignedDealers` array) will be replaced with API-driven queries from `/api/v1/dealers/assigned/`.

---

**AUDIT CONCLUSION:**  
The existing UI represents an exceptionally complete, domain-accurate frontend specification for BFEL FLOW with full coverage of the 6 roles, truck loading rules, advance payment verification, claims, and documents. The core challenge for future layers is building the robust Django 5 + PostgreSQL 16 backend and wiring it cleanly without degrading the frontend design or workflow.

**Status:** Layer 0 Audit Complete. All work stopped. Awaiting user instruction for Layer 1.
