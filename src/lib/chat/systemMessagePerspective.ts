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
 * guarantees the three surfaces stay in lockstep.
 *
 * Resolution strategy (post SDK 1.2.5)
 * -----------------------------------
 * The SDK now resolves `content.text` viewer-aware at delivery time —
 * actor receives "You removed X", target receives "X removed you",
 * bystander receives "X removed Y" — see SDK docs § MessageMetadata.
 * We therefore TRUST the server-resolved text and pass it through, no
 * client-side templates. The fallback chain (Steps 2-5 of
 * `resolveSystemMessageText`) is kept as a safety net for:
 *   • Cold-load REST `lastMessage` where backend strips metadata
 *   • Legacy text-only events without `systemOperationType`
 *   • Surfaces that show the message from a different viewer's
 *     perspective than the one the server resolved for (rare)
 *
 * Layers
 * ------
 *   1. `resolvePerspective` — pure ID-based check. Returns 'actor' |
 *      'target' | 'bystander'. No display text. Used by callers that
 *      need to know the viewer's role (e.g. to style the bubble) and
 *      by the fallback chain in `resolveSystemMessageText`.
 *   2. `resolveSystemMessageText` — runs the fallback chain on top of
 *      the server-resolved `msg.message`. In the 99% case where the
 *      server already provided viewer-aware text, this is a passthrough.
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

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

  if (!text) return ''

  // 2. Actor-prefix replace (text starts with my own name → "You ...")
  //    Triggers when the server didn't pre-resolve actor text — common
  //    on cold-load lastMessage which sometimes ships the bystander
  //    form for every viewer.
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
