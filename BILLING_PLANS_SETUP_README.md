# Free, Pro, and Team Billing Setup Guide

Updated: 2026-05-29

This guide is the step-by-step plan for turning the app into a real Free, Pro, and Team SaaS billing system.

The most important rule: choose one billing provider as the payment source of truth. Do not run Clerk Billing and Razorpay as two independent checkout systems for the same plans.

Implementation update for this project: Razorpay is the billing source of truth, Clerk is only for auth and organizations, and Team is purchased before organization creation. Free and Pro users stay in the personal workspace. After a user buys Team, the app unlocks Clerk organization creation/switching and treats that Team entitlement as the access source for the team workspace.

## 0. Current Project Reality

Your app already has most of the product-side plan gates:

- Backend recognizes `free`, `pro`, `team`, and `business` in `Backend_Part/src/utils/planAccess.js`.
- Frontend recognizes paid plans in `Frontend_Part/src/utils/planAccess.js`.
- Free users can generate SQL only.
- Pro-or-higher users can use schema generation, optimize, format, validate, explain, analytics, history actions, and API-key features.
- The dashboard billing page currently renders Clerk's `<PricingTable />` from `Frontend_Part/src/components/clerk/ClerkBillingPanel.jsx`.
- The backend still has Razorpay payment routes and invoice code.
- Public landing pricing currently shows only Starter and Professional in `Frontend_Part/src/config/productConfig.js`.

What is missing for a real Team plan:

- A clear payment-provider decision.
- Organization-level billing state.
- Effective-plan resolution for the active workspace.
- Team pricing card/UI.
- Team checkout flow.
- Team webhook sync.
- Tests for personal Pro versus organization Team.

## 1. Billing Provider Decision

### Recommended For Your Current App: Razorpay For Payments, Clerk For Auth/Organizations

Your current public prices are in INR, and the backend already has Razorpay logic. Clerk's Billing docs currently say Billing is beta, USD-only, and not supported in India. Because of that, the safer production path for your current market is:

- Clerk handles login, user identity, organizations, roles, invitations, and workspace switching.
- Razorpay handles INR checkout, payment links/orders, refunds, and Indian payment methods.
- MongoDB stores the app subscription state.
- Backend plan middleware reads MongoDB to decide feature access.

Use this path if your customers are in India or you need INR pricing.

### Alternative: Clerk Billing For Supported USD Markets

Use Clerk Billing only if:

- You are okay with USD pricing.
- Your customer country/region is supported by Clerk Billing.
- You accept Clerk Billing beta/API-change risk.
- You want Clerk's hosted pricing table and billing UI to own checkout.

If you choose Clerk Billing, pin Clerk SDK versions instead of floating `^` ranges before production.

## 2. Final Plan Model

Use these slugs everywhere:

```txt
free
pro
team
```

Do not use random slugs like `professional-monthly`, `team-plan`, or `paid`. If the payment provider forces a different product/price ID, map it to these app slugs in the backend.

## 3. Plan Feature Matrix

| Feature | Free | Pro | Team |
| --- | --- | --- | --- |
| Scope | Personal user | Personal user | Team workspace entitlement |
| Price suggestion | INR 0 | INR 499/month | INR 1499/month |
| SQL query generation | Yes | Yes | Yes |
| Free credits | 5 total | No app-side limit | No app-side limit |
| SQL dialect selection | Standard only | All supported dialects | All supported dialects |
| Generate schema from English | No | Yes | Yes |
| Optimize SQL | No | Yes | Yes |
| Format SQL | No | Yes | Yes |
| Validate SQL | No | Yes | Yes |
| Explain SQL | No | Yes | Yes |
| Saved schema context | 1 personal schema | Personal schema | Shared org schema |
| History | Latest 10 | Full personal history | Shared org history |
| Pins/favorites/tags | No | Yes | Yes |
| Analytics | Basic overview | Advanced personal analytics | Organization analytics |
| API keys | No | Yes | Optional later |
| Organization members | No billing benefit | Can join orgs, but plan is personal | Included |
| Billing owner | None | User | User who bought Team |

