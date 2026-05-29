# Clerk Authentication And Clerk Billing Migration

This document explains how AI SQL Studio can move from custom JWT authentication and Razorpay billing to Clerk Authentication and Clerk Billing.

The goal is to make authentication, profile management, sessions, teams, and subscriptions easier to maintain while keeping the existing product logic: SQL generation, saved schemas, query history, analytics, admin controls, and Pro feature gates.

## Why Move To Clerk

The current app already has a full custom auth stack:

- Email/password registration and login.
- JWT auth middleware.
- Cookie/session helpers.
- Password hashing with bcrypt.
- Forgot password with OTP.
- Google OAuth through Passport.
- Local MongoDB user records.
- Razorpay subscription/payment handling.

This works, but it creates a lot of security and maintenance responsibility.

Clerk can replace most of that with managed authentication, user profile UI, session security, MFA, social login, organizations, and billing components.

## Recommended Target Architecture

Use Clerk as the identity and billing source of truth.

Keep MongoDB as the application data source of truth.

```text
Clerk
- Authentication
- User profile
- Sessions
- MFA
- Social login
- Organizations
- Subscription billing
- Billing webhooks

MongoDB
- App user mirror
- Plan and usage snapshot
- Query history
- Saved schemas
- Feedback
- Admin audit logs
- Security events
- Analytics data
```

## What Clerk Should Replace

### Replace Immediately

- Custom register endpoint.
- Custom login endpoint.
- Custom logout endpoint.
- Forgot password OTP flow.
- Google OAuth Passport strategy.
- Frontend login/register/reset pages.
- JWT issuing logic.
- Password fields in MongoDB for normal users.

### Keep Initially

- Local `User` model, but add `clerkId`.
- Existing Pro gates.
- Usage counters.
- Query history and schema ownership.
- Admin dashboard.
- Security event tracking.

### Replace Later

- Razorpay billing.
- Custom invoice generation.
- Subscription renewal/downgrade cron.
- Manual Pro activation after payment.

These can be replaced by Clerk Billing and Clerk billing webhooks once auth is stable.

## Clerk Features To Use

### Authentication

Use Clerk for:

- Email/password login.
- Email verification.
- Google login.
- GitHub login for developer users.
- Password reset.
- Magic links or OTP login.
- Passkeys.
- Multi-factor authentication.
- Session and device management.

### Frontend Components

Useful Clerk React components:

```text
<ClerkProvider />
<SignIn />
<SignUp />
<UserButton />
<UserProfile />
<SignedIn />
<SignedOut />
<OrganizationSwitcher />
<OrganizationProfile />
<CreateOrganization />
<PricingTable />
```

### Backend

Use Clerk Express middleware to authenticate API requests.

The backend should receive the Clerk session token, verify it, and attach a normalized user object to `req.user`.

Expected internal shape:

```js
req.user = {
  userId: mongoUser._id.toString(),
  clerkId: auth.userId,
  role: mongoUser.role,
  plan: mongoUser.plan,
  orgId: auth.orgId || null
};
```

This keeps the rest of the backend stable because existing controllers already expect `req.user.userId`.

## MongoDB User Model Changes

Add Clerk fields:

```js
clerkId: {
  type: String,
  unique: true,
  sparse: true,
  index: true
},
clerkOrgId: {
  type: String,
  default: null,
  index: true
},
avatarUrl: {
  type: String,
  default: null
}
```

Keep:

```text
name
email
role
status
plan
riskScore
riskFlags
dailyUsage
usageDate
billingRenewal
teamSize
```

Eventually remove:

```text
password
googleId
resetPasswordToken
resetPasswordExpire
resetOTP
resetOTPExpire
resetOTPAttempts
```

## Environment Variables

### Frontend

Add:

```env
VITE_CLERK_PUBLISHABLE_KEY=
```

Remove the legacy `VITE_GOOGLE_AUTH_URL`; Clerk owns sign-in and sign-up routing now.

### Backend

Add:

```env
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
CLERK_ADMIN_USER_IDS=
```

Remove legacy Google OAuth variables. Keep `JWT_SECRET` for non-admin app signing only if a migration flag explicitly requires it, and use `ADMIN_JWT_SECRET` for admin password fallback sessions.

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ENABLE_LEGACY_JWT_AUTH=true
RAZORPAY_KEY_ID=
RAZORPAY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Only remove Razorpay variables after Clerk Billing is fully live.

## Frontend Migration Plan

### 1. Install Clerk

```bash
cd Frontend_Part
npm install @clerk/clerk-react
```

### 2. Wrap The App

Wrap the app in `ClerkProvider` in `src/main.jsx`.

The provider should use:

```js
import { ClerkProvider } from "@clerk/clerk-react";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
```

### 3. Replace Public Auth Pages

