# Clerk Extra Features Roadmap

This document lists the extra Clerk features we can add to AI SQL Studio after the basic Clerk login, signup, profile, token bridge, and webhook sync are in place.

The goal is to make the app feel like a real SaaS product for interviews: team workspaces, cleaner account settings, secure sessions, subscription gates, API access, and admin-ready audit behavior.

## Current Clerk Base

Already planned or already integrated in this project:

- React/Vite app wrapped with `ClerkProvider`.
- Clerk login and signup popup on the landing page.
- Clerk session token attached to backend API calls.
- Express backend protected with Clerk auth.
- MongoDB user mirror linked by `clerkId`.
- Clerk webhook endpoint for user and billing events.
- Clerk `UserProfile` used for profile and security settings.
- Custom password reset, Google Passport auth, and old JWT-first auth removed from the main user flow.

## Implementation Status

Implemented in this codebase:

- Organization switcher in the dashboard header/mobile menu.
- Full Settings sections for account/security, workspace management, and developer API keys.
- Organization-aware MongoDB scoping for schemas, query history, analytics, and feedback.
- Backend role/permission gates for schema edits, AI generation, query edits/deletes, and billing actions.
- Clerk Billing pricing table on `/dashboard/billing` with webhook-based local plan snapshots.
- Plan support for `free`, `pro`, `team`, and `business`.
- Clerk API key verification for backend API access.
- Webhook audit logging for user, organization, membership, subscription, and billing events.
- Optional waitlist mode with pending/rejected access states and admin approval actions.

Still configured from Clerk Dashboard, not React code:

- Enable Organizations.
- Create organization roles and permissions.
- Enable Billing and create the Free, Pro, Team, and Business plans.
- Enable API keys.
- Enable MFA and passkeys.
- Create the webhook endpoint subscription and copy the webhook signing secret.

## Best Extra Features To Implement

| Priority | Feature | Why It Helps | App Impact |
| --- | --- | --- | --- |
| 1 | Organizations / team workspaces | Makes the project look like a B2B SaaS | Teams can share schemas, queries, billing, and members |
| 2 | Roles and permissions | Shows real authorization design | Admins, analysts, viewers, and billing managers can have different access |
| 3 | Clerk Billing gates | Replaces manual payment logic | Pro features unlock from Clerk subscription state |
| 4 | Better account settings | Improves dashboard professionalism | One clean place for profile, security, billing, and organization settings |
| 5 | MFA and passkeys | Improves security story | Users can secure accounts without custom auth code |
| 6 | API keys for users | Makes the app developer-friendly | Users can call AI SQL APIs from scripts or tools |
| 7 | Webhook audit trail | Makes backend safer and interview-ready | User, billing, and org changes are logged and recoverable |
| 8 | Waitlist / invite-only mode | Useful before launch | Control who can access the app while showcasing product maturity |

## Phase 1: Organizations And Team Workspaces

Clerk Organizations let users create workspaces, invite members, switch between teams, and manage access.

### What We Will Add

- Add `OrganizationSwitcher` in the dashboard header/sidebar.
- Add `OrganizationProfile` inside Settings for team management.
- Store the active Clerk organization ID on app-owned records:
  - saved schemas
  - query history
  - feedback
  - usage counters
  - billing snapshots
- Filter backend data by both `userId` and `organizationId`.
- Let users work in either:
  - personal workspace
  - team workspace

### Backend Changes

- Add `clerkOrgId` or `organizationId` fields to shared models.
- Update query/history/schema routes to read the active org from Clerk auth.
- Prevent users from reading or deleting records from another organization.
- Add indexes like:

```js
{ clerkOrgId: 1, createdAt: -1 }
{ clerkOrgId: 1, userId: 1 }
```

### Frontend Changes

- Add workspace switcher near the dashboard user menu.
- Show the active workspace name in the dashboard header.
- Show empty states per workspace.
- Make Settings split into:
  - Account
  - Security
  - Organization
  - Billing

## Phase 2: Roles And Permissions

This is the most interview-friendly Clerk feature because it proves the app has real authorization, not just authentication.

### Recommended Roles

| Role | Access |
| --- | --- |
| `org:admin` | Full workspace management, members, billing, schemas, and queries |
| `org:billing` | Manage plans, invoices, and subscription settings |
| `org:analyst` | Generate SQL, save schemas, view team history |
| `org:viewer` | Read schemas and query history, no edit/delete |

### Recommended Permissions

| Permission | Used For |
| --- | --- |
| `org:schema:manage` | Create, update, delete schemas |
| `org:query:generate` | Use AI SQL generation |
| `org:query:delete` | Delete query history |
| `org:billing:manage` | Manage subscription and invoices |
| `org:admin:view` | Access admin/team dashboard sections |

### App Gates To Add

