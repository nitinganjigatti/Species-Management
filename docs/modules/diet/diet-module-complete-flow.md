# Diet Module - Complete Documentation

## Overview

The Diet Module is a comprehensive system for managing dietary plans, feed types, ingredients, recipes, and meal distribution across different species and animals in a zoological or animal care facility. It provides tools to create, manage, and report on nutritional requirements and meal planning.

---

## Module Architecture

### Navigation Structure

The diet module is organized in the left sidebar under **"Diet"** with the following menu options:

```
Diet Module
├── Diet List (Primary)
├── Feed Types
├── Item (Ingredients)
├── Diet
├── Recipe
├── Mix (Combos)
├── Meal Groups
├── Kitchen
│   ├── Diet Report
│   └── Meal Group Report
└── Settings
    ├── Preparation Types
    ├── Cut Sizes
    ├── Diet Category
    └── Drop Points
```

---

## 1. Diet List (Species-Diet)

**Route:** `/diet/species-diet`

### Purpose

Assign and manage dietary plans for different species and individual animals within the facility.

### Key Features

#### 1.1 Tabs

- **Species Tab**: View all species in the system
  - List all available species
  - Filter by class, diet status
  - Search functionality
  - Bulk diet assignment options
- **Animal Tab**: View individual animals
  - Search and filter animals
  - Assign diets to specific animals
  - Override species-level diet assignments

#### 1.2 Main Functionality

**Species Management:**

- Click on a species to view detailed diet information
- See total count of animals and sites assigned to each species
- View current diet assignment status

**Animal Details:**

- View individual animal records
- Assign specific diets to animals
- Override inherited species diets
- Track diet assignment history

**Diet Upload:**

- Bulk upload diet assignments via CSV/Excel
- Map columns to diet parameters
- Validate before upload
- Handle upload errors gracefully

#### 1.3 Filter Options

- Filter by diet status (assigned/unassigned)
- Filter by species class (Mammal, Bird, Reptile, etc.)
- Search by species name or animal ID

### Technical Implementation

**Main Page:**
- `src/app/(module)/diet/species-diet/page.tsx` - Main species-diet page component

**Components:**
- `src/components/diet/species-diet/speciesDetails.tsx` - Display species details drawer
- `src/components/diet/species-diet/animalDetails.tsx` - Display animal details drawer
- `src/components/diet/species-diet/uploadDiet.tsx` - Handle bulk diet upload
- `src/components/diet/species-diet/species-upload-card.tsx` - Upload card UI
- `src/components/diet/species-diet/speciesDietFilter.tsx` - Filter logic for species diet

**Views:**
- `src/views/pages/diet/species/SpeciesDietFilterDrawer.tsx` - Filter drawer component

**API:**
- `src/lib/api/diet/speciesDiet.ts` - API calls for species and animal diet operations
  - `getSpeciesList()` - Fetch species list
  - `getAnimalList()` - Fetch animal list
  - `assignDietToSpecies()` - Assign diet to species
  - `assignDietToAnimal()` - Assign diet to individual animal
  - `uploadDietAssignments()` - Bulk upload functionality

**Types:**
- `src/types/diet/models.ts` - SpeciesItem, AnimalItem type definitions
- `src/types/diet/api.ts` - API parameter types

---

## 2. Feed Types

**Route:** `/diet/feed`

### Purpose

Define and manage types of feed/food items available in the facility.

### Key Features

#### 2.1 List View

- Table displaying all feed types
- Columns: Feed Type Name, Status (Active/Inactive), Created Date, Created By
- Pagination support (50 items per page)
- Search functionality by feed type name

#### 2.2 Add/Edit Feed Type

- **Create New:** Click "Add Feed Type" to create new feed type
- **Edit:** Click on feed type row to edit
- **Fields:**
  - Feed Type Name (required)
  - Description (optional)
  - Status (Active/Inactive)
  - Nutritional information (optional)

#### 2.3 Operations

- **Create**: Add new feed types
- **View Details**: Click row to see full details
- **Edit**: Modify existing feed types
- **Delete**: Remove unused feed types
- **Status Toggle**: Activate/Deactivate feed types

#### 2.4 Feed Type Categories

Common feed types include:

- Fruits
- Vegetables
- Meat
- Grains
- Supplements
- Specialized feeds

### Technical Implementation

**Main Page:**
- `src/app/(module)/diet/feed/page.tsx` - Main feed types list page

**Components:**
- `src/views/pages/diet/feed/feedoverview.tsx` - Feed types overview/form component

**API:**
- `src/lib/api/diet/feedType.ts` - Feed type API operations
  - `getFeedTypeList()` - Fetch all feed types
  - `createFeedType()` - Create new feed type
  - `updateFeedType()` - Update existing feed type
  - `deleteFeedType()` - Delete feed type
  - `updateFeedTypeStatus()` - Toggle active/inactive status

**Types:**
- `src/types/diet/models.ts` - FeedTypeItem definition

---

## 3. Item (Ingredients)

**Route:** `/diet/ingredient`

### Purpose

Manage individual food items/ingredients that will be used in recipes and diets.

### Key Features

#### 3.1 List View