Replace:

```text
src/pages/Login.jsx
src/pages/Register.jsx
src/pages/ForgotPassword.jsx
src/pages/ResetWithOTP.jsx
src/pages/OAuthSuccess.jsx
```

With Clerk pages:

```text
/login      -> <SignIn />
/register   -> <SignUp />
/settings   -> <UserProfile />
```

### 4. Update Protected Routes

Use Clerk's auth state for route protection.

The app can still keep a local `AuthContext`, but it should read from Clerk and then fetch the app profile from `/api/auth/me`.

Recommended flow:

```text
Clerk signed in -> call backend /auth/me -> get Mongo app profile -> render dashboard
```

### 5. Update API Client

Every protected request should include a Clerk session token.

Recommended frontend behavior:

```text
const token = await getToken();
Authorization: Bearer ${token}
```

## Backend Migration Plan

### 1. Install Clerk

```bash
cd Backend_Part
npm install @clerk/express svix
```

`svix` is used for webhook signature verification.

### 2. Replace Auth Middleware

Replace JWT verification in:

```text
Backend_Part/src/middlewares/auth.middleware.js
```

New behavior:

```text
1. Verify Clerk session.
2. Read Clerk user ID.
3. Find or create Mongo user by clerkId.
4. Block suspended users.
5. Attach normalized req.user.
```

### 3. Add Clerk Webhook Route

Create a route such as:

```text
POST /api/webhooks/clerk
```

Handle:

```text
user.created
user.updated
user.deleted
organization.created
organizationMembership.created
organizationMembership.deleted
subscription.created
subscription.updated
subscription.deleted
```

Exact event names should be confirmed against the Clerk dashboard when configuring the webhook.

### 4. Sync Users

On `user.created`, create a Mongo user:

```js
{
  clerkId,
  name,
  email,
  avatarUrl,
  plan: "free",
  dailyUsage: 0,
  role: "user",
  status: "active"
}
```

On `user.updated`, sync:

```text
name
email
avatarUrl
```

On `user.deleted`, either:

- Delete the Mongo user and related app data.
- Or mark the user as deleted for audit/history safety.

For this project, deleting app data matches the current `deleteUserAccount` behavior.

## Clerk Billing Plan

Clerk Billing can replace Razorpay for subscription management.

Recommended plans:

### Free

```text
Price: INR 0
Audience: Trial users and students
Limits:
- 5 one-time generation credits
- 1 saved schema
- Latest 10 history items
- Generate mode only
```

### Pro

```text
Price: INR 499/month
Audience: Developers, analysts, students, founders
Includes:
- Higher or unlimited fair-use SQL generations
- Optimize SQL
- Validate SQL
- Explain SQL
- Format SQL
- Multiple schema workspaces
- Full searchable history
- Pins, tags, favorites
- Advanced analytics
- Priority support
```

### Team

```text
Price: Future plan
Audience: Small teams
Includes:
- Shared schemas
- Shared query history
- Team members
- Role-based access
- Organization billing
- Admin controls
```

Do not build Team first. Add it after Pro is strong.

## Billing UI

Use Clerk Billing components for:

- Pricing page.
- Checkout.
- Current subscription.
- Plan changes.
- Payment method management.
- Billing history.

Suggested mapping:

```text
Frontend_Part/src/pages/dashboard/Pricing.jsx -> Clerk PricingTable
Frontend_Part/src/pages/Billing.jsx -> Clerk billing/profile section
Frontend_Part/src/pages/dashboard/Invoices.jsx -> Clerk billing history or local mirror
```

## Billing Webhook Sync

Even with Clerk Billing, keep a local plan snapshot in MongoDB.

Why:

- Fast feature checks.
- Existing `requirePro` middleware can keep working.
- Admin dashboard can show plan counts.
- Analytics can group by plan.

When Clerk sends a billing/subscription webhook:

```text
Active paid subscription -> user.plan = "pro"
Canceled or expired subscription -> user.plan = "free"
Trialing subscription -> user.plan = "pro" or "trial"
Payment failed -> keep current plan until subscription is actually inactive
```

Recommended Mongo fields:

```js
plan: "free" | "pro" | "trial",
clerkSubscriptionId: String,
clerkCustomerId: String,
billingRenewal: Date,
billingStatus: String
```

## Pro Feature Gates

Keep the current middleware:

```text
Backend_Part/src/middlewares/plan.middleware.js
```

But make sure it checks the Mongo user that was synced from Clerk Billing.

Protected Pro features:

- Optimize SQL.
- Validate SQL.
- Explain SQL.
- Full analytics.
- Multiple schema workspaces.
- Full history archive.
- Pinning, tags, favorites.
- Advanced exports.

## Organizations And Team Plan

Clerk Organizations can power a future Team plan.