- Only admins can invite/remove team members.
- Only billing role can open billing management.
- Only analysts/admins can generate SQL.
- Viewers can copy/export SQL but cannot delete history.
- Backend must enforce the same rules as the frontend.

## Phase 3: Clerk Billing For SaaS Plans

Clerk Billing can become the source of truth for subscription state.

### Pricing Setup To Create In Clerk

Create these plans in Clerk Dashboard after the app UI is ready. The React app already renders the billing cards through Clerk's pricing table, so the cards should be configured in Clerk, not hardcoded in React.

| Plan | Slug | Suggested Price | Who It Is For | Main Value |
| --- | --- | --- | --- | --- |
| Free | `free` | `0` | Students, demo users, casual users | Try core SQL generation |
| Pro | `pro` | Your monthly price | Individual developers | Advanced SQL tools and higher usage |
| Team | `team` | Higher monthly price | Small teams | Shared workspace and members |
| Business | `business` | Custom or high-tier price | Interview/demo enterprise tier | Admin controls, audit story, priority support |

Recommended plan card text:

| Plan | Headline | Description |
| --- | --- | --- |
| Free | Start writing SQL faster | Basic SQL generation for personal experiments |
| Pro | Build production-ready queries | Advanced generation, optimization, validation, analytics, and exports |
| Team | Collaborate on SQL workflows | Shared schemas, team query history, roles, and member management |
| Business | Control SQL work at scale | Governance-ready controls, audit logs, API access, and priority support |

### Clerk Features To Add To Plans

Use these as feature names in Clerk so the pricing cards look strong.

| Feature Key | Free | Pro | Team | Business |
| --- | --- | --- | --- | --- |
| Monthly AI generations | Limited | High | Higher/team pool | Custom |
| SQL generation | Included | Included | Included | Included |
| SQL optimization | Not included | Included | Included | Included |
| SQL explanation | Limited | Included | Included | Included |
| SQL validation and fix | Not included | Included | Included | Included |
| Schema-aware generation | Limited | Included | Included | Included |
| Query history | Basic | Full history | Team history | Advanced history |
| Query pinning | Not included | Included | Included | Included |
| Analytics | Not included | Included | Included | Advanced |
| Export `.sql` files | Limited | Included | Included | Included |
| Organizations/team workspace | Not included | Not included | Included | Included |
| Roles and permissions | Not included | Not included | Basic roles | Advanced roles |
| User API keys | Not included | Included | Included | Higher limits |
| Priority support | Not included | Not included | Included | Included |

### What To Configure Manually In Clerk

In Clerk Dashboard:

1. Open your application.
2. Go to Billing.
3. Create the plans above.
4. Add feature names to each plan.
5. Mark `free` as the free/default plan if Clerk asks for it.
6. Enable the plans you want visible on the pricing table.
7. Save the changes.
8. Reload `/dashboard/billing` in this app.

Do not create payment cards in React. Users enter payment details inside Clerk Checkout.

### Recommended Plans

| Plan | Target User | Limits |
| --- | --- | --- |
| Free | Students and casual users | Limited monthly generations, personal workspace only |
| Pro | Individual developers | More generations, advanced SQL modes, analytics, exports |
| Team | Small teams | Organizations, shared schemas, member invites |
| Business | Interview/demo enterprise tier | Audit logs, priority support, advanced team controls |

### Features To Gate

- AI generation monthly limit.
- Advanced AI modes:
  - optimize
  - explain
  - validate/fix
  - schema-aware generation
- Query history pinning.
- Analytics page.
- Export features.
- Team workspaces.
- API key access.

### Backend Billing Rules

- Do not trust frontend plan labels.
- Read Clerk billing state from webhook-synced fields or backend Clerk API.
- Keep a local plan snapshot in MongoDB for fast checks.
- Treat webhook data as async and recoverable.
- Add a fallback check if local billing state is missing.

## Phase 4: Security Upgrades

### MFA

Enable multi-factor authentication from the Clerk Dashboard. This gives users stronger account protection without maintaining custom OTP/password-reset code.

Recommended product copy:

```text
Protect your SQL workspace with an extra verification step.
```

### Passkeys

Enable passkeys as a modern sign-in option. Passkeys are good for passwordless login, but browser and domain behavior matters, so test this on your production domain before presenting it as a core feature.

### Session Controls

Recommended Clerk/security settings:

- Shorter session lifetime for sensitive admin users.
- Allow users to revoke active sessions from profile settings.
- Require verified email before app access.
- Keep backend API routes protected by Clerk middleware.
- Keep the secret key only in backend `.env`.

## Phase 5: User API Keys

This can make AI SQL Studio feel like a real developer tool.

### What Users Can Do

- Generate an API key from Settings.
- Call endpoints like:

