# Data Flow Diagrams

This document explains how data moves through AI SQL Studio across authentication, AI generation, billing, admin operations, and persistence.

## High-Level Data Flow

```mermaid
flowchart TD
  browser[User Browser] --> ui[React UI]
  adminBrowser[Admin Browser] --> ui

  ui --> apiClient[Frontend Service Clients]
  apiClient --> express[Express API]

  express --> authMw[Auth and Plan Middleware]
  authMw --> routeControllers[Controllers]
  routeControllers --> domainServices[Domain Services]
  domainServices --> mongoose[Mongoose Models]
  mongoose --> mongo[(MongoDB)]

  domainServices --> gemini[Gemini API]
  domainServices --> razorpay[Razorpay]
  domainServices --> mail[SMTP or Resend]
  express --> google[Google OAuth]

  mongo --> domainServices
  domainServices --> routeControllers
  routeControllers --> apiClient
  apiClient --> ui
```

## Authentication Flow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant API as Auth API
  participant DB as MongoDB

  U->>FE: Submit login or register form
  FE->>API: POST /api/auth/login or /register
  API->>DB: Find or create user
  API->>API: Hash or compare password
  API->>API: Sign JWT
  API-->>FE: Return token and public user
  FE->>FE: Store token and user in localStorage
  FE-->>U: Open dashboard
```

## Google OAuth Flow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant API as Auth API
  participant G as Google OAuth
  participant DB as MongoDB

  U->>FE: Click Continue with Google
  FE->>API: GET /api/auth/google
  API->>G: Redirect to Google consent
  G-->>API: Callback with profile
  API->>DB: Find or create user
  API->>API: Sign JWT
  API-->>FE: Redirect to /oauth-success
  FE->>FE: Save token and user
  FE-->>U: Open dashboard
```

## AI Tool Flow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as AI Workspace
  participant API as AI API
  participant M as Middleware
  participant S as AI Service
  participant DB as MongoDB
  participant G as Gemini API

  U->>FE: Select generate, optimize, explain, or validate
  U->>FE: Enter prompt or SQL
  FE->>API: POST /api/ai
  API->>M: Verify JWT
  M->>M: Check plan for Pro-only modes
  API->>S: Process tool request
  S->>DB: Read saved schema context
  S->>G: Send prompt, SQL, schema, and mode
  G-->>S: Return result
  S->>DB: Save query record
  S-->>API: Result
  API-->>FE: JSON response
  FE-->>U: Render output
```

## Schema Context Flow

```mermaid
flowchart LR
  user[User] --> editor[Schema Editor]
  editor --> schemaApi[Schema API]
  schemaApi --> schemaService[Schema Service]
  schemaService --> schemaModel[Schema Model]
  schemaModel --> mongo[(MongoDB)]
  mongo --> aiService[AI Service]
  aiService --> gemini[Gemini API]
```

## Query History And Analytics Flow

```mermaid
flowchart TD
  aiResult[AI Result] --> queryService[Query Service]
  queryService --> queryModel[Query Model]
  queryModel --> mongo[(MongoDB)]

  dashboard[Dashboard Pages] --> queryApi[Query API]
  queryApi --> queryService
  queryService --> overview[Overview Stats]
  queryService --> history[History Records]
  queryService --> analytics[Analytics Data]
  overview --> dashboard
  history --> dashboard
  analytics --> dashboard
```

## Billing Flow

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Billing UI
  participant API as Payment API
  participant R as Razorpay
  participant DB as MongoDB
  participant E as Email Service

  U->>FE: Click Upgrade To Pro
  FE->>API: POST /api/payment/create-payment-link
  API->>R: Create payment link
  R-->>API: Return payment link
  API-->>FE: Return short_url
  FE->>R: Redirect user to checkout
  R-->>FE: Redirect user to success callback
  FE->>API: POST /api/payment/verify-payment-link
  API->>API: Verify Razorpay signature
  API->>DB: Set user plan to pro
  API->>DB: Create Payment document
  API->>DB: Create Invoice document
  API->>E: Send confirmation email with invoice
  API-->>FE: Return verification result
  FE-->>U: Show billing success page
```

## Downgrade Flow

```mermaid
sequenceDiagram
  participant U as Pro User
  participant FE as Pricing or Billing UI
  participant API as Payment API
  participant DB as MongoDB

  U->>FE: Click Downgrade To Free
  FE->>FE: Confirm downgrade
  FE->>API: POST /api/payment/downgrade
  API->>API: Verify JWT
  API->>DB: Set plan to free and clear billingRenewal
  DB-->>API: Updated user
  API-->>FE: Return public user
  FE->>FE: Refresh auth session
  FE-->>U: Show Free plan as active
```

## Admin Moderation Flow

```mermaid
sequenceDiagram
  participant A as Admin
  participant FE as Admin UI
  participant API as Admin API
  participant DB as MongoDB

  A->>FE: Login to admin console
  FE->>API: POST /api/admin/login
  API-->>FE: Return admin token
  FE->>API: GET /api/admin/overview
  API->>DB: Aggregate users, feedback, invoices, events
  DB-->>API: Dashboard data
  API-->>FE: Overview
  A->>FE: Moderate user or feedback
  FE->>API: Moderation request
  API->>DB: Update target record
  API->>DB: Write AdminAuditLog
  API-->>FE: Updated state
```

## Persistence Map

```mermaid
erDiagram
  User ||--o{ Query : creates
  User ||--o{ Schema : owns
  User ||--o{ Payment : pays
  User ||--o{ Invoice : receives
  User ||--o{ Feedback : submits
  User ||--o{ SecurityEvent : triggers
  User ||--o{ AdminAuditLog : target

  User {
    string name
    string email
    string role
    string status
    string plan
    date billingRenewal
  }

  Query {
    string mode
    string prompt
    string result
    boolean pinned
  }

  Schema {
    string schemaText
    number size
  }

  Payment {
    string paymentId
    number amount
    string status
  }

  Invoice {
    string invoiceNumber
    number amount
    string status
  }

  Feedback {
    number rating
    string topic
    string status
  }

  SecurityEvent {
    string type
    string severity
    string status
  }

  AdminAuditLog {
    string action
    string reason
  }
```
