# Project Review README

Senior engineering review for AI SQL Studio.

Review date: 2026-05-27

Scope reviewed:
- Backend Express API, routes, controllers, services, models, auth, admin, billing, AI flow, deployment config.
- Frontend React/Vite routes, auth contexts, API clients, dashboard pages, admin dashboard, billing/OAuth flows.
- Dependency audit, lint, smoke test.

Automated check results:
- Backend smoke test: PASS (`npm.cmd test` in `Backend_Part`).
- Frontend lint: FAIL (`AuthModal.jsx` has one unused variable).
- Backend npm audit: FAIL, 8 vulnerabilities reported, including high severity.
- Frontend npm audit: FAIL, 8 vulnerabilities reported, including high severity.
- Frontend build previously passed after admin dashboard edits, with a large bundle warning.

## Executive Summary

The project is functional and reasonably separated into frontend/backend layers, but it is not production-ready yet. The highest-risk areas are authentication/session handling, admin security, missing rate limits, payment callback trust boundaries, unbounded data access, weak automated test coverage, and vulnerable dependencies.

The next fix pass should prioritize security and correctness before UI polish.

## Critical And High Priority Findings

### 1. Auth, admin, OTP, AI, and payment endpoints have no active rate limiting

Affected files:
- `Backend_Part/src/app.js`
- `Backend_Part/src/routes/auth.routes.js`
- `Backend_Part/src/routes/admin.routes.js`
- `Backend_Part/src/routes/ai.routes.js`
- `Backend_Part/src/routes/payment.routes.js`

Evidence:
- `express-rate-limit` is installed, but no limiter is applied in `app.js` or route files.

Risk:
- Brute force attacks against login/admin login.
- OTP abuse and email bombing.
- AI endpoint cost exhaustion.
- Payment verification spam.

Recommended fix:
- Add route-specific limiters.
- Strictest limits for admin login, user login, forgot password, verify OTP.
- Add cost-aware throttling for `/api/ai`.
- Add rate limiting to payment verification endpoints.

### 2. Admin login has insecure default credentials

Affected file:
- `Backend_Part/src/services/admin.service.js`

Evidence:
- `getAdminCredentials()` falls back to `admin` / `Admin@123`.

Risk:
- If production env vars are missing, admin access becomes guessable.

Recommended fix:
- In production, fail startup if `ADMIN_USER_ID` or `ADMIN_PASSWORD` is missing.
- Require hashed admin password only.
- Remove plaintext fallback.
- Add admin login rate limiting.

### 3. JWT tokens are stored in `localStorage`

Affected files:
- `Frontend_Part/src/context/AuthContext.jsx`
- `Frontend_Part/src/context/AdminAuthContext.jsx`
- `Frontend_Part/src/services/api.js`
- `Frontend_Part/src/services/adminApi.js`

Risk:
- Any XSS can steal user and admin tokens.

Recommended fix:
- Move auth to secure, httpOnly, sameSite cookies.
- If keeping bearer tokens temporarily, reduce token lifetime, add refresh rotation, and harden CSP.
- Store admin session separately with stricter expiration and forced logout.

### 4. OAuth sends token and user JSON in the URL

Affected files:
- `Backend_Part/src/routes/auth.routes.js`
- `Frontend_Part/src/pages/OAuthSuccess.jsx`

Evidence:
- Backend redirects to `/oauth-success?token=...&user=...`.
- Frontend parses token from query params.

Risk:
- Tokens may leak via browser history, logs, screenshots, referrers, and analytics.

Recommended fix:
- Use an authorization code style callback.
- Set a secure httpOnly cookie server-side.
- Avoid sending user JSON in the URL.
- Clean the URL immediately if query-token flow is kept temporarily.

### 5. Payment link callback URL is client-controlled and not allowlisted

Affected file:
- `Backend_Part/src/services/payment.service.js`

Evidence:
- `createPaymentLink({ userId, callbackUrl })` accepts `callbackUrl` from the frontend and sends it directly to Razorpay.

Risk:
- Open redirect / callback abuse.
- Incorrect callback can break billing verification.
- User-controlled URLs should not be trusted for payment flows.

Recommended fix:
- Build callback URL on the backend from `FRONTEND_URL`.
- Validate against an allowlist if multiple frontend domains are supported.
- Do not accept arbitrary callback URLs from clients.

