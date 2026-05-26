/**
 * Single source of truth for WhatsApp-style perspective rewriting of
 * system messages (group membership / role / metadata events).
 *
 * Why this module exists
 * ----------------------
 * Before this file, the same ID-based actor/target detection + template
 * switch was duplicated in:
 *   • src/views/apps/chat/ChatLog.tsx      (in-chat pill)
 *   • src/views/apps/chat/SidebarLeft.tsx  (sidebar preview)
 *   • src/views/apps/chat/ChatContent.tsx  (banner copy)
 *   • src/views/apps/chat/AppChat.tsx      (synthesis fallbacks)
 * Drift between them caused the bugs the user reported (sidebar showing
 * "Anil Rathod added Ajay Antony" while the pill showed "Anil Rathod
 * added you", banner not matching the pill, etc.). Centralizing here
 * guarantees the three surfaces stay in lockstep — change a template
 * once, all surfaces update.
 *
 * Layers
 * ------
 *   1. `resolvePerspective` — pure ID-based check. Returns 'actor' |
 *      'target' | 'bystander'. No display text.
 *   2. `SYSTEM_MESSAGE_TEMPLATES` — declarative table (the "JSON data"
 *      the user asked for) keyed by `systemOperationType`. Each entry
 *      returns the resolved string for a given perspective, or
 *      `undefined` if no rewrite applies (caller falls back).
 *   3. `resolveSystemMessageText` — combines the two layers + the
 *      fallback chain (actor-prefix, target-replace, legacy verb
 *      regex) and returns the final display string.
 */

import type { MessageType } from 'src/types/apps/chatTypes'

export type Perspective = 'actor' | 'target' | 'bystander'

export type PerspectiveCtx = {
  /** Current user's id as a string. Empty string treated as "no user yet". */
  meId: string
  /** Current user's full name. Empty string treated as "unknown name". */
  meName: string
}

/**
 * ID-based perspective resolution. The senderId / targetUserId fields on
 * the message determine which side the current user is on:
 *
 *   actor      → senderId   === meId   (I did the action)
 *   target     → targetUserId === meId (it was done to me)
 *   bystander  → neither (I'm watching it happen)
 *
 * Sender takes precedence over target for the rare events where they
 * coincide (e.g. self-exit has senderId === targetUserId === me).
 *
 * Name-based fallback for the slim-event window: the
 * `conversation_updated` payload carries `senderName` but NOT
 * `senderId` (and arrives just before / just after `new_message`
 * race-style). When senderId is empty or undefined, fall back to
 * matching senderName === meName so the actor perspective is detected
 * even in that brief window — eliminates the "raw text → rewritten
 * text" flash in the sidebar.
 */
export function resolvePerspective(
  msg: Pick<MessageType, 'senderId' | 'targetUserId' | 'senderName' | 'targetUserName'>,
  ctx: PerspectiveCtx
): Perspective {
  if (!ctx.meId && !ctx.meName) return 'bystander'

  if (msg.senderId !== undefined && msg.senderId !== '' && ctx.meId !== '' && String(msg.senderId) === ctx.meId) {
    return 'actor'
  }
  if (
    (msg.senderId === undefined || msg.senderId === '') &&
    ctx.meName !== '' &&
    msg.senderName !== undefined &&
    msg.senderName === ctx.meName
  ) {
    return 'actor'
  }

  if (msg.targetUserId !== undefined && msg.targetUserId !== '' && ctx.meId !== '' && String(msg.targetUserId) === ctx.meId) {
    return 'target'
  }
  if (
    (msg.targetUserId === undefined || msg.targetUserId === '') &&
    ctx.meName !== '' &&
    msg.targetUserName !== undefined &&
    msg.targetUserName === ctx.meName
  ) {
    return 'target'
  }

  return 'bystander'
}

type TemplateFn = (msg: MessageType, perspective: Perspective) => string | undefined

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Declarative template table. One entry per backend `systemOperationType`.
 * Each entry is a pure function returning the display string for a given
 * perspective + message, or `undefined` if the template doesn't apply
 * (caller falls through to the fallback chain).
 *
 * Aliases (e.g. `participant_removed` → `user_removed`) are wired
 * explicitly so the table reflects what backend has actually shipped
 * historically. Keep the aliases — they're cheap insurance.
 */
const userRemoved: TemplateFn = (msg, p) => {
  if (p === 'target' && msg.senderName) return `${msg.senderName} removed you`
  if (p === 'actor' && msg.targetUserName) return `You removed ${msg.targetUserName}`

  return undefined
}

const userAdded: TemplateFn = (msg, p) => {
  if (p === 'target' && msg.senderName) return `${msg.senderName} added you`
  if (p === 'actor' && msg.targetUserName) return `You added ${msg.targetUserName}`

  return undefined
}

const userLeft: TemplateFn = (_msg, p) => {
  if (p === 'actor') return 'You left the group'

  return undefined
}