- Table of all ingredients in the system
- Columns: Ingredient Name, Feed Type, Status, Created Date, Created By
- Toggle status (Active/Inactive) with switch control
- Search by ingredient name
- Filter by feed type
- Pagination support

#### 3.2 Add/Edit Ingredient

- **Create New:** Click "Add Ingredient" button
- **Fields:**
  - Ingredient Name (required)
  - Feed Type (required) - references Feed Types
  - Description (optional)
  - Nutritional Values:
    - Protein %
    - Fat %
    - Fiber %
    - Calcium
    - Phosphorus
    - Vitamin A
    - Other micronutrients
  - Cost per unit (optional)
  - Supplier information (optional)
  - Status (Active/Inactive)

#### 3.3 Operations

- **Create**: Add new ingredients
- **Edit**: Modify ingredient details and nutritional info
- **View**: See full ingredient details
- **Status Toggle**: Activate/Deactivate ingredients
- **Delete**: Remove unused ingredients
- **Bulk Operations**: Enable/disable multiple ingredients at once

#### 3.4 Ingredient Workflow

1. Create feed types (e.g., "Fruit", "Vegetable", "Meat")
2. Create ingredients within each feed type
3. Use ingredients in recipes
4. Use recipes in diets

### Technical Implementation

**Main Page:**
- `src/app/(module)/diet/ingredient/page.tsx` - Main ingredients list page

**Components:**
- `src/components/diet/AddIngredients.tsx` - Add ingredients dialog/drawer
- `src/components/diet/AddIngredientswithchoice.tsx` - Add ingredients with choice options
- `src/views/pages/diet/utility/ingrdientoverview.tsx` - Ingredient overview/form component

**API:**
- `src/lib/api/diet/getIngredients.ts` - Ingredient API operations
  - `getIngredientList()` - Fetch all ingredients
  - `createIngredient()` - Create new ingredient
  - `updateIngredient()` - Update ingredient
  - `deleteIngredient()` - Delete ingredient
  - `updateIngredientStatus()` - Toggle active/inactive status

**Types:**
- `src/types/diet/models.ts` - IngredientItem definition

---

## 4. Diet

**Route:** `/diet/diet`

### Purpose

Create and manage diet plans that combine multiple recipes for different species.

### Key Features

#### 4.1 List View

- Table of all diets in the system
- Columns: Diet Name, Diet Category, Status, Created Date, Created By, Total Animals, Total Species
- Status tabs: All, Active, Inactive
- Search by diet name
- Pagination support

#### 4.2 Create/Edit Diet

- **Route for Creating:** `/diet/add-diet`
- **Fields:**
  - Diet Name (required)
  - Diet Number (optional ID)
  - Diet Category (select from Diet Categories)
  - Diet Image (optional)
  - Description (optional)
  - Status (Active/Inactive)

#### 4.3 Diet Composition

After creating a diet, add recipes:

1. Search for recipes
2. Select recipes from available list
3. Specify quantity for each recipe
4. Set portion control parameters:
   - Portion size
   - Frequency (daily, weekly, etc.)
   - Special notes

#### 4.4 Diet Details View

Click on a diet to see:

- Included recipes
- Total nutritional information (calculated from recipes)
- Species assigned to this diet
- Animals assigned to this diet
- Diet assignment history
- Activity logs

#### 4.5 Operations

- **Create**: Add new diets
- **Edit**: Modify diet composition
- **View**: See diet details and assignments
- **Duplicate**: Clone existing diet
- **Activate/Deactivate**: Toggle diet status
- **Delete**: Remove unused diets

### Technical Implementation

**Main Pages:**
- `src/app/(module)/diet/diet/page.tsx` - Diet list page
- `src/app/(module)/diet/add-diet/page.tsx` - Create/Edit diet page

**Components:**
- `src/components/diet/SpeciesMappedtoDiet.tsx` - Species mapped to diet view
- `src/components/diet/Species_Animals_mapped.tsx` - Species and animals mapped view
- `src/components/diet/ChangeDietname.tsx` - Change diet name dialog
- `src/views/pages/diet/DietDetailCard/index.tsx` - Diet detail card component
- `src/views/pages/diet/add-diet/StepBasicDetails.tsx` - Diet basic details form
- `src/views/pages/diet/add-diet/AddDietType.tsx` - Add diet type logic
- `src/views/pages/diet/add-diet/PreviewDiet.tsx` - Preview diet before saving

**API:**
- `src/lib/api/diet/dietList.ts` - Diet API operations
  - `getDietList()` - Fetch all diets
  - `createDiet()` - Create new diet
  - `updateDiet()` - Update diet
  - `deleteDiet()` - Delete diet
  - `updateDietStatus()` - Toggle diet status
  - `getTaxonomyList()` - Get species taxonomy for filtering

**Types:**
- `src/types/diet/models.ts` - DietItem definition

---

## 5. Recipe

**Route:** `/diet/recipe`

### Purpose

Create recipes that combine specific ingredients with preparation methods.

### Key Features

#### 5.1 List View

- Table of all recipes
- Columns: Recipe Name, Meal Type, Status, Created Date, Created By
- Status tabs: All, Active, Inactive
- Search functionality
- Pagination support

