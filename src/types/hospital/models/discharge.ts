/**
 * Discharge (mortality / necropsy) domain model types for the Hospital module.
 *
 * Extracted from `src/types/hospital/models.ts`. Covers the discharge flow's
 * supporting data — necropsy centers and carcass condition / disposition
 * master options used by the mortality discharge form.
 *
 * Note: the transfer-enclosure and transfer-hospital discharge flows currently
 * have no dedicated domain types here — their payloads are defined under
 * `src/types/hospital/api/Discharge/` (API request/response shapes).
 */

import type { Id, UserAvatarInfo } from '../models'

export interface GetNecropsyCenter {
  id: Id
  name: string
  description: string
  zoo_id: Id
  site_id: Id
  site_name: string
  entity_type: string
  created_by: UserAvatarInfo
}

export interface Carcass {
  id: Id
  name: string
  string_id: string
  zoo_id: Id | null
  description: string
  active: string | number
  created_by: Id
  created_at: string
}
