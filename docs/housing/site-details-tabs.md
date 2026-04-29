# Site Details Tabs - Web Implementation Guide

This document outlines all the tabs, permissions, APIs, and navigations required to implement the Site Details page in the web dashboard, based on the mobile app implementation.

---

## Table of Contents

1. [Overview](#overview)
2. [Tab Configuration](#tab-configuration)
3. [Permissions Reference](#permissions-reference)
4. [Tab Details](#tab-details)
   - [Sections Tab](#1-sections-tab)
   - [Occupants (Species) Tab](#2-occupants-species-tab)
   - [Animals Under Treatment Tab](#3-animals-under-treatment-tab)
   - [Notes Tab](#4-notes-tab)
   - [Assessment Tab](#5-assessment-tab)
   - [Medical Tab](#6-medical-tab)
   - [Animal Transfers Tab](#7-animal-transfers-tab)
   - [Teams Tab](#8-teams-tab)
   - [Media Tab](#9-media-tab)
   - [Config Tab](#10-config-tab)
   - [Users Tab](#11-users-tab)
   - [Incharges Tab](#12-incharges-tab)
   - [Mortality Tab](#13-mortality-tab)
   - [Food Wastage Tab](#14-food-wastage-tab)
   - [Hospital Transfer Tab](#15-hospital-transfer-tab)
5. [API Constants](#api-constants)
6. [Navigation Routes](#navigation-routes)
7. [Settings Dependencies](#settings-dependencies)

---

## Overview

The Site Details page displays comprehensive information about a specific site in the housing module. It contains up to 15 tabs, each showing different aspects of site management.

### Current Web Implementation Status

| Tab | Web Status | Priority |
|-----|------------|----------|
| Sections | ✅ Implemented | - |
| Occupants (Species) | ✅ Implemented | - |
| Animals Under Treatment | ✅ Implemented | - |
| Notes | ❌ Missing | High |
| Assessment | ❌ Missing | High |
| Medical | ❌ Missing | High |
| Animal Transfers | ❌ Missing | Medium |
| Teams | ❌ Missing | Medium |
| Media | ✅ Implemented | - |
| Config | ❌ Missing | Low |
| Users | ❌ Missing | Medium |
| Incharges | ❌ Missing | Medium |
| Mortality | ✅ Implemented | - |
| Food Wastage | ❌ Missing | High |
| Hospital Transfer | ❌ Missing | Low |

---

## Tab Configuration

```javascript
const TAB_HEADER_ITEMS = [
  { id: "0", title: "Sections", screen: "section" },
  { id: "2", title: "Occupants", screen: "species" },
  { id: "3", title: "Animals Under Treatment", screen: "treatment" },
  { id: "4", title: "Notes", screen: "observation" },
  { id: "15", title: "Assessment", screen: "assessment" },
  { id: "5", title: "Medical", screen: "medicalRecord" },
  { id: "6", title: "Animal Transfers", screen: "animalTransfers" },
  { id: "7", title: "Teams", screen: "teams" },
  { id: "8", title: "Media", screen: "media" },
  { id: "9", title: "Config", screen: "config" },
  { id: "10", title: "Users", screen: "permissions" },
  { id: "11", title: "Incharges", screen: "incharges" },
  { id: "12", title: "Mortality", screen: "Mortality" },
  { id: "13", title: "Food Wastage", screen: "foodWastage" },
  { id: "14", title: "Hospital Transfer", screen: "hospitalTransfer" }
];
```

---

## Permissions Reference

| Permission Key | Description | Tabs Affected |
|----------------|-------------|---------------|
| `collection_animal_records` | Access to animal records | Occupants (Species) |
| `access_mortality_module` | Access to mortality data | Mortality |
| `approval_move_animal_external` | Animal transfer approvals | Animal Transfers, Hospital Transfer |
| `medical_records` | Access to medical records | Medical |
| `lab_test_mapping` | Lab test configuration | Config |
| `housing_view_insights` | View housing insights | Site Header Stats |

### Settings Dependencies

| Setting Key | Description | Tabs Affected |
|-------------|-------------|---------------|
| `ANIMAL_TRANSFER_REQUIRES_APPROVAL` | Enable transfer approvals | Teams (shows/hides tab) |
| `ANIMAL_TRANSFER_REQUIRES_SECURITY_APPROVAL` | Enable security approvals | Teams (security sub-tab) |
| `LAB_LIMS_REQUIRED` | Lab LIMS integration | Config (hides if true) |

---

## Tab Details

### 1. Sections Tab

**Screen Key:** `section`

**Permission Required:** None (default visible)

#### API Endpoint
```
GET /get-site-wise-section-list
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `site_id` | number | Yes | Site ID |
| `search` | string | No | Search query |
| `page_no` | number | Yes | Pagination |

#### Response Structure
```json
{
  "success": true,
  "data": {
    "result": [
      {
        "section_id": 1,
        "section_name": "Section A",
        "enclosure_count": 10,
        "animal_count": 50,
        "species_count": 15
      }
    ],
    "total_count": 100
  }
}
```

#### Navigation
- Click on section card → Navigate to `/housing/sections/[section_id]`

#### RTK Query Hook
```javascript
useGetSectionListInfiniteQuery({
  site_id: site_id,
  search: debouncedValue?.trim(),
})
```

---

### 2. Occupants (Species) Tab

**Screen Key:** `species`

**Permission Required:** `collection_animal_records`

#### API Endpoint
```
GET /v1/species/listing
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `site_id` | number | Yes | Site ID |
| `search` | string | No | Search query |
| `page_no` | number | Yes | Pagination |

#### Response Structure
```json
{
  "success": true,
  "data": {
    "listing": [
      {
        "taxonomy_id": 1,
        "common_name": "Lion",
        "scientific_name": "Panthera leo",
        "total_count": 5,
        "male_count": 2,
        "female_count": 3
      }
    ],
    "total_scies_count": 50
  }
}
```

#### Navigation
- Click on species card → Open Animals List Modal
- Navigate to Animal Details: `/housing/animals/[animal_id]`
- Navigate to Animal List Page with filters

#### RTK Query Hook
```javascript
useGetSpeciesListInfiniteQuery({
  site_id: site_id,
  search: debouncedValue?.trim(),
})
```

---

### 3. Animals Under Treatment Tab

**Screen Key:** `treatment`

**Permission Required:** None (default visible)

#### API Endpoint
```
GET /medical/site-wise-animal-medical-data/{site_id}
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `site_id` | number | Yes | Site ID (in URL) |
| `q` | string | No | Search query |
| `page_no` | number | Yes | Pagination |

#### Response Structure
```json
{
  "success": true,
  "data": {
    "result": [
      {
        "animal_id": 1,
        "animal_name": "Simba",
        "species_name": "Lion",
        "treatment_type": "Medication",
        "status": "active"
      }
    ],
    "total_count": 25
  }
}
```

#### Navigation
- Click on animal card → Navigate to Animal Details

#### RTK Query Hook
```javascript
useGetAnimalTreatmentListInfiniteQuery({
  site_id: site_id,
  q: debouncedValue?.trim(),
})
```

---

### 4. Notes Tab

**Screen Key:** `observation`

**Permission Required:** None (default visible)

#### API Endpoint
```
GET /v1/get-observation-by-type-id
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Site ID |
| `type` | string | Yes | `"site"` |
| `q` | string | No | Search query |
| `page_no` | number | Yes | Pagination |
| `priority` | string | No | Filter by priority (Low, Moderate, High, Critical) |
| `note_type` | string | No | Filter by note type ID |
| `created_by` | string | No | Filter by creator user ID |
| `tagged_to` | string | No | Filter by tagged user ID |

#### Response Structure
```json
{
  "success": true,
  "data": {
    "result": [
      {
        "observation_id": 1,
        "title": "Feeding observation",
        "description": "...",
        "priority": "High",
        "note_type": "Behavioral",
        "created_by": "John Doe",
        "created_at": "2024-01-15T10:00:00Z",
        "tagged_users": []
      }
    ],
    "total_count": 50
  }
}
```

#### Filter Options
```javascript
const filterItems = [
  { title: "Note Type", type: "note", subItem: [] }, // Fetch from API
  { title: "Priority", type: "priority", subItem: ["Low", "Moderate", "High", "Critical"] },
  { title: "Noted By", type: "user", subItem: [] }, // Fetch users
  { title: "Tagged To", type: "user", subItem: [] }  // Fetch users
];
```

#### Additional APIs for Filters
- Note Types: `GET /observation/master-type`
- User Listing: `POST /user/listing` with `{ zoo_id, isActive: true }`

#### Navigation
- Click "Add Note" → Navigate to Observation creation screen
- Click on note card → Navigate to `ObservationSummary`

#### RTK Query Hook
```javascript
useGetObservationListInfiniteQuery({
  id: site_id,
  type: "site",
  q: debouncedValue?.trim(),
  priority: filterData?.priority,
  note_type: noteTypeId,
  created_by: filterData?.created_by,
  tagged_to: filterData?.tagged_to,
})
```

---

### 5. Assessment Tab

**Screen Key:** `assessment`

**Permission Required:** None (default visible)

#### API Endpoints

**Get Assessment Types:**
```
GET /v1/assessment/animal/types/{site_id}
```

**Get Assessment Entity Types:**
```
GET /v1/assessment/entity/type/list
```

**Get Measurement Units:**
```
GET /masters/measurement-units
```

#### Request Parameters (Assessment Types)
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Site ID (in URL path) |
| `ref_type` | string | No | Reference type |

#### Response Structure
```json
{
  "success": true,
  "data": {
    "assessment_types": [
      {
        "id": 1,
        "name": "Weight Assessment",
        "entity_type": "animal",
        "measurement_unit": "kg"
      }
    ]
  }
}
```

#### Component
Uses `AssessmentInfo` component with ref for refresh functionality.

#### Navigation
- Click "Add Assessment" → Navigate to `AddAssessmentTypeTemplate`

#### RTK Query Hooks
```javascript
useGetAssessmentTypeListQuery({ id: site_id })
useGetAssessmentEntityTypeListQuery({})
useGetMeasurementUnitListQuery({})
```

---

### 6. Medical Tab

**Screen Key:** `medicalRecord`

**Permission Required:** `medical_records`

#### API Endpoint
```
GET /medical/get-medical-record-statistics
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `site_id` | number | Yes | Site ID |
| `medical` | string | Yes | `"zoo"` |
| `start_date` | string | No | Filter start date (YYYY-MM-DD) |
| `end_date` | string | No | Filter end date (YYYY-MM-DD) |
| `status` | string | No | `"active"` or `"closed"` |

#### Response Structure
```json
{
  "success": true,
  "data": {
    "total_records": 100,
    "active_count": 45,
    "closed_count": 55,
    "categories": {
      "medication": 30,
      "treatment": 25,
      "checkup": 45
    }
  }
}
```

#### Filter Options
- Date Range: Last 7 days, Last 30 days, Custom range
- Status: All, Active, Closed

#### Navigation
- Click on WebView analytics URL (if available)

#### RTK Query Hook
```javascript
useGetMedicalRecordListQuery({
  site_id: site_id,
  medical: "zoo",
  start_date: startDate,
  end_date: endDate,
  status: statusMedicalRecord,
})
```

---

### 7. Animal Transfers Tab

**Screen Key:** `animalTransfers`

**Permission Required:** `approval_move_animal_external`

#### API Endpoint
```
GET /v1/animal/get-transfer-list
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `site_id` | number | Yes | Site ID |
| `filter_type` | string | No | Status filter (see below) |
| `transfer_type` | string | Yes | `"intra"` or `"inter"` |
| `page_no` | number | Yes | Pagination |

#### Transfer Status Filters
```javascript
const TRANSFER_STATUS = [
  { id: -1, name: "Show All", value: "ALL" },
  { id: 0, name: "Awaiting Approval", value: "PENDING" },
  { id: 1, name: "Approved", value: "APPROVED" },
  { id: 2, name: "Rejected", value: "REJECTED" },
  { id: 3, name: "Canceled", value: "CANCELED" },
  { id: 4, name: "Completed", value: "COMPLETED" },
  { id: 5, name: "Allocate", value: "REACHED_DESTINATION" },
  { id: 6, name: "Received Animals", value: "RECEIVED_ANIMALS" },
  { id: 7, name: "Security Checkout Cleared", value: "SECURITY_CHECKOUT_ALLOWED" },
  { id: 8, name: "Security Checkin Cleared", value: "SECURITY_CHECKIN_ALLOWED" }
];
```

#### Sub-Tabs
- **Intra**: Internal transfers within zoo
- **Inter**: External transfers to other organizations

#### Response Structure
```json
{
  "success": true,
  "data": {
    "result": [
      {
        "transfer_id": 1,
        "transfer_type": "intra",
        "status": "PENDING",
        "animals": [],
        "from_enclosure": "Enclosure A",
        "to_enclosure": "Enclosure B",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "total_count": 30
  }
}
```

#### Navigation
- Click on transfer card → Navigate to `ApprovalSummary`

#### RTK Query Hook
```javascript
useGetAnimalTransferListInfiniteQuery({
  site_id: site_id,
  filter_type: transferFilter,
  transfer_type: innerTab, // "intra" or "inter"
})
```

---

### 8. Teams Tab

**Screen Key:** `teams`

**Permission Required:** None, but visibility controlled by setting

**Visibility Condition:**
```javascript
setting?.ANIMAL_TRANSFER_REQUIRES_APPROVAL === true
```

#### API Endpoint
```
GET /get-default-animal-movement-user-list-by-site-id
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `site_id` | number | Yes | Site ID |
| `user_type` | string | Yes | `"transfer_user"` or `"security"` |

#### Sub-Tabs
```javascript
const TEAMS_HEADER_ITEMS = [
  { id: "1", title: "Transfer Team", screen: "team", type: "transfer_user" },
  { id: "2", title: "Security Team", screen: "securityTeam", type: "security" }
];
```

#### Response Structure
```json
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "user_name": "John Doe",
      "role": "Transfer Coordinator",
      "is_approver": true
    }
  ]
}
```

#### Actions
- Add team member → Navigate to `InchargeAndApproverSelect`
- Remove team member

#### RTK Query Hook
```javascript
useGetTransferTeamListQuery({
  site_id: site_id,
  user_type: selectedSubTabItem?.type ?? "transfer_user",
})
```

---

### 9. Media Tab

**Screen Key:** `media`

**Permission Required:** None (default visible)

#### API Endpoint
```
GET /zoos/all-type-media-list
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ref_type` | string | Yes | `"site"` |
| `ref_id` | number | Yes | Site ID |
| `filter_type` | string | Yes | `"image"`, `"document"`, or `"video"` |
| `page_no` | number | Yes | Pagination |

#### Sub-Tabs
```javascript
const MEDIA_HEADER_ITEMS = [
  { id: "1", title: "Images", screen: "images" },
  { id: "2", title: "Documents", screen: "documents" },
  { id: "3", title: "Videos", screen: "videos" }
];
```

#### Response Structure
```json
{
  "success": true,
  "data": {
    "result": [
      {
        "media_id": 1,
        "file_url": "https://...",
        "file_type": "image",
        "file_name": "photo.jpg",
        "uploaded_at": "2024-01-15T10:00:00Z",
        "uploaded_by": "John Doe"
      }
    ],
    "total_count": 100
  }
}
```

#### Additional APIs
- **Add Media:** `POST /zoos/all-type-add-media` (multipart/form-data)
- **Delete Media:** `POST /zoos/all-type-delete-media`

#### RTK Query Hook
```javascript
useGetMediaListInfiniteQuery({
  ref_type: "site",
  ref_id: site_id,
  filter_type: type_of, // "image", "document", "video"
})
```

---

### 10. Config Tab

**Screen Key:** `config`

**Permission Required:** `lab_test_mapping`

**Visibility Condition:**
```javascript
setting?.LAB_LIMS_REQUIRED !== true && permission["lab_test_mapping"]
```

#### Sub-Tabs
```javascript
const CONFIG_HEADER_ITEMS = [
  { id: "1", title: "Lab Config", screen: "labConfig" },
  { id: "2", title: "Pharmacy Config", screen: "pharmacyConfig" }
];
```

#### API Endpoints
These would be site-specific lab and pharmacy configuration APIs.

#### Navigation
- Lab configuration management
- Pharmacy configuration management

---

### 11. Users Tab

**Screen Key:** `permissions`

**Permission Required:** None (default visible)

#### API Endpoint
```
GET /get-userswith-access
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Site ID |
| `type` | string | Yes | `"site"` |
| `search` | string | No | Search query |
| `page_no` | number | Yes | Pagination |

#### Response Structure
```json
{
  "success": true,
  "data": {
    "result": [
      {
        "user_id": 1,
        "user_name": "John Doe",
        "role": "Site Manager",
        "email": "john@example.com",
        "access_level": "full"
      }
    ],
    "total_count": 20
  }
}
```

#### Additional API - Login History
```
GET /get-user-login-data
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | number | Yes | User ID |
| `page_no` | number | Yes | Pagination |

#### Navigation
- Click on user card → Show login history modal

#### RTK Query Hook
```javascript
useGetUserWithAccessListInfiniteQuery({
  id: site_id,
  type: "site",
  search: debouncedValue?.trim(),
})
```

---

### 12. Incharges Tab

**Screen Key:** `incharges`

**Permission Required:** None (default visible)

#### API Endpoint
```
GET /get-incharge-list
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ref_id` | number | Yes | Site ID |
| `ref_type` | string | Yes | `"site"` |

#### Response Structure
```json
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "user_name": "John Doe",
      "designation": "Site Incharge",
      "mobile_no": "+1234567890",
      "email": "john@example.com"
    }
  ]
}
```

#### Additional API - Add Incharge
```
POST /add-incharge
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ref_id` | number | Yes | Site ID |
| `ref_type` | string | Yes | `"site"` |
| `user_ids` | array | Yes | Array of user IDs |

#### Navigation
- Click "Add Incharge" → Navigate to `InchargeAndApproverSelect`

#### RTK Query Hook
```javascript
useGetInchargeListQuery({
  ref_id: site_id,
  ref_type: "site",
})
```

---

### 13. Mortality Tab

**Screen Key:** `Mortality`

**Permission Required:** `access_mortality_module`

#### API Endpoint
```
GET /animal/get-mortality-listing-type-wise
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `site_id` | number | Yes | Site ID |
| `type` | string | Yes | `"animals"` |
| `page_no` | number | Yes | Pagination |

#### Response Structure
```json
{
  "success": true,
  "data": {
    "result": [
      {
        "animal_id": 1,
        "animal_name": "Simba",
        "species_name": "Lion",
        "death_date": "2024-01-15",
        "cause_of_death": "Natural causes",
        "necropsy_status": "completed"
      }
    ],
    "total_count": 15
  }
}
```

#### Navigation
- Click on mortality record → Navigate to Animal Details (Mortality tab)

#### RTK Query Hook
```javascript
useGetMortalityRecordListInfiniteQuery({
  site_id: site_id,
  type: "animals",
})
```

---

### 14. Food Wastage Tab

**Screen Key:** `foodWastage`

**Permission Required:** None (default visible)

#### API Endpoint
```
GET /v1/site/food/wastage
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `site_id` | number | Yes | Site ID |
| `from_date` | string | Yes | Start date (YYYY-MM-DD) |
| `to_date` | string | Yes | End date (YYYY-MM-DD) |
| `limit` | number | Yes | Items per page (10 for list, 50 for graph) |
| `filter` | string | Yes | `"ASC"` or `"DESC"` |
| `is_graph` | number | No | `1` for graph data, `0` for list |
| `page_no` | number | Yes | Pagination |

#### Response Structure
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "wastage_date": "2024-01-15",
        "total_wastage": 25.5,
        "unit": "kg",
        "total_entry": 5,
        "entries": [
          {
            "wastage_quantity": 5.5,
            "unit": "kg",
            "wastage_date": "2024-01-15T10:00:00Z"
          }
        ]
      }
    ],
    "total": 30,
    "graphlist": [] // For graph view
  }
}
```

#### Date Range Filters
```javascript
const dateFilterFoodWastage = [
  { id: 1, name: "This Week", label: "This Week" },
  { id: 2, name: "This Month", label: "This Month" },
  { id: 3, name: "Three Months", label: "3 Months" },
  { id: 4, name: "Six Months", label: "6 Months" },
  { id: 5, name: "calendorIcon" } // Custom date picker
];
```

#### View Modes
- **List View**: Tabular display of wastage data
- **Graph View**: Visual chart representation

#### RTK Query Hook
```javascript
useGetFoodWastageDataListInfiniteQuery({
  site_id: site_id,
  from_date: formattedStartDate,
  to_date: formattedEndDate,
  limit: listOrGraphData === "List" ? 10 : 50,
  filter: siteFoodWastageListFilter ? "ASC" : "DESC",
  is_graph: listOrGraphData === "List" ? 0 : 1,
})
```

---

### 15. Hospital Transfer Tab

**Screen Key:** `hospitalTransfer`

**Permission Required:** `approval_move_animal_external`

#### API Endpoint
Uses common transfer list API with hospital-specific filters.

#### Sub-Tabs
```javascript
const HOSPITAL_HEADER_ITEMS = [
  { id: 0, title: "Pending", screen: "pending", key: "pending" },
  { id: 1, title: "In Transit", screen: "inTransit", key: "intransit" },
  { id: 2, title: "Accepted", screen: "accepted", key: "completed" },
  { id: 3, title: "Cancelled", screen: "cancelled", key: "cancelled" },
  { id: 4, title: "Rejected", screen: "rejected", key: "rejected" }
];
```

#### Response includes counts for each status in tab titles.

---

## API Constants

```javascript
// Base API endpoints for Site Details
const API_CONSTANTS = {
  // Section
  getSectionListApi: "get-site-wise-section-list",

  // Species
  getSpeciesListApi: "v1/species/listing",

  // Treatment
  getAnimalTreatmentListApi: "medical/site-wise-animal-medical-data",

  // Notes/Observation
  getObservationListApi: "v1/get-observation-by-type-id",
  observationMasterTypeList: "observation/master-type",

  // Medical
  getMedicalRecordListApi: "medical/get-medical-record-statistics",

  // Animal Transfer
  getAnimalTransferListApi: "v1/animal/get-transfer-list",

  // Teams
  getTransferTeamListApi: "get-default-animal-movement-user-list-by-site-id",

  // Media
  getMediaListApi: "zoos/all-type-media-list",
  zoosAddMedia: "zoos/all-type-add-media",
  zoosDeleteMedia: "zoos/all-type-delete-media",

  // Users
  getUserWithAccessListApi: "get-userswith-access",
  getUserLoginHistoryApi: "get-user-login-data",

  // Incharges
  getInchargeListApi: "get-incharge-list",
  addInchargeApi: "add-incharge",

  // Mortality
  getMortalityListApi: "animal/get-mortality-listing-type-wise",

  // Food Wastage
  getFoodWastageDataListApi: "v1/site/food/wastage",

  // Assessment
  getAssessmentTypeListApi: "v1/assessment/animal/types",
  getAssessmentEntityTypeListApi: "v1/assessment/entity/type/list",
  getMeasurementUnitListApi: "masters/measurement-units",

  // Site Details
  getSiteDetailsApi: "zoos/getZooSite/",
};
```

---

## Navigation Routes

| Action | Route | Parameters |
|--------|-------|------------|
| Section Details | `/housing/sections/[id]` | `section_id` |
| Enclosure Details | `/housing/enclosure/[id]` | `enclosure_id` |
| Animal Details | `/housing/animals/[id]` | `animal_id` |
| Add Observation | `/observation/create` | `SiteEntity`, `onGoBackData` |
| Observation Summary | `/observation/[id]` | `observation_id` |
| Add Assessment Template | `/assessment/template/create` | `site_id`, `ref_type` |
| Approval Summary | `/transfers/[id]` | `transfer_id` |
| User Selection | `/users/select` | `type`, `existingUsers` |
| Animal List Page | `/animals` | Various filters |

---

## Settings Dependencies

```javascript
// Check these settings before rendering certain tabs
const settings = {
  // If true, show Teams tab
  ANIMAL_TRANSFER_REQUIRES_APPROVAL: boolean,

  // If true, show Security Team sub-tab
  ANIMAL_TRANSFER_REQUIRES_SECURITY_APPROVAL: boolean,

  // If true, hide Config tab
  LAB_LIMS_REQUIRED: boolean,
};
```

---

## Implementation Checklist

### Phase 1: High Priority Tabs
- [ ] Notes Tab
  - [ ] List component with filters
  - [ ] Add note functionality
  - [ ] Note type filtering
  - [ ] Priority filtering
  - [ ] User filtering (Noted By, Tagged To)

- [ ] Assessment Tab
  - [ ] Assessment Info component
  - [ ] Add assessment template navigation

- [ ] Medical Tab
  - [ ] Medical stats display
  - [ ] Date range filtering
  - [ ] Status filtering (Active/Closed)

- [ ] Food Wastage Tab
  - [ ] List view component
  - [ ] Graph view component
  - [ ] Date range filters
  - [ ] Sort order toggle

### Phase 2: Medium Priority Tabs
- [ ] Animal Transfers Tab
  - [ ] Transfer list component
  - [ ] Status filtering
  - [ ] Intra/Inter sub-tabs

- [ ] Teams Tab
  - [ ] Transfer Team sub-tab
  - [ ] Security Team sub-tab
  - [ ] Add/Remove team members

- [ ] Users Tab
  - [ ] Users list component
  - [ ] Login history modal
  - [ ] Search functionality

- [ ] Incharges Tab
  - [ ] Incharges list component
  - [ ] Add incharge functionality

### Phase 3: Low Priority Tabs
- [ ] Config Tab
  - [ ] Lab Config sub-tab
  - [ ] Pharmacy Config sub-tab

- [ ] Hospital Transfer Tab
  - [ ] Status-based sub-tabs
  - [ ] Transfer management

---

## Notes

1. **Pagination**: All list endpoints support infinite scroll pagination with `page_no` parameter.
2. **Search**: Most list endpoints support search via `q` or `search` parameter.
3. **Refresh**: Each tab should handle refresh control for data refetching.
4. **Loading States**: Implement skeleton loaders for better UX.
5. **Error Handling**: Handle API errors gracefully with user feedback.
6. **Permission Checks**: Always verify permissions before rendering tabs.
7. **Settings Checks**: Verify settings before showing conditional tabs.