export const SYSTEM_MESSAGE_TEMPLATES: Record<string, TemplateFn> = {
  // Membership
  user_removed: userRemoved,
  participant_removed: userRemoved,
  user_added: userAdded,
  participant_added: userAdded,
  user_left: userLeft,
  participant_left: userLeft,
  member_left: userLeft,

  // Role changes
  admin_promoted: (msg, p) => {
    if (p === 'target') return "You're now an admin"
    if (p === 'actor' && msg.targetUserName) return `You made ${msg.targetUserName} an admin`

    return undefined
  },
  admin_demoted: (msg, p) => {
    if (p === 'target') return "You're no longer an admin"
    if (p === 'actor' && msg.targetUserName) return `You dismissed ${msg.targetUserName} as admin`

    return undefined
  },

  // Group meta — backend likely just sends a free-text `message` like
  // "Anil Rathod changed the subject to X". The actor-prefix replace in
  // the fallback chain handles the actor case ("You changed the subject
  // to X"); bystanders see the raw text. Keep an entry here only when
  // backend uses a STRUCTURED op type we want to support.
  group_renamed: (msg, p) => {
    if (p === 'actor' && msg.senderName && msg.message?.startsWith(msg.senderName + ' ')) {
      return 'You ' + msg.message.slice(msg.senderName.length + 1)
    }

    return undefined
  },
  group_description_changed: (msg, p) => {
    if (p === 'actor' && msg.senderName && msg.message?.startsWith(msg.senderName + ' ')) {
      return 'You ' + msg.message.slice(msg.senderName.length + 1)
    }

    return undefined
  },
  group_icon_changed: (msg, p) => {
    if (p === 'actor' && msg.senderName && msg.message?.startsWith(msg.senderName + ' ')) {
      return 'You ' + msg.message.slice(msg.senderName.length + 1)
    }

    return undefined
  },
  group_created: (msg, p) => {
    if (p === 'actor' && msg.senderName && msg.message?.startsWith(msg.senderName + ' ')) {
      return 'You ' + msg.message.slice(msg.senderName.length + 1)
    }

    return undefined
  }
}

/** Verbs used by the legacy fallback when `targetUserId` is stripped on
 * cold-load (REST conversation list drops system metadata). Order doesn't
 * matter — alternation is purely a set membership check. */
const LEGACY_VERB_LIST = 'removed|added|made|invited|kicked|dismissed'

/**
 * Resolve the final display text for a system message in the current
 * user's perspective. Used by ChatLog (pill), SidebarLeft (preview),
 * ChatContent (banner), and any future surface.
 *
 * Resolution order:
 *   1. Structured template (if op type is known + entry returns a value)
 *   2. Actor-prefix replace ("Anil Rathod created group X" → "You
 *      created group X" when actor is me)
 *   3. Target-name replace (text contains my targetUserName → "you")
 *   4. Legacy verb regex (cold-load: targetUserId stripped, but text
 *      contains my full name after a known membership verb)
 *   5. Raw text passthrough (bystander default)
 *
 * Pure / side-effect free / safe to call on every render.
 */
export function resolveSystemMessageText(
  msg: MessageType,
  ctx: PerspectiveCtx
): string {
  const text = msg.message ?? ''
  const perspective = resolvePerspective(msg, ctx)

  // 1. Structured template
  if (msg.systemOperationType) {
    const template = SYSTEM_MESSAGE_TEMPLATES[msg.systemOperationType]
    const result = template?.(msg, perspective)
    if (result !== undefined) return result
  }

  if (!text) return ''

  // 2. Actor-prefix replace (text starts with my own name → "You ...")
  if (perspective === 'actor' && msg.senderName && text.startsWith(msg.senderName + ' ')) {
    return 'You ' + text.slice(msg.senderName.length + 1)
  }

  // 3. Target-name replace (server gave us the exact target name)
  if (perspective === 'target' && msg.targetUserName) {
    const re = new RegExp(`\\b${escapeRegExp(msg.targetUserName)}\\b`, 'g')
    const replaced = text.replace(re, 'you')
    if (replaced !== text) return replaced
  }

  // 4. Legacy verb regex — cold-load lastMessage often drops
  // `targetUserId`, so we detect "I'm the target" by name match.
  // Only fires when the user is NOT the actor (bystander OR target
  // without explicit targetUserId).
  if (perspective !== 'actor' && ctx.meName) {
    const verbRe = new RegExp(`\\b(${LEGACY_VERB_LIST})\\s+${escapeRegExp(ctx.meName)}\\b`, 'g')
    if (verbRe.test(text)) {
      return text.replace(
        new RegExp(`\\b(${LEGACY_VERB_LIST})\\s+${escapeRegExp(ctx.meName)}\\b`, 'g'),
        '$1 you'
      )
    }
  }

  // 5. Raw text passthrough
  return text
}

/**
 * Helper for banner / composer-placeholder use. Detects whether the
 * given `lastMessage` (or any system message) represents the current
 * user voluntarily leaving the group — used by ChatContent to choose
 * between "You left the group." and the generic "You're no longer a
 * member of this group." copy.
 */
export function isSelfLeftMessage(
  msg: Pick<MessageType, 'systemOperationType' | 'senderId' | 'contentType'> | undefined,
  ctx: PerspectiveCtx
): boolean {
  if (!msg) return false
  if (msg.contentType !== 'system') return false
  const op = msg.systemOperationType
  if (op !== 'user_left' && op !== 'participant_left' && op !== 'member_left') return false

  return resolvePerspective(msg, ctx) === 'actor'
}