### 6. Payment link verification does not bind payment link reference to the user/session

Affected file:
- `Backend_Part/src/services/payment.service.js`

Evidence:
- `verifyHostedPaymentLink` verifies Razorpay signature and status, then upgrades `req.user.userId`.
- It does not persist payment link creation records and does not verify `reference_id` or Razorpay notes belong to the same user.

Risk:
- A valid paid callback could be replayed or associated with the wrong authenticated user if payment IDs/reference handling is abused.

Recommended fix:
- Persist payment link ID, reference ID, user ID, amount, and status at creation.
- During verification, require a matching pending record for the same user.
- Enforce amount/currency verification from Razorpay API or webhook.
- Prefer Razorpay webhooks for source-of-truth confirmation.

### 7. Dependency audit reports high severity vulnerabilities

Backend audit:
- 8 total vulnerabilities.
- High severity includes `axios`, `express-rate-limit`, `lodash`, `path-to-regexp`.
- Moderate includes `nodemailer`, `qs`, transitive packages.

Frontend audit:
- 8 total vulnerabilities.
- High severity includes `vite`, `rollup`, `flatted`, `minimatch`, `picomatch`.
- Moderate includes `ajv`, `brace-expansion`, `postcss`.

Recommended fix:
- Run safe dependency updates first.
- Re-run `npm audit`.
- If major updates are required, run smoke/build/lint after each package group.
- Backend: upgrade `axios`, `express-rate-limit`, `nodemailer`, Express-related transitive packages.
- Frontend: upgrade `vite`, Rollup, and lockfile transitive packages.

### 8. Query history endpoint is unpaginated

Affected files:
- `Backend_Part/src/services/query.service.js`
- `Frontend_Part/src/pages/dashboard/History.jsx`

Evidence:
- Backend returns all user queries from `Query.find({ userId })`.
- Frontend filters/sorts the full list client-side.

Risk:
- Slow dashboard for active users.
- Memory pressure and large API responses.
- Poor mobile performance.

Recommended fix:
- Add backend pagination, search, sort, and mode filtering.
- Update frontend to request pages.
- Add indexes on `{ userId, createdAt }`, `{ userId, mode }`, `{ userId, pinned }`.

## Medium Priority Bugs And Product Issues

### 9. Frontend lint currently fails

Affected file:
- `Frontend_Part/src/components/public/AuthModal.jsx`

Evidence:
- `Icon` is reported as unused by ESLint at line 36.

Recommended fix:
- Rename destructured prop to avoid lint false positive or render through `createElement`.
- Re-run `npm.cmd run lint`.

### 10. Route documentation does not match actual admin/frontend behavior

Affected files:
- `README.md`
- `Frontend_Part/src/services/adminService.js`
- `Backend_Part/src/routes/admin.routes.js`

Evidence:
- README lists admin routes that exist, but the frontend uses only `/admin/users/:id/moderate`, `/admin/feedback/:id/status`, and `/admin/security-events/:id/status`.
- Some documented routes are not surfaced in UI.

Risk:
- Confusing API contract.

Recommended fix:
- Decide one canonical admin moderation API.
- Remove or document unused route variants.
- Add API docs generated from route definitions if possible.

### 11. Duplicate query route alias

Affected file:
- `Backend_Part/src/app.js`

Evidence:
- Both `/api/queries` and `/api/query` mount the same router.

Risk:
- Unnecessary API surface and testing burden.

Recommended fix:
- Keep `/api/queries`.
- Remove `/api/query` or mark as deprecated with tests.

### 12. Google OAuth account linking can create duplicate users

Affected file:
- `Backend_Part/src/config/passport.js`

Evidence:
- Lookup is by `googleId` only.
- If an email/password user later signs in with Google using the same email, code attempts to create a new user with the same email.

Risk:
- Duplicate key errors.
- Broken OAuth sign-in for existing users.

Recommended fix:
- First find by `googleId`.
- If absent, find by email and attach `googleId`.
- Validate `profile.emails?.[0]?.value` exists before creating.

### 13. Forgot password leaks whether an email exists

Affected file:
- `Backend_Part/src/services/auth.service.js`

Evidence:
- Unknown email returns `404 User not found`.

Risk:
- Account enumeration.

Recommended fix:
- Always return a generic success response.
- Log security events internally only.

### 14. Password reset and change password validation is inconsistent

