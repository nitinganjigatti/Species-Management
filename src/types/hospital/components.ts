/**
 * Component prop types for the Hospital module.
 *
 * Specific drawer/component prop types are added as components are converted.
 */

import { ReactNode } from 'react'

// ==================== Base ====================

export interface BaseDrawerProps {
  open: boolean
  onClose: () => void
  children?: ReactNode
}

export interface BaseDrawerWithIdProps extends BaseDrawerProps {
  id?: string | number
}

export interface BaseFilterDrawerProps<TFilters = Record<string, unknown>> extends BaseDrawerProps {
  filters: TFilters
  onApply: (filters: TFilters) => void
  onReset?: () => void
}
