# SaathCare — Website Add-ons & Product Enhancements Specification

This document details the architectural implementation, database schemas, API routes, security posture, and frontend components introduced across Phases 1 through 19 of the SaathCare platform.

---

## 1. Contact Us (Phase 1)
- **Model**: `ContactMessage` in `server/src/models/ContactMessage.js` storing `name`, `email`, `subject`, `message`, `emailSent`, and timestamps.
- **Validation**: Zod schema (`contactSchema` in `server/src/validators/contact.validators.js`) enforcing length constraints (min 3 characters for message, max 5000), email validation, and honeypot detection.
- **Service & Resilience**: `ContactService.submitMessage` saves every inquiry to MongoDB first before attempting acknowledgment email dispatch. If third-party email transports experience transient outages or rate limits, the request succeeds and the record is safely retained in the database.
- **Spam Mitigation & Rate Limiting**: Honeypot field `website_url` silently drops bot traffic without database write or email execution. Endpoint is protected by `contactLimiter` (5 submissions per 15 minutes per IP).
- **Frontend**: `ContactForm.jsx` with input sanitization, dynamic submit states (idle, submitting, success, error), and accessible error banners embedded in `LandingPage.jsx`.

---

## 2. Light / Dark Dual Theme (Phase 2)
- **CSS Architecture**: Defined CSS custom properties in `client/src/index.css` for both dark mode (`:root`) and light mode (`[data-theme="light"]`).
- **Context & Storage**: `ThemeContext.jsx` detects operating system preference (`prefers-color-scheme`) and persists user selection to `localStorage`.
- **Theme Toggle**: Accessible `ThemeToggle.jsx` component placed in both the public landing page header and authenticated top navigation bar.

---

## 3. "What We Do" (Phase 3)
- Implemented in `LandingPage.jsx` detailing SaathCare's 4 core capabilities:
  1. **Coordinate Care Duties**: Explicit sibling assignment, medication schedules, and automated missed-task detection.
  2. **Append-Only Cost Ledger**: Immutable financial accounting, integer-paise precision, and receipt attachments.
  3. **Real-Time Live Sync**: WebSocket event distribution across time zones.
  4. **Settle Up Without Friction**: Greedy debt-minimization algorithm minimizing sibling transfers.

---

## 4. "How It Works" (Phase 4)
- A 4-step workflow section in `LandingPage.jsx`:
  - **Step 1: Create Care Profile**: Emergency contacts, blood group, physician info.
  - **Step 2: Invite Family Members**: One-click invitations for siblings and caregivers.
  - **Step 3: Schedule Care Duties**: Medication routines and vitals tracking.
  - **Step 4: Track & Settle Expenses**: Upload receipts, calculate net balances, and settle debts.

---

## 5. Interactive Onboarding Walkthrough (Phase 5)
- **Backend**: Added `hasSeenOnboarding` boolean to `User` model, with `PATCH /api/auth/onboarding` endpoint.
- **Frontend**: `OnboardingTour.jsx` provides a 5-step interactive guide with progress indicators, skip capabilities, and automatic trigger for new accounts, with on-demand access via "Tour Guide" in the dashboard.

---

## 6. Real-Data Usage Statistics (Phase 6)
- **API**: `GET /api/stats` endpoint returning aggregated real database metrics:
  - `activeFamilies`: Total count of family care groups.
  - `totalCaregivers`: Total verified users on the platform.
  - `completedDuties`: Total completed care tasks.
  - `totalExpensesPaise`: Aggregate volume of healthcare expenditures tracked.
- **In-Memory Caching**: 15-minute cache TTL prevents heavy database aggregation on high-traffic public landing page views.
- **Zero Synthetic Numbers**: All figures reflect actual system usage.

---

## 7. Real-Time In-App Notification Center (Phase 7)
- **Model**: `Notification` (`server/src/models/Notification.js`) indexed on `{ userId: 1, read: 1, createdAt: -1 }`.
- **Live Dispatch**: Sockets automatically join user room `user:<userId>`. When events occur (duty assigned, duty completed, duty missed, expense logged, expense reversed), `InAppNotificationService` creates a record and emits `notification:new`.
- **Drawer Component**: `NotificationDrawer.jsx` in the top navigation bar displays unread badge counters, live event feeds, and "Mark all as read" functionality.

---

