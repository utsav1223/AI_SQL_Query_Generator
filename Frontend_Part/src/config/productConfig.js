export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "utsavjha93030@gmail.com";

export const SQL_DIALECT_OPTIONS = [
  { value: "standard", label: "Standard SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "sqlserver", label: "SQL Server" },
  { value: "oracle", label: "Oracle" }
];

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "INR 0",
    note: "/ month",
    badge: "Current",
    promise: "Try schema-aware SQL generation for free.",
    description: "For trying schema-aware SQL generation before committing to a full workflow.",
    dashboardDescription: "For students, demos, and users checking whether AI SQL Studio fits their workflow.",
    metrics: ["5 credits", "1 schema", "Latest 10 history"],
    features: [
      { label: "5 one-time generation credits", included: true },
      { label: "1 saved schema workspace", included: true },
      { label: "Text-to-SQL generation", included: true },
      { label: "Copy and download SQL", included: true },
      { label: "Latest 10 history entries", included: true },
      { label: "Basic usage overview", included: true },
      { label: "Optimize, validate, and explain", included: false },
      { label: "Advanced analytics", included: false }
    ],
    action: "Start Free",
    mode: "register"
  },
  {
    id: "professional",
    name: "Professional",
    price: "INR 499",
    note: "/ month",
    badge: "Best value",
    promise: "Generate, validate, optimize, explain, and track SQL without limits.",
    description: "For serious SQL work with review tools, full history, and analytics that prove time saved.",
    dashboardDescription: "For serious SQL work where history, review, and analytics save real time.",
    metrics: ["Full archive", "Pro tools", "Value analytics"],
    highlighted: true,
    features: [
      { label: "High monthly generation allowance", included: true },
      { label: "Optimize, validate, explain, and format", included: true },
      { label: "Full searchable history archive", included: true },
      { label: "Pins, favorites, and tags", included: true },
      { label: "SQL dialect selection", included: true },
      { label: "Time saved, quality, and schema analytics", included: true },
      { label: "Invoices and priority support", included: true }
    ],
    action: "Go Pro",
    mode: "login"
  }
];