Team should not be available as a free Clerk organization switcher. In this implementation, `user.plan = team` unlocks the ability to create/use team workspaces; a Clerk organization subscription record can also be created after organization creation so invited members inherit Team access inside that organization.

## 4. Source Of Truth

Use this hierarchy:

```txt
Clerk
  - user identity
  - organization identity
  - organization membership
  - roles and permissions

Payment provider
  - actual checkout
  - payment status
  - payment IDs
  - payment webhooks

MongoDB
  - app plan snapshot
  - billing renewal date
  - active subscription scope
  - invoice/audit records

Backend middleware
  - final feature-access decision
```

The frontend can hide locked features, but the backend must enforce every paid feature.

## 5. Data Model To Add For Team

Keep `User.plan` for personal Free/Pro access. Add a separate organization subscription model for Team.

Create something like:

```txt
Backend_Part/src/models/OrganizationSubscription.js
```

Recommended fields:

```js
{
  clerkOrgId: { type: String, required: true, unique: true, index: true },
  plan: { type: String, enum: ["free", "team", "business"], default: "free" },
  status: { type: String, default: "free", index: true },
  billingProvider: { type: String, enum: ["razorpay", "clerk", "manual"], default: "manual" },
  providerCustomerId: { type: String, default: null, index: true },
  providerSubscriptionId: { type: String, default: null, index: true },
  providerPaymentId: { type: String, default: null, index: true },
  currentPeriodEnd: { type: Date, default: null },
  seatsIncluded: { type: Number, default: 5 },
  seatsUsed: { type: Number, default: 1 },
  createdByClerkUserId: { type: String, default: null, index: true },
  lastWebhookEventId: { type: String, default: null, index: true }
}
```

Why separate model:

- Personal Pro belongs to a user.
- Team belongs to an organization.
- One user can belong to many organizations.
- An organization can continue to be paid even if one member leaves.

## 6. Effective Plan Resolver

Add one backend helper that every paid gate uses.

Suggested file:

```txt
Backend_Part/src/utils/effectivePlan.js
```

Behavior:

```txt
If request has active clerkOrgId:
  load OrganizationSubscription by clerkOrgId
  if org plan is team/business and active:
    return team/business
  otherwise:
    return free

If request has no active clerkOrgId:
  return user.plan
```

Important: do not let a user's personal Pro plan automatically unlock paid tools for the whole organization. Otherwise one Pro user could accidentally give Pro features to every workspace member.

Files that should use the effective plan:

- `Backend_Part/src/middlewares/plan.middleware.js`
- `Backend_Part/src/services/ai.service.js`
- `Backend_Part/src/services/query.service.js`
- `Backend_Part/src/utils/usageManager.js`
- Any API-key, analytics, export, history-tag, pin, or favorite gates

Return the effective plan in auth/current-user responses so the frontend can display the right state for the active workspace.

## 7. Backend Implementation Order

### Step 1: Keep Existing Plan Slugs

Current backend file:

```txt
Backend_Part/src/utils/planAccess.js
```

Keep:

```js
free: 0,
pro: 1,
team: 2,
business: 3
```

Do not remove `team`; it is already useful.

### Step 2: Add Organization Subscription Model

Add:

```txt
Backend_Part/src/models/OrganizationSubscription.js
```

Indexes:

- Unique `clerkOrgId`.
- Index `plan`.
- Index `status`.
- Index `currentPeriodEnd`.
- Sparse index for provider subscription/payment IDs.

### Step 3: Add Effective Plan Helper

Add:

```txt
Backend_Part/src/utils/effectivePlan.js
```

Then replace direct checks like:

```js
hasPlan(user, "pro")
```

with:

```js
hasPlan(effectivePlan, "pro")
```

where organization requests resolve from the organization subscription.