## 8. Interactive Calendar View (Phase 8)
- **Component**: `TaskCalendar.jsx` in `client/src/components/calendar/TaskCalendar.jsx`.
- **Features**: Monthly grid view, weekday headers, task indicators color-coded by status (pending, completed, missed), month navigation, "Today" shortcut, and an integrated Day Inspector allowing direct duty completion.
- **View Switcher**: Toggle between List and Calendar views in `TasksPage.jsx`.

---

## 9. Dashboard Analytics & Category Breakdown (Phase 9)
- **Component**: `CategoryExpenseAnalytics.jsx` in `client/src/components/dashboard/CategoryExpenseAnalytics.jsx`.
- **Visualization**: Pure CSS & React multi-segment progress bar and cards showing percentage of expenditure and INR amounts grouped by medical category.
- **Zero Heavy Dependencies**: Avoids bulky charting libraries (Chart.js, D3) to maintain fast page load.

---

## 10. Expanded Expense Categories (Phase 10)
- Categories expanded in both backend (`server/src/constants/splitType.js`) and frontend (`client/src/utils/constants.js`):
  - `MEDICINE`, `DOCTOR`, `FOOD`, `GROCERY`, `TRANSPORT`, `BILLS`, `CAREGIVER`, `EQUIPMENT`, `OTHER`.
- Filter pills added to `ExpensesPage.jsx` for quick category-based filtering.

---

## 11. Enhanced Receipts UX (Phase 11)
- **Component**: `ReceiptPreviewModal.jsx` in `client/src/components/modals/ReceiptPreviewModal.jsx`.
- **Capabilities**: In-app document and image viewer, zoom controls (zoom in, zoom out, reset scale), and direct download button.

---

## 12. Care Recipient & Emergency Information Vault (Phase 12)
- **Schema**: `careInfo` subdocument on `FamilyGroup` (`emergencyContact`, `primaryDoctor`, `bloodGroup`, `allergies`, `importantNotes`).
- **Endpoint**: `PATCH /api/family-groups/:familyGroupId/care-info`.
- **Components**:
  - `CareInfoCard.jsx`: Emergency directory card on the main dashboard with click-to-call links.
  - `EditCareInfoModal.jsx`: Modal for editing and updating critical medical information.

---

## 13. PWA & Mobile Ergonomics (Phase 13)
- **Service Worker**: `client/public/sw.js` with stale-while-revalidate for static assets, network-bypass for authenticated API and WebSocket routes, and offline fallback.
- **Manifest**: `manifest.json` configured with standalone display mode and theme color.

---

## 14. Accessibility Standards (Phase 14)
- Focus visibility (`:focus-visible`) styling in `index.css`.
- `prefers-reduced-motion` media queries disabling animations for users with vestibular sensitivities.
- Screen reader helper `.sr-only` class and ARIA roles (`role="dialog"`, `aria-modal="true"`, `aria-label`).

---

## 15. Performance Optimization (Phase 15)
- Code-splitting with `React.lazy` and `React.Suspense` across authenticated application routes (`DashboardPage`, `TasksPage`, `ExpensesPage`, `SettlementsPage`, `FamilyDetailPage`).
- Clean bundle distribution verified via Vite build.

---

## 16. Security Hardening (Phase 16)
- Honeypot anti-bot protection on public forms.
- Rate limiting on contact endpoints (5 req / 15m) and authentication endpoints.
- Strict family isolation on all care records and emergency contact details.
- Integer-paise precision to eliminate floating-point drift in ledger calculations.

---

## 17. Automated Testing (Phase 17)
- 16 test suites and 57 unit/integration tests running under Vitest, covering:
  - Contact Us validators, honeypots, and service error resilience (`contact.test.js`).
  - Public statistics calculation and cache behavior (`stats.test.js`).
  - In-app notification creation and real-time socket delivery (`inAppNotification.test.js`).
  - Immutability of the expense ledger, idempotency keys, debt minimization, account anonymization, and notification outbox workers.

---

## 18. CI / CD Pipeline (Phase 18)
- GitHub Actions CI workflow in `.github/workflows/deploy.yml` verifying linting, unit testing, integration testing, and build compilation on every pull request and push to `main`.

---

## 19. Documentation (Phase 19)
- Complete technical and architectural reference in `docs/website-addons.md` and updated `README.md`.
