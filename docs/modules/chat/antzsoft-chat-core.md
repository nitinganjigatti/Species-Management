# `@antzsoft/chat-core` — Complete Library Reference

> **Status (May 2026)**: documented for future use. The chat module currently runs on Materio mock data. This file is a **self-contained** reference — everything you need to integrate the SDK lives here.
>
> Companion to [README.md](./README.md) (the Materio chat module overview).

---

## Table of Contents

1. [Overview](#overview)
2. [Install](#install)
3. [Package facts](#package-facts)
4. [Required adapters](#required-adapters)
5. [Configuration (`AntzChatConfig`)](#configuration-antzchatconfig)
6. [Auth integration with WSO2 SSO](#auth-integration-with-wso2-sso)
7. [`AntzChatClient` — headless entrypoint](#antzchatclient--headless-entrypoint)
8. [Auth API](#auth-api-authapi)
9. [Messages API](#messages-api-messagesapi)
10. [Conversations API](#conversations-api-conversationsapi)
11. [Storage API + `uploadBatch`](#storage-api-storageapi--uploadbatch)
12. [Devices API (push notifications)](#devices-api-devicesapi)
13. [Socket — connection management](#socket--connection-management)
14. [Socket — outbound (`socketEmit`)](#socket--outbound-socketemit)
15. [Socket — inbound events](#socket--inbound-events)
16. [Auth Store (Zustand, persisted)](#auth-store-zustand-persisted)
17. [Chat Store (`useChatStore`)](#chat-store-usechatstore)
18. [Data Types](#data-types)
19. [Full bot example (Node.js)](#full-bot-example-nodejs)
20. [Custom UI example (vanilla browser)](#custom-ui-example-vanilla-browser)
21. [Migration plan from our mock](#migration-plan-from-our-mock)
22. [Risks to track](#risks-to-track)
23. [Activation checklist](#activation-checklist)

---

## Overview

`@antzsoft/chat-core` is a **headless TypeScript SDK** for the Antz Chat platform. Pure data + transport + state. **No UI.** Works in browser, React Native (Expo + bare), and Node.js.

| Layer | Provides |
|---|---|
| HTTP | Axios client with automatic token injection, 401 → refresh handling, multi-tenant headers |
| Realtime | Socket.IO wrapper with typed event emitters, ack-based operations, connection-state management |
| State | Zustand auth store (persisted) + chat UI store (typing, presence, replies, edit context) |
| Class | `AntzChatClient` — one class that wires everything together |
| Types | Full TS types for every entity, API payload, and socket event |

Three siblings in the ecosystem:
- `@antzsoft/chat-core` ← **this**
- `@antzsoft/chat-web-sdk` — pre-built web UI on top of core (not used here; we have Materio)
- `@antzsoft/chat-rn-sdk` — pre-built React Native UI

We use **core only** because our UI is the existing Materio chat layout.

---

## Install

```bash
npm install @antzsoft/chat-core
```

Brings in three transitive deps already bundled: `axios ^1.6.7`, `socket.io-client ^4.7.4`, `zustand ^4.5.0`. **No peer deps.**

---

## Package facts

| | |
|---|---|
| Latest version | `1.0.0` (also `1.0.1` exists; `latest` tag → `1.0.0`) — published 2026-05-15 |
| Module format | Hybrid ESM (`dist/index.js`) + CJS (`dist/index.cjs`) + `.d.ts` |
| Unpacked size | ~287 KB · 8 files |
| License | MIT |
| Maintainers | `antz.karthik` / `antzsoft_trellisys` — lifesciencetrust.com (same team as `@antzsoft/wso2-auth-web`) |
| Repo / homepage | Not declared in package.json |

---

## Required adapters

The SDK is platform-agnostic, so it asks you for two small adapters:

### 1. `persistStorage` — token persistence

```ts
interface PersistStorage {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}
```

The SDK stores auth tokens under the key `"antz-chat-auth"`.

**Browser:**
```ts
const persistStorage: PersistStorage = {
  getItem: (k) => localStorage.getItem(k),
  setItem: (k, v) => localStorage.setItem(k, v),
  removeItem: (k) => localStorage.removeItem(k)
}
```

**React Native:**
```ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const persistStorage: PersistStorage = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k)
}
```

**Node.js (in-memory, fine for bots):**
```ts
const _store: Record<string, string> = {}
const persistStorage: PersistStorage = {
  getItem: (k) => _store[k] ?? null,
  setItem: (k, v) => { _store[k] = v },
  removeItem: (k) => { delete _store[k] }
}
```

### 2. `platformUploadFn` — binary upload to presigned URL

```ts
type PlatformUploadFn = (
  presigned: PresignedUrlResponse,
  file: UploadableFile,
  onProgress?: (pct: number) => void
) => Promise<void>
```

The SDK requests a presigned URL from the server, then hands the response + local file to this function. The function is responsible for the actual HTTP upload and for calling `onProgress` with a 0–1 fraction.

**Browser (XHR with progress):**
```ts
const platformUploadFn: PlatformUploadFn = async (presigned, file, onProgress) => {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(presigned.method, presigned.uploadUrl)
    Object.entries(presigned.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    xhr.upload.onprogress = (e) => onProgress?.(e.loaded / e.total)
    xhr.onload = () => xhr.status < 400 ? resolve() : reject(new Error(`${xhr.status}`))
    xhr.onerror = () => reject(new Error('Network error'))
    if (presigned.method === 'PUT') {
      fetch(file.uri).then(r => r.blob()).then(blob => xhr.send(blob))
    } else {
      const fd = new FormData()
      Object.entries(presigned.fields ?? {}).forEach(([k, v]) => fd.append(k, v))
      fetch(file.uri).then(r => r.blob()).then(blob => { fd.append('file', blob, file.name); xhr.send(fd) })
    }
  })
}
```

**React Native (Expo FileSystem):**
```ts
import * as FileSystem from 'expo-file-system'

const platformUploadFn: PlatformUploadFn = async (presigned, file, onProgress) => {
  const callback = (p: FileSystem.UploadProgressData) =>
    onProgress?.(p.totalBytesSent / p.totalBytesExpectedToSend)

  const task = FileSystem.createUploadTask(
    presigned.uploadUrl,
    file.uri,
    {
      httpMethod: presigned.method,
      headers: presigned.headers,
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT
    },
    callback
  )
  const result = await task.uploadAsync()
  if (!result || result.status >= 400) throw new Error(`Upload failed: ${result?.status}`)
}
```

**Node.js (fetch + fs, Node 18+):**
```ts
import { readFileSync } from 'fs'

const platformUploadFn: PlatformUploadFn = async (presigned, file) => {
  const body = readFileSync(file.uri.replace('file://', ''))
  const res = await fetch(presigned.uploadUrl, {
    method: presigned.method,
    headers: presigned.headers,
    body
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
}
```

**No uploads at all?** Use a no-op:
```ts
const platformUploadFn: PlatformUploadFn = async () => {}
```

---

## Configuration (`AntzChatConfig`)

```ts
interface AntzChatConfig {
  /** Base URL for REST. Include the versioned path: "https://api.x.com/api/v1". REQUIRED. */
  apiUrl: string

  /** Token storage adapter. REQUIRED. */
  persistStorage: PersistStorage

  /** Binary upload adapter. REQUIRED. */
  platformUploadFn: PlatformUploadFn

  /** WebSocket URL. Defaults to apiUrl with "/api/vN" stripped. Connects to {socketUrl}/chat. */
  socketUrl?: string

  /** Pre-issued JWT (e.g. SSO-completed). Skips the login step. Use this OR authProvider. */
  authToken?: string

  /** Async function returning a fresh access token. Called before every request and on socket reconnect. */
  authProvider?: () => Promise<string>

  /** Multi-tenant identifier. Sent as the "X-Tenant-ID" header. */
  tenantId?: string

  /** Encryption mode. Must match the server's ENCRYPTION_MODE env var. Default: 'none'. */
  encryptionMode?: 'none' | 'server'

  /** Fine-grained upload constraints and callbacks. */
  upload?: UploadConfig
}

interface UploadConfig {
  /** File size limits in MB. Either a single number or per-type. Defaults: image 5, video 25, audio 10, document 10. */
  maxFileSizeMB?: number | {
    image?: number
    video?: number
    audio?: number
    document?: number
    default?: number
  }
  /** Max attachments per message. Default: 10. */
  maxFilesPerMessage?: number
  /** Restrict allowed categories. Default: all four. */
  allowedTypes?: Array<'image' | 'video' | 'audio' | 'document'>
  /** Called when a file fails local validation or its upload fails. */
  onUploadError?: (file: UploadableFile, error: Error) => void
  /** Called with 0–100 aggregate progress during a batch upload. */
  onProgress?: (progress: number) => void
}
```

### Per-type upload limits example

```ts
const config: AntzChatConfig = {
  apiUrl: 'https://chat.example.com/api/v1',
  persistStorage,
  platformUploadFn,
  upload: {
    maxFileSizeMB: { image: 10, video: 50, audio: 20, document: 25 },
    maxFilesPerMessage: 5,
    allowedTypes: ['image', 'document'],
    onUploadError: (file, err) => console.error(`Failed: ${file.name}:`, err),
    onProgress: (pct) => setProgress(pct)
  }
}
```

---

## Auth integration with WSO2 SSO

For the Antz Web Dashboard, use the `authProvider` mode — the SDK calls it on every request and on socket reconnect:

```ts
import { AntzChatClient } from '@antzsoft/chat-core'
import wso2Client from 'src/lib/auth/wso2Client'

const chatClient = new AntzChatClient({
  apiUrl: process.env.NEXT_PUBLIC_CHAT_API_URL!,
  persistStorage,
  platformUploadFn,
  authProvider: async () => await wso2Client.getAccessToken(),
  tenantId: authContext.userData?.user?.zoos?.[0]?.zoo_id  // current zoo as tenant
})
```

> **Open question**: does the Antz Chat backend accept WSO2-issued JWTs directly, or do we need a token-exchange step? Confirm with backend team before integration.

### Three auth modes

```ts
// Option 1 — SDK manages login/logout
await client.auth.login({ email, password })

// Option 2 — pre-authenticated token (one-shot)
const client = new AntzChatClient({ ...config, authToken: 'eyJ...' })

// Option 3 — dynamic token provider (SSO, rotation) — our pick
const client = new AntzChatClient({
  ...config,
  authProvider: async () => {
    const token = await yourApp.getAccessToken()
    return token
  }
})
```

---

## `AntzChatClient` — headless entrypoint

```ts
class AntzChatClient {
  readonly auth: typeof authApi
  readonly messages: typeof messagesApi
  readonly conversations: typeof conversationsApi
  readonly storage: typeof storageApi
  readonly socket: {
    emit: typeof socketEmit
    on(event: string, handler: (...args: unknown[]) => void): void
    off(event: string, handler: (...args: unknown[]) => void): void
  }

  constructor(config: AntzChatConfig)

  /** Connect Socket.IO. Resolves on successful connection. */
  connect(): Promise<void>

  /** Disconnect socket + clear singleton. */
  disconnect(): void

  /** High-level batch upload pipeline. */
  uploadFiles(files: UploadableFile[], conversationId?: string): Promise<BatchUploadResult>
}
```

### Minimum bootstrap (5 lines)

```ts
import { AntzChatClient } from '@antzsoft/chat-core'

const client = new AntzChatClient({ apiUrl, persistStorage, platformUploadFn })
await client.auth.login({ email: 'user@example.com', password: 'secret' })
await client.connect()
client.socket.on('new_message', (evt) => console.log(evt.message))
client.socket.emit.joinRoom('conv-abc')
```

---

## Auth API (`authApi`)

```ts
import { authApi } from '@antzsoft/chat-core'
```

| Method | Signature | Description |
|---|---|---|
| `login` | `(credentials: LoginCredentials) => Promise<AuthResponse>` | Email + password. Returns user and tokens. |
| `register` | `(data: RegisterData) => Promise<AuthResponse>` | Create a new account. |
| `refresh` | `(refreshToken: string) => Promise<AuthTokens>` | Exchange refresh token. **Automatic on 401** — call manually only if needed. |
| `logout` | `(refreshToken?: string) => Promise<void>` | Invalidate current session. |
| `logoutAll` | `() => Promise<void>` | Invalidate all sessions for the current user. |
| `getMe` | `() => Promise<User>` | Fetch the current user's profile. |

```ts
const { user, tokens } = await authApi.login({ email: 'u@x.com', password: 'secret' })

const { user } = await authApi.register({
  email: 'new@x.com',
  password: 'hunter2',
  username: 'newuser',
  displayName: 'New User',
  tenantId: 'tenant-xyz'
})

await authApi.logout(tokens.refreshToken)
```

---

## Messages API (`messagesApi`)

```ts
import { messagesApi } from '@antzsoft/chat-core'
```

| Method | Signature | Description |
|---|---|---|
| `list` | `(conversationId, params?: ListMessagesParams) => Promise<CursorPaginatedResponse<Message>>` | Cursor-paginated message history. |
| `get` | `(messageId: string) => Promise<Message>` | Fetch a single message. |
| `send` | `(conversationId, payload: SendData) => Promise<Message>` | REST send (use `socketEmit.sendMessage` for real-time). |
| `update` | `(messageId, text) => Promise<Message>` | Edit message text. |
| `delete` | `(messageId) => Promise<void>` | Delete a message. |
| `addReaction` | `(messageId, emoji) => Promise<Message>` | Add reaction. |
| `removeReaction` | `(messageId, emoji) => Promise<Message>` | Remove reaction. |
| `star` | `(messageId) => Promise<void>` | Star a message. |
| `unstar` | `(messageId) => Promise<void>` | Unstar. |
| `getStarred` | `(params?) => Promise<PaginatedResponse<Message>>` | List starred messages. |
| `search` | `(params: SearchParams) => Promise<PaginatedResponse<Message>>` | Full-text search. |
| `markAsRead` | `(conversationId, messageId?) => Promise<void>` | Mark messages as read via REST. |
| `pin` | `(messageId) => Promise<Message>` | Pin a message. |
| `unpin` | `(messageId) => Promise<Message>` | Unpin. |
| `getPinned` | `(conversationId) => Promise<Message[]>` | List pinned messages. |

```ts
interface ListMessagesParams {
  cursor?: string                       // opaque pagination cursor
  limit?: number                        // server default
  direction?: 'before' | 'after'
}

interface SendData {
  text?: string
  attachments?: SendMessageAttachment[]
  replyTo?: string                      // messageId being replied to
  tempId?: string                       // client-generated; echoed in message_ack
  isEncrypted?: boolean
}

interface SearchParams {
  query: string
  conversationId?: string
  page?: number
  limit?: number
}
```

### Cursor-paginated history

```ts
const page1 = await messagesApi.list('conv-abc', { limit: 50 })

if (page1.meta.hasMore && page1.meta.nextCursor) {
  const page2 = await messagesApi.list('conv-abc', {
    cursor: page1.meta.nextCursor,
    direction: 'before',
    limit: 50
  })
}
```

### Send with reply

```ts
await messagesApi.send('conv-abc', {
  text: 'Good point!',
  replyTo: 'msg-456',
  tempId: crypto.randomUUID()
})
```

### Search

```ts
const results = await messagesApi.search({ query: 'deployment', conversationId: 'conv-abc' })
```

---

## Conversations API (`conversationsApi`)

```ts
import { conversationsApi } from '@antzsoft/chat-core'
```

| Method | Signature | Description |
|---|---|---|
| `list` | `(params?) => Promise<PaginatedResponse<Conversation>>` | All conversations the user is part of. |
| `get` | `(conversationId) => Promise<Conversation>` | Single conversation. |
| `createGroup` | `(data: CreateGroupData) => Promise<Conversation>` | Create a group. |
| `createDirect` | `(data: CreateDirectData) => Promise<Conversation>` | Start or retrieve a DM. |
| `update` | `(conversationId, data: UpdateConversationData) => Promise<Conversation>` | Update name/description/icon. |
| `delete` | `(conversationId) => Promise<void>` | Admin-only deletion. |
| `addParticipants` | `(conversationId, userIds: string[]) => Promise<Conversation>` | Add members. |
| `removeParticipant` | `(conversationId, userId) => Promise<Conversation>` | Remove a member. |
| `updateParticipantRole` | `(conversationId, userId, role: 'admin' \| 'member') => Promise<Conversation>` | Promote/demote. |
| `mute` | `(conversationId, mutedUntil?: string) => Promise<void>` | Mute (optionally until an ISO date). |
| `unmute` | `(conversationId) => Promise<void>` | Unmute. |
| `pin` | `(conversationId) => Promise<void>` | Pin to top. |
| `unpin` | `(conversationId) => Promise<void>` | Unpin. |
| `leave` | `(conversationId) => Promise<void>` | Leave a group. |
| `getMembers` | `(conversationId) => Promise<User[]>` | Full participant profiles. |
| `searchUsers` | `(query: string) => Promise<User[]>` | Search users by name/email. |

```ts
interface CreateGroupData {
  name: string
  description?: string
  icon?: string                         // emoji or short string for group avatar
  participantIds: string[]
}

interface CreateDirectData {
  userId: string
}

interface UpdateConversationData {
  name?: string
  description?: string
  icon?: string
}
```

### Examples

```ts
// Create a group
const group = await conversationsApi.createGroup({
  name: 'Engineering',
  participantIds: ['user-a', 'user-b', 'user-c']
})

// Start a DM
const dm = await conversationsApi.createDirect({ userId: 'user-b' })

// Add members
await conversationsApi.addParticipants(group.id, ['user-d', 'user-e'])

// Mute for 8 hours
const mutedUntil = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
await conversationsApi.mute(group.id, mutedUntil)
```

---

## Storage API (`storageApi`) + `uploadBatch`

```ts
import { storageApi, uploadBatch } from '@antzsoft/chat-core'
```

| Method | Signature | Description |
|---|---|---|
| `requestPresignedUrl` | `(payload: PresignedUrlRequest) => Promise<PresignedUrlResponse>` | Single presigned URL. |
| `requestPresignedUrlBatch` | `(files: PresignedUrlRequest[]) => Promise<{ urls; errors }>` | Batch presign. |
| `confirmUpload` | `(fileId: string) => Promise<FileResponse>` | **Required** after each upload. |
| `getFile` | `(fileId) => Promise<FileResponse>` | Fetch metadata. |
| `getFileUrl` | `(fileId, expiresIn?) => Promise<{ url; expiresAt }>` | Fresh signed URL for an existing file. |
| `deleteFile` | `(fileId) => Promise<void>` | Delete. |
| `getConversationFiles` | `(conversationId, params?) => Promise<PaginatedResponse<FileResponse>>` | Files shared in a conversation. |
| `getMyFiles` | `(params?) => Promise<PaginatedResponse<FileResponse>>` | Files uploaded by current user. |

### `uploadBatch` — high-level helper

```ts
function uploadBatch(
  files: UploadableFile[],
  platformUploadFn: PlatformUploadFn,
  conversationId?: string,
  onProgress?: (pct: number) => void
): Promise<BatchUploadResult>

interface BatchUploadResult {
  successful: FileResponse[]
  failed: Array<{ filename: string; error: string }>
}
```

Handles: batch presign → parallel binary upload → confirm each file.

### Manual flow (single file)

```ts
const presigned = await storageApi.requestPresignedUrl({
  filename: 'report.pdf',
  mimeType: 'application/pdf',
  size: 512_000,
  conversationId: 'conv-abc'
})

await platformUploadFn(presigned, file, (pct) => console.log(`${pct * 100}%`))

const fileRecord = await storageApi.confirmUpload(presigned.fileId)
```

### Batch flow

```ts
const result = await uploadBatch(
  files,
  platformUploadFn,
  'conv-abc',
  (pct) => setProgress(pct)
)
result.successful.forEach((f) => console.log('Uploaded:', f.url))
result.failed.forEach((f) => console.error('Failed:', f.filename, f.error))
```

---

## Devices API (`devicesApi`)

Push notification token registration. **The SDK does not call this automatically.** The host app must obtain the device token from the OS and register it.

```ts
import { devicesApi } from '@antzsoft/chat-core'
```

| Method | Signature | Description |
|---|---|---|
| `register` | `(payload: RegisterDeviceTokenPayload) => Promise<void>` | Register or refresh a push token (upserts by `deviceId`). |
| `remove` | `(deviceId: string) => Promise<void>` | Remove a device token. Call on logout. |

```ts
type RegisterDeviceTokenPayload =
  | {
      deviceId: string                      // stable UUID — generate once and persist
      platform: 'ios' | 'android' | 'web'
      provider: 'expo' | 'fcm' | 'apns'
      token: string                         // OS-issued push token
      userAgent?: string
    }
  | {
      deviceId: string
      platform: 'web'
      provider: 'web-push'
      endpoint: string                      // PushSubscription.endpoint
      p256dh: string                        // base64url 'p256dh'
      auth: string                          // base64url 'auth'
      userAgent?: string
    }
```

```ts
// Mobile (Expo)
import * as Notifications from 'expo-notifications'
const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync()
await devicesApi.register({
  deviceId: await getStableDeviceId(),
  platform: 'ios',
  provider: 'expo',
  token: expoPushToken
})

// On logout
await devicesApi.remove(deviceId)
```

---

## Socket — connection management

```ts
import {
  connectSocket,
  disconnectSocket,
  reconnectSocket,
  getSocketStatus,
  onSocketStatus,
  type SocketStatus
} from '@antzsoft/chat-core'
```

```ts
type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
```

| Function | Signature | Description |
|---|---|---|
| `connectSocket` | `(config, getToken: () => string \| null \| undefined) => Promise<Socket>` | Initialize + connect. No-op if already connected. |
| `disconnectSocket` | `() => void` | Disconnect + clear singleton. |
| `reconnectSocket` | `(token: string) => void` | Update auth token and reconnect. |
| `getSocketStatus` | `() => SocketStatus` | Synchronous read. |
| `onSocketStatus` | `(listener: (status) => void) => () => void` | Subscribe to status changes (returns unsubscribe). |

```ts
const unsubscribe = onSocketStatus((status) => {
  if (status === 'connected') console.log('Socket ready')
  if (status === 'error') console.error('Socket error — check network')
})

reconnectSocket(newAccessToken)  // when host app refreshes its token
unsubscribe()
disconnectSocket()
```

---

## Socket — outbound (`socketEmit`)

```ts
import { socketEmit } from '@antzsoft/chat-core'
```

> Ack-based methods reject the promise on **5s timeout** or if the socket is disconnected.
> Fire-and-forget methods silently no-op when disconnected.

| Method | Signature | Behavior |
|---|---|---|
| `joinRoom` | `(conversationId) => void` | Fire-and-forget. |
| `leaveRoom` | `(conversationId) => void` | Fire-and-forget. |
| `sendMessage` | `(payload: SendMessagePayload) => Promise<unknown>` | Ack-based. |
| `updateMessage` | `(messageId, text) => Promise<unknown>` | Ack-based. |
| `deleteMessage` | `(messageId) => Promise<unknown>` | Ack-based. |
| `addReaction` | `(messageId, emoji) => Promise<unknown>` | Ack-based. |
| `removeReaction` | `(messageId, emoji) => Promise<unknown>` | Ack-based. |
| `pinMessage` | `(messageId) => Promise<unknown>` | Ack-based. |
| `unpinMessage` | `(messageId) => Promise<unknown>` | Ack-based. |
| `typing` | `(conversationId, isTyping) => void` | Fire-and-forget. |
| `markRead` | `(conversationId, messageId?) => void` | Fire-and-forget. |
| `getOnlineUsers` | `(userIds: string[]) => Promise<string[]>` | Ack-based — returns the online subset. |
| `getTypingUsers` | `(conversationId) => Promise<unknown>` | Ack-based. |

```ts
socketEmit.joinRoom('conv-abc')

await socketEmit.sendMessage({
  conversationId: 'conv-abc',
  text: 'Hello!',
  tempId: crypto.randomUUID()
})

socketEmit.typing('conv-abc', true)
// … later
socketEmit.typing('conv-abc', false)

socketEmit.markRead('conv-abc')              // mark all unread
socketEmit.markRead('conv-abc', 'msg-99')    // mark up to a specific message

const onlineIds = await socketEmit.getOnlineUsers(['user-a', 'user-b'])
```

---

## Socket — inbound events

Subscribe via `client.socket.on(event, handler)` or `getSocket().on(...)`.

| Event | Payload | Description |
|---|---|---|
| `new_message` | `NewMessageEvent` | New message in a room you've joined. |
| `message_updated` | `MessageUpdatedEvent` | Message edited. |
| `message_deleted` | `MessageDeletedEvent` | Message deleted. |
| `reaction_updated` | `ReactionUpdatedEvent` | Reactions changed (full array). |
| `typing_indicator` | `TypingIndicatorEvent` | User started/stopped typing. |
| `user_status` | `UserStatusEvent` | User went online/offline/away. |
| `read_receipt` | `ReadReceiptEvent` | User read messages. |
| `message_ack` | `MessageAckEvent` | Server confirmation for a socket-sent message (`tempId → messageId`). |
| `messages_delivered` | `MessagesDeliveredEvent` | Messages you sent were delivered. |
| `conversation_created` | `Conversation` | New conversation (or you were added). |
| `conversation_updated` | `Conversation` | Metadata changed. |
| `conversation_deleted` | `{ conversationId: string }` | Conversation deleted. |

```ts
import type {
  NewMessageEvent,
  MessageUpdatedEvent,
  MessageDeletedEvent,
  ReactionUpdatedEvent,
  TypingIndicatorEvent,
  UserStatusEvent,
  ReadReceiptEvent,
  MessageAckEvent,
  MessagesDeliveredEvent
} from '@antzsoft/chat-core'

client.socket.on('new_message', (evt: NewMessageEvent) => appendMessage(evt.message))
client.socket.on('message_updated', (evt: MessageUpdatedEvent) => updateMessageText(evt.messageId, evt.text))
client.socket.on('message_deleted', (evt: MessageDeletedEvent) => removeMessage(evt.messageId))
client.socket.on('reaction_updated', (evt: ReactionUpdatedEvent) => setMessageReactions(evt.messageId, evt.reactions))
client.socket.on('typing_indicator', (evt: TypingIndicatorEvent) => {
  evt.isTyping ? showTyping(evt.conversationId, evt.displayName) : hideTyping(evt.conversationId, evt.userId)
})
client.socket.on('read_receipt', (evt: ReadReceiptEvent) => markMessagesRead(evt.fullyReadMessageIds ?? []))
client.socket.on('message_ack', (evt: MessageAckEvent) => confirmOptimisticMessage(evt.tempId, evt.messageId, evt.status))
```

---

## Auth Store (Zustand, persisted)

Persisted to the configured `PersistStorage` adapter under key `"antz-chat-auth"`.

```ts
import { initAuthStore, getAuthStore, resetAuthStore } from '@antzsoft/chat-core'
```

| Function | Description |
|---|---|
| `initAuthStore(storage)` | Initialize the singleton. Idempotent. Returns `{ useAuthStore, authTokenStore }`. |
| `getAuthStore()` | Retrieve singleton. Throws if called before `initAuthStore`. |
| `resetAuthStore()` | Clear singleton (testing / teardown). |

### `useAuthStore`

```ts
interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  /** True once persisted state has been rehydrated from storage. */
  isHydrated: boolean

  setAuth(user: User, tokens: AuthTokens): void
  setTokens(tokens: AuthTokens): void
  setUser(user: User): void
  logout(): void
  setLoading(loading: boolean): void
  setHydrated(hydrated: boolean): void
}
```

```ts
// In a React component (web or RN)
const { useAuthStore } = getAuthStore()
const user = useAuthStore((s) => s.user)
const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

// Outside React
const currentUser = useAuthStore.getState().user
```

### `authTokenStore` — raw synchronous token ops

Used internally by the API client and socket.

```ts
const { authTokenStore } = getAuthStore()

authTokenStore.getAccessToken()    // string | null | undefined
authTokenStore.getRefreshToken()
authTokenStore.setTokens(tokens)
authTokenStore.clearTokens()
```

---

## Chat Store (`useChatStore`)

A **non-persisted** Zustand store for transient UI state. Import and use directly:

```ts
import { useChatStore } from '@antzsoft/chat-core'
```

### State

| Field | Type | Description |
|---|---|---|
| `activeConversationId` | `string \| null` | Currently open conversation. |
| `pendingTarget` | `{ conversationId; messageId } \| null` | Scroll-to target for deep links. |
| `typingUsers` | `Record<string, TypingUser[]>` | Map of conversationId → typing users. |
| `onlineUsers` | `string[]` | User IDs currently online. |
| `replyingTo` | `Message \| null` | Composer reply context. |
| `editingMessage` | `Message \| null` | Composer edit context. |
| `isSidebarOpen` | `boolean` | Sidebar visibility. |
| `isGroupInfoOpen` | `boolean` | Group info panel visibility. |

### Actions

| Action | Signature |
|---|---|
| `setActiveConversation` | `(id: string \| null) => void` (clears reply/edit too) |
| `setPendingTarget` | `(target) => void` |
| `addTypingUser` | `(conversationId, user: TypingUser) => void` (de-dupes by userId) |
| `removeTypingUser` | `(conversationId, userId) => void` |
| `setUserOnline` | `(userId) => void` |
| `setUserOffline` | `(userId) => void` |
| `setOnlineUsers` | `(userIds) => void` |
| `setReplyingTo` | `(message \| null) => void` (clears editing) |
| `setEditingMessage` | `(message \| null) => void` (clears replying) |
| `toggleSidebar` / `setSidebarOpen` | toggle / explicit |
| `toggleGroupInfo` / `setGroupInfoOpen` | toggle / explicit |

```ts
// In a component
const activeId = useChatStore((s) => s.activeConversationId)
const typingInActive = useChatStore((s) =>
  activeId ? (s.typingUsers[activeId] ?? []) : []
)
const { setActiveConversation, setReplyingTo } = useChatStore.getState()

// Wire typing events
client.socket.on('typing_indicator', (evt: TypingIndicatorEvent) => {
  const { addTypingUser, removeTypingUser } = useChatStore.getState()
  if (evt.isTyping) {
    addTypingUser(evt.conversationId, {
      userId: evt.userId,
      displayName: evt.displayName,
      avatarUrl: evt.avatarUrl
    })
  } else {
    removeTypingUser(evt.conversationId, evt.userId)
  }
})

// Wire presence
client.socket.on('user_status', (evt: UserStatusEvent) => {
  const { setUserOnline, setUserOffline } = useChatStore.getState()
  evt.status === 'online' ? setUserOnline(evt.userId) : setUserOffline(evt.userId)
})
```

---

## Data Types

### `User`

```ts
interface User {
  id: string
  tenantId: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  phone?: string
  status: 'online' | 'offline' | 'away'
  lastSeenAt?: string                   // ISO 8601
  createdAt: string
  updatedAt: string
}
```

### `AuthTokens`

```ts
interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string                     // 'Bearer'
  expiresIn: number                     // seconds
}
```

### `Message`

```ts
interface Message {
  id: string
  tenantId: string
  conversationId: string
  senderId: string
  content: MessageContent
  replyTo?: MessageReplyReference
  reactions: MessageReaction[]
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted'
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  isEdited: boolean
  editedAt?: string
  isStarred?: boolean
  isPinned?: boolean
  pinnedBy?: string
  pinnedAt?: string
  uploadProgress?: number               // 0–100 on optimistic messages
  sentAt: string
  createdAt: string
  sender?: User
  readBy?: string[]
  isEncrypted?: boolean
  encryptionMode?: 'none' | 'server' | 'e2ee'
  encryptedContent?: EncryptedContent
}
```

### `MessageContent`

```ts
interface MessageContent {
  type: 'text' | 'attachment' | 'system'
  text?: string
  attachments?: Attachment[]
}
```

### `MessageReaction`

```ts
interface MessageReaction {
  emoji: string
  userIds: string[]
  count: number
}
```

### `MessageReplyReference`

```ts
interface MessageReplyReference {
  messageId?: string
  contentPreview?: string
  senderName?: string
  // Present on optimistic messages before server confirmation
  id?: string
  content?: MessageContent
  sender?: Pick<User, 'displayName' | 'avatarUrl'>
}
```

### `Conversation`

```ts
interface Conversation {
  id: string
  tenantId: string
  conversationType: 'direct' | 'group'
  name?: string
  description?: string
  icon?: string
  iconUrl?: string
  participants: Participant[]
  participantCount?: number
  settings?: ConversationSettings
  lastMessage?: Message
  createdBy?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  unreadCount?: number
  isPinned?: boolean
  isMuted?: boolean
  mutedUntil?: string
  encryptionMode?: 'none' | 'server' | 'e2ee'
  isEncryptionEnabled?: boolean
  encryptionKey?: string
}

interface ConversationSettings {
  onlyAdminsCanMessage?: boolean
  onlyAdminsCanAddMembers?: boolean
}
```

### `Participant`

```ts
interface Participant {
  userId: string
  role: 'admin' | 'member'
  joinedAt: string
  isActive?: boolean
  user?: User
}
```

### `Attachment`

```ts
interface Attachment {
  id: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  thumbnailUrl?: string
  filename: string
  mimeType: string
  size: number                          // bytes
  dimensions?: { width: number; height: number }
  duration?: number                     // seconds (audio/video)
  isUploading?: boolean
  uploadProgress?: number               // 0–100
}
```

### `UploadableFile`

Platform-agnostic file descriptor. Web builds it from a `File`; RN from a picker result.

```ts
interface UploadableFile {
  uri: string                           // blob URL on web, file:// URI on RN
  name: string
  type: string                          // MIME, e.g. 'image/jpeg'
  size: number                          // bytes
}
```

### `SendMessagePayload`

```ts
interface SendMessagePayload {
  conversationId: string
  text?: string
  attachments?: SendMessageAttachment[]
  replyTo?: string                      // messageId
  tempId: string                        // client-generated; echoed in message_ack
  encryptedContent?: EncryptedContent
  isEncrypted?: boolean
}

interface SendMessageAttachment {
  fileId: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  thumbnailUrl?: string
  filename: string
  mimeType: string
  size: number
}
```

### Socket event types

```ts
interface NewMessageEvent {
  tempId?: string
  senderName?: string
  senderAvatarUrl?: string
  message: Message
}

interface MessageUpdatedEvent {
  messageId: string
  conversationId: string
  text: string
  editedAt: string
}

interface MessageDeletedEvent {
  messageId: string
  conversationId: string
}

interface ReactionUpdatedEvent {
  messageId: string
  conversationId: string
  reactions: MessageReaction[]
}

interface TypingIndicatorEvent {
  conversationId: string
  userId: string
  username: string
  displayName: string
  avatarUrl?: string
  isTyping: boolean
}

interface UserStatusEvent {
  userId: string
  status: 'online' | 'offline' | 'away'
  lastSeenAt?: string
}

interface ReadReceiptEvent {
  conversationId: string
  messageId: string
  userId: string
  readAt: string
  updatedMessageIds?: string[]
  fullyReadMessageIds?: string[]
}

interface MessageAckEvent {
  tempId: string                        // the client-generated ID you sent
  messageId: string                     // the server-assigned real ID
  status: MessageStatus
}

interface MessagesDeliveredEvent {
  conversationId: string
  messageIds: string[]
  deliveredTo: string
  deliveredAt: string
}
```

---

## Full bot example (Node.js)

```ts
// node-bot.ts — complete headless Node.js integration
import {
  AntzChatClient,
  type AntzChatConfig,
  type NewMessageEvent
} from '@antzsoft/chat-core'
import { readFileSync } from 'fs'

// 1) In-memory storage for Node
const _store: Record<string, string> = {}
const nodeStorage = {
  getItem: (k: string) => _store[k] ?? null,
  setItem: (k: string, v: string) => { _store[k] = v },
  removeItem: (k: string) => { delete _store[k] }
}

// 2) Node upload adapter using fetch
const nodePlatformUploadFn: AntzChatConfig['platformUploadFn'] = async (presigned, file) => {
  const body = readFileSync(file.uri.replace('file://', ''))
  const res = await fetch(presigned.uploadUrl, {
    method: presigned.method,
    headers: presigned.headers,
    body
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
}

// 3) Initialize
const client = new AntzChatClient({
  apiUrl: 'https://chat.example.com/api/v1',
  persistStorage: nodeStorage,
  platformUploadFn: nodePlatformUploadFn,
  tenantId: 'tenant-xyz'
})

// 4) Authenticate
await client.auth.login({ email: 'bot@example.com', password: process.env.BOT_PASSWORD! })

// 5) Connect socket
await client.connect()

// 6) Join all rooms
const { data: conversations } = await client.conversations.list({ limit: 100 })
for (const conv of conversations) {
  client.socket.emit.joinRoom(conv.id)
}

// 7) Respond to messages
client.socket.on('new_message', async (evt: NewMessageEvent) => {
  const { message } = evt
  const me = await client.auth.getMe()
  if (message.senderId === me.id) return    // ignore own messages

  const text = message.content.text?.toLowerCase() ?? ''
  if (text.includes('ping')) {
    await client.socket.emit.sendMessage({
      conversationId: message.conversationId,
      text: 'Pong!',
      tempId: crypto.randomUUID()
    })
  }
  client.socket.emit.markRead(message.conversationId, message.id)
})

// 8) Graceful shutdown
process.on('SIGINT', () => {
  client.disconnect()
  process.exit(0)
})
```

---

## Custom UI example (vanilla browser)

```ts
import {
  AntzChatClient,
  useChatStore,
  type NewMessageEvent
} from '@antzsoft/chat-core'

const client = new AntzChatClient({ apiUrl, persistStorage, platformUploadFn })

await client.auth.login({ email, password })
await client.connect()

client.socket.on('new_message', (evt: NewMessageEvent) => {
  renderMessage(evt.message)
  client.socket.emit.markRead(evt.message.conversationId, evt.message.id)
})

const { setActiveConversation } = useChatStore.getState()
document.querySelectorAll('[data-conv-id]').forEach((el) => {
  el.addEventListener('click', () => {
    const convId = el.getAttribute('data-conv-id')!
    setActiveConversation(convId)
    client.socket.emit.joinRoom(convId)
  })
})
```

---

## Migration plan from our mock

### Phase 1 — Singleton client

Create `src/lib/chat/client.ts`:

```ts
'use client'

import { AntzChatClient } from '@antzsoft/chat-core'

let _client: AntzChatClient | null = null

const persistStorage = {
  getItem: (k: string) => (typeof window !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: (k: string, v: string) => { if (typeof window !== 'undefined') localStorage.setItem(k, v) },
  removeItem: (k: string) => { if (typeof window !== 'undefined') localStorage.removeItem(k) }
}

const platformUploadFn = async (presigned: any, file: any, onProgress?: (n: number) => void) => {
  // XHR implementation from the Required Adapters section
}

export function getChatClient(authProvider: () => Promise<string>, tenantId?: string): AntzChatClient {
  if (_client) return _client
  _client = new AntzChatClient({
    apiUrl: process.env.NEXT_PUBLIC_CHAT_API_URL!,
    persistStorage,
    platformUploadFn,
    authProvider,
    tenantId
  })
  return _client
}

export function disposeChatClient() {
  _client?.disconnect()
  _client = null
}
```

### Phase 2 — Replace the three Redux thunks

In `src/store/apps/chat/index.ts`:

```ts
// OLD: return userProfile (seed)
export const fetchUserProfile = createAsyncThunk('appChat/fetchUserProfile', async () => {
  return await getChatClient(...).auth.getMe()
})

// OLD: return chatsSeed + contactsSeed
export const fetchChatsContacts = createAsyncThunk('appChat/fetchChatsContacts', async () => {
  const client = getChatClient(...)
  const convs = await client.conversations.list({ limit: 100 })
  return {
    chatsContacts: convs.data.map(mapConvToChat),
    contacts: [/* from members or searchUsers */]
  }
})

// OLD: append to local state only
export const sendMsg = createAsyncThunk('appChat/sendMsg', async (payload: SendMsgParamsType) => {
  await getChatClient(...).socket.emit.sendMessage({
    conversationId: payload.chat!.id.toString(),
    text: payload.message,
    tempId: crypto.randomUUID()
  })
  // server broadcasts via new_message — remove the optimistic extraReducer
  return { newMsg: null, contactId: null }
})
```

### Phase 3 — Wire socket events

In `src/views/apps/chat/AppChat.tsx`:

```ts
useEffect(() => {
  const client = getChatClient(/* deps */)
  ;(async () => {
    await client.connect()

    const onNew = (evt: NewMessageEvent) => dispatch(receiveMsg(evt))
    const onTyping = (evt: TypingIndicatorEvent) => {
      const { addTypingUser, removeTypingUser } = useChatStore.getState()
      evt.isTyping
        ? addTypingUser(evt.conversationId, evt)
        : removeTypingUser(evt.conversationId, evt.userId)
    }
    const onPresence = (evt: UserStatusEvent) => {
      const { setUserOnline, setUserOffline } = useChatStore.getState()
      evt.status === 'online' ? setUserOnline(evt.userId) : setUserOffline(evt.userId)
    }

    client.socket.on('new_message', onNew)
    client.socket.on('typing_indicator', onTyping)
    client.socket.on('user_status', onPresence)
    // … message_ack, read_receipt, messages_delivered, message_updated, message_deleted
  })()

  return () => {
    client.socket.off('new_message', onNew)
    client.socket.off('typing_indicator', onTyping)
    client.socket.off('user_status', onPresence)
    client.disconnect()
  }
}, [])
```

### Phase 4 — Map the type shapes

The Materio `ChatsArrType` and SDK `Conversation` differ. Two paths:

- **A. Migrate UI to consume `Conversation` directly** — cleaner long-term
- **B. Write `mapConvToChat` / `mapMessageToMaterioMessage` adapters in `src/lib/chat/adapters.ts`** — faster, isolates the SDK

Recommendation: **B** for the first cut; **A** as a follow-up.

### Phase 5 — Remove the mock seed

Delete `userProfile`, `contactsSeed`, `chatsSeed` constants from the slice. Drop `loadServerRows` / `lastMessage` synthesis.

---

## Risks to track

| Risk | Severity | Mitigation |
|---|---|---|
| Antz Chat backend not yet available | 🔴 High | Don't call `client.connect()` until URL + auth contract confirmed |
| WSO2 token incompatibility | 🟡 Med | Backend team must accept WSO2 JWTs, or build an exchange endpoint |
| Brand-new package (1.0.0 / 1.0.1 published today) | 🟡 Med | Treat as alpha. Watch for patch releases; pin exactly before going to staging |
| Zustand vs Redux co-existence | 🟡 Med | Decide store ownership upfront — chat-core stores own typing/presence; Redux owns rest |
| Bundle size (~80–100 KB g-zipped added) | 🟢 Low | Acceptable for a chat module |
| No client-side E2EE (only `server` encryption mode) | 🟢 Low | Confirm regulatory/privacy needs before exposing chat in production |

---

## Activation checklist

1. ☐ Confirm Antz Chat backend URL + auth scheme (WSO2-compatible?) with backend team
2. ☐ Set `NEXT_PUBLIC_CHAT_API_URL` and optionally `NEXT_PUBLIC_CHAT_WS_URL` in `.env.*`
3. ☐ Create `src/lib/chat/client.ts` singleton (Phase 1)
4. ☐ Swap the three thunks in `src/store/apps/chat/index.ts` (Phase 2)
5. ☐ Add new reducers: `receiveMsg`, `markDelivered`, `markSeen`, `updatePresence` (or move to `useChatStore`)
6. ☐ Wire socket listeners in `AppChat.tsx` (Phase 3)
7. ☐ Add type adapters in `src/lib/chat/adapters.ts` (Phase 4)
8. ☐ Delete mock seeds (Phase 5)
9. ☐ Update [README.md](./README.md) to reflect the new data layer

---

## Resources

- npm: https://www.npmjs.com/package/@antzsoft/chat-core
- Registry metadata (versions, integrity hashes): `https://registry.npmjs.org/@antzsoft/chat-core`
- Related sibling SDKs (not installed): `@antzsoft/chat-web-sdk`, `@antzsoft/chat-rn-sdk`
