# Antz Platform — Architecture Summary

## Overview

The Antz platform consists of two core codebases:

| | Web Dashboard | API Backend |
|--|--|--|
| **Framework** | Next.js 16 + React 19 | CodeIgniter 4.7 (PHP 8.2+) |
| **Purpose** | Admin UI for zoo management | RESTful API serving all clients |
| **Repo** | `antz_web_dashboard` | `web-app-ci4` |

---

## 1. Web Dashboard (`antz_web_dashboard`)

### Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (Pages Router) | 16.1.6 |
| UI Library | React | 19.2.4 |
| Component Library | MUI (Material UI) | 7.3.8 |
| Data Tables | MUI X DataGrid | 8.27.1 |
| Date Pickers | MUI X Date Pickers | 8.27.2 |
| Styling | Emotion (CSS-in-JS) | 11.14.0 |
| Server State | TanStack React Query | 5.80.6 |
| Client State | Redux Toolkit | 2.11.2 |
| Forms | React Hook Form + Yup | 7.43.5 / 1.3.3 |
| HTTP Client | Axios | 1.13.5 |
| Icons | Iconify (`mdi:` prefix) | — |
| Notifications | React Hot Toast | 2.4.0 |
| Charts | ApexCharts, Recharts, Chart.js | — |
| i18n | i18next | 22.4.11 |
| Permissions | CASL | 6.3.3 |
| Font | Inter | — |

### Folder Structure

```
src/                          (~1,493 files)
├── @core/                    (119) — Core utilities, theme overrides, components
├── pages/                    (285) — Next.js file-based routes
├── components/               (447) — Business logic components (API calls, state, handlers)
├── views/                    (406) — Pure template components (props in, JSX out)
├── lib/api/                  (129) — API service layer (axios wrappers per module)
├── store/                    (18)  — Redux Toolkit store + slices
├── context/                  (9)   — React Context providers
├── hooks/                    (12)  — Custom React hooks
├── types/                    (27)  — TypeScript type definitions
├── configs/                  (4)   — Theme, auth, ACL config
├── constants/                (6)   — API endpoints, app constants
├── layouts/                  (14)  — Page layout components
├── navigation/               (2)   — Sidebar navigation config
└── utility/                  (5)   — Helper functions
```

### Architecture Patterns

**Component-View Separation:**
- `src/components/` — Business logic: API calls, React Query, state, handlers, toast notifications
- `src/views/pages/` — Pure templates: props in, JSX out, NO API calls or side effects
- Drawers/modals with own API logic go in `components/`

**API Layer:**
- Centralized in `src/lib/api/` organized by module (pharmacy, housing, diet, etc.)
- Uses `axiosGet`, `axiosPost`, `axiosFormPost`, `axiosDelete` from `src/lib/api/utility/`
- Auto-injects headers: Authorization (Bearer token), ZooId, SelectedStore, TimeZone

**State Management:**
- Server state: TanStack React Query (fetching, caching, invalidation)
- Client state: Redux Toolkit (housing insights, pharmacy shipments, necropsy, hospital)
- Local state: React useState/useReducer for UI state
- Auth state: React Context (`AuthContext`)

**Theme System:**
- Config: `src/configs/themeConfig.js`
- Palette: `src/@core/theme/palette/`
- Typography: `src/@core/theme/typography/` (Inter font)
- Component overrides: `src/@core/theme/overrides/`
- Custom tokens: `customColors.Surface`, `customColors.Tertiary`, etc.
- Rule: NEVER hardcode hex colors — always use theme tokens

**Auth & Permissions:**
- JWT-based auth via `AuthContext`
- CASL-based ACL for role-based access control
- Permission checks at component level

**Routing:**
- Next.js Pages Router (file-based)
- Dynamic routes: `[id]/index.js`
- Shallow routing for filter state preservation

### Key Modules

| Module | Pages | Description |
|--------|-------|-------------|
| Pharmacy | Request, Dispatch, Purchase, Stock | Drug/supply management |
| Housing | Cluster, Section, Enclosure | Animal housing hierarchy |
| Medical | Records, Vaccination, Lab | Medical records |
| Hospital | Operations, Admission | Hospital management |
| Diet | Categories, Templates | Animal nutrition |
| Egg | Tracking, Transfer | Egg management |
| Necropsy | Cases, Reports | Post-mortem records |
| Settings | QR Codes, Zoo Config, Departments | System configuration |
| Dashboard | Analytics, Reports | Data visualization |

---

## 2. API Backend (`web-app-ci4`)

### Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | CodeIgniter 4 | 4.7.0 |
| Language | PHP | 8.2+ |
| Database | MySQL | — |
| Auth | Firebase PHP-JWT | 6.3 |
| Caching | Predis (Redis) | 2.1 |
| Queue | RabbitMQ (php-amqplib) | 3.5 |
| PDF | mPDF | 8.2 |
| Excel | OpenSpout + PhpSpreadsheet | 4.28 / 4.3 |
| Email | SendGrid + Brevo | 8.1 / 2.0 |
| SMS/Voice | Twilio SDK | 8.3 |
| Cloud | AWS SDK | 3.315 |
| QR Codes | chillerlan/php-qrcode | 4.3 |
| WebSocket | Ratchet | 0.4.4 |
| Metrics | Prometheus Client | 2.14 |
| API Docs | Swagger/OpenAPI (zircote) | — |

