const fs = require("fs");
const path = require("path");
const PDFDocument = require("../Backend_Part/node_modules/pdfkit");

const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(__dirname, "AI_SQL_Studio_Feature_Showcase.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 54, right: 46, bottom: 58, left: 46 },
  bufferPages: true,
  info: {
    Title: "AI SQL Studio Complete Feature Documentation",
    Author: "AI SQL Studio",
    Subject: "Professional feature showcase and implementation documentation",
    Keywords: "AI SQL Studio, SQL, React, Express, Clerk, Gemini, Razorpay, SaaS"
  }
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const colors = {
  ink: "#102033",
  muted: "#53647a",
  soft: "#edf3f8",
  line: "#d9e3ec",
  panel: "#f8fbfd",
  panelDark: "#13283a",
  accent: "#0f766e",
  accent2: "#1d4ed8",
  amber: "#b7791f",
  rose: "#be123c",
  white: "#ffffff"
};

const page = () => ({
  width: doc.page.width,
  height: doc.page.height,
  left: doc.page.margins.left,
  right: doc.page.width - doc.page.margins.right,
  top: doc.page.margins.top,
  bottom: doc.page.height - doc.page.margins.bottom - 36
});

const contentWidth = () => page().right - page().left;
const rel = (relativePath) => path.join(rootDir, relativePath);
const hasFile = (relativePath) => fs.existsSync(rel(relativePath));

function safeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function ensureSpace(height) {
  if (doc.y + height > page().bottom) {
    doc.addPage();
  }
}

function drawLine(y = doc.y, color = colors.line) {
  const p = page();
  doc.moveTo(p.left, y).lineTo(p.right, y).strokeColor(color).lineWidth(1).stroke();
}

function tag(text, x, y, width, fill = colors.accent) {
  doc.roundedRect(x, y, width, 20, 5).fillColor(fill).fill();
  doc
    .font("Helvetica-Bold")
    .fontSize(7.6)
    .fillColor(colors.white)
    .text(text, x + 5, y + 6, { width: width - 10, align: "center" });
}

function sectionTitle(title, eyebrow = "") {
  ensureSpace(62);
  if (eyebrow) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(colors.accent)
      .text(eyebrow.toUpperCase(), { characterSpacing: 0.5 });
    doc.moveDown(0.25);
  }
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(colors.ink)
    .text(title, { lineGap: 2 });
  doc.moveDown(0.45);
  drawLine();
  doc.moveDown(0.75);
}

function subTitle(title) {
  ensureSpace(36);
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(colors.ink)
    .text(title, { lineGap: 2 });
  doc.moveDown(0.35);
}

function microTitle(title, color = colors.accent) {
  ensureSpace(26);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.7)
    .fillColor(color)
    .text(title.toUpperCase(), { characterSpacing: 0.45 });
  doc.moveDown(0.25);
}