#### 5.2 Create/Edit Recipe

- **Route for Creating:** `/diet/recipe/add-recipe`
- **Basic Information:**
  - Recipe Name (required)
  - Meal Type (Breakfast, Lunch, Dinner, Snack, etc.)
  - Description (optional)
  - Status (Active/Inactive)

#### 5.3 Recipe Ingredients

After creating a recipe, add ingredients:

1. **Add Ingredients Workflow:**

   - Click "Add Ingredients" button
   - Search for ingredients from available list
   - For each ingredient, specify:
     - Ingredient Name
     - Quantity (amount)
     - Unit (grams, ml, pieces, etc.)
     - Preparation Type (Raw, Cooked, Frozen, etc.)
     - Special notes

2. **Ingredient List View:**
   - See all ingredients in recipe
   - Edit ingredient quantity
   - Remove ingredients
   - Reorder ingredients

#### 5.4 Recipe Details

- Total nutritional information (auto-calculated)
- List of ingredients with quantities
- Preparation instructions
- Cost calculation
- Diets using this recipe

#### 5.5 Operations

- **Create**: Add new recipes
- **Edit**: Modify recipe details and ingredients
- **View**: See full recipe composition
- **Duplicate**: Clone recipe
- **Activate/Deactivate**: Toggle recipe status
- **Delete**: Remove unused recipes

### Technical Implementation

**Main Pages:**
- `src/app/(module)/diet/recipe/page.tsx` - Recipe list page
- `src/app/(module)/diet/recipe/add-recipe/page.tsx` - Create/Edit recipe page

**Components:**
- `src/components/diet/RecipeList.tsx` - Recipe list selector component
- `src/components/diet/ChangeRecipename.tsx` - Change recipe name dialog
- `src/views/pages/diet/add_recipe_combo-List/recipeCard.tsx` - Recipe card component

**API:**
- `src/lib/api/diet/recipe.ts` - Recipe API operations
  - `getRecipeList()` - Fetch all recipes
  - `createRecipe()` - Create new recipe
  - `updateRecipe()` - Update recipe
  - `deleteRecipe()` - Delete recipe
  - `updateRecipeStatus()` - Toggle recipe status
  - `getRecipeDetails()` - Get detailed recipe with ingredients

**Types:**
- `src/types/diet/models.ts` - RecipeItem definition

---

## 6. Mix (Combos)

**Route:** `/diet/combo`

### Purpose

Create recipe combinations that group multiple recipes together for convenience.

### Key Features

#### 6.1 List View

- Table of all recipe combos/mixes
- Columns: Combo Name, Status, Created Date, Created By
- Status tabs: All, Active, Inactive
- Search functionality
- Pagination support

#### 6.2 Create/Edit Combo

- **Route for Creating:** `/diet/combo/add-combo`
- **Basic Information:**
  - Combo Name (required)
  - Description (optional)
  - Status (Active/Inactive)

#### 6.3 Combo Composition

Add recipes to combo:

1. **Add Recipes Workflow:**

   - Search for recipes
   - Select recipes to include
   - For each recipe, specify:
     - Recipe name
     - Quantity/Serving size
     - Frequency in combo
     - Special notes

2. **Ingredient List View:**
   - Click "Ingredient List" to see all combined ingredients
   - View total nutritional content
   - See ingredient summary across all recipes

#### 6.4 Use Cases

- Morning feeding combo (multiple recipes together)
- Special occasion feeding
- Seasonal combinations
- Animal-specific combinations

#### 6.5 Operations

- **Create**: Add new combos
- **Edit**: Modify combo composition
- **View**: See combined recipes and ingredients
- **Duplicate**: Clone combo
- **Activate/Deactivate**: Toggle status
- **Delete**: Remove unused combos

### Technical Implementation

**Main Pages:**
- `src/app/(module)/diet/combo/page.tsx` - Combo list page
- `src/app/(module)/diet/combo/add-combo/page.tsx` - Create/Edit combo page

**Components:**
- `src/components/diet/ComboList.tsx` - Combo list selector component
- `src/views/pages/diet/add_recipe_combo-List/comboCard.tsx` - Combo card component

**API:**
- `src/lib/api/diet/recipe.ts` - Shared with recipe (combo uses recipe API)
  - `getRecipeList()` - Fetch recipes for combo
  - API also handles combo operations

**Types:**
- `src/types/diet/models.ts` - Combo definition

---

## 7. Meal Groups

**Route:** `/diet/meal-groups`

### Purpose

Organize physical feeding locations (enclosures, sections) and assign diets to them.

### Key Features

#### 7.1 Tabs

- **Meal Groups**: Main list of meal groups
- **Meal Schedules**: (if available) Feeding schedules
- **Drop Points**: Feeding/drop-off locations

#### 7.2 Meal Group Management

**Create Meal Group:**

- Group Name (required)
- Site Selection (required)
- Section Selection (from site)
- Enclosures (select which enclosures belong to this group)
- Diet Assignment (select diet for this group)
- Feeding Schedule (frequency, times)

**Edit Meal Group:**

- Update group name
- Change assigned diet
- Modify enclosures in group
- Update feeding schedule

