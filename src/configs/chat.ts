/**
 * Chat-SDK configuration constants shared between the REST client
 * (`src/lib/chat/client.ts`) and the socket handshake
 * (`src/contexts/ChatClientContext.tsx`).
 *
 * Single source of truth so the two surfaces can't drift out of sync.
 */

/**
 * Whether to use transit encryption (ECDH key exchange + AES-256-GCM on
 * every HTTP body and socket event).
 *
 * MUST match the server's `TRANSIT_ENCRYPTION_ENABLED` flag — SDK 1.1.8+
 * enforces a strict equality check and throws
 * `[AntzChat] Transit encryption mismatch ...` from `connectSocket` when
 * the two sides disagree.
 *
 *  • Server has it ON  → set this to `true`
 *  • Server has it OFF → set this to `false`
 */
export const CHAT_TRANSIT_ENCRYPTION = true