Affected files:
- `Backend_Part/src/routes/auth.routes.js`
- `Backend_Part/src/services/auth.service.js`
- `Backend_Part/src/validators/auth.validator.js`

Evidence:
- Register/login have validators.
- Forgot password, verify OTP, update profile, change password do not use equivalent route-level validators.
- `changeUserPassword` does not enforce the same password complexity as registration.

Recommended fix:
- Add validators for all auth mutation routes.
- Reuse password policy helper.

### 15. AI request usage count is incremented before the AI request succeeds

Affected file:
- `Backend_Part/src/services/ai.service.js`

Evidence:
- `checkAndUpdateUsage(user._id)` runs before `callGemini`.

Risk:
- Users lose free credits when Gemini fails or times out.

Recommended fix:
- Track attempts separately from successful usage.
- Increment free credit only after successful result save.
- Add anti-abuse rate limit separately.

### 16. AI `format` mode is free but still saved as query only if it passed AI path

Affected file:
- `Backend_Part/src/services/ai.service.js`

Evidence:
- `format` returns early before `Query.create`.

Risk:
- Product inconsistency: UI may imply all tools appear in history, but format does not.

Recommended fix:
- Decide desired behavior.
- Save format operations if history should include them, or hide `format` from history expectations.

### 17. Schema model contains corrupted comment characters

Affected file:
- `Backend_Part/src/models/Schema.js`

Evidence:
- Comment shows mojibake: `// ðŸ”¥ prevent abuse`.

Risk:
- Low functional risk, but poor code quality.

Recommended fix:
- Replace with ASCII comment or remove comment.

### 18. Admin delete is not transactional

Affected file:
- `Backend_Part/src/services/admin.service.js`

Evidence:
- Delete action runs several `deleteMany` calls plus `User.findByIdAndDelete` in `Promise.all`.

Risk:
- Partial deletes if one operation fails.
- Hard to recover data.

Recommended fix:
- Use MongoDB transactions where available.
- Soft-delete users first, then async cleanup.
- Keep audit/security logs even after user deletion.

### 19. Regex search is not escaped

Affected file:
- `Backend_Part/src/services/admin.service.js`

Evidence:
- Search text is injected into `$regex` for users, feedback, and security events.

Risk:
- Regex denial-of-service for crafted patterns.
- Unexpected matches.

Recommended fix:
- Escape regex metacharacters.
- Consider text indexes.
- Cap search length.

### 20. No request body size limits per route

Affected file:
- `Backend_Part/src/app.js`

Evidence:
- Uses `express.json()` with default limit.

Risk:
- Large request bodies can waste memory, especially AI/schema endpoints.

Recommended fix:
- Set global JSON limit, for example `express.json({ limit: "100kb" })`.
- Add stricter route-specific limits where needed.

### 21. Backend test script is only import smoke testing

Affected file:
- `Backend_Part/package.json`

Evidence:
- `npm test` only requires modules.

Risk:
- Does not verify auth, payments, admin moderation, AI validation, or database behavior.

Recommended fix:
- Add integration tests with Supertest and a test MongoDB.
- Cover auth, OTP, admin auth, AI limits, payment verification, and query ownership.

### 22. Frontend has no unit/component tests

Affected files:
- `Frontend_Part/package.json`
- frontend source tree

Risk:
- UI regressions are likely when changing dashboard/auth/payment flows.

Recommended fix:
- Add Vitest + React Testing Library.
- Add smoke tests for route guards, auth context, payment success, history filtering, and admin dashboard state.

## Code Quality, Duplication, And Reusability Issues

### 23. Repeated card, badge, button, empty-state, and skeleton styles

Affected areas:
- `Frontend_Part/src/pages/dashboard/*`
- `Frontend_Part/src/pages/admin/AdminDashboard.jsx`
- `Frontend_Part/src/components/ai/*`

Risk:
- UI changes require editing many pages.
- Style consistency drifts, as seen in admin dashboard sizing.

Recommended fix:
- Create shared UI primitives:
  - `PageHeader`
  - `MetricCard`
  - `Panel`
  - `StatusBadge`
  - `IconButton`
  - `EmptyState`
  - `Pager`
  - `SearchInput`

### 24. AdminDashboard is too large and mixes data, behavior, and rendering

Affected file:
- `Frontend_Part/src/pages/admin/AdminDashboard.jsx`