#### 7.3 Enclosure Management

- Add enclosures to meal groups
- Remove enclosures from groups
- View animals in each enclosure
- Manage enclosure-specific feeding requirements

#### 7.4 Drop Points

- Define feeding drop-off points within meal groups
- Assign drop points to specific meal groups
- Create new drop points via "Add Drop Point" button
- Manage multiple drop points per meal group

**Drop Point Fields:**

- Drop Point Name (required)
- Location within enclosure (optional)
- Capacity
- Special notes
- Status (Active/Inactive)

#### 7.5 Meal Group Workflow

1. Select Site
2. Create Meal Group
3. Add Sections and Enclosures to group
4. Assign Diet to group
5. Create/assign Drop Points
6. Set feeding schedule

### Technical Implementation

**Main Page:**
- `src/app/(module)/diet/meal-groups/page.tsx` - Main meal groups page

**Components:**
- `src/components/diet/SelectSiteList.tsx` - Site selection component
- `src/components/diet/SelectSectionList.tsx` - Section selection component
- `src/components/diet/SelectEnclosureList.tsx` - Enclosure selection component
- `src/components/diet/AddDropPointDrawer.tsx` - Add drop point drawer
- `src/views/pages/diet/mealGroup/creategroup.tsx` - Create meal group form
- `src/views/pages/diet/mealGroup/createEnclosure.tsx` - Create enclosure form
- `src/views/pages/diet/mealGroup/addEnclosureToGroup.tsx` - Add enclosure to group
- `src/views/pages/diet/mealGroup/selectedEnclosure.tsx` - Selected enclosures view

**API:**
- `src/lib/api/diet/mealgroup.ts` - Meal group API operations
  - `getMealGroupList()` - Fetch meal groups
  - `createMealGroup()` - Create new meal group
  - `updateMealGroup()` - Update meal group
  - `removeMealGroup()` - Delete meal group
  - `getEnclosureList()` - Fetch enclosures
  - `getEnclosureListByGroup()` - Fetch enclosures in group
  - `getSectionList()` - Fetch sections
  - `getSpeciesList()` - Fetch species list
  - `getMealGroupStats()` - Get statistics for meal group
  - `removeMealGroupFromDropPoint()` - Remove from drop point

**Types:**
- `src/types/diet/models.ts` - MealGroup definition

---

## 8. Kitchen (Reports)

**Route:** `/diet/kitchen/diet-report`

### Purpose

Generate reports for kitchen/food preparation staff to understand what needs to be prepared.

### Key Features

#### 8.1 Diet Report

- **Purpose:** Show current diet plans for each species

**Report Types:**

- Species wise Diet & Quantity Report
  - View current diet plan for each species
  - Quantities needed per species
  - Filter by species, site, or diet
- Site & Species wise Diet & Quantity Report
  - Estimated inventory needs per species at specific site
  - Consider number of animals per species
- Inventory Estimate by Animal
  - Inventory quantities needed per individual animal
  - Most detailed breakdown
- Species Diet Report
  - Detailed view of each species' diet plan
  - Recipe breakdown
- Species Site Diet Report
  - Site-specific diet plans for species

**Report Features:**

- Date Range Filter (selectable date range)
- Download functionality (Excel, PDF)
- Filter by species, site, diet
- Sortable columns
- Export for inventory planning

#### 8.2 Meal Group Report

- **Route:** `/diet/kitchen/meal-group-report`
- View meal group feeding schedules
- See which diets are assigned to which meal groups
- Generate preparation lists
- Track meal group assignments

**Report Options:**

- By meal group
- By site
- By enclosure
- By feeding schedule

#### 8.3 Report Usage

- Kitchen staff uses reports to understand daily preparation needs
- Inventory team uses for procurement planning
- Animal care staff for feeding verification
- Management for resource planning

### Technical Implementation

**Main Pages:**
- `src/app/(module)/diet/kitchen/diet-report/page.tsx` - Diet report page
- `src/app/(module)/diet/kitchen/meal-group-report/page.tsx` - Meal group report page

**Components:**
- `src/components/diet/drawers/DietReportDrawer.tsx` - Report detail drawer
- `src/components/diet/drawers/MealGroupReportDrawer.tsx` - Meal group report drawer
- `src/views/pages/diet/kitchen/diet-report/index.tsx` - Diet report view

**API:**
- `src/lib/api/diet/kitchen.ts` - Kitchen/Report API operations
  - `getGeneralSpeciesWiseReport()` - Get species-wise report
  - `getSpeciesWiseReport()` - Detailed species report
  - `getAnimalWiseInventoryPlanning()` - Animal-wise inventory planning
  - `getGeneralSpeciesWiseComboReport()` - Species-wise combo report
  - `downloadReport()` - Download report functionality

**Types:**
- `src/types/diet/api.ts` - Report parameter types

---

## 9. Settings

**Route:** `/diet/settings`

### Purpose

Configure various diet module parameters and categorizations.

### Key Submenus

#### 9.1 Preparation Types

- **Path:** `/diet/settings/preparation-types`
- Define how ingredients are prepared
- Examples: Raw, Cooked, Boiled, Steamed, Frozen, Dried, etc.