function paragraph(text, options = {}) {
  ensureSpace(options.space || 42);
  doc
    .font(options.bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(options.size || 9.7)
    .fillColor(options.color || colors.muted)
    .text(safeText(text), {
      width: options.width || contentWidth(),
      align: options.align || "left",
      lineGap: options.lineGap ?? 3
    });
  doc.moveDown(options.after ?? 0.55);
}

function bulletList(items, options = {}) {
  const p = page();
  const x = options.x || p.left;
  const width = options.width || p.right - x;
  items.forEach((item) => {
    ensureSpace(24);
    const y = doc.y + 4.5;
    doc.circle(x + 3.2, y, 2.1).fillColor(options.dotColor || colors.accent).fill();
    doc
      .font(options.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(options.size || 8.9)
      .fillColor(options.color || colors.muted)
      .text(safeText(item), x + 14, doc.y, {
        width: width - 14,
        lineGap: 2
      });
    doc.moveDown(0.25);
  });
  doc.moveDown(options.after ?? 0.25);
}

function callout(title, body, tone = "accent") {
  ensureSpace(94);
  const p = page();
  const y = doc.y;
  const h = 76;
  const fill = tone === "dark" ? colors.panelDark : colors.panel;
  const stroke = tone === "dark" ? colors.panelDark : colors.line;
  const titleColor = tone === "dark" ? colors.white : colors.ink;
  const bodyColor = tone === "dark" ? "#dbeafe" : colors.muted;
  doc.roundedRect(p.left, y, contentWidth(), h, 8).fillColor(fill).fill();
  doc.roundedRect(p.left, y, contentWidth(), h, 8).strokeColor(stroke).lineWidth(0.8).stroke();
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(titleColor)
    .text(title, p.left + 16, y + 14, { width: contentWidth() - 32 });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(bodyColor)
    .text(safeText(body), p.left + 16, y + 35, { width: contentWidth() - 32, lineGap: 2 });
  doc.y = y + h + 12;
}

function twoColumnCards(items) {
  const p = page();
  const gap = 12;
  const colW = (contentWidth() - gap) / 2;
  let rowY = doc.y;

  items.forEach((item, index) => {
    if (index % 2 === 0) {
      ensureSpace(item.height || 104);
      rowY = doc.y;
    }

    const x = index % 2 === 0 ? p.left : p.left + colW + gap;
    const y = rowY;
    const h = item.height || 90;
    doc.roundedRect(x, y, colW, h, 8).fillColor(item.fill || colors.panel).fill();
    doc.roundedRect(x, y, colW, h, 8).strokeColor(colors.line).lineWidth(0.8).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(10.6)
      .fillColor(colors.ink)
      .text(item.title, x + 13, y + 12, { width: colW - 26 });
    doc
      .font("Helvetica")
      .fontSize(8.6)
      .fillColor(colors.muted)
      .text(safeText(item.text), x + 13, y + 33, { width: colW - 26, lineGap: 2 });

    if (index % 2 === 1 || index === items.length - 1) {
      doc.y = rowY + h + 12;
    }
  });
}

function metricStrip(items) {
  ensureSpace(78);
  const p = page();
  const gap = 10;
  const w = (contentWidth() - gap * (items.length - 1)) / items.length;
  const y = doc.y;
  items.forEach((item, index) => {
    const x = p.left + index * (w + gap);
    doc.roundedRect(x, y, w, 58, 7).fillColor(colors.white).fill();
    doc.roundedRect(x, y, w, 58, 7).strokeColor(colors.line).lineWidth(0.8).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(item.color || colors.accent)
      .text(item.value, x + 10, y + 11, { width: w - 20 });
    doc
      .font("Helvetica-Bold")
      .fontSize(7.7)
      .fillColor(colors.muted)
      .text(item.label.toUpperCase(), x + 10, y + 34, { width: w - 20, characterSpacing: 0.3 });
  });
  doc.y = y + 72;
}

function featureBlock(feature) {
  ensureSpace(feature.height || 156);
  const p = page();
  const y = doc.y;
  const h = feature.height || 142;
  doc.roundedRect(p.left, y, contentWidth(), h, 9).fillColor(colors.panel).fill();
  doc.roundedRect(p.left, y, contentWidth(), h, 9).strokeColor(colors.line).lineWidth(0.8).stroke();
  tag(feature.tag || "FEATURE", p.left + 14, y + 13, 82, feature.tagColor || colors.accent);
  doc
    .font("Helvetica-Bold")
    .fontSize(13.3)
    .fillColor(colors.ink)
    .text(feature.title, p.left + 110, y + 14, { width: contentWidth() - 124 });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(colors.muted)
    .text(safeText(feature.summary), p.left + 14, y + 43, {
      width: contentWidth() - 28,
      lineGap: 2
    });
  doc
    .font("Helvetica-Bold")
    .fontSize(8.4)
    .fillColor(colors.accent)
    .text("Implemented in this project", p.left + 14, y + 78);
  let currentY = y + 96;
  feature.implemented.forEach((item) => {
    doc.circle(p.left + 18, currentY + 4, 1.8).fillColor(colors.accent).fill();
    doc
      .font("Helvetica")
      .fontSize(8.4)
      .fillColor(colors.muted)
      .text(safeText(item), p.left + 28, currentY, {
        width: contentWidth() - 42,
        lineGap: 1.5
      });
    currentY = doc.y + 4;
  });
  doc.y = y + h + 12;
}

function tableRow(columns, widths, options = {}) {
  const p = page();
  const rowHeight = options.height || 34;
  ensureSpace(rowHeight + 6);
  const y = doc.y;
  let x = p.left;
  if (options.fill) {
    doc.rect(p.left, y - 3, contentWidth(), rowHeight + 4).fillColor(options.fill).fill();
  }
  columns.forEach((value, index) => {
    doc
      .font(options.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(options.size || 8.4)
      .fillColor(options.color || colors.muted)
      .text(safeText(value), x + 4, y, {
        width: widths[index] - 8,
        lineGap: 1.5
      });
    x += widths[index];
  });
  doc.y = y + rowHeight;
  drawLine(doc.y, options.lineColor || colors.soft);
  doc.moveDown(0.2);
}

function screenshotBlock(relativePath, caption, maxHeight = 214) {
  if (!hasFile(relativePath)) return;
  ensureSpace(maxHeight + 62);
  const p = page();
  const y = doc.y;
  const h = maxHeight + 16;
  doc.roundedRect(p.left, y, contentWidth(), h, 9).fillColor(colors.white).fill();
  doc.roundedRect(p.left, y, contentWidth(), h, 9).strokeColor(colors.line).lineWidth(0.8).stroke();
  doc.image(rel(relativePath), p.left + 12, y + 10, {
    fit: [contentWidth() - 24, maxHeight - 4],
    align: "center",
    valign: "center"
  });
  doc.y = y + h + 8;
  paragraph(caption, { size: 8.2, after: 0.2 });
}

function pageBreak() {
  doc.addPage();
}

const featureBlocks = [
  {
    tag: "PUBLIC",
    tagColor: colors.accent,
    title: "Public Website and Product Presentation",
    summary:
      "The public website introduces the product, pricing, workflow, platform preview, contact path, login/register entry points, billing redirects, and a developers showcase.",
    implemented: [
      "Routes: /, /developers, /login, /register, /billing/success, /billingsuccess, plus redirects for FAQ, support, feedback, billing, and admin.",
      "SEO component, robots.txt, sitemap.xml, manifest, favicon, and image assets under docs/screenshots.",
      "Responsive landing sections with auth modal, plan cards, product preview, workflow storytelling, and developer profiles."
    ]
  },
  {
    tag: "AUTH",
    tagColor: colors.accent2,
    title: "Clerk Authentication, Protected Routing, and Workspaces",
    summary:
      "Clerk owns user login and sessions. The frontend waits for Clerk readiness, while the backend validates Clerk sessions, API keys, account states, and organization context.",
    implemented: [
      "ClerkProvider, AuthModal, ClerkTokenBridge, ProtectedRoute, PublicRoute, AdminProtectedRoute, and AdminPublicRoute.",
      "Backend Clerk middleware, bearer token auth, paid-plan API key verification, workspace role and permission checks.",
      "Account restrictions for suspended, rejected, pending, and deleted users with an access appeal flow."
    ]
  },
  {
    tag: "AI",
    tagColor: colors.rose,
    title: "AI SQL Workspace",
    summary:
      "The Generate page supports six AI tools and keeps the workflow compact: choose a mode, provide SQL or a prompt, run the tool, inspect output, copy/download, chain to another tool, or save generated schema.",
    implemented: [
      "Modes: generate, schema, optimize, validate, explain, and format.",
      "Gemini prompting with strict JSON responses, JSON repair, SQL review, SQL completion recovery, SQL formatter fallback, and result persistence.",
      "Plan-aware tool gating, SQL dialect selection for paid users, schema awareness, keyboard shortcuts, and provider error mapping."
    ]
  },
  {
    tag: "SCHEMA",
    tagColor: colors.accent,
    title: "Schema Context",
    summary:
      "Users can store a database schema per personal or organization workspace, giving AI requests a trusted table and column context.",
    implemented: [
      "Schema page, schemaService client, schema routes, schema controller, schema service, and Schema model.",
      "Workspace scoping for personal vs organization schema context.",
      "Validation and body limits protect the schema endpoint from oversized payloads."
    ]
  },
  {
    tag: "HISTORY",
    tagColor: colors.accent2,
    title: "Query History and SQL Productivity",
    summary:
      "AI outputs are saved as query records so users can search, filter, copy, export, delete, pin, favorite, tag, and track SQL workflow usage.",
    implemented: [
      "Query history page with search, mode filter, sort, pagination, copy, export, and delete.",
      "Pro tools: pins, favorites, tags, full searchable archive, and productivity tracking.",
      "Backend query service, query validator rules, workspace scope utilities, request cache, and export helpers."
    ]
  },
  {
    tag: "ANALYTICS",
    tagColor: colors.amber,
    title: "Overview and Advanced Analytics",
    summary:
      "The dashboard reports plan state, usage, recent activity, quality signals, workflow signals, top tables, time saved, and reliability indicators.",
    implemented: [
      "Overview page, Analytics page, Recharts charts, stat cards, free analytics preview, and upgrade prompts.",
      "Backend aggregations for daily activity, weekly growth, mode mix, optimizer usage, validation changes, and query quality counters.",
      "DSA utilities for top-K table extraction, query analytics accumulation, pagination, search, and caching."
    ]
  },
  {
    tag: "BILLING",
    tagColor: colors.accent,
    title: "Pricing, Billing, Invoices, and Plan Management",
    summary:
      "The app includes Free, Professional, and Team plans with Razorpay checkout, payment verification, invoices, downgrade support, and effective plan resolution.",
    implemented: [
      "Pricing page, Billing Success page, Invoices page, and productConfig plan data.",
      "Razorpay order/payment-link creation, signed payment verification, signed webhooks, invoice records, and confirmation emails.",
      "Plan middleware, subscription service, organization subscriptions, downgrade flows, and subscription cron support."
    ]
  },
  {
    tag: "SUPPORT",
    tagColor: colors.accent2,
    title: "Feedback, Support, FAQ, Settings, and Notifications",
    summary:
      "The authenticated app includes operational pages and user communication flows that make the product feel complete beyond the AI screen.",
    implemented: [
      "Support, FAQ, Feedback, Settings, NotificationDrawer, WorkspaceSwitcher, and Clerk account/organization profile embeds.",
      "Feedback submission and feedback history endpoints.",
      "Notification create/list/read/read-all flows, notification read tracking, and notification ranking utility."
    ]
  },
  {
    tag: "ADMIN",
    tagColor: colors.rose,
    title: "Admin Console and Platform Operations",
    summary:
      "A separate admin console provides user management, revenue visibility, feedback triage, notification publishing, security review, access appeals, and audit history.",
    implemented: [
      "Admin login with HttpOnly admin cookie, protected admin dashboard, theme toggle, charts, search, filters, and pagers.",
      "User moderation actions: set Pro, set Free, approve access, reject access, suspend, unsuspend, and delete.",
      "Admin APIs for overview, users, feedback, notifications, access appeals, security events, and audit/security logging."
    ]
  },
  {
    tag: "OPS",
    tagColor: colors.ink,
    title: "API, Security, Tests, and Deployment Readiness",
    summary:
      "The backend is organized as a production-style service with route/controller/service/model layering, security middleware, validation, OpenAPI docs, tests, Docker, and Render configuration.",
    implemented: [
      "Express app with Helmet, CORS allowlist, CSRF origin checks, rate limits, JSON body limits, validators, async error handling, and centralized API responses.",
      "OpenAPI JSON at /api/docs/openapi.json and route groups for auth, AI, schema, queries, payment, feedback, notifications, webhooks, and admin.",
      "Backend Node tests, frontend Vitest tests, ESLint, Dockerfiles, nginx.conf, docker-compose.yml, and render.yaml."
    ]
  }
];

const pageRoutes = [
  ["Public", "/, /developers, /login, /register, /billing/success, /billingsuccess", "Product, auth entry, developer showcase, and payment callback handling."],
  ["Dashboard", "/dashboard, /generate, /schema, /history, /analytics, /settings", "Protected user workspace for AI, schema, archive, analytics, and account settings."],
  ["Operations", "/dashboard/billing, /invoices, /support, /faq, /feedback", "Billing management, invoice history, help content, and feedback submission."],
  ["Admin", "/admin/login, /admin/dashboard", "Separate control center for platform operations and moderation."]
];

const apiGroups = [
  ["System", "GET /api/health, GET /api/docs/openapi.json", "Health checks and API contract."],
  ["Auth", "GET /api/auth/me, POST /api/auth/logout, POST /api/auth/access-appeal", "Current profile, logout, and access appeals."],
  ["AI", "POST /api/ai", "Generate, schema, optimize, validate, explain, and format SQL."],
  ["Schema", "GET/POST/DELETE /api/schema, POST/DELETE /api/schema/clear", "Workspace schema context lifecycle."],
  ["Queries", "GET /api/queries, /overview, /analytics, /advanced-analytics", "History, overview, analytics, delete, pin, favorite, tags, and action tracking."],
  ["Payments", "/current, /create-order, /create-payment-link, /verify, /verify-payment-link, /downgrade, /invoices", "Plan checkout, verification, invoices, and downgrade."],
  ["Webhooks", "POST /api/payment/webhook, POST /api/webhooks/clerk", "Signed Razorpay and Clerk event processing."],
  ["Feedback", "POST /api/feedback, GET /api/feedback/mine", "User feedback submission and history."],
  ["Notifications", "GET /api/notifications, PATCH /read-all, PATCH /:id/read", "User notification inbox and read state."],
  ["Admin", "/login, /me, /overview, /users, /feedback, /notifications, /access-appeals, /security-events", "Admin metrics, moderation, publishing, triage, and review."]
];

const modelMap = [
  ["User", "Identity mirror, role, status, access status, plan, billing renewal, usage, organization metadata, risk fields."],
  ["Schema", "Saved schema context for personal or organization workspace."],
  ["Query", "Prompt, generated SQL, mode, dialect, tags, pinned/favorite flags, copy/export counters."],
  ["Payment", "Checkout, Razorpay order/link/payment IDs, amount, currency, status, scope, and plan."],
  ["Invoice", "Invoice number, payment/order IDs, amount, currency, status, scope, and plan."],
  ["OrganizationSubscription", "Organization-level plan, billing provider, payment IDs, renewal window, and status."],
  ["Feedback", "Rating, topic, message, status, admin note, workspace owner, and user reference."],
  ["Notification and NotificationRead", "Announcements, audience targeting, priority, read tracking, status, publish/expiry dates."],
  ["AccessAppeal", "User appeal records with email, message, status, admin note, risk context, and metadata."],
  ["SecurityEvent", "Security signals, severity, status, risk impact, user snapshot, metadata, IP, and user agent."],
  ["AdminAuditLog", "Admin action, reason, target user snapshot, previous and next state, request metadata."],
  ["WebhookAuditLog", "Provider event ID/type, Clerk identity, status, payload summary, and failure notes."]
];

const securityControls = [
  "Clerk sessions are the default user auth model; legacy user JWTs stay disabled unless explicitly enabled.",
  "Admin password login issues an HttpOnly cookie; the browser no longer needs to store an admin JWT in localStorage.",
  "CORS is allowlist-based and CSRF checks reject unsafe browser mutations from untrusted origins.",
  "Helmet, route-specific rate limits, request body limits, express-validator rules, and centralized error responses reduce API risk.",
  "Razorpay payment verification and webhooks use HMAC signatures and local ownership checks.",
  "Production env validation rejects placeholder secrets, weak secrets, HTTP public origins, and partial integration secrets.",
  "Workspace scoping keeps personal and organization data separated across schema, query, invoice, feedback, and analytics flows."
];

const techStack = [
  ["Frontend", "React 19, Vite, React Router, Tailwind CSS v4, Clerk React, Lucide, Framer Motion, Recharts."],
  ["Backend", "Node.js, Express 5, MongoDB, Mongoose, Clerk Express, Gemini client, Razorpay, Nodemailer, PDFKit."],
  ["Quality", "Vitest, Testing Library, Node test runner, Supertest, ESLint, OpenAPI JSON, structured validators."],
  ["Deployment", "Frontend/backend Dockerfiles, nginx config, docker-compose.yml, render.yaml, environment examples."]
];

// Cover page
doc.rect(0, 0, doc.page.width, doc.page.height).fillColor("#f5f9fc").fill();
doc.rect(0, 0, doc.page.width, 190).fillColor(colors.panelDark).fill();
tag("PROFESSIONAL FEATURE DOCUMENTATION", page().left, 58, 198, colors.accent);
doc
  .font("Helvetica-Bold")
  .fontSize(36)
  .fillColor(colors.white)
  .text("AI SQL Studio", page().left, 104, { width: contentWidth(), lineGap: 2 });
doc
  .font("Helvetica-Bold")
  .fontSize(18)
  .fillColor("#c8f7ee")
  .text("Complete Website Feature Showcase", page().left, 158, { width: contentWidth() });
doc
  .font("Helvetica")
  .fontSize(11)
  .fillColor(colors.muted)
  .text(
    "A polished product document covering the implemented website features, user journeys, backend capabilities, security controls, database models, API surface, and deployment readiness.",
    page().left,
    224,
    { width: contentWidth(), lineGap: 4 }
  );

metricStrip([
  { value: "6", label: "AI SQL tools", color: colors.rose },
  { value: "3", label: "Plans", color: colors.accent },
  { value: "12", label: "Core models", color: colors.accent2 },
  { value: "10", label: "API areas", color: colors.amber }
]);

if (hasFile("docs/screenshots/landing.png")) {
  doc.image(rel("docs/screenshots/landing.png"), page().left, 362, {
    fit: [contentWidth(), 250],
    align: "center",
    valign: "center"
  });
}

doc
  .font("Helvetica-Bold")
  .fontSize(9)
  .fillColor(colors.ink)
  .text("Generated: May 31, 2026", page().left, 712);
doc
  .font("Helvetica")
  .fontSize(8.5)
  .fillColor(colors.muted)
  .text("Repository documentation for the AI SQL Studio website and platform.", page().left, 728);

pageBreak();

sectionTitle("Executive Summary", "Product Overview");
callout(
  "What the website is",
  "AI SQL Studio is a full-stack SaaS product for generating, improving, validating, formatting, and explaining SQL with AI. It combines a public marketing site, authenticated user dashboard, billing system, analytics, feedback/support surfaces, and an admin control center.",
  "dark"
);
paragraph(
  "The project is more than a single prompt form. It is implemented as a portfolio-ready web application with React/Vite on the frontend and Express/MongoDB on the backend. The system integrates Clerk for auth, Gemini for AI output, Razorpay for billing, email utilities for transactional workflows, OpenAPI for documentation, and Docker/Render files for deployment."
);
subTitle("Product strengths");
twoColumnCards([
  {
    title: "End-to-end SaaS flow",
    text: "Public site, auth, protected dashboard, pricing, plan gating, payments, invoices, support, feedback, admin operations, and deployment configuration."
  },
  {
    title: "Real AI workflow",
    text: "Schema-aware prompting, six AI SQL tools, strict JSON AI responses, repair logic, SQL formatting, history persistence, and productivity analytics."
  },
  {
    title: "Professional operations",
    text: "Admin dashboard for user moderation, access requests, feedback triage, notification publishing, security review, revenue, and audit logs."
  },
  {
    title: "Security-aware implementation",
    text: "Clerk sessions, HttpOnly admin cookie, signed payment/webhook checks, CORS/CSRF controls, rate limits, validators, body limits, and env validation."
  }
]);

sectionTitle("Feature Inventory", "Complete Website Scope");
featureBlocks.forEach(featureBlock);

sectionTitle("User-Facing Application", "Frontend Routes and Experiences");
paragraph(
  "The frontend uses route-level code splitting and protected routing to separate public pages, user dashboard pages, payment callback pages, and admin pages."
);
tableRow(["Area", "Routes", "Purpose"], [86, 230, 187], {
  bold: true,
  color: colors.ink,
  fill: colors.soft,
  height: 24
});
pageRoutes.forEach((row) => tableRow(row, [86, 230, 187], { height: 48 }));

subTitle("Dashboard pages documented");
bulletList([
  "Overview: plan status, usage, free credit state, recent queries, and quick actions.",
  "Generate: AI workspace for generation, schema creation, optimization, validation, explanation, and formatting.",
  "Schema: save, edit, clear, and use schema context for accurate SQL generation.",
  "History: search, filter, sort, copy, export, delete, pin, favorite, tag, and track SQL actions.",
  "Analytics: Pro dashboard for usage charts, top tables, workflow metrics, quality score, productivity, and reliability.",
  "Billing/Pricing: Starter, Professional, and Team plans with checkout and current billing state.",
  "Invoices: invoice history for personal or organization workspace.",
  "Settings: Clerk user and organization profile integration.",
  "Support, FAQ, Feedback: user help, guidance, feedback submission, and previous feedback."
]);

sectionTitle("AI Workspace Details", "Core Product Functionality");
paragraph(
  "The Generate page is the centerpiece of the product. It connects frontend controls to a backend AI service that normalizes dialects, checks plans, loads workspace schema context, calls Gemini, repairs structured output, formats SQL, persists history, and refunds usage on failures."
);
tableRow(["Tool", "Who can use it", "What it does"], [110, 112, 281], {
  bold: true,
  color: colors.ink,
  fill: colors.soft,
  height: 24
});
[
  ["Generate", "Starter and paid", "Converts plain English into SQL using saved schema context."],
  ["Schema", "Paid", "Creates relational SQL DDL from a product or domain description."],
  ["Optimize", "Paid", "Rewrites SQL for better performance while preserving semantics."],
  ["Validate", "Paid", "Repairs syntax and obvious logical SQL issues."],
  ["Explain", "Paid", "Produces a concise technical explanation with steps, columns, performance notes, and risks."],
  ["Format", "Paid", "Formats SQL locally with sql-formatter fallback behavior."]
].forEach((row) => tableRow(row, [110, 112, 281], { height: 42 }));

subTitle("AI implementation behaviors");
bulletList([
  "Schema context is treated as authoritative for generation and review.",
  "The backend asks Gemini for strict JSON output and then repairs malformed AI responses when needed.",
  "Generated SQL is reviewed against schema context and completed if the AI provider truncates output.",
  "Saved queries include prompt, generated SQL, mode, dialect, workspace owner, and timestamps.",
  "Free users have limited generation credits while paid users unlock advanced modes and dialect selection.",
  "AI provider errors are converted into helpful product messages for quota, model, auth, timeout, payload size, and bad response states."
]);

sectionTitle("Pricing and Plan Access", "Business Model");
tableRow(["Plan", "Price", "Included capability"], [98, 88, 317], {
  bold: true,
  color: colors.ink,
  fill: colors.soft,
  height: 24
});
[
  ["Starter", "INR 0 / month", "5 one-time generation credits, 1 schema workspace, text-to-SQL, copy/download SQL, latest 10 history entries, and basic overview."],
  ["Professional", "INR 499 / month", "Advanced AI tools, unlimited app-side usage subject to provider quota, full history, pins, favorites, tags, dialects, analytics, invoices, and priority support."],
  ["Team", "INR 1499 / month", "Everything in Professional plus team workspace creation, shared organization schema, shared organization history, member invitations, and team analytics."]
].forEach((row) => tableRow(row, [98, 88, 317], { height: 58 }));

subTitle("Plan enforcement points");
bulletList([
  "Frontend locks advanced modes for users without a paid plan and shows upgrade guidance.",
  "Backend plan middleware protects Pro and Team-only routes.",
  "Organization workspaces require Team plan access.",
  "Effective plan resolution supports personal plan, personal Team entitlement, and organization subscription state.",
  "Billing APIs return current plan, personal plan, workspace plan, renewal data, and billing management permission."
]);

sectionTitle("Billing and Payment Flow", "Razorpay and Invoices");
paragraph(
  "Billing is implemented across frontend pages, backend services, Mongoose records, Razorpay integration, and email utilities. The app supports hosted payment links, order verification, payment-link verification, signed webhooks, invoice records, subscription activation, and downgrade."
);
twoColumnCards([
  {
    title: "Checkout creation",
    text: "Backend creates Razorpay orders or hosted payment links for Pro or Team and records a pending Payment document with user/workspace scope."
  },
  {
    title: "Callback verification",
    text: "Frontend payment success page sends Razorpay callback data to the backend, which checks HMAC signature and local payment ownership."
  },
  {
    title: "Webhook processing",
    text: "Signed Razorpay webhooks process payment_link.paid and payment.captured events and safely ignore unsupported or unmatched events."
  },
  {
    title: "Invoice and activation",
    text: "Successful payments create Payment and Invoice records, activate Pro/Team state, and can send confirmation email with invoice PDF."
  }
]);

sectionTitle("Admin Console", "Platform Operations");
paragraph(
  "The admin console is separate from the user dashboard. It provides a controlled operational surface for user management, revenue monitoring, feedback triage, notification publishing, access appeals, and security review."
);
subTitle("Admin dashboard capabilities");
bulletList([
  "Admin authentication with credential validation, rate limiting, and HttpOnly admin cookie.",
  "Overview stats for users, paid users, free users, total queries, invoices, revenue, feedback, access appeals, notifications, and security events.",
  "Charts for monthly revenue/signups, feedback status, and plan distribution.",
  "User search and filters by plan, status, and access status.",
  "Moderation actions: set Pro, set Free, approve access, reject access, suspend, unsuspend, and delete.",
  "Notification creation with title, message, type, priority, audience, status, publish date, and expiry date.",
  "Access appeal workflow with statuses: new, in_review, resolved, and closed.",
  "Feedback triage by status and search with admin note support.",
  "Security event review with severity/status labels and risk-focused user lists.",
  "Admin audit logs and security events are written for sensitive admin actions."
]);

sectionTitle("Backend API Surface", "OpenAPI and Route Groups");
paragraph(
  "The backend publishes OpenAPI JSON and is organized into focused route modules. Most user routes require Clerk authentication and approved access; admin routes require admin auth."
);
tableRow(["Group", "Routes", "Purpose"], [82, 245, 176], {
  bold: true,
  color: colors.ink,
  fill: colors.soft,
  height: 24
});
apiGroups.forEach((row) => tableRow(row, [82, 245, 176], { height: 48 }));

sectionTitle("Data Model Documentation", "MongoDB and Mongoose");
paragraph(
  "The models support identity, AI history, schema context, billing, feedback, notifications, admin auditability, access control, webhook processing, and security monitoring."
);
tableRow(["Model", "Purpose"], [146, 357], {
  bold: true,
  color: colors.ink,
  fill: colors.soft,
  height: 24
});
modelMap.forEach((row) => tableRow(row, [146, 357], { height: 42 }));

sectionTitle("Security and Quality", "Controls Already Implemented");
bulletList(securityControls, { size: 9.1 });

subTitle("Validation and resilience");
twoColumnCards([
  {
    title: "Input validation",
    text: "express-validator rules cover AI requests, schema size, query history filters, IDs, feedback, admin queries/actions, notification creation/status, and payment payloads."
  },
  {
    title: "Rate limiting",
    text: "Separate limiters protect auth, admin login, AI requests, payment requests, payment webhooks, and password-reset-style flows."
  },
  {
    title: "Request sizing",
    text: "Dedicated body limits keep tiny payment calls, standard JSON, schema JSON, AI JSON, and raw webhook payloads bounded."
  },
  {
    title: "Logging",
    text: "Backend and frontend loggers redact sensitive keys such as passwords, tokens, secrets, cookies, API keys, authorization headers, and signatures."
  }
]);

sectionTitle("Technology and Project Structure", "Implementation Map");
tableRow(["Area", "Implementation"], [112, 391], {
  bold: true,
  color: colors.ink,
  fill: colors.soft,
  height: 24
});
techStack.forEach((row) => tableRow(row, [112, 391], { height: 44 }));

subTitle("Important source locations");
bulletList([
  "Frontend routes: Frontend_Part/src/routes/AppRoutes.jsx",
  "AI workspace UI: Frontend_Part/src/pages/dashboard/Generate.jsx",
  "AI backend service: Backend_Part/src/services/ai.service.js",
  "Schema context: Frontend_Part/src/pages/dashboard/Schema.jsx and Backend_Part/src/services/schema.service.js",
  "Query history and analytics: Frontend_Part/src/pages/dashboard/History.jsx, Analytics.jsx, and Backend_Part/src/services/query.service.js",
  "Billing: Frontend_Part/src/pages/dashboard/Pricing.jsx, BillingSuccess.jsx, Invoices.jsx, and Backend_Part/src/services/payment.service.js",
  "Admin console: Frontend_Part/src/pages/admin/AdminDashboard.jsx and Backend_Part/src/services/admin.service.js",
  "API contract: Backend_Part/src/docs/openapi.js",
  "Deployment: Dockerfiles, nginx.conf, docker-compose.yml, render.yaml"
]);

sectionTitle("Screenshots", "Visual Showcase");
screenshotBlock("docs/screenshots/full_website.png", "Public website screenshot showing the full landing-page experience.", 225);
screenshotBlock("docs/screenshots/developers.png", "Developers showcase page.", 205);
screenshotBlock("docs/screenshots/admin-login.png", "Separate admin login page for the platform console.", 205);

sectionTitle("Testing, Verification, and Deployment", "Project Quality");
subTitle("Existing quality signals");
bulletList([
  "Backend tests cover API validation, auth guards, OpenAPI docs, indexes, env validation, Razorpay webhook security, and payment ownership checks.",
  "Frontend tests cover protected routing, AI service timeout behavior, query service URL building, HTTP auth events, and bodyless request headers.",
  "Frontend ESLint config enforces React hooks and refresh-safe exports.",
  "Docker and Render config make local and hosted deployment straightforward.",
  "OpenAPI document provides a public API contract for consumers and reviewers."
]);
subTitle("Professional presentation notes");
bulletList([
  "This PDF intentionally documents both product features and implementation evidence so it can be used in portfolio reviews, project submissions, or stakeholder demos.",
  "The website demonstrates frontend engineering, backend architecture, AI integration, auth, billing, analytics, admin operations, security hardening, and deployment readiness.",
  "The remaining polish opportunities are mostly product expansion items, not missing core architecture: richer live screenshots, more OpenAPI schemas, automated screenshot capture in CI, and deeper integration tests with a test database."
]);

sectionTitle("Final Product Pitch", "Summary");
callout(
  "AI SQL Studio in one sentence",
  "A professional full-stack SaaS website that turns schema-aware prompts into useful SQL and wraps that core AI workflow with authentication, plans, billing, analytics, history, support, notifications, admin operations, security controls, tests, and deployment configuration.",
  "dark"
);
paragraph(
  "For a portfolio or academic review, the strongest story is that this is not just an AI feature. It is a complete web product: public acquisition pages, protected workspace, paid-plan lifecycle, admin governance, and production-style backend architecture all exist in the repository."
);

function addFooter() {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const p = page();
    const pageNumber = i + 1;
    const footerLineY = p.height - doc.page.margins.bottom - 24;
    const footerTextY = p.height - doc.page.margins.bottom - 14;
    drawLine(footerLineY, "#dbe5ed");
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#6b7a8d")
      .text("AI SQL Studio - Complete Feature Documentation", p.left, footerTextY, {
        width: 300,
        align: "left",
        lineBreak: false
      });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#6b7a8d")
      .text(`Page ${pageNumber} of ${range.count}`, p.right - 100, footerTextY, {
        width: 100,
        align: "right",
        lineBreak: false
      });
  }
}

addFooter();
doc.end();

stream.on("finish", () => {
  console.log(outputPath);
});
