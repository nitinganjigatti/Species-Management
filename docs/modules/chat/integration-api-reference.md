# Antz Chat Integration API — Reference

> **Important**: This API is **server-to-server**. The browser never calls these endpoints directly. The chat backend consumes them to validate user tokens and look up user profiles from the main Antz app.
>
> Captured here for architectural context. The user-facing chat backend (which the browser + `@antzsoft/chat-core` SDK talks to) is a separate service and is **not yet documented or deployed**.
>
> **Source**: Antz Chat Integration API Reference v1.0 (confidential, provided by backend team).
>
> Related docs:
> - [README.md](./README.md) — chat module overview (currently runs on mock data)
> - [antzsoft-chat-core.md](./antzsoft-chat-core.md) — full SDK reference
> - [chat-core-starter.md](./chat-core-starter.md) — integration playbook for when the chat backend URL arrives

---

## 1. Overview

Five POST endpoints used by the **chat backend** to validate Bearer tokens and read user profiles from the **main Antz app**. All endpoints are server-to-server. They expect JSON, return JSON, and require the `x-api-key` header on every request.

### 1.1 Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/validate-token` | Verify a Bearer token, subject, and tenant |
| POST | `/users/get` | Fetch one user profile |
| POST | `/users/batch` | Fetch up to 100 user profiles |
| POST | `/users/list` | Paginated tenant directory |
| POST | `/users/search` | Search by name / email / username / staff ID |

All paths relative to `https://<host>/api/v1/chat-integration`.

On the dev API host: `https://api.dev.antzsystems.com/api/v1/chat-integration/...`

---

## 2. Authentication & common rules

### 2.1 API key (every request)

```
x-api-key: <CHAT_INTEGRATION_API_KEY>
Content-Type: application/json
```

- Missing or wrong key → HTTP `401`
- Compared with a constant-time function (timing-safe)
- One shared key, rotated quarterly
- **NEVER expose this key in the browser** — it's server-only

### 2.2 Common rules

| Rule | Detail |
|---|---|
| HTTP method | All endpoints are POST |
| Request `Content-Type` | `application/json` |
| Response `Content-Type` | `application/json` |
| "Not found" semantics | Always HTTP 200 with `{found:false}` or `{valid:false}` — never HTTP 404 |
| Timeout target | 5 seconds. `/auth/validate-token` is hot path, target < 50ms |
| Active-user scope | By default, only `account_status = active` returned. `/users/list` and `/users/search` accept a `status` override |
| Tenant scope | Every lookup is scoped to `tenantId`. Users not in the tenant are treated as "not found" |

---

## 3. User object

Returned by `/users/get`, `/users/batch`, `/users/list`, `/users/search`.