**Manage Preparation Types:**

- Create new preparation type
- Edit existing types
- Delete unused types
- Activate/Deactivate types
- Use in ingredient specifications when creating recipes

#### 9.2 Cut Sizes

- **Path:** `/diet/settings/cut-sizes`
- Define cutting/portioning sizes for ingredients
- Examples: Small, Medium, Large, Diced, Minced, Whole, Half, Quarter, etc.

**Manage Cut Sizes:**

- Create size specifications
- Modify cut size definitions
- Delete unused sizes
- Activate/Deactivate sizes
- Use when specifying ingredient portions in recipes

#### 9.3 Diet Category

- **Path:** `/diet/settings/diet-category`
- Categorize diets for organization
- Examples: Carnivore, Herbivore, Omnivore, Specialized, Medical, etc.

**Manage Categories:**

- Create diet categories
- Assign diets to categories
- Edit category details
- Delete unused categories
- Filter diets by category in main diet list

#### 9.4 Drop Points

- **Path:** `/diet/settings/drop-points`
- Manage global drop point configurations
- Define feeding locations in facility

**Manage Drop Points:**

- Create/edit global drop point templates
- View drop points used in meal groups
- Set drop point parameters:
  - Name
  - Type (Floor, Elevated, Container, etc.)
  - Capacity
  - Associated site/enclosure
- Activate/Deactivate drop points

### Technical Implementation

**Pages:**
- `src/app/(module)/diet/settings/preparation-types/page.tsx` - Preparation types page
- `src/app/(module)/diet/settings/cut-sizes/page.tsx` - Cut sizes page
- `src/app/(module)/diet/settings/diet-category/page.tsx` - Diet category page
- `src/app/(module)/diet/settings/drop-points/page.tsx` - Drop points page

**Components:**
- `src/views/pages/diet/preparationTypes/addPreparationType.tsx` - Add preparation type form
- `src/views/pages/diet/cutSizes/addCutSizes.tsx` - Add cut sizes form
- `src/views/pages/diet/dietCategories/AddEditDietCategory.tsx` - Add/Edit diet category form
- `src/views/pages/diet/dropPoint/AddEditDropPoint.tsx` - Add/Edit drop point form

**API:**
- `src/lib/api/diet/settings/preparationTypes.ts` - Preparation types API
  - `getPreparationTypesList()` - Fetch all preparation types
  - `createPreparationType()` - Create new
  - `updatePreparationType()` - Update existing
  - `deletePreparationType()` - Delete

- `src/lib/api/diet/settings/cutSizes.ts` - Cut sizes API
  - `getCutSizesList()` - Fetch all cut sizes
  - `createCutSize()` - Create new
  - `updateCutSize()` - Update existing
  - `deleteCutSize()` - Delete

- `src/lib/api/diet/settings/dietCategory.ts` - Diet category API
  - `getDietCategoryList()` - Fetch all categories
  - `createDietCategory()` - Create new
  - `updateDietCategory()` - Update existing
  - `deleteDietCategory()` - Delete

- `src/lib/api/diet/mealgroup.ts` - Drop point operations handled in mealgroup API
  - `addDropPoint()` - Add drop point
  - `updateDropPoint()` - Update drop point
  - `deleteDropPoint()` - Delete drop point

**Types:**
- `src/types/diet/models.ts` - All settings types (PreparationType, CutSize, DietCategory)

---

## Complete End-to-End Workflow

### Scenario: Setting Up Diet for a New Species

#### Phase 1: Foundation Setup (Settings & Configuration)

1. **Set Up Preparation Types** (if not already done)

   - Go to Settings > Preparation Types
   - Add: Raw, Cooked, Steamed, Frozen
   - These will be used when adding ingredients to recipes

2. **Set Up Cut Sizes** (if not already done)

   - Go to Settings > Cut Sizes
   - Add: Whole, Half, Diced, Minced, Sliced
   - These specify how ingredients are cut

3. **Set Up Diet Category** (if not already done)
   - Go to Settings > Diet Category
   - Add category for the species type (e.g., "Carnivore", "Primate", "Reptile")

#### Phase 2: Create Foundational Data

4. **Create Feed Types**

   - Navigate to Feed Types
   - Create feed type: "Fruits" (description: "Various fruits for diet")
   - Create feed type: "Vegetables"
   - Create feed type: "Meat/Protein"
   - Create feed type: "Grains"
   - Status: Active for all

5. **Create Ingredients**
   - Navigate to Item (Ingredients)
   - Add ingredients:

     - Ingredient: "Apple" → Feed Type: Fruits

       - Nutritional values: Fiber 2.4g, Vitamin C 5mg per 100g
       - Status: Active

     - Ingredient: "Carrot" → Feed Type: Vegetables

       - Nutritional values: Protein 0.9g, Vitamin A 835µg per 100g
       - Status: Active

     - Ingredient: "Chicken Breast" → Feed Type: Meat/Protein

       - Nutritional values: Protein 31g, Fat 3.6g per 100g
       - Status: Active

     - Ingredient: "Brown Rice" → Feed Type: Grains
       - Status: Active

#### Phase 3: Create Recipes

