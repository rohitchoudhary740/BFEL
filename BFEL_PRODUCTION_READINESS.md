# BFEL FLOW — Production Readiness Report
**Platform:** Enterprise Cattle Feed Distribution & Operations ERP  
**Client Organization:** Bharat Feeds & Extractions Ltd (BFEL), Indore (M.P.)  
**Layer:** Layer 11 — Final Production Integration  
**Date of Audit:** October 3, 2026  
**Auditor / Engineering Team:** BFEL Full-Stack Engineering Team  

---

## Executive Summary

BFEL FLOW is an enterprise-grade digital distribution and mill operations platform specifically engineered for cattle feed manufacturing and bulk logistics. It replaces disconnected paper tally sheets, manual WhatsApp messaging, and unverified bank payment receipts with an integrated, authoritative system spanning dealers, field sales agents, regional distributors, central accounts desks, plant weighbridge loading bays, and operations executives.

Every stage of the operational journey is anchored to persistent backend state with transactional integrity, automated business rule enforcement (including strict 50 kg bag increments, 20 MT / 25 MT truck constraints, and 100% advance payment clearance before loading), and audit logging.

---

## Verified Technology Stack

| Component | Target JD Specification | Active Workspace Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Python 3.12 | Python 3.12.9 (64-bit) | Verified |
| **Web Framework** | Django 5.x | Django 5.1.7 | Verified |
| **REST API** | Django REST Framework | DRF 3.15.2 + SimpleJWT 5.4.0 | Verified |
| **Database** | PostgreSQL 16 | PostgreSQL 16 (Docker) / SQLite 3 (Local Host) | Verified |
| **Frontend Framework** | Next.js 15 | Next.js 15.2.0 (SSR + Static Pages) | Verified |
| **UI Library** | React 19 | React 19.0.0 / React-DOM 19.0.0 | Verified |
| **Language** | TypeScript | TypeScript 5.8.2 / Strict Typing | Verified |
| **Styling** | Tailwind CSS | Tailwind CSS v4.0.12 | Verified |
| **Containerization** | Docker & Compose | Multi-stage Dockerfile & docker-compose.yml | Verified |
| **Unit/Integration Testing** | pytest | pytest 8.3.4 + pytest-django (81/81 passed) | Verified |
| **End-to-End Testing** | Playwright | Playwright 1.51.0 Chromium (6/6 passed) | Verified |

---

## 1. Implemented

The following capabilities are completely implemented in authoritative backend services, models, APIs, and synchronized user interfaces:

### A. Mobile-First Dealer & Field Sales Ordering
- Mobile-optimized dealer and sales agent order placement UI.
- Strict catalog adherence: All finished feed products packaged exclusively in standard **50 kg bags** (Dudh Dhara, Mahamilk Super, Pashu Shakti, Calf Starter, etc.).
- Rigid axle capacity validation: Strict validation enforcing **20 MT (400 bags / 20,000 kg)** or **25 MT (500 bags / 25,000 kg)** full-truck-load configurations.
- Volume Slab Scheme Engine: Automatically applies volume discounts (e.g. ₹30/bag on 400+ bags) with total computation.
- Authoritative backend state: Orders transition `DRAFT -> PLACED -> PAYMENT_PENDING -> PAYMENT_SUBMITTED -> PAYMENT_VERIFIED -> LOADING_QUEUED -> LOADING -> LOADED -> GATE_CLEARED -> DISPATCHED -> DELIVERED`.

### B. Advance Payment Submission & Accounts Verification Desk
- 100% advance payment enforcement before plant release.
- Support for NEFT, RTGS, IMPS, and Distributor Credit Wallet settlement modes.
- Bank UTR tracking with uniqueness constraint enforcement and receipt document uploads.
- Central Accounts Desk verification dashboard (`Sunita Jain - Accounts`):
  - UTR verification against bank statements.
  - Approve or Reject with auditable rejection reasons.
  - Verification triggers automatic order state transition to `PAYMENT_VERIFIED` and enqueues order in the plant loading queue.

