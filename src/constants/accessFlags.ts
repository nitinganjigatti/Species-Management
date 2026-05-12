/**
 * Centralized registry of backend access flag keys read from `userData.roles.settings`.
 *
 * Why: backend may rename a flag — keeping the literal in one place means a rename
 * is a single edit here, and TypeScript flags every stale call site. Without this,
 * a silent rename returns `undefined` at the lookup and routes 404 for all users.
 *
 * How to apply: import `ACCESS_FLAGS.<module>` instead of typing the raw string.
 * When migrating a new module, add an entry below and switch its layout/nav usage.
 */
export const ACCESS_FLAGS = {
  collection: 'enable_collection_in_web'
} as const

export type AccessFlag = (typeof ACCESS_FLAGS)[keyof typeof ACCESS_FLAGS]