```json
{
  "id": "123",
  "tenantId": "7",
  "displayName": "John Doe",
  "email": "john@acme.com",
  "username": "john",
  "avatarUrl": "https://cdn.example.com/uploads/profiles/123.jpg?signed=...",
  "phone": "+919876543210",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2025-03-01T08:00:00Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | Yes | User's unique identifier |
| `tenantId` | string | Yes | Always echoes the tenant the lookup was scoped to |
| `displayName` | string | Yes | "First Last" — falls back to `username`, then `email` |
| `email` | string | Yes | Email address |
| `username` | string | Yes | Handle / login name |
| `avatarUrl` | string \| null | No | Signed URL (12-hour validity). `null` when no avatar is on file. |
| `phone` | string \| null | No | E.164-style. `null` when no phone is on file. |
| `status` | string | Yes | `active` / `inactive` / `suspended` |
| `createdAt` | ISO 8601 UTC | Yes | Account creation timestamp |
| `updatedAt` | ISO 8601 UTC | Yes | Last profile update timestamp |

---

## 4. POST `/auth/validate-token`

Verify that a Bearer token is valid, not expired, and owned by an active user who belongs to the requested tenant.

### Request

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "123",
  "tenantId": "7"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `token` | string | Yes | The Bearer token to verify |
| `userId` | string | Yes | User the client claims to be — cross-checked against the token subject |
| `tenantId` | string | Yes | Tenant the client claims |

### Response — valid (HTTP 200)

```json
{
  "valid": true,
  "userId": "123",
  "tenantId": "7",
  "error": null
}
```

### Response — invalid (HTTP 200)

```json
{
  "valid": false,
  "userId": null,
  "tenantId": null,
  "error": "Token expired"
}
```

### Possible error values

| Value | Meaning |
|---|---|
| `Missing token` | Required field missing in the request body |
| `Token invalid` | Signature does not verify |
| `Token subject mismatch` | Token's user does not match the claimed `userId` |
| `User not found` | No matching user in the system |
| `User is not active` | Account is inactive / suspended |
| `Token revoked` | Token was issued before the most recent password change |
| `User does not belong to tenant` | User exists but is not a member of the requested tenant |

> Always returns HTTP 200 when it runs. `valid:false` means the token was rejected; non-2xx means the service itself failed.

---

## 5. POST `/users/get`

Fetch one user profile, scoped to a tenant. Returns active users only.

### Request

```json
{
  "tenantId": "7",
  "userId": "123"
}
```

### Response — found (HTTP 200)

```json
{
  "found": true,
  "user": {
    "id": "123",
    "tenantId": "7",
    "email": "john@acme.com",
    "username": "john",
    "displayName": "John Doe",
    "avatarUrl": null,
    "phone": "+919876543210",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2025-03-01T08:00:00Z"
  }
}
```

### Response — not found (HTTP 200)

```json
{
  "found": false,
  "user": null
}
```

Returns `found:false` when the user doesn't exist, isn't in the tenant, or isn't active. Never HTTP 404.

---

## 6. POST `/users/batch`

Fetch up to **100** user profiles in one call. Active users only.

### Request

```json
{
  "tenantId": "7",
  "userIds": ["123", "456", "789"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `tenantId` | string | Yes | Tenant context |
| `userIds` | string[] | Yes | Array of user IDs — max length 100 |

### Response (HTTP 200)

```json
{
  "users": [
    { "id": "123", "tenantId": "7", "displayName": "John Doe", "...": "..." },
    { "id": "456", "tenantId": "7", "displayName": "Jane Smith", "...": "..." }
  ]
}
```

Users not found (or not active) in the tenant are silently omitted. No error entries.

`userIds.length > 100` → HTTP 400 with `code: TOO_MANY_IDS`.

---

## 7. POST `/users/list`

Paginated tenant user directory. Defaults to active users only; admin tooling may pass `status` to include inactive entries.

### Request

```json
{
  "tenantId": "7",
  "page": 1,
  "limit": 20,
  "status": "active"
}
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `tenantId` | string | Yes | — | Tenant to list users for |
| `page` | integer | No | 1 | 1-based |
| `limit` | integer | No | 20 | Cap at 100 |
| `status` | string | No | `active` | `active` / `inactive` / `all` |

### Response (HTTP 200)

```json
{
  "users": [ "...user objects..." ],
  "total": 150
}
```

`total` is the full count across all pages, not just the current page. Users are ordered alphabetically by first name, then last name.

---

## 8. POST `/users/search`

Search users by name, email, username, or staff ID, scoped to a tenant. Defaults to active users only.

### Request

```json
{
  "tenantId": "7",
  "query": "john",
  "limit": 20,
  "status": "active"
}
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `tenantId` | string | Yes | — | Tenant to search within |
| `query` | string | Yes | — | Search term, min 1 character |
| `limit` | integer | No | 20 | Cap at 50 |
| `status` | string | No | `active` | `active` / `inactive` / `all` |

### Response (HTTP 200)

```json
{
  "users": [ "...user objects..." ],
  "total": 3
}
```

Matched against:
- First name, last name, full name (concatenation)
- Email
- Username
- Staff ID

`total` is the number of matches before `limit` is applied.

---

## 9. Error responses

### 9.1 Error body shape

```json
{
  "error": "Unauthorized",
  "code": "INVALID_API_KEY",
  "message": "Missing or invalid x-api-key header."
}
```

### 9.2 HTTP status codes

| Status | When |
|---|---|
| 200 OK | Success — including logical not-found (`found:false` / `valid:false`) |
| 400 Bad Request | Malformed body, missing required fields, `userIds > 100` |
| 401 Unauthorized | Missing or invalid `x-api-key` header |
| 500 Internal Server Error | Unexpected server error — generic message returned |
| 503 Service Unavailable | Server-side configuration missing |

### 9.3 Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `INVALID_API_KEY` | 401 | Missing or wrong `x-api-key` |
| `VALIDATION_ERROR` | 400 | Body failed schema validation |
| `TOO_MANY_IDS` | 400 | `userIds` array exceeded 100 entries |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
| `INTEGRATION_NOT_CONFIGURED` | 503 | `CHAT_INTEGRATION_API_KEY` not set on the server |

---

## 10. Quick reference

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/chat-integration/auth/validate-token` | Verify Bearer token + subject + tenant |
| POST | `/api/v1/chat-integration/users/get` | Fetch one user profile |
| POST | `/api/v1/chat-integration/users/batch` | Fetch up to 100 user profiles |
| POST | `/api/v1/chat-integration/users/list` | Paginated tenant directory |
| POST | `/api/v1/chat-integration/users/search` | Search users in a tenant |

### Common headers

```
x-api-key: <CHAT_INTEGRATION_API_KEY>
Content-Type: application/json
```

### Sample request — Get single user

```bash
curl -X POST 'https://api.dev.antzsystems.com/api/v1/chat-integration/users/get' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: <CHAT_INTEGRATION_API_KEY>' \
  -d '{"tenantId":"7","userId":"123"}'
```

---

## 11. How this fits the chat architecture

```
                                        ┌─────────────────────────────────────┐
                                        │ ANTZ APP API (existing)             │
                                        │ api.dev.antzsystems.com             │
                                        │                                     │
                                        │ /api/v1/chat-integration/*  ◄──┐    │
                                        │  • /auth/validate-token        │    │
                                        │  • /users/get / batch          │    │
                                        │  • /users/list / search        │    │
                                        └────────────────────────────────┼────┘
                                                                         │
                                                          (x-api-key, server-to-server)
                                                                         │
                                                                         │
       ┌─────────────────────────────┐                                   │
       │ Browser (Antz Web Dashboard)│                                   │
       │                             │                                   │
       │  @antzsoft/chat-core SDK    │   Bearer JWT (WSO2 token)         │
       │  ┌────────────────────────┐ │ ─────────────────────────────►  ┌─┴─────────────────────────┐
       │  │ HTTP + Socket.IO       │ │                                  │ CHAT BACKEND               │
       │  └────────────────────────┘ │                                  │ (URL: TBD from backend     │
       │                             │ ◄──────────────────────────────  │  team — separate service)  │
       └─────────────────────────────┘   responses                      │                            │
                                                                        │  /api/v1/auth/*            │
                                                                        │  /api/v1/messages/*        │
                                                                        │  /api/v1/conversations/*   │
                                                                        │  /api/v1/storage/*         │
                                                                        │  Socket.IO /chat namespace │
                                                                        └────────────────────────────┘
```

### Flow on every chat-client request

1. Browser sends `Authorization: Bearer <WSO2 JWT>` to **chat backend**
2. **Chat backend** calls `POST /chat-integration/auth/validate-token` to the **Antz App API** with `{token, userId, tenantId}`
3. Antz App API verifies the token, checks user is active and belongs to tenant → returns `{valid: true/false}`
4. Chat backend either processes the request or returns 401

### Implications for our frontend

| Concern | Status |
|---|---|
| Bearer JWT is the right auth mechanism | ✅ Confirmed — chat-core uses this by default |
| WSO2 tokens will be accepted | ✅ Confirmed by `/auth/validate-token` shape (`{token, userId, tenantId}`) |
| `tenantId` = our `zoo_id` | ⚠ Likely, but worth confirming with backend ("Is the tenantId the same as our zoo_id?") |
| Browser never calls `/chat-integration/*` directly | ✅ This API is server-to-server only |
| `x-api-key` stays out of the frontend bundle | ✅ Frontend has no business knowing it |

### Still open

1. **What is the chat backend's URL?** — the service that consumes `/chat-integration/*` and serves browser-facing `/auth/*`, `/messages/*`, etc.
2. **What's the WebSocket URL?** — `/chat` namespace
3. **Does `tenantId` = `zoo_id`** in our user data, or something else?
4. **Where is the chat backend deployed** — same host as the integration API (sub-route), or a separate host?

These questions go to the **chat backend team**, not the Antz App API team (who already provided this integration adapter).

---

## Sample TypeScript bindings (for future server-side use)

If at some point the Antz Web Dashboard adds an internal Next.js API route that needs to call this integration API (e.g. a server-side admin tool), here are the matching TS types:

```ts
// All requests use 'x-api-key' header — never call from the browser.

export interface ChatIntegrationUser {
  id: string
  tenantId: string
  displayName: string
  email: string
  username: string
  avatarUrl: string | null
  phone: string | null
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string  // ISO 8601 UTC
  updatedAt: string  // ISO 8601 UTC
}

// /auth/validate-token
export interface ValidateTokenRequest {
  token: string
  userId: string
  tenantId: string
}
export interface ValidateTokenResponse {
  valid: boolean
  userId: string | null
  tenantId: string | null
  error: string | null
}

// /users/get
export interface GetUserRequest {
  tenantId: string
  userId: string
}
export interface GetUserResponse {
  found: boolean
  user: ChatIntegrationUser | null
}

// /users/batch
export interface BatchUsersRequest {
  tenantId: string
  userIds: string[]  // max 100
}
export interface BatchUsersResponse {
  users: ChatIntegrationUser[]
}

// /users/list
export interface ListUsersRequest {
  tenantId: string
  page?: number    // default 1
  limit?: number   // default 20, max 100
  status?: 'active' | 'inactive' | 'all'  // default 'active'
}
export interface ListUsersResponse {
  users: ChatIntegrationUser[]
  total: number
}

// /users/search
export interface SearchUsersRequest {
  tenantId: string
  query: string
  limit?: number   // default 20, max 50
  status?: 'active' | 'inactive' | 'all'  // default 'active'
}
export interface SearchUsersResponse {
  users: ChatIntegrationUser[]
  total: number
}

// Common error shape
export interface ChatIntegrationError {
  error: string
  code: 'INVALID_API_KEY' | 'VALIDATION_ERROR' | 'TOO_MANY_IDS' | 'INTERNAL_ERROR' | 'INTEGRATION_NOT_CONFIGURED'
  message: string
}
```

---

## License / confidentiality

Source document marked **Confidential**. Do not redistribute outside the Antz engineering org.
