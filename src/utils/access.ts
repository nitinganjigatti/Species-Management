// Access-level helpers for the cumulative permission ladder used across the app.
// Backend exposes `<feature>_access` flags as one of: undefined | "VIEW" | "ADD" | "EDIT" | "DELETE".
// Each level includes everything below it:
//   VIEW (or none) → view only (when the parent feature flag is true)
//   ADD            → view + add
//   EDIT           → view + add + edit
//   DELETE         → view + add + edit + delete

export type AccessLevel = 'VIEW' | 'ADD' | 'EDIT' | 'DELETE' | string | null | undefined

/**
 * Whether the user can view the feature. Driven solely by the parent feature flag
 * (e.g. `collection_animal_records`) — the access level does not gate view.
 */
export const canView = (enabled: boolean | null | undefined | unknown): boolean => Boolean(enabled)

export const canAdd = (level: AccessLevel): boolean =>
  level === 'ADD' || level === 'EDIT' || level === 'DELETE'

export const canEdit = (level: AccessLevel): boolean => level === 'EDIT' || level === 'DELETE'

export const canDelete = (level: AccessLevel): boolean => level === 'DELETE'
