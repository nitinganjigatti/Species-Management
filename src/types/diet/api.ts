/**
 * API request param types for the Diet module
 */

// ==================== Pagination ====================

export interface PaginationParams {
  page?: number
  limit?: number
  q?: string
  status?: string | number
  sort?: string
}

// ==================== Diet ====================

export interface DietListParams extends PaginationParams {
  diet_category_id?: string | number
  is_active?: string | number
}

// ==================== Meal Group ====================

export interface MealGroupListParams {
  site_id?: string | number
  page_no?: number
  limit?: number
  q?: string
}

// ==================== Ingredient ====================

export interface IngredientListParams extends PaginationParams {
  feed_type?: string | number
}

// ==================== Recipe ====================

export interface RecipeListParams extends PaginationParams {
  sortBy?: string
  meal_type?: string
}