```http
POST /api/ai/generate
Authorization: Bearer user_api_key
```

- Revoke keys from the dashboard.
- See last used time for each key.

### Backend Rules

- Prefer Clerk's built-in API keys instead of building custom key storage.
- Verify API keys on the backend with Clerk before allowing API access.
- Do not store raw API key secrets in MongoDB.
- Store only local usage metadata if needed, such as last used time, request count, user ID, and organization ID.
- Add rate limits per key, user, and organization.
- Add plan gates so API keys are Pro or Team only.
- Track usage by key, user, and organization.

Clerk API keys are usage-based, so check the Clerk Dashboard before assuming this is unlimited on your student/developer-pack account.

## Phase 6: Webhook Audit Trail

Clerk webhooks should not only update user data. They should also create a small audit trail.

### Events To Track

- `user.created`
- `user.updated`
- `user.deleted`
- organization created/updated/deleted events
- membership created/updated/deleted events
- billing subscription created/updated/canceled events

### Audit Model

Suggested fields:

```js
{
  provider: "clerk",
  eventId: String,
  eventType: String,
  clerkUserId: String,
  clerkOrgId: String,
  status: "processed" | "ignored" | "failed",
  payloadSummary: Object,
  createdAt: Date,
}
```

### Why This Helps

- Debug webhook delivery.
- Replay failed sync safely.
- Explain production-grade thinking in interviews.
- Prove billing/user state changes were received.

## Phase 7: Waitlist Or Invite-Only Mode

This is useful if the app is shown as a polished SaaS launch.

### Good Use Cases

- Early access for GitHub/student users.
- Invite-only beta.
- Admin approval before dashboard access.
- Product launch page with controlled signup.

### App Behavior

- Landing page still opens Clerk signup popup.
- New users are marked as pending until approved.
- Backend denies protected product actions until access is approved.

## Settings Page Target Design

The Settings page should feel simple and executive, not crowded.

Recommended sections:

| Section | Contains |
| --- | --- |
| Account | Name, email, avatar, connected accounts |
| Security | MFA, passkeys, active sessions |
| Workspace | Organization profile, members, invites |
| Billing | Current plan, payment method, invoices |
| Developer | API keys, webhook docs, API usage |

Design rules:

- Avoid one huge settings page with everything visible at once.
- Use tabs or a compact sidebar.
- Keep Clerk profile UI embedded only where it belongs.
- Show plan/security summary cards above detailed controls.
- Keep mobile layout single-column.

## Recommended Implementation Order

1. Add organization support.
2. Add organization-aware database filtering.
3. Add role and permission checks.
4. Add Clerk Billing feature gates.
5. Add billing/settings polish.
6. Add MFA/passkey dashboard guidance.
7. Add user API keys.
8. Add webhook audit logs.
9. Add waitlist/invite-only mode.

## What You Need To Configure In Clerk

In Clerk Dashboard:

- Enable email and Google login.
- Enable Organizations when we start team workspaces.
- Configure Roles and Permissions for organization access.
- Enable Billing and create Free, Pro, Team, and Business plans.
- Configure webhook endpoint:

```text
https://your-backend-domain.com/api/webhooks/clerk
```

- Subscribe webhook endpoint to user, organization, membership, and billing events.
- Copy webhook signing secret into backend `.env`.
- Enable MFA and passkeys if available for your instance and product domain.
- Rotate any secret key that was ever pasted into chat or screenshots.

## Environment Reminder

Frontend `.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key
```

Backend `.env`:

```env
CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_signing_secret
CLERK_WAITLIST_MODE=false
```

Never put `CLERK_SECRET_KEY` in the React/Vite frontend.

## Official Clerk Docs

- Clerk docs: https://clerk.com/docs
- React/Vite quickstart: https://clerk.com/docs/react/getting-started/quickstart
- Organizations: https://clerk.com/docs/organizations/overview
- Organization roles and permissions: https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions
- Billing: https://clerk.com/docs/guides/billing/default-plans
- API keys: https://clerk.com/docs/guides/development/machine-auth/api-keys
- Webhooks: https://clerk.com/docs/guides/development/webhooks/overview
- Backend SDK: https://clerk.com/docs/references/backend/overview
- Express middleware: https://clerk.com/docs/reference/express/clerk-middleware

## Interview Talking Points

You can explain the app like this:

```text
I use Clerk as the identity and billing source of truth, but I keep MongoDB as the product data source of truth. Clerk handles users, sessions, MFA, organizations, roles, and subscriptions. My backend mirrors only the fields it needs for fast authorization and product limits. Every protected API still verifies the Clerk session server-side, and webhooks keep local user and billing snapshots in sync.
```

This shows strong SaaS architecture because authentication, authorization, billing, product limits, and team data are separated cleanly.