6. **Create Recipe 1: Fruit Mix**

   - Navigate to Recipe
   - Click "Add Recipe"
   - Recipe Name: "Daily Fruit Mix"
   - Meal Type: "Snack"
   - Status: Active
   - Save recipe

   - Click "Add Ingredients"
   - Add Ingredient: Apple

     - Quantity: 100
     - Unit: grams
     - Preparation Type: Fresh (Raw)
     - Cut Size: Sliced

   - Add Ingredient: Carrot

     - Quantity: 100
     - Unit: grams
     - Preparation Type: Raw
     - Cut Size: Diced

   - Save ingredients

7. **Create Recipe 2: Protein Mix**

   - Navigate to Recipe
   - Click "Add Recipe"
   - Recipe Name: "Protein & Grain Mix"
   - Meal Type: "Main"
   - Status: Active

   - Add Ingredients:

     - Chicken Breast: 150g, Cooked
     - Brown Rice: 200g, Cooked

   - Save

#### Phase 4: Create Combos (Optional)

8. **Create Combo**
   - Navigate to Mix (Combo)
   - Click "Add Combo"
   - Combo Name: "Daily Feeding Combo"
   - Add Recipes:
     - Daily Fruit Mix
     - Protein & Grain Mix
   - Status: Active

#### Phase 5: Create Diet

9. **Create Diet**

   - Navigate to Diet
   - Click "Add Diet" (or on diet list)
   - Diet Name: "Standard Omnivore Diet"
   - Diet Number: "OMN-001"
   - Diet Category: "Omnivore" (from settings)
   - Status: Active

   - Add Recipes/Combos:

     - Recipe: Daily Fruit Mix (Quantity: 1 serving)
     - Recipe: Protein & Grain Mix (Quantity: 2 servings)

   - Save diet
   - View diet details to see total nutritional information

#### Phase 6: Assign to Species/Animals

10. **Create Meal Groups**

    - Navigate to Meal Groups
    - Select Site (e.g., "Main Zoo Site")
    - Create Meal Group:

      - Group Name: "Primate House Morning Group"
      - Add Section: "Primate House"
      - Add Enclosures: Select all primate enclosures
      - Assign Diet: "Standard Omnivore Diet"
      - Status: Active

    - Create Drop Points:
      - Click "Add Drop Point"
      - Drop Point Name: "Primate House - Feeding Platform 1"
      - Location: "Main enclosure area"
      - Capacity: "500g"
      - Status: Active

11. **Assign Diet to Species**

    - Navigate to Diet List (Species-Diet)
    - Click on Species tab
    - Search for your species
    - Click on species row
    - Select Diet: "Standard Omnivore Diet"
    - Status: Active
    - Save assignment

12. **Override for Individual Animals** (if needed)
    - Navigate to Diet List
    - Click on Animal tab
    - Search for specific animal
    - Assign special diet if different from species diet
    - Example: Senior animal on modified diet
    - Save

#### Phase 7: Generate Reports

13. **Kitchen Report**

    - Navigate to Kitchen > Diet Report
    - Select Date Range: Today or next 7 days
    - Filter by Site or Species
    - View "Species wise Diet & Quantity Report"
    - Download report for kitchen staff
    - Kitchen team now knows exactly what to prepare

14. **Inventory Planning**
    - Navigate to Kitchen > Diet Report
    - Select "Inventory Estimate by Animal"
    - See total quantities needed for all species/animals
    - Use for procurement planning

---

## Data Model Overview

### Key Entities and Relationships

```
Feed Type
├── Feed Type Name
├── Description
└── Status

Ingredient
├── Name
├── Feed Type (FK to Feed Type)
├── Nutritional Information
├── Preparation Types (many-to-many)
├── Cut Sizes (many-to-many)
└── Status

Recipe
├── Name
├── Meal Type
├── Ingredients (one-to-many)
│   ├── Ingredient (FK)
│   ├── Quantity
│   ├── Unit
│   ├── Preparation Type
│   └── Cut Size
└── Status

Combo
├── Name
├── Recipes (many-to-many)
│   ├── Recipe (FK)
│   ├── Quantity
│   └── Serving Size
└── Status

Diet
├── Name
├── Diet Category (FK)
├── Recipes/Combos (many-to-many)
│   ├── Recipe or Combo (FK)
│   ├── Quantity
│   └── Frequency
└── Status

Species Diet Assignment
├── Species
├── Diet (FK)
└── Assignment Date

Animal Diet Assignment
├── Animal
├── Species
├── Diet (FK)
├── Override Flag (if different from species)
└── Assignment Date

Meal Group
├── Name
├── Site (FK)
├── Sections (many-to-many)
├── Enclosures (many-to-many)
├── Diet (FK)
├── Drop Points (one-to-many)
└── Feeding Schedule

Drop Point
├── Name
├── Meal Group (FK)
├── Capacity
├── Location
└── Status

Diet Category
├── Name
└── Description
```

---

## Access Control

The diet module respects the following permissions based on user roles:

- `diet_module`: Can access the diet module
- `diet_module_access`: Specific access level within the diet module

Users without these permissions will see a 404 error when trying to access diet module pages.

---

