/**
 * Dashboard Module Types — barrel export
 *
 * Import types from 'src/types/dashboard' for use throughout the application.
 *
 * Sub-modules:
 *   models.ts      → core domain entities
 *   api/index.ts   → API request/response types
 *   components.ts  → component prop types
 */

export type * from './models'
export type * from './api/index'
export type * from './components'
