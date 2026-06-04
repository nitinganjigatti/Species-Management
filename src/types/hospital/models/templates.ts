/**
 * Template-related domain model types for the Hospital module.
 *
 * Extracted from the monolithic `src/types/hospital/models.ts`.
 * Used by both symptom (complaint) and clinical-assessment (diagnosis) template flows.
 */

import type { Id, MedicalType, StatusAction } from '../models'

export interface Category {
  id?: Id
  med_cat_id?: Id
  label?: string
  category?: string
  key?: string
  type?: MedicalType
  zoo_id?: number
}

export interface Template {
  id: Id
  template_name: string
  type: MedicalType
  template_items: TemplateItems[]
  created_at: string
  modified_at: string
  deleted_at?: string | null
  is_deleted?: string | null
  title?: string
}

export interface TemplateItems {
  id: Id
  name: string
  string_id?: string
}

export interface TransformedTemplateItems {
  id: Id
  name: string
  template_items: TemplateItems[]
}

export interface ComplaintsDiagnosisTemplates {
  id: Id
  template_name: string
  type: MedicalType
  template_items: TemplateItems[]
  message: string
}

export interface TemplateList {
  id: Id
  template_name: string
  type: string
  description: string
  status: StatusAction
  hospital_id: Id
  zoo_id: Id
  created_at: string
}

export interface TemplateAction {
  template_id: Id
}