## Key Features Summary

| Feature         | Purpose                         | Key Actions                                    |
| --------------- | ------------------------------- | ---------------------------------------------- |
| Feed Types      | Categorize food items           | Create, Edit, Delete, Activate/Deactivate      |
| Ingredients     | Define individual food items    | Create, Edit, Delete, Manage nutrition info    |
| Recipes         | Combine ingredients             | Create, Add ingredients, View nutrition        |
| Mix (Combos)    | Group recipes                   | Create, Add recipes, View combined ingredients |
| Diet            | Create complete feeding plans   | Create, Add recipes, Assign to species         |
| Species-Diet    | Assign diets to species/animals | View, Assign, Override per animal              |
| Meal Groups     | Organize physical feeding areas | Create, Add enclosures, Assign diets           |
| Kitchen Reports | Generate preparation reports    | View, Filter, Download for kitchen staff       |
| Settings        | Configure module parameters     | Manage categories, cut sizes, prep types       |

---

## Common Workflows

### 1. Daily Operations

1. Kitchen staff checks Kitchen > Diet Report
2. Staff sees what diets need to be prepared
3. Staff prepares food based on recipes in diet
4. Food delivered to drop points managed by meal groups

### 2. Quarterly Diet Review

1. Manager reviews current diets in Diet module
2. Updates recipes based on seasonal ingredient availability
3. Modifies combos or meal group assignments
4. Generates inventory planning report
5. Communicates to procurement team

### 3. New Animal Arrival

1. Animal assigned to species
2. Species diet automatically applied
3. If special dietary needs, create override in Species-Diet section
4. Meal groups updated if needed
5. Kitchen notified via reports

### 4. Dietary Change

1. Create new recipe with updated ingredients
2. Create new diet using updated recipe
3. Assign new diet to species
4. Deprecate old diet (make inactive)
5. Kitchen receives new report

---

## Best Practices

1. **Ingredient Management**

   - Keep ingredient list clean - remove duplicates
   - Always specify nutritional information
   - Use consistent units (grams, ml, pieces)

2. **Recipe Creation**

   - Use descriptive recipe names
   - Include meal type for clarity
   - Keep recipes focused on specific meal purpose

3. **Diet Planning**

   - Use diet categories to organize by animal type
   - Create base diets and mark variations clearly
   - Regularly review and update diets
   - Keep inactive diets for historical reference

4. **Meal Groups**

   - Name meal groups clearly with location/purpose
   - Ensure drop points match physical facility layout
   - Update assignments when facility changes
   - Test assignments before going live

5. **Reporting**
   - Generate reports regularly (weekly or before procurement)
   - Use consistent date ranges for trend analysis
   - Filter reports by site for large facilities
   - Share reports with relevant teams

---

## Troubleshooting

### Issue: Recipe shows no nutritional information

**Solution:** Ensure all ingredients have nutritional data filled in. Recipes calculate nutrition from ingredients.

### Issue: Diet not showing in assignment

**Solution:** Check that diet status is "Active". Only active diets can be assigned.

### Issue: Ingredient not available when creating recipe

**Solution:** Check ingredient status is "Active" and feed type is assigned.

### Issue: Meal group not saving

**Solution:** Ensure at least one enclosure and one diet are selected. Both are required.

### Issue: Kitchen report shows no data

**Solution:** Verify diets are assigned to species/animals and date range includes current assignments.

---

## Shared Components and Utilities

These reusable components are used across multiple diet module features:

### Selection Components

**Site Selection:**
- **File:** `src/components/diet/SelectSiteList.tsx`
- **Purpose:** Multi-use component for selecting sites
- **Usage:** Meal Groups, Meal Group Reports, Species-Diet filters
- **Props:** `onChange()`, `value`, `disabled`

**Section Selection:**
- **File:** `src/components/diet/SelectSectionList.tsx`
- **Purpose:** Reusable section selector for meal groups
- **Usage:** Meal Group creation and editing
- **Props:** `onChange()`, `siteId`, `disabled`

**Enclosure Selection:**
- **File:** `src/components/diet/SelectEnclosureList.tsx`
- **Purpose:** Enclosure multi-select component
- **Usage:** Meal Group enclosure assignment
- **Props:** `onChange()`, `siteId`, `sectionId`, `selected`

### List Display Components

**Recipe List:**
- **File:** `src/components/diet/RecipeList.tsx`
- **Purpose:** Display and select recipes
- **Usage:** Diet composition, Combo creation
- **Props:** `onSelect()`, `multiple`, `selected`

**Combo List:**
- **File:** `src/components/diet/ComboList.tsx`
- **Purpose:** Display and select combos/recipe combinations
- **Usage:** Diet composition
- **Props:** `onSelect()`, `multiple`, `selected`

### Drawer/Modal Components

**Add Ingredients Drawer:**
- **File:** `src/components/diet/AddIngredients.tsx`
- **Purpose:** Add ingredients to recipes with quantity and prep type
- **Usage:** Recipe creation, Diet composition
- **Props:** `open: boolean`, `onClose()`, `recipeId`, `dietId`, `refetch()`