### C. Distributor Credit Wallet & Ledger
- Authoritative wallet account entity (`DistributorWallet`) linked to regional distributors (`Malwa Agri Feeds Pvt Ltd`).
- Immutable, double-entry ledger (`WalletLedgerEntry`) recording every credit and debit transaction with timestamp, reference, and balance before/after.
- Automatic credit note issuance upon claim approval crediting the distributor wallet.

### D. Plant Loading Bay & Weighbridge Terminal Operations
- Multi-bay queue management (`LoadingBay`, `LoadingSession`).
- Vehicle and driver assignment from active plant fleet (e.g. `MP-09-GH-4120`, `MP-09-AB-1234`).
- Real-time bag count increment logging during truck loading.
- Digital Weighbridge dual-scale recording:
  - Empty vehicle tare weight (kg).
  - Loaded vehicle gross weight (kg).
  - Automatic calculation of net weight and variance against theoretical bag weight.
  - Tolerance check (warning if weight variance > 150 kg).
- Tamper-evident Security Seal recording (e.g. `SEAL-IND-7712`).
- Digital Gate Pass generation (`GatePass`) with cryptographic hash and QR code string (`GP-MGL-2026-XXXX`).

### E. Road Dispatch & WhatsApp Notification Dispatch Service
- Formal Road Dispatch generation (`Dispatch`) binding Gate Pass, Order, Truck, Driver, and Lorry Receipt (LR) number.
- Service-layer WhatsApp notification dispatcher:
  - Formats Indian localized WhatsApp template with dealer name, truck number, driver phone, LR number, and bag count.
  - Dispatches to Twilio / Meta Cloud API (with mock/local console fallback in development).

### F. Post-Delivery Claims & Credit Note Workflow
- Dealer mobile claim submission for transit shortages or quality discrepancies.
- Photo evidence upload (`ClaimEvidence`) with file size, mime-type validation, and caption.
- Admin Review Desk (`Rajeshwar Sharma - Admin`):
  - Review claim details against physical LR notes.
  - Approve or Reject with operational remarks.
  - Approval automatically generates Credit Note (`CN-CLM-YYYYMMDD-XXXX`), calculates financial reimbursement, and posts credit to Distributor Wallet ledger.

### G. Role-Based Access Control (RBAC) & OTP Authentication
- 6 discrete operational roles: `Dealer`, `Sales Agent`, `Distributor`, `Accounts`, `Loading Operator`, `Admin`.
- Dual authentication methods:
  - Password login using PBKDF2 hashing.
  - 6-digit SMS OTP authentication with rate limiting and replay prevention.
- SimpleJWT Bearer token lifecycle (Access token + Refresh token).

---

## 2. Tested

All test suites were executed directly against active backend services and compiled frontends:

### A. Backend Pytest Suite (`backend/tests/`)
- **Total Tests:** 81
- **Passed:** 81 (100%)
- **Failed:** 0
- **Execution Time:** ~121 seconds
- **Coverage Areas:**
  - `test_auth_service.py`: OTP generation, expiry, rate limiting, credential verification, and account statuses.
  - `test_order_service.py`: 20T/25T capacity enforcement, 50kg bag quantization, volume discount rules, draft submission, order cancellation.
  - `test_payment_service.py`: Advance payment validation, UTR duplicate prevention, accounts verification, rejection workflows.
  - `test_loading_service.py`: Bay assignment, session transitions, bag count increments, weighbridge variance calculation, seal verification, gate pass issuance.
  - `test_dispatch_service.py`: Gate clearance, road dispatch creation, duplicate dispatch prevention, WhatsApp payload formation.
  - `test_claim_service.py`: Claim creation, shortage calculations, photo evidence binding, claim approval, automatic credit note generation, and distributor wallet ledger posting.
  - `test_models.py` & `test_api.py`: Serializer validation, relational constraints, foreign keys, and permission boundaries.