Recommended team features:

- Create a workspace.
- Invite teammates.
- Switch between personal and team workspace.
- Share schemas inside an organization.
- Share query history inside an organization.
- Owner/admin/member roles.
- Organization-level billing.

Backend ownership should support both:

```js
{
  userId,
  orgId: null
}
```

and:

```js
{
  userId,
  orgId: "org_..."
}
```

For personal data, `orgId` is null.

For team data, `orgId` is the active Clerk organization ID.

## Admin Dashboard Changes

Admin dashboard should show:

- Clerk ID.
- Email.
- Name.
- Plan.
- Billing status.
- Last login if available.
- Created date.
- Suspended status.

Admin actions:

- Suspend user locally.
- Unsuspend user locally.
- Force downgrade local plan.
- Delete local app data.

Important:

Use Clerk Dashboard for identity-level operations like changing email, resetting MFA, or deleting a Clerk identity.

## Security Improvements From Clerk

After migration, the app can support:

- MFA.
- Passkeys.
- Session revocation.
- Device management.
- Email verification.
- Social login without Passport code.
- Bot and abuse protection.
- Better password reset security.

This removes the need to maintain password reset OTP logic and custom OAuth callback logic.

## Suggested Implementation Phases

### Phase 1: Clerk Auth

- Install Clerk frontend and backend packages.
- Add Clerk environment variables.
- Add `clerkId` to `User`.
- Replace login/register UI.
- Replace auth middleware.
- Make `/auth/me` return the local Mongo profile.
- Keep existing Razorpay billing for now.

### Phase 2: Webhook User Sync

- Add Clerk webhook endpoint.
- Sync user created, updated, and deleted events.
- Backfill existing users if needed.
- Remove old password reset UI.
- Remove Passport Google OAuth.

### Phase 3: Clerk Billing

- Create Free and Pro plans in Clerk.
- Replace pricing page with Clerk billing UI.
- Add billing webhook sync.
- Update local `plan` from Clerk subscription state.
- Disable Razorpay purchase flow.

### Phase 4: Pro Polish

- Improve upgrade prompts.
- Add plan-aware analytics.
- Add billing status to settings.
- Add better cancellation/downgrade messaging.

### Phase 5: Organizations

- Enable Clerk Organizations.
- Add `OrganizationSwitcher`.
- Add `orgId` to schemas and queries.
- Add team shared history.
- Add organization billing for Team plan.

## Files Likely To Change

### Frontend

```text
Frontend_Part/src/main.jsx
Frontend_Part/src/context/AuthContext.jsx
Frontend_Part/src/hooks/useAuth.js
Frontend_Part/src/services/httpClient.js
Frontend_Part/src/services/authService.js
Frontend_Part/src/components/ProtectedRoute.jsx
Frontend_Part/src/components/layout/Navbar.jsx
Frontend_Part/src/components/layout/Sidebar.jsx
Frontend_Part/src/pages/Login.jsx
Frontend_Part/src/pages/Register.jsx
Frontend_Part/src/pages/ForgotPassword.jsx
Frontend_Part/src/pages/ResetWithOTP.jsx
Frontend_Part/src/pages/Billing.jsx
Frontend_Part/src/pages/dashboard/Pricing.jsx
Frontend_Part/src/pages/dashboard/Invoices.jsx
```

### Backend

```text
Backend_Part/src/models/User.js
Backend_Part/src/middlewares/auth.middleware.js
Backend_Part/src/routes/auth.routes.js
Backend_Part/src/controllers/auth.controller.js
Backend_Part/src/services/auth.service.js
Backend_Part/src/routes/payment.routes.js
Backend_Part/src/controllers/payment.controller.js
Backend_Part/src/services/payment.service.js
Backend_Part/src/routes/paymentWebhook.routes.js
Backend_Part/src/app.js
```

## Cleanup After Migration

After Clerk Auth is fully working, remove:

```text
bcryptjs
jsonwebtoken
passport
passport-google-oauth20
custom password policy code
custom OTP reset code
custom Google OAuth routes
old auth modal logic
```

After Clerk Billing is fully working, remove:

```text
razorpay
Razorpay webhook route
Razorpay payment controller/service
custom invoice generation if Clerk billing history is enough
subscription downgrade cron if Clerk webhook sync covers status
```

Keep invoice generation only if the product needs custom PDF invoices outside Clerk.

## Final Recommendation

Move in two major steps:

1. Clerk Authentication first.
2. Clerk Billing second.

Do not migrate auth and billing in the same pull request. Auth touches every protected request, while billing touches money, plan access, invoices, and upgrade flows.

The best final result is:

```text
Clerk handles identity, sessions, teams, and billing.
AI SQL Studio handles SQL workflows, usage, analytics, admin moderation, and product value.
```
