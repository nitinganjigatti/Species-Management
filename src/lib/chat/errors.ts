import {
  AntzChatError,
  AntzChatAuthError,
  AntzChatValidationError,
  AntzChatNetworkError,
  AntzChatPermissionError,
  AntzChatServerError
} from '@antzsoft/chat-core'

/**
 * Map a thrown chat-core error to a user-facing message.
 *
 * The SDK (Step 20) throws typed `AntzChatError` subclasses, each carrying a
 * machine-readable `.code`, a `.retryable` flag, and — for validation — a
 * `.fields` array. This helper turns those into friendly copy so call sites
 * can show something more specific than a generic "X failed" toast, WITHOUT
 * changing any control flow.
 *
 * Always pass a `fallback` — the existing hardcoded message for that action.
 * Unknown / non-SDK errors (plain Error, network blips the SDK didn't wrap)
 * return the fallback unchanged, so adopting this never regresses a call site.
 *
 * @param err      the caught error (unknown — we narrow internally)
 * @param fallback the action-specific default, e.g. 'Delete failed'
 */
export function chatErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof AntzChatError)) return fallback

  // Permission (403) — the most useful one to surface specifically: tells the
  // user WHY an action was blocked (e.g. non-admin trying an admin-only op).
  if (err instanceof AntzChatPermissionError) {
    return err.message || 'You don’t have permission to do that'
  }

  // Validation (400/422) — prefer the server's field errors when present.
  if (err instanceof AntzChatValidationError) {
    if (err.fields?.length) return err.fields.join('\n')

    return err.message || fallback
  }

  // Auth (401 after refresh failed) — session is gone; the global
  // `session-expired` flow will handle logout. Keep the toast generic.
  if (err instanceof AntzChatAuthError) {
    return 'Your session has expired. Please sign in again.'
  }

  // Network / server — both retryable; nudge the user to try again.
  if (err instanceof AntzChatNetworkError || err instanceof AntzChatServerError) {
    return `${fallback} — please try again.`
  }

  // Any other AntzChatError subclass / base — fall back to its message.
  return err.message || fallback
}

/** True when the SDK marked the error as safe to retry. */
export function isRetryableChatError(err: unknown): boolean {
  return err instanceof AntzChatError && err.retryable === true
}