### Folder Structure

```
app/
├── Controllers/Api/v1/       (98)  — REST API endpoints
├── Models/                   (382) — Data access + business logic
├── Services/                 (29)  — Cross-model orchestration
├── Libraries/                      — Custom libraries (Twilio, Odoo, PDF, etc.)
├── Filters/                  (11)  — Middleware (Auth, Metrics, Security)
├── Config/Routes/            (30)  — Route definitions per module
├── Database/Migrations/      (1,524) — Schema migrations
├── Commands/                 (13)  — CLI commands (cron, sync, notifications)
├── Helpers/                        — Shared utility functions
├── Jobs/                     (1)   — Queue job handlers
├── Validation/               (2)   — Custom validation rules
└── Swagger/                        — API documentation config
```

### Architecture Patterns

**Request Flow:**
```
Client → Filter (Auth/Validation) → Controller → Model/Service → Database
                                         ↓
                                    Response JSON
                                { success, data, message }
```

**Controller Design:**
- Thin controllers — orchestrate, don't implement logic
- One public method per endpoint
- Input validation at controller level (`$this->validateData()`)
- Standard response: `{ "success": bool, "data": ..., "message": "..." }`

**Model Layer:**
- Heavy models — data access + domain logic
- Composable methods: `scopeActive()`, `scopeByZoo()`
- Key-value settings: 2-query + loop pattern (not N JOINs)
- Soft deletes: varies per table (`is_deleted`, `active`, `status`)

**Middleware (Filters):**

| Filter | Purpose |
|--------|---------|
| `AuthFilter` | JWT token validation |
| `ValidateUserAndZooFilter` | User + zoo context |
| `AccessKeyFilter` | API key auth for public endpoints |
| `CronIpFilter` | IP whitelist for cron endpoints |
| `SecurityHeadersFilter` | CORS, XSS, HSTS headers |
| `MetricsFilter` | Prometheus request metrics |
| `QueryLogger` | SQL query logging |

**External Integrations:**

| Service | Purpose |
|---------|---------|
| AWS S3 | File storage, signed URLs |
| Twilio | SMS, WhatsApp notifications |
| SendGrid / Brevo | Email delivery |
| Odoo | ERP integration (webhooks) |
| RabbitMQ | Async message processing |
| Redis | Caching layer |

**Database Patterns:**
- Parameterized queries (no SQL injection)
- Query builder preferred over raw SQL
- Transactions for multi-table writes
- Pagination required on all list endpoints
- No `SELECT *` — explicit column selection

### Key Modules

| Module | Controllers | Description |
|--------|-------------|-------------|
| Auth | Login, Register, OTP | JWT authentication |
| Housing | Sites, Sections, Enclosures | Zoo facility hierarchy |
| Medical | Records, Vaccination, Lab | Animal health records |
| Pharmacy | Stock, Purchase, Dispatch | Drug/supply chain |
| Request | Departments, Approvals, Vendors | Procurement workflows |
| Hospital | Admission, Discharge | Hospital operations |
| Diet | Categories, Templates | Nutrition management |
| Egg | Tracking, Transfer | Egg lifecycle |
| Reports | Scheduled, On-demand | Data exports (Excel, PDF) |

---

## 3. How They Connect

```
┌─────────────────────────┐         ┌─────────────────────────┐
│   Web Dashboard          │  HTTP   │   API Backend            │
│   (Next.js + React)      │────────→│   (CodeIgniter 4)        │
│                          │  JSON   │                          │
│  src/lib/api/utility/    │←────────│  app/Controllers/Api/v1/ │
│  axiosGet/axiosPost      │         │  AuthFilter + Routes     │
│                          │         │                          │
│  Headers:                │         │  Reads:                  │
│  - Authorization: Bearer │         │  - JWT token → user      │
│  - ZooId                 │         │  - ZooId → zoo context   │
│  - CurrentTimeZone       │         │  - Timezone → dates      │
└─────────────────────────┘         └──────────┬──────────────┘
                                               │
                                    ┌──────────▼──────────────┐
                                    │   MySQL Database         │
                                    │   + Redis Cache          │
                                    │   + AWS S3 (files)       │
                                    │   + RabbitMQ (async)     │
                                    └─────────────────────────┘
```

**API Base URL:** Set via `NEXT_PUBLIC_API_BASE_URL` env variable in the dashboard.

**Auth Flow:**
1. Dashboard sends login credentials → API returns JWT token
2. Dashboard stores token in IndexedDB
3. All subsequent requests include `Authorization: Bearer <token>`
4. API `AuthFilter` validates token, extracts user context
5. `ValidateUserAndZooFilter` ensures user has access to the requested zoo

**Data Flow:**
1. Dashboard component calls API service function (e.g., `getDepartments(params)`)
2. `axiosGet/axiosPost` prepends base URL, injects auth headers
3. API controller receives request, validates input
4. Model executes query, returns data
5. Controller wraps in `{ success: true, data: [...] }` response
6. Dashboard component processes response, updates state/UI
