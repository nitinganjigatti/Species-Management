/**
 * Component prop interfaces for the Diet module
 */

// ==================== Drawer Props ====================

export interface AddDropPointDrawerProps {
  open: boolean
  onClose: () => void
  mealGroupId?: number | string
  refetch?: () => void
}

export interface AddIngredientsProps {
  open: boolean
  onClose: () => void
  recipeId?: number | string
  dietId?: number | string
  refetch?: () => void
}

export interface AddIngredientswithChoiceProps {
  open: boolean
  onClose: () => void
  selectedIngredients?: any[]
  onSave?: (ingredients: any[]) => void
}

// ==================== List Props ====================

export interface ComboListProps {
  params?: Record<string, any>
  onSelect?: (item: any) => void
}

export interface RecipeListProps {
  params?: Record<string, any>
  onSelect?: (item: any) => void
}

// ==================== Layout Props ====================

export interface FixedFooterWrapperProps {
  children: React.ReactNode
  footer?: React.ReactNode
}