### Step 4: Add Current Billing Endpoint

Create or update a route that returns:

```json
{
  "scope": "personal",
  "plan": "pro",
  "status": "active",
  "renewal": "2026-06-29T00:00:00.000Z",
  "canManageBilling": true
}
```

For organization workspace:

```json
{
  "scope": "organization",
  "clerkOrgId": "org_xxx",
  "plan": "team",
  "status": "active",
  "renewal": "2026-06-29T00:00:00.000Z",
  "seatsIncluded": 5,
  "seatsUsed": 3,
  "canManageBilling": true
}
```

Suggested endpoint:

```txt
GET /api/payment/current
```

or:

```txt
GET /api/billing/current
```

Use the second name if you refactor the payment module.

### Step 5: Extend Razorpay Checkout For Plan And Scope

Current routes:

```txt
POST /api/payment/create-order
POST /api/payment/create-payment-link
POST /api/payment/verify
POST /api/payment/verify-payment-link
POST /api/payment/downgrade
GET  /api/payment/invoices
POST /api/payment/webhook
```

Extend checkout payload:

```json
{
  "plan": "team",
  "scope": "organization",
  "clerkOrgId": "org_xxx"
}
```

For Pro:

```json
{
  "plan": "pro",
  "scope": "personal"
}
```

Server-side rules:

- `free` cannot create checkout.
- `pro` checkout must be personal scope.
- `team` checkout can be personal scope first so the buyer can unlock organization creation.
- Organization-scoped Team checkout is optional later for org-admin billing.
- Free and Pro users must not see Clerk organization creation as an available workspace feature.
- Never trust amount, currency, or renewal date from the frontend.

### Step 6: Extend Subscription Service

Current file:

```txt
Backend_Part/src/services/subscription.service.js
```

It currently handles Pro at INR 499. Extend it to support:

```js
const PLAN_PRICES_INR = {
  pro: 499,
  team: 1499
};
```

Add functions:

```txt
activatePersonalPro(user, renewalDate)
activateOrganizationTeam(clerkOrgId, renewalDate, metadata)
downgradePersonalToFree(user)
downgradeOrganizationToFree(clerkOrgId)
downgradeExpiredSubscriptions()
```

Do not downgrade all Team members. Downgrade the organization subscription record.

### Step 7: Extend Invoices

Current invoice model is user-focused. Add scope fields:

```js
scope: { type: String, enum: ["personal", "organization"], default: "personal" },
clerkOrgId: { type: String, default: null, index: true },
plan: { type: String, enum: ["pro", "team"], required: true }
```

Invoice visibility:

- Personal invoices: visible to that user.
- Organization invoices: visible only to org admins/billing managers.

### Step 8: Update Admin Tools

Current admin toggle appears to switch only Free/Pro. Update it so admin can:

- Set personal user to Free.
- Set personal user to Pro.
- View organization subscriptions.
- Set organization subscription to Free or Team manually for support/testing.

Do not let admin accidentally set `user.plan = team` for normal Team billing. Team should live on the organization subscription model.

## 8. Frontend Implementation Order

### Step 1: Add Team Pricing Card

Current file:

```txt
Frontend_Part/src/config/productConfig.js
```

Add a third plan:

```txt
Team
INR 1499 / month
```

Team card features:

- Everything in Pro.
- Shared organization schema context.
- Shared organization history.
- Member invitations through Clerk Organizations.
- Admin billing controls.
- Team analytics.
- 5 seats included.

### Step 2: Update Landing Pricing

Current file:

```txt
Frontend_Part/src/pages/Landing.jsx
```

It maps `PRICING_PLANS`, so adding Team to config should show the card automatically. Test mobile layout after adding the third card.

### Step 3: Update Dashboard Billing Page

Current file:

```txt
Frontend_Part/src/pages/dashboard/Pricing.jsx
```

Recommended UI:

- Show current active workspace at top: Personal or organization name.
- Show effective plan for that workspace.
- Show Pro checkout when in personal workspace.
- Show Team checkout from personal workspace.
- After Team is active, show Clerk organization creation/switching.
- If Team is not active, show a locked Team workspace card instead of Clerk organization controls.

### Step 4: Replace Or Split Clerk PricingTable Depending On Provider

If using Razorpay:

- Do not rely on Clerk `<PricingTable />` for checkout.
- Build your own plan cards/buttons.
- Buttons call your backend payment endpoints.

If using Clerk Billing:

- Keep `Frontend_Part/src/components/clerk/ClerkBillingPanel.jsx`.
- For personal Pro, render:

```jsx
<PricingTable for="user" highlightedPlan="pro" />
```

- For Team, render:

```jsx
<PricingTable for="organization" highlightedPlan="team" />
```

Only do this if Clerk Billing is valid for your target market.

### Step 5: Update Frontend Plan State

Current file:

```txt
Frontend_Part/src/context/AuthContext.jsx
```

Add or consume backend data for:

```js
user.plan
activeWorkspacePlan
activeWorkspaceScope
activeWorkspaceBillingStatus
canManageBilling
```

Use `activeWorkspacePlan` for dashboard feature locks, not only `user.plan`.

Files to review:

- `Frontend_Part/src/pages/dashboard/Generate.jsx`
- `Frontend_Part/src/pages/dashboard/History.jsx`
- `Frontend_Part/src/pages/dashboard/Analytics.jsx`
- `Frontend_Part/src/components/layout/Sidebar.jsx`
- `Frontend_Part/src/pages/dashboard/Overview.jsx`
- `Frontend_Part/src/pages/dashboard/Settings.jsx`

## 9. Razorpay Setup Path

Use this path if you want INR/India billing.

### Razorpay Dashboard

Create products/plans conceptually:

- Pro: INR 499 monthly.
- Team: INR 1499 monthly.

If you use Razorpay payment links/orders instead of subscriptions, your backend must create the renewal date and downgrade expired plans with a cron job.

### Required Backend Env

```env
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
FRONTEND_URL=http://localhost:5173
```

Production:

```env
FRONTEND_URL=https://your-production-frontend.com
```

### Razorpay Webhook Events

Enable only the events your code handles. For the current code, confirm these before production:

- payment captured
- payment link paid
- subscription charged, if you move to Razorpay subscriptions
- subscription cancelled, if you move to Razorpay subscriptions

Webhook URL:

```txt
https://your-backend-domain.com/api/payment/webhook
```

### Razorpay Security Rules

- Verify webhook signature on raw body.
- Store provider event IDs or payment IDs to make processing idempotent.
- Never upgrade plan from a frontend success page alone.
- The success page can show "payment received", but backend should upgrade only after signature/webhook verification.
- Log failed webhook attempts without storing secrets.

## 10. Clerk Billing Setup Path

Use this path only if Clerk Billing fits your target market.

### Clerk Dashboard

Create these plans:

```txt
free
pro
team
```

Recommended setup:

- `free`: default free plan.
- `pro`: user plan.
- `team`: organization plan.

Clerk automatically uses the free plan as the default plan when Billing is enabled.

### Pricing Table

For user plans:

```jsx
<PricingTable for="user" highlightedPlan="pro" />
```

For organization plans:

```jsx
<PricingTable for="organization" highlightedPlan="team" />
```

The app currently renders `<PricingTable />` without `for`, so it defaults to user plans. You must add organization pricing support before Team checkout can work through Clerk Billing.

### Clerk Webhook URL

Local:

```txt
http://localhost:5000/api/webhooks/clerk
```

Production:

```txt
https://your-backend-domain.com/api/webhooks/clerk
```

### Clerk Webhook Events To Enable

User/org sync:

```txt
user.created
user.updated
user.deleted
organization.created
organization.updated
organization.deleted
organizationMembership.created
organizationMembership.updated
organizationMembership.deleted
```

