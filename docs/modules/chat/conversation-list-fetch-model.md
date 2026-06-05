# Conversation list — fetch model (why we don't use server-side `ConversationListParams` filters)

**Decision:** the web app loads the **entire** conversation list once and filters it **client-side**. We intentionally do **not** pass the SDK's server-side `ConversationListParams` filters (`type`, `isPinned`, `isMuted`, `hasUnread`, `search`, `role`, `hasAttachments`, `attachmentType`, `notificationsEnabled`) or use `page`/`limit` pagination.

**Status:** intentional, correct for the current scale. Revisit only if a single user can have thousands of conversations (see "When to switch").

---

## How it works today

```
conversationsApi.list()            ← called with NO params (omit page+limit → "return all")
  └─ src/lib/chat/api.ts:listConversations(params?)   (params supported, never passed)
       └─ src/store/apps/chat/index.ts:fetchChatsContacts   → writes the full list to Redux (state.chat.chats)
            └─ dispatched on connect from ChatLauncher (global) + AppChat (/chat)
```

The full list in `state.chat.chats` is then filtered **in memory** in `SidebarLeft.tsx`:
- tabs: `All` / `Unread` (`unseenMsgs > 0`) / `Favourites` / `Groups`
- search: client-side match on the loaded chats
- pinned/unpinned split + sort

The SDK guide explicitly supports this: *"Omit `page` and `limit` to receive all matching conversations in one response."*

## Why client-side, not the server-side filters

The single in-memory list is **load-bearing for several features at once**:

| Feature | Why it needs the FULL list |
|---|---|
| Sidebar tabs (All/Unread/Favourites/Groups) | filter one in-memory list → instant, no refetch per tab |
| Sidebar search | client-side → instant, no network |
| **Unread badge** (ChatLauncher + tab counts) | sums `unseenMsgs` across **all** conversations |
| **Contacts directory** | `extractContactsFromConversations` derives it from the **full** list |
| Socket live updates | `receiveMessage` / `conversation_updated` patch the one list in place |

If we switched the sidebar to per-filter server calls (`list({ type })`, `list({ hasUnread })`, …), Redux would hold only a **subset** at any time — which **breaks** the unread badge (can't sum across all), the contacts directory, and cross-tab counts. So the server-side filters **cannot be adopted "without affecting" other features** in this architecture; they're coupled to a paginated model.

## What the server-side filters are actually for

They shine in a **server-side pagination** model: when you fetch in pages, the server applies the filters as MongoDB aggregation stages **before** `$skip`/`$limit`, so totals/page counts reflect the filtered set (`hasUnread` even uses a `$lookup` join — no client post-filtering). That's a different app shape than ours.

## When to switch (the only reason to use them)

Move to server-side pagination + filters **only** if a single user can realistically have **thousands** of conversations, where fetching all on every connect becomes too heavy. That is a deliberate, multi-part change — not a no-impact tweak — and must also:
- move the **unread badge** to `conversationsApi.getUnreadSummary()` (no longer derivable from a partial list),
- move the **contacts directory** to `usersApi.list()` (instead of `extractContactsFromConversations`),
- add infinite-scroll/pagination state to `SidebarLeft` and the store,
- decide whether search hits the server (`list({ search })`) or stays client-side on the loaded page.

Until that scale is real, **fetch-all + client-side filter is the correct choice**: instant tab/search, one source of truth, fewer requests. The `listConversations(params?)` wrapper already accepts the params, so the door is open with no signature change when/if the day comes.
