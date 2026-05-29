# Free vs Paid Plan Guide

This file documents what AI SQL Studio currently gives to Free and Paid users, where each rule is enforced, and what you must configure manually in Clerk.

## Current Plans

### Free / Starter

Free is for trying the product.

Users get:

- 5 one-time AI generation credits.
- Text-to-SQL generation only.
- Standard SQL dialect only.
- 1 saved schema context per active workspace.
- Copy and download generated SQL.
- Latest 10 history entries visible.
- Basic dashboard usage overview.
- Personal workspace and organization workspace support when Clerk Organizations is enabled.

Free users do not get:

- Optimize, validate, explain, or format tools.
- SQL dialect selection.
- Full searchable history archive.
- Pins, favorites, and tags.
- Advanced analytics.
- API keys.
- Paid billing/invoice access.

### Paid / Pro

Pro is for serious SQL workflow usage.

Users get:

- No app-side AI usage limit. Actual availability still depends on your Gemini API quota.
- Generate, optimize, validate, explain, and format tools.
- SQL dialect selection for PostgreSQL, MySQL, SQLite, SQL Server, and Oracle.
- Full searchable history archive.
- Pins, favorites, and tags.
- Advanced analytics.
- API keys through Clerk.
- Clerk Billing/PricingTable checkout.
- Invoice and billing pages in the dashboard.
- Organization workspace collaboration when Clerk Organizations is enabled.

The backend already treats `pro`, `team`, and `business` as paid plans.

## Where To Change Plans

Change public pricing cards here:

- `Frontend_Part/src/config/productConfig.js`

Change frontend paid-plan checks here:

- `Frontend_Part/src/utils/planAccess.js`
- `Frontend_Part/src/pages/dashboard/Generate.jsx`
- `Frontend_Part/src/pages/dashboard/History.jsx`
- `Frontend_Part/src/pages/dashboard/Analytics.jsx`
- `Frontend_Part/src/components/layout/Sidebar.jsx`

Change backend plan order and paid-plan detection here:

- `Backend_Part/src/utils/planAccess.js`

Change the Free credit limit here:

- `Backend_Part/src/utils/usageManager.js`

Change Free history visibility here:

- `Backend_Part/src/services/query.service.js`

Change backend paid-only route gates here:

- `Backend_Part/src/middlewares/plan.middleware.js`
- `Backend_Part/src/routes/query.routes.js`
- `Backend_Part/src/services/ai.service.js`

Change Clerk Billing webhook plan mapping here:

- `Backend_Part/src/controllers/clerkWebhook.controller.js`

Your Clerk Billing plan slugs should match backend plan names:

- `free`
- `pro`
- `team`
- `business`

If you create a different Clerk slug like `professional-monthly`, map it in `clerkWebhook.controller.js` or rename the Clerk plan slug to `pro`.

## Current Backend Enforcement

Free limits are enforced server-side, not only hidden in the UI.

Rules:

- Free users can only run `generate`.
- Free users can only use the `standard` SQL dialect.
- Free users stop after 5 AI credits.
- Free users only see the latest 10 history entries.
- Pro users can use all AI modes.
- Pro users can choose SQL dialects.
- Pro users can pin, favorite, and tag history.
- Pro users can open advanced analytics.
- API keys require a paid plan.

## Clerk Setup You Must Do

### Billing

In Clerk Dashboard:

1. Go to Billing.
2. Create a Free plan with slug `free`.
3. Create a Pro plan with slug `pro`.
4. Add pricing, currency, billing interval, and features.
5. Enable checkout.
6. Add your app URLs in Clerk allowed redirects.
7. Create a Clerk webhook endpoint:

```txt
http://localhost:5000/api/webhooks/clerk
```

For production, use your deployed backend URL.

Webhook events to enable:

- `user.created`
- `user.updated`
- `user.deleted`
- `subscription.created`
- `subscription.updated`
- `subscription.deleted`
- `organization.created`
- `organization.updated`
- `organization.deleted`
- `organizationMembership.created`
- `organizationMembership.updated`
- `organizationMembership.deleted`

Copy the webhook signing secret into backend `.env`:

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

### Organizations And Invitations

In Clerk Dashboard:

1. Enable Organizations.
2. Use Membership optional if users can work in personal workspace too.
3. Make sure max organization members is greater than 1.
4. Enable organization invitations.
5. Configure email sender/domain for production email delivery.
6. Test invites with a different email address, preferably in an incognito browser.

The app uses Clerk's built-in `OrganizationSwitcher` and `OrganizationProfile`.

Invite members from:

- Dashboard > Settings > Workspace
- Select or create an organization
- Open the organization profile members section
- Send invite

If invitations still do not send, it is usually a Clerk dashboard/email/domain setup issue, not MongoDB. The app does not send organization invites itself. Clerk owns that flow.

## Workspace Switching

Personal workspace and organization workspace data are separated by Clerk org ID.

Backend scoping lives here:

- `Backend_Part/src/utils/workspaceScope.js`

Frontend refresh/remount support lives here:

- `Frontend_Part/src/context/AuthContext.jsx`
- `Frontend_Part/src/components/layout/DashboardLayout.jsx`
- `Frontend_Part/src/components/clerk/WorkspaceSwitcher.jsx`

When switching from an organization back to Personal workspace, the dashboard should now refresh the active workspace state and remount the current dashboard page.

## AI Provider Setup

Backend AI config:

```env
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MAX_OUTPUT_TOKENS=2048
```

Alternative key name supported:

```env
GOOGLE_API_KEY=your_google_ai_studio_key
```

If generation fails:

- `AI_PROVIDER_AUTH`: key is missing, invalid, or not allowed.
- `AI_PROVIDER_MODEL`: `GEMINI_MODEL` is not available for your API key.
- `AI_PROVIDER_QUOTA`: Google AI Studio quota or rate limit is reached.
- `AI_PROVIDER_CONTEXT`: prompt or saved schema is too large.
- `AI_PROVIDER_REQUEST`: Gemini rejected the request even after a relaxed JSON retry.

For better generation quality, keep Schema Context focused on the tables needed for the prompt.

## Testing Checklist

Free user:

1. Sign up with a new Clerk user.
2. Save schema in Dashboard > Schema.
3. Generate SQL 5 times.
4. Confirm the 6th AI request is blocked.
5. Confirm Optimize, Validate, Explain, Format are locked.
6. Confirm dialect dropdown is locked to Standard SQL.
7. Confirm History only shows latest 10 entries.

Pro user:

1. Upgrade through Clerk Billing or set the Mongo user `plan` to `pro` for local testing.
2. Confirm all AI modes work.
3. Confirm dialect dropdown works.
4. Confirm full history is visible.
5. Confirm pins, favorites, and tags work.
6. Confirm advanced analytics opens.
7. Confirm API key UI opens in Settings > Developer.

Organization workspace:

1. Enable Organizations in Clerk.
2. Create an organization from the workspace switcher.
3. Save a schema in the organization workspace.
4. Switch to Personal workspace.
5. Confirm personal schema/history are separate.
6. Switch back to organization.
7. Confirm organization schema/history return.
8. Invite a different email from Settings > Workspace.

