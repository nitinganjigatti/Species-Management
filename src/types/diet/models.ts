/**
 * Core entity types for the Diet module
 */

// ==================== Generic Response Types ====================

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResult<T> {
  result: T[]
  total_count: number
}

// ==================== Diet ====================

export interface DietItem {
  diet_id: number
  diet_name?: string
  diet_no?: string
  diet_image?: string
  total_animals?: number
  total_species?: number
  total_site_species?: number
  is_active?: number | boolean
  diet_category_id?: number
  diet_category_name?: string
  created_at?: string
  updated_at?: string
}

// ==================== Recipe ====================

export interface RecipeItem {
  id: number
  recipe_name?: string
  meal_type?: string
  meal_type_id?: number
  status?: number | boolean
  created_at?: string
  updated_at?: string
}

// ==================== Ingredient ====================

export interface PreparationType {
  id: number
  label?: string
  key?: string
}

export interface IngredientItem {
  id: number
  ingredient_name?: string
  image?: string
  feed_type_label?: string
  feed_type_id?: number
  preparation_types?: PreparationType[]
  is_active?: number | boolean
  created_at?: string
  updated_at?: string
}

export interface SelectedIngredient {
  ingredient_id: number | string
  ingredient_name?: string
  preparation_type_id?: number | string
  preparation_type?: string
  days_of_week?: number[]
  mealid?: number | string
  ingredient_image?: string
  master_cut_size_id?: number | string
  master_cut_size?: string
  remarks?: string
}

// ==================== Feed Type ====================

export interface FeedType {
  id: number
  feed_type_name?: string
  key?: string
  is_active?: number | boolean
}

// ==================== Cut Size ====================

export interface CutSize {
  id: number
  cut_size?: string
}

export interface CutSizeItem {
  id: number
  cut_size_name?: string
  is_active?: number | boolean
}

// ==================== UOM ====================

export interface UOM {
  id: number
  cut_size?: string
  uom_name?: string
}

// ==================== Meal Group ====================

export interface MealGroup {
  id: number
  group_name?: string
  site_id?: number | string
  site_name?: string
  total_enclosures?: number
  created_at?: string
  updated_at?: string
}

// ==================== Drop Point ====================

export interface DropPoint {
  id: number
  drop_point_id?: number
  drop_point_name?: string
  site_id?: number | string
  site_name?: string
  is_active?: number | boolean
}

// ==================== Enclosure ====================

export interface EnclosureItem {
  id: number
  enclosure_name?: string
  section_id?: number | string
  section_name?: string
  site_id?: number | string
  site_name?: string
  is_active?: number | boolean
}

// ==================== Species ====================

export interface SpeciesItem {
  species_id: number | string
  species_name?: string
  image?: string
  is_primary?: number | boolean
  assign_id?: number | string
  mapped_to_diet?: number | boolean
  total_animals?: number
  scientific_name?: string
}

export interface SiteSpeciesGroup {
  site_name?: string
  site_id?: number | string
  species?: SpeciesItem[]
}

// ==================== Animal ====================

export interface AnimalItem {
  animal_id: number | string
  animal_name?: string
  image?: string
  is_primary?: number | boolean
  assign_id?: number | string
  local_id?: string
  sex_type?: string
}

// ==================== Diet Category ====================

export interface DietCategory {
  id: number
  diet_category_name?: string
  is_active?: number | boolean
}

// ==================== Preparation Type (Settings) ====================

export interface PreparationTypeItem {
  id: number
  preparation_type_name?: string
  is_active?: number | boolean
}

// ==================== Kitchen Report ====================

export interface KitchenReport {
  [key: string]: any
}