**Add Ingredients with Choice:**
- **File:** `src/components/diet/AddIngredientswithchoice.tsx`
- **Purpose:** Advanced ingredient selection with options
- **Usage:** Complex recipe creation
- **Props:** `open: boolean`, `onClose()`, `selectedIngredients`, `onSave()`

**Add Drop Point Drawer:**
- **File:** `src/components/diet/AddDropPointDrawer.tsx`
- **Purpose:** Create and manage drop points for meal groups
- **Usage:** Meal Group management
- **Props:** `open: boolean`, `onClose()`, `mealGroupId`, `refetch()`

**Report Drawers:**
- **Diet Report Drawer:** `src/components/diet/drawers/DietReportDrawer.tsx` - View detailed diet reports
- **Meal Group Report Drawer:** `src/components/diet/drawers/MealGroupReportDrawer.tsx` - View meal group reports

### Name Change Components

**Change Diet Name:**
- **File:** `src/components/diet/ChangeDietname.tsx`
- **Purpose:** Dialog to rename existing diet
- **Usage:** Diet list edit operations
- **Props:** `open: boolean`, `onClose()`, `currentName`, `onSave()`

**Change Recipe Name:**
- **File:** `src/components/diet/ChangeRecipename.tsx`
- **Purpose:** Dialog to rename existing recipe
- **Usage:** Recipe list edit operations
- **Props:** `open: boolean`, `onClose()`, `currentName`, `onSave()`

### Mapping/Display Components

**Species Mapped to Diet:**
- **File:** `src/components/diet/SpeciesMappedtoDiet.tsx`
- **Purpose:** Show all species assigned to a diet
- **Usage:** Diet details view
- **Props:** `dietId`, `refreshData`

**Species & Animals Mapped:**
- **File:** `src/components/diet/Species_Animals_mapped.tsx`
- **Purpose:** Display both species and animals assigned to a diet
- **Usage:** Diet details, Species-Diet assignments
- **Props:** `dietId`

**Edit Animals/Species:**
- **File:** `src/components/diet/EditAnimalsSpecies.tsx`
- **Purpose:** Edit species and animal assignments
- **Usage:** Diet management
- **Props:** `dietId`, `onSave()`, `onCancel()`

**List of Species Mapped:**
- **File:** `src/components/diet/ListofSpeciesMapped.tsx`
- **Purpose:** List view of mapped species
- **Usage:** Species-Diet view
- **Props:** `species: Array`, `onEdit()`

### Layout Components

**Fixed Footer Wrapper:**
- **File:** `src/components/diet/FixedFooterWrapper.tsx`
- **Purpose:** Layout wrapper with fixed footer for save/cancel buttons
- **Usage:** Multi-step forms (Diet, Recipe, Meal Group creation)
- **Props:** `children: ReactNode`, `footer: ReactNode`

### Card Components

**Generic Card:**
- **File:** `src/components/diet/Card.tsx`
- **Purpose:** Reusable card component for displaying items
- **Usage:** Feed types, Ingredients, Recipes display
- **Props:** `title`, `description`, `onClick`, `actions`

### Activity Logs

**Activity Logs Component:**
- **File:** `src/components/diet/activityLogs/index.tsx`
- **Purpose:** Display activity/change history for diet items
- **Usage:** Diet, Recipe, Ingredient detail views
- **Props:** `entityId`, `entityType` (diet|recipe|ingredient), `userId`

### Filter Components

**Species-Diet Filter Drawer:**
- **File:** `src/views/pages/diet/species/SpeciesDietFilterDrawer.tsx`
- **Purpose:** Advanced filtering for species diet assignment
- **Usage:** Species-Diet list filtering
- **Props:** `open: boolean`, `onClose()`, `onApplyFilter()`, `filterOptions`

**Species-Diet Filter Logic:**
- **File:** `src/components/diet/species-diet/speciesDietFilter.tsx`
- **Purpose:** Filter logic and state management
- **Usage:** Species-Diet page
- **Props:** `onChange()`

---

## Code Organization Best Practices

When extending the diet module, follow these patterns:

### Component Organization
```
src/components/diet/
├── [Reusable components by feature]
├── drawers/
│   └── [Dialog/drawer components]
├── species-diet/
│   └── [Species-diet specific components]
└── activityLogs/
    └── [Activity log components]
```

### API Organization
```
src/lib/api/diet/
├── feedType.ts
├── getIngredients.ts
├── recipe.ts
├── dietList.ts
├── mealgroup.ts
├── kitchen.ts
└── settings/
    ├── preparationTypes.ts
    ├── cutSizes.ts
    └── dietCategory.ts
```

### View Organization
```
src/views/pages/diet/
├── [Feature-specific forms and views]
├── kitchen/
│   └── diet-report/
├── mealGroup/
└── [Settings forms]
```

---

## Additional Resources

- **API Documentation:** See `src/lib/api/diet/`
- **Type Definitions:** See `src/types/diet/`
- **Component Library:** See `src/components/diet/`
- **View Templates:** See `src/views/pages/diet/`
- **Navigation Config:** See `src/components/navigation/diet/index.tsx`
- **Theme/Styling:** See `src/configs/themeConfig.js` and `src/layouts/UserThemeOptions.js`