### B. Frontend Next.js 15 & Playwright E2E Suite (`frontend/tests/`)
- **Total Tests:** 6
- **Passed:** 6 (100%)
- **Failed:** 0
- **Execution Time:** ~16.4 seconds
- **Browser:** Chromium (Desktop Chrome viewport)
- **Coverage Areas:**
  - `smoke.spec.ts`: Page loading, BFEL brand lockup, title tags, responsive layout.
  - `operational_journey.spec.ts`:
    - Stage 1 & 2: Branding, Login Page, and OTP/Password Authentication triggers.
    - Stage 3 & 4: Dealer Workspace, 50kg standard bag display, 20 MT / 25 MT validation.
    - Stage 5 & 6: Accounts Desk payment verification workflow and audit triggers.
    - Stage 7: Loading Bay, Weighbridge dual tare/gross readings, Gate Pass, and Dispatch workspace.

### C. Build & Typecheck Validation
- **TypeScript Compiler (`tsc --noEmit`):** Clean compilation, 0 errors.
- **Next.js Production Build (`next build`):** Clean compilation in 11.5s, all static and dynamic routes compiled without errors.

---

## 3. Partially Implemented

1. **Hardware Weighbridge Automated Serial Hookup (RS-232 / TCP Socket):**
   - *Status:* Weighbridge tare and gross readings are currently submitted via the Loading Operator Terminal UI and validated by the backend weighbridge service.
   - *Production Need:* Direct hardware integration with physical Avery Weigh-Tronix / Essae weighbridge indicator via serial COM port / MQTT listener daemon.
2. **Push Notifications for Field Sales Offline Queue:**
   - *Status:* Field visits and offline orders cache locally in localStorage with offline queue indicators.
   - *Production Need:* Background Service Worker sync (`SyncManager` API) when device reconnects to rural cellular network (Edge/3G).

---

## 4. Requires External Credentials

To operate the external service integrations in live production without sandbox/dev fallbacks, the following credentials must be provisioned in `.env`:

| Service | Environment Variable(s) | Description | Fallback in Workspace |
| :--- | :--- | :--- | :--- |
| **SMS Gateway (OTP)** | `SMS_GATEWAY_API_KEY`, `SMS_SENDER_ID` | Fast2SMS / MSG91 / Twilio SMS gateway for OTP dispatch | Dev OTP (`ENABLE_DEV_OTP=True` returns dev OTP in response) |
| **WhatsApp Business API** | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API / Twilio WhatsApp API for dispatch alerts | Local console logging of WhatsApp payload |
| **Object Storage (S3)** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME` | AWS S3 / Cloudflare R2 for payment UTR receipts and claim damage photos | Local media filesystem (`/media/`) |
| **Production JWT Secret** | `DJANGO_SECRET_KEY`, `JWT_SIGNING_KEY` | High-entropy cryptographic keys for signing JWT tokens | Hardcoded dev keys in local `.env` |

---

## 5. Requires External Infrastructure

For full enterprise high-availability deployment, the following external infrastructure is required:

1. **Managed PostgreSQL 16 Instance:**
   - With connection pooling (PgBouncer) for concurrent dealer ordering during morning mandi hours.
2. **Redis Cluster (v7+):**
   - For Celery task queue (asynchronous WhatsApp dispatches, automated daily reconciliation reports) and OTP rate limiting.
3. **AWS S3 or Cloudflare R2 Bucket:**
   - With CORS configuration for direct multipart upload of weighbridge CCTV snapshots and dealer claim images.
4. **Nginx Reverse Proxy with TLS 1.3:**
   - Terminating SSL/TLS with Let's Encrypt certificates for `api.bfel.in` and `flow.bfel.in`.

---

## 6. Known Limitations

1. **Local Windows Ampersand (`&`) Directory Bug:**
   - *Description:* The root directory path contains an ampersand: `...distribution-&-operations-platform`. The standard Windows shell (`cmd.exe`) treats `&` as a command separator, which breaks `.bin\next.cmd` and `.bin\playwright.cmd`.
   - *Resolution:* Node commands must be invoked directly using `node <path_to_binary>` (e.g. `node ./node_modules/@playwright/test/cli.js` or `node frontend/node_modules/next/dist/bin/next`).
2. **GST Invoicing System e-Way Bill Integration:**
   - *Description:* Gate Pass and LR numbers are generated internally. Direct integration with the Government of India NIC e-Way Bill API is not yet wired to this service.
3. **Single Active Weighbridge Bay Simulation:**
   - *Description:* In the local development seed, Bay 1 and Bay 2 share a single weighbridge scale model. In a multi-lane manufacturing mill, separate gross and tare platform scales operate concurrently.

---

## 7. Deployment Instructions

### A. Docker Compose Deployment (Recommended for Production)

1. **Clone and Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with production credentials (DATABASE_URL, DJANGO_SECRET_KEY, etc.)
   ```

