/**
 * Lineage / Family Tree API types
 * Used by: animals/[id]
 */

import type {
  LineageAnimal,
  ExternalAnimal,
  LineagePair,
  LineageSibling,
  LineageAnimalListItem
} from '../models'

// ==================== Lineage / Family Tree ====================

export interface GetLineageParentParams {
  animal_id: number | string
  is_mother?: '0' | '1'
  type?: 'internal' | 'external'
  page_no?: number
  limit?: number
  q?: string
}

export interface GetLineageParentResponse {
  success?: boolean
  message?: string
  data?: {
    animal_id?: number
    mother?: LineageAnimal | LineageAnimal[]
    father?: LineageAnimal | LineageAnimal[]
    external_mother?: ExternalAnimal | ExternalAnimal[]
    external_father?: ExternalAnimal | ExternalAnimal[]
    mother_count?: number
    father_count?: number
    external_mother_count?: number
    external_father_count?: number
    result?: LineageAnimal[]
    total_count?: number
  }
}

export interface GetLineagePairParams {
  animal_id: number | string
  page_no?: number
  limit?: number
}

export interface GetLineagePairResponse {
  success?: boolean
  message?: string
  data?: LineagePair[]
  total_count?: number
}

export interface GetLineageSiblingParams {
  animal_id: number | string
  page_no?: number
  limit?: number
}

export interface GetLineageSiblingResponse {
  success?: boolean
  message?: string
  data?: {
    result?: LineageSibling[]
    total_count?: number
  }
}

// ==================== Lineage CRUD ====================

export interface AddLineageParentResponse {
  success?: boolean
  message?: string
  data?: {
    parent_id?: number
    external_parent_id?: number
  }
}

export interface EditExternalParentResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface DeleteLineageParentResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface AddLineagePairResponse {
  success?: boolean
  message?: string
  data?: {
    pair_id?: number
  }
}

export interface EditLineagePairResponse {
  success?: boolean
  message?: string
  data?: unknown
}

export interface DeleteLineagePairResponse {
  success?: boolean
  message?: string
  data?: {
    pair_present?: boolean
  }
}

export interface GetLineageAnimalListParams {
  animal_id: number | string
  parent_type?: 'sire' | 'dam'
  taxonomy_id?: number | string
  page_no?: number
  limit?: number
  q?: string
}

export interface GetLineageAnimalListResponse {
  success?: boolean
  message?: string
  data?: {
    result?: LineageAnimalListItem[]
    total_count?: number
  }
}
