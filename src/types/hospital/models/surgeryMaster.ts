/**
 * Surgery Master (catalog) domain model types for the Hospital module.
 *
 * Extracted from the monolithic `src/types/hospital/models.ts`.
 */

import type { Id, StatusAction } from '../models'

export interface SurgeryMaster {
  id: Id
  zoo_id: Id
  surgery_name: string
  description: string
  status: StatusAction
  created_at: string
  created_by: Id
  updated_at: string | null
  updated_by: Id | null
  is_deleted: string | number
  deleted_at: string | null
  deleted_by: Id | null
}