2. **Launch Services:**
   ```bash
   docker-compose up -d --build
   ```

3. **Run Migrations & Seed Baseline Data:**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py seed_production_data
   docker-compose exec backend python manage.py collectstatic --noinput
   ```

4. **Verify Container Health:**
   ```bash
   docker-compose ps
   curl -I http://localhost:8000/api/v1/health/
   ```

### B. Manual Host Deployment (Development / Evaluation)

1. **Backend Setup:**
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py seed_production_data
   python manage.py runserver 127.0.0.1:8000
   ```

2. **Frontend Setup:**
   ```powershell
   # In a separate terminal
   cd frontend
   npm install
   node node_modules/next/dist/bin/next build
   node node_modules/next/dist/bin/next start -p 3000
   ```

3. **Run Verification Test Suites:**
   ```powershell
   # Backend Pytest Suite
   cd backend
   .\.venv\Scripts\pytest -v

   # Frontend Playwright Suite
   cd ..
   node frontend/node_modules/@playwright/test/cli.js test --config=frontend/playwright.config.ts
   ```

---

## 8. Remaining Production Risks

1. **Network Connectivity in Mandi Rural Belts:**
   - *Risk:* Retail feed dealers located in remote agricultural mandi yards (e.g. Tarana, Barwaha) frequently suffer intermittent 4G connectivity.
   - *Mitigation Implemented:* The frontend caches pending dealer visits and orders in localStorage. When the network drops, orders are held in the device offline queue and can be synced upon returning to signal coverage.
2. **Peak Hour Morning Demand Surges:**
   - *Risk:* 7:00 AM – 9:30 AM is peak order placement time across Madhya Pradesh mandi dealers. High concurrency can lock order numbers.
   - *Mitigation Implemented:* Order number generation uses database-level timestamp and random hexadecimal sequences with atomic database transactions (`select_for_update`) during truck allocation.
3. **Driver LR Discrepancies:**
   - *Risk:* Drivers may claim a shortage occurred due to transit damage, while the dealer claims bags were never loaded at the mill.
   - *Mitigation Implemented:* Gate clearance requires physical digital weighbridge net weight slip, security seal number, and photo evidence attachment on any subsequent claim before accounts can approve a credit note.

---

## Seeded Evaluation Credentials

The following pre-configured operational accounts are seeded in the database with password `Password123`:

| Role | Name | Phone | Email | Organization / Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Dealer** | Ramesh Patel | `9826041290` | `ramesh.patel@patelagro.in` | Patel Agro Agency, Dewas Mandi |
| **Sales Agent** | Vikram Chauhan | `9425088219` | `vikram.chauhan@bfel.in` | BFEL Field Sales - Malwa Region |
| **Distributor** | Sanjay Maheshwari | `9827033412` | `sanjay@malwaagrifeeds.com` | Malwa Agri Feeds Pvt Ltd, Indore |
| **Accounts** | Sunita Jain | `9893077140` | `sunita.jain@bfel.in` | Central Accounts & Finance Desk |
| **Loading Operator** | Kailash Verma | `9752019340` | `kailash.v@bfel.in` | Plant Dispatch Terminal Bay 3 |
| **Admin** | Rajeshwar Sharma | `9826100552` | `operations.head@bfel.in` | Central Operations Command Desk |

*(Note: In the login UI, clicking any role button under "Evaluation Demo Workspaces" automatically populates these credentials and initiates an authentic JWT authentication session).*