Risk:
- Hard to test and maintain.
- Multiple concerns in one component: fetching, charts, tables, moderation prompts, feedback, security events, recent activity.

Recommended fix:
- Split into:
  - `AdminSummary`
  - `AdminCharts`
  - `AdminUsersTable`
  - `AdminSecurityPanel`
  - `AdminFeedbackTriage`
  - `AdminActivityPanels`
  - `useAdminDashboardData`

### 25. Browser `prompt` and `confirm` are used for destructive admin/user actions

Affected files:
- `Frontend_Part/src/pages/admin/AdminDashboard.jsx`
- `Frontend_Part/src/pages/dashboard/History.jsx`
- `Frontend_Part/src/pages/dashboard/Settings.jsx`
- `Frontend_Part/src/pages/Billing.jsx`
- `Frontend_Part/src/pages/dashboard/Pricing.jsx`

Risk:
- Poor UX.
- Hard to validate reason input.
- Hard to test.

Recommended fix:
- Replace with reusable modal dialog components.
- Require typed confirmation for destructive actions.
- Validate moderation reason before submit.

### 26. API client does not centralize 401/403 handling

Affected file:
- `Frontend_Part/src/services/httpClient.js`

Risk:
- Expired tokens produce inconsistent user experience.
- Admin/user sessions may stay stale in local storage.

Recommended fix:
- Add optional `onUnauthorized` handler.
- Clear relevant session and redirect to login/admin login.
- Preserve original destination if useful.

### 27. Console logging is scattered

Affected files:
- Multiple backend utils and frontend pages.

Risk:
- No structured logs.
- Potential sensitive info leakage in production.

Recommended fix:
- Add a small logger wrapper.
- Suppress or redact sensitive errors in production.
- Keep user-facing errors generic.

## Deployment And Configuration Issues

### 28. Render frontend env var mapping is suspicious

Affected file:
- `render.yaml`

Evidence:
- `VITE_API_BASE_URL` and `VITE_GOOGLE_AUTH_URL` include both `fromService` and `value`.

Risk:
- Render may not interpolate as expected.
- Frontend may build with wrong API URLs.

Recommended fix:
- Use explicit values or documented Render env linking syntax.
- Validate deployed frontend build env after deploy.

### 29. Production startup does not validate required env vars

Affected files:
- `Backend_Part/src/server.js`
- backend config/service files

Risk:
- App can boot with missing secrets and fail later.
- Dangerous defaults for admin credentials.

Recommended fix:
- Add `config/env.js` validation.
- Fail fast in production for missing `JWT_SECRET`, `MONGO_URI`, `ADMIN_USER_ID`, `ADMIN_PASSWORD`, `FRONTEND_URL`, `CORS_ORIGIN`.
- Validate integration secrets only when features are enabled.

### 30. Large frontend bundle warning

Affected area:
- Frontend build output.

Evidence:
- Vite reports main JS chunk around 963 kB minified.

Risk:
- Slower initial load.

Recommended fix:
- Lazy-load dashboard/admin/public route groups.
- Split Recharts/admin dashboard into separate chunks.
- Use `React.lazy` and route-level suspense.

## Recommended Fix Order

1. Fix dependency vulnerabilities and lockfiles.
2. Add env validation and remove insecure admin defaults.
3. Add rate limiting and body size limits.
4. Harden OAuth token handling and localStorage session strategy.
5. Harden payment link creation/verification.
6. Add query history pagination and backend filtering.
7. Fix lint and add baseline tests.
8. Refactor shared frontend UI primitives.
9. Split AdminDashboard into smaller components.
10. Clean docs, deployment config, and duplicate route aliases.

## Immediate Fix Checklist

- [ ] Fix frontend lint error in `AuthModal.jsx`.
- [ ] Upgrade vulnerable backend dependencies.
- [ ] Upgrade vulnerable frontend dependencies.
- [ ] Add auth/admin/OTP/AI/payment rate limiters.
- [ ] Replace admin credential fallback with production env validation.
- [ ] Restrict payment callback URL to trusted frontend URL.
- [ ] Add payment link persistence and user binding.
- [ ] Stop putting OAuth JWTs in query params.
- [ ] Add backend pagination for query history.
- [ ] Escape admin regex search input.
- [ ] Replace browser prompts/confirms with modals.
- [ ] Add basic integration and UI tests.