Billing sync:

```txt
subscription.created
subscription.updated
subscription.active
subscription.pastDue
subscriptionItem.updated
subscriptionItem.active
subscriptionItem.canceled
subscriptionItem.upcoming
subscriptionItem.ended
subscriptionItem.abandoned
subscriptionItem.incomplete
subscriptionItem.pastDue
paymentAttempt.created
paymentAttempt.updated
```

Important code note: current `Backend_Part/src/controllers/clerkWebhook.controller.js` handles `subscription.*` and `billing.*`, but not `subscriptionItem.*` or `paymentAttempt.*`. If you choose Clerk Billing, update this controller before relying on it.

### Required Backend Env

```env
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### Required Frontend Env

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

## 11. Organizations And Team Plan Rules

Enable Clerk Organizations in the Clerk Dashboard.

Team billing rules:

- A user buys Team before creating the team workspace.
- Team unlocks Clerk organization creation/switching in the app UI.
- Organization-scoped Team billing can still be used later for org-admin billing.
- Personal workspace should still use the user's personal Free/Pro plan.
- Organization data should stay scoped by `clerkOrgId`.

Already relevant files:

- `Backend_Part/src/utils/workspaceScope.js`
- `Frontend_Part/src/components/clerk/WorkspaceSwitcher.jsx`
- `Frontend_Part/src/context/AuthContext.jsx`
- `Frontend_Part/src/pages/dashboard/Schema.jsx`
- `Frontend_Part/src/pages/dashboard/Generate.jsx`

## 12. Feature Gates To Recheck

Free users:

- Can run `generate` only.
- Cannot choose non-standard dialects.
- Cannot use schema generation, optimize, format, validate, or explain.
- Cannot use advanced analytics.
- Cannot use pins/favorites/tags.
- Cannot use API keys.

Pro users:

- Personal workspace gets all paid tools.
- Organization workspace stays locked until Team is active.

Team organizations:

- Buyer can create/select a team workspace after Team payment.
- Organization workspace gets paid tools.
- Shared org schema/history should work.
- Members should inherit Team access inside an activated Team organization.
- Team includes all Pro features.

## 13. Suggested API Shape

Even if you keep current route names, aim for this behavior.

### Get Current Billing State

```txt
GET /api/billing/current
```

Response:

```json
{
  "scope": "organization",
  "plan": "team",
  "status": "active",
  "renewal": "2026-06-29T00:00:00.000Z",
  "canManageBilling": true
}
```

### Create Checkout

```txt
POST /api/billing/checkout
```

Body:

```json
{
  "plan": "team",
  "scope": "organization"
}
```

Backend derives:

- amount
- currency
- user ID
- org ID
- callback URL
- renewal date

### Downgrade

```txt
POST /api/billing/downgrade
```

Body:

```json
{
  "scope": "organization"
}
```

Backend checks permission and downgrades the correct subscription.

## 14. Testing Checklist

### Free Personal User

[ ] Sign up as a new user.
[ ] Confirm plan is `free`.
[ ] Generate SQL 5 times.
[ ] Confirm 6th AI request is blocked.
[ ] Confirm schema generation is blocked.
[ ] Confirm optimize/format/validate/explain are blocked.
[ ] Confirm dialect selector is locked to Standard SQL.
[ ] Confirm history only shows latest 10.

### Pro Personal User

[ ] Buy Pro or manually set user to `pro` locally.
[ ] Confirm personal workspace shows Pro.
[ ] Confirm all AI tools work.
[ ] Confirm dialect selector works.
[ ] Confirm full history works.
[ ] Confirm pins/favorites/tags work.
[ ] Confirm analytics page opens.
[ ] Confirm API-key UI opens.

### Team Organization

[ ] Buy Team.
[ ] Confirm Clerk organization creation/switching appears after Team activation.
[ ] Create an organization.
[ ] Switch into the organization.
[ ] Confirm organization effective plan is `team`.
[ ] Confirm all AI tools work inside organization workspace.
[ ] Invite a second user.
[ ] Confirm invited member gets Team access inside the org.
[ ] Switch second user to personal workspace.
[ ] Confirm personal workspace is still Free unless that user has Pro.
[ ] Save schema in organization workspace.
[ ] Switch to personal workspace and confirm schema is separate.
[ ] Switch back and confirm organization schema returns.

### Cancellation / Expiry

[ ] Cancel Pro and confirm user becomes Free after intended expiry.
[ ] Cancel Team and confirm team workspace tools lock after intended expiry.
[ ] Confirm old invoices remain visible.
[ ] Confirm paid tools lock again.
[ ] Confirm user data is not deleted during downgrade.

### Webhook Idempotency

[ ] Replay same payment webhook twice.
[ ] Confirm no duplicate invoice.
[ ] Confirm no duplicate payment record.
[ ] Confirm plan remains correct.
[ ] Send bad signature webhook.
[ ] Confirm request is rejected and plan does not change.

## 15. Production Readiness Checklist

[ ] Decide Razorpay or Clerk Billing as the payment source of truth.
[ ] Remove/hide the unused checkout path from the UI.
[ ] Add Team plan to public pricing config.
[ ] Add organization subscription model.
[ ] Add effective-plan resolver.
[ ] Update backend paid gates to use effective plan.
[ ] Add current billing endpoint.
[ ] Update billing UI for personal versus organization workspace.
[ ] Add webhook idempotency.
[ ] Add invoice scope fields.
[ ] Add Team admin controls.
[ ] Add integration tests for Free, Pro, and Team.
[ ] Add webhook tests.
[ ] Confirm env vars are set in production.
[ ] Confirm webhook URLs are public HTTPS URLs.
[ ] Rotate any API keys that were ever pasted into chat or logs.
[ ] Pin Clerk versions if using Clerk Billing.
[ ] Add monitoring alerts for webhook failures.
[ ] Add backup strategy for MongoDB.

## 16. Common Mistakes To Avoid

- Do not store Team only on `User.plan`.
- Do not unlock organization paid features because one member has personal Pro.
- Do not trust frontend-provided amount or plan price.
- Do not upgrade from redirect success without payment verification.
- Do not let webhook retries create duplicate invoices.
- Do not expose payment secrets to the frontend.
- Do not keep Clerk PricingTable visible if Razorpay is the real checkout system.
- Do not use INR labels if the live checkout is USD.
- Do not use different plan slugs in frontend, backend, and payment provider.

## 17. Recommended Build Order For This Project

Follow this exact order:

1. Choose provider path. For INR/India, choose Razorpay.
2. Add `Team` card in `Frontend_Part/src/config/productConfig.js`.
3. Add `OrganizationSubscription` backend model.
4. Add `effectivePlan` backend helper.
5. Update paid middleware and AI/history/analytics gates to use effective plan.
6. Add `/api/billing/current` or extend `/api/payment/current`.
7. Update billing dashboard UI for Personal vs Organization.
8. Extend Razorpay checkout payload with `plan` and `scope`.
9. Extend payment service to activate Pro user or Team organization.
10. Extend invoice model with `scope`, `plan`, and `clerkOrgId`.
11. Add webhook idempotency.
12. Add tests.
13. Test Free, Pro, Team, cancellation, and webhook replay.
14. Deploy backend first.
15. Deploy frontend after backend billing endpoints are live.

## 18. Official Docs Checked

- Clerk Billing overview: https://clerk.com/docs/guides/billing/overview
- Clerk PricingTable React component: https://clerk.com/docs/react/reference/components/billing/pricing-table
- Clerk Billing webhooks: https://clerk.com/docs/js-frontend/guides/development/webhooks/billing
- Clerk default plans: https://clerk.com/docs/guides/billing/default-plans
- Clerk Organizations overview: https://clerk.com/docs/guides/organizations/overview
