import type { Id, Severity, DurationUnit, SymptomStatus } from 'src/types/hospital/models'
import type { NotesDump } from 'src/types/hospital/models/symptoms'
import type { Prognosis } from 'src/types/hospital/models/clinicalAssessment'

// ============================================================
// Cross-flow UI types (used by symptoms + clinical assessment)
// ============================================================

export type StatusKey = 'Active' | 'Resolved' | 'All'

export interface ActivityFormData {
  isSystemGenerated?: boolean
  createdBy?: Id
  formattedTime: string
  oldSeverity?: Severity
  newSeverity?: Severity
  oldRecord?: string
  newRecord?: string
  oldPrognosis?: Prognosis
  newPrognosis?: Prognosis
  oldIsChronical?: number
  newIsChronical?: number
  note: string
  status?: SymptomStatus
  duration?: string | number
  duration_unit?: DurationUnit
  created_at?: string
  notes_dump?: NotesDump
  created_by_user_name?: string
  is_system_generated?: number
  note_id?: Id
}
