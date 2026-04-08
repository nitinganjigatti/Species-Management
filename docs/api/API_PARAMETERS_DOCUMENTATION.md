# Comprehensive API Parameters Documentation
## Antz Web Dashboard - Necropsy & Medical Modules

---

## TABLE OF CONTENTS
1. [API Call Infrastructure](#api-call-infrastructure)
2. [Necropsy Module APIs](#necropsy-module-apis)
3. [Medical Records Module APIs](#medical-records-module-apis)
4. [Common Patterns](#common-patterns)

---

## API CALL INFRASTRUCTURE

### Base Configuration
- **Base URL**: `process.env.NEXT_PUBLIC_API_BASE_URL`
- **ML Operations Base URL**: `process.env.NEXT_PUBLIC_ML_OPERATIONS_BASE_URL`

### HTTP Methods & Content Types
- **axiosGet**: GET requests with `application/json`
- **axiosPost**: POST requests with `application/json`
- **axiosFormPost**: POST requests with `multipart/form-data`
- **axiosDelete**: DELETE requests with `application/json`

### Standard Headers (Added by GetAPIHeader utility)
```
- Authorization: Bearer {token}
- ZooId: {zoo_id}
- CurrentTimeZone: {browser_timezone}
- Selectedstore: {store_id} (only for pharmacy requests)
- Content-Type: application/json or multipart/form-data
```

---

## NECROPSY MODULE APIS

### 1. Get Necropsy Listing (Centers)
**Function**: `getNecropsyListing(params, userId)`
**Method**: GET
**Endpoint**: `v1/entity/types/withUserPermission/{userId}/necropsy_centre`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | No | Search query for centers |
| has_permission | number | No | Filter by permission (typically 1) |

**Response**:
```typescript
{
  status: boolean
  message: string
  data: {
    list: NecropsyCenter[]
  }
}
```

---

### 2. Get Necropsy Stats
**Function**: `getNecropsyStats(params)`
**Method**: GET
**Endpoint**: `v2/necropsy/stats`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| necropsy_center_id | number | Yes | - | ID of necropsy center |
| from_date | string | No | null | Start date (YYYY-MM-DD) |
| til_date | string | No | null | End date (YYYY-MM-DD) |
| type | string | No | - | Filter type: 'animals' \| 'species' |
| use_case | string | No | - | Use case identifier |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: {
      incoming_count: number
      pending_count: number
      draft_count: number
      completed_count: number
      transfer_count: number
    }
  }
}
```

**Mapped to Redux Stats**:
- INCOMING: incoming_count
- PENDING: pending_count
- DRAFT: draft_count
- COMPLETED: completed_count
- CARCASS_TRANSFER: transfer_count

---

### 3. Get Animal-Wise Necropsy List
**Function**: `getAnimalWiseNecropsyList(params)`
**Method**: GET
**Endpoint**: `v2/species-wise-necropsy-list`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page_no | number | No | Page number (1-indexed) |
| limit | number | No | Items per page (default: 50) |
| q | string | No | Search query |
| from_date | string | No | Start date (YYYY-MM-DD) |
| to_date | string | No | End date (YYYY-MM-DD) |
| status | string | No | Filter by status: INCOMING, PENDING, DRAFT, COMPLETED |
| necropsy_center_id | number | No | Center ID filter |
| use_case | string | No | Use case identifier (e.g., 'necropsy_module') |
| site_id | string | No | Site ID (JSON stringified array if multiple) |
| priority | string | No | Priority filter |
| sex_type | string | No | Sex type (JSON stringified array if multiple) |
| necropsy_on_site | string | No | 1 for onsite, 0 for center |
| necropsy_conducted_by | string | No | Conducted by user IDs (JSON stringified array) |
| created_by | string | No | Created by user IDs (JSON stringified array) |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: AnimalNecropsyItem[]
    total_count: number
    page: number
    limit: number
    stats?: Record<string, number>
  }
}
```

---

### 4. Get Species-Wise Necropsy List
**Function**: `getSpeciesWiseNecropsyList(params)`
**Method**: GET
**Endpoint**: `v2/species-wise-necropsy`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page_no | number | No | Page number (1-indexed) |
| limit | number | No | Items per page |
| q | string | No | Search query |
| from_date | string | No | Start date (YYYY-MM-DD) |
| til_date | string | No | End date (YYYY-MM-DD) |
| status | string | No | Filter by status |
| necropsy_center_id | number | No | Center ID filter |
| site_id | number | No | Site ID filter |
| priority | string | No | Priority filter |

**Response**: Same as Animal-Wise list

---

### 5. Get Incoming Necropsy Transfer Summary
**Function**: `getIncomingNecropsyTransferSummary(params)`
**Method**: GET
**Endpoint**: `v1/get-transfer-summary`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| transfer_id | number | Yes | Transfer ID |

**Response**:
```typescript
{
  success: boolean
  data: IncomingNecropsySummary
}
```

---

### 6. Get Incoming Necropsy Checklist Details
**Function**: `getIncomingNecropsyChecklistDetails(params, transferId)`
**Method**: GET
**Endpoint**: `v1/request/{transferId}/activity`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| entity_type | string | Yes | Type of entity |

**Response**:
```typescript
{
  success: boolean
  data: {
    comments: IncomingNecropsyComment[]
    checklist_items: TransferChecklist[]
  }
}
```

---

### 7. Create Incoming Necropsy Summary Comment
**Function**: `createIncomingNecropsySummaryComment(params)`
**Method**: POST (multipart/form-data)
**Endpoint**: `v1/request/comment/create`

**Body Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| transfer_id | number | Yes | Transfer ID |
| comment | string | Yes | Comment text |

**Response**:
```typescript
{
  success: boolean
  message: string
  data?: unknown
}
```

---

### 8. Get Incoming Necropsy Button Status
**Function**: `getIncomingNecropsyBtnStatus(transferId)`
**Method**: GET
**Endpoint**: `v1/transfer/{transferId}/button-status`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| transferId | number | Yes |

**Response**:
```typescript
{
  success: boolean
  data: IncomingNecropsyBtnStatus
}
```

---

### 9. Accept Necropsy Transfer
**Function**: `acceptNecropsyTransfer(transferId, payload)`
**Method**: POST (multipart/form-data)
**Endpoint**: `v1/transfer/update-btn-status/{transferId}`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| transferId | number | Yes |

**Body Parameters**:
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| status | string | No | 'COMPLETED' \| 'REJECTED' |
| reason | string | No | Reason for rejection/action |

**Response**:
```typescript
{
  success: boolean
  message: string
}
```

---

### 10. Get Transfer Animal List
**Function**: `getTransferAnimalList(transferId, params?)`
**Method**: GET
**Endpoint**: `v1/transfer/get-animal-list/{transferId}`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| transferId | number | Yes |

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| page_no | number | No |
| limit | number | No |
| q | string | No |
| status | string | No |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: TransferAnimal[]
    total_count: number
  }
}
```

---

### 11. Get Filled Checklist List
**Function**: `getFilledChecklistList(transferId)`
**Method**: GET
**Endpoint**: `v1/get-field-checklist-list/{transferId}`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| transferId | number | Yes |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: FilledChecklistItem[]
  }
}
```

---

### 12. Get Transfer Checklist
**Function**: `getTransferChecklist()`
**Method**: GET
**Endpoint**: `antz/get-transfer-checklist`

**Response**:
```typescript
{
  success: boolean
  data: {
    result: TransferChecklistItem[]
  }
}
```

---

### 13. Get Necropsy Summary
**Function**: `getNecropsySummary(necropsyId)`
**Method**: GET
**Endpoint**: `v2/necropsy/summary/{necropsyId}`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| necropsyId | number | Yes |

**Response**:
```typescript
{
  success: boolean
  data: NecropsySummary
}
```

---

### 14. Add Necropsy
**Function**: `addNecropsy(payload)`
**Method**: POST (multipart/form-data)
**Endpoint**: `v2/animal/necropsy/add`

**Body Parameters** (FormData):
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| animal_id | number | Yes | Animal ID |
| mortality_id | number | No | Mortality record ID |
| necropsy_center_id | number | Yes | Necropsy center ID |
| necropsy_date | string | No | Date (YYYY-MM-DD) |
| manner_of_death_id | number | No | Manner of death option ID |
| carcass_disposition_id | number | No | Carcass disposition option ID |
| gross_findings | string | No | Gross findings text |
| histopathology_findings | string | No | Histopathology findings |
| final_diagnosis | string | No | Final diagnosis |
| comments | string | No | Additional comments |
| weight | number | No | Animal weight |
| weight_unit_id | number | No | Weight unit ID |
| necropsy_conducted_by | number | No | Conducted by user ID |
| status | string | No | Status (DRAFT, PENDING, COMPLETED) |
| organs[0][organ_id] | number | No | Organ ID |
| organs[0][findings] | string | No | Organ findings |
| organs[0][is_normal] | boolean | No | Is organ normal |
| organs[0][images] | File[] | No | Organ images |
| attachments | File[] | No | Additional attachments |

**Response**:
```typescript
{
  success: boolean
  message: string
  data?: unknown
}
```

---

### 15. Edit Necropsy
**Function**: `editNecropsy(payload)`
**Method**: POST (multipart/form-data)
**Endpoint**: `v2/animal/necropsy/edit`

**Body Parameters**: Same as Add Necropsy with additional:
| Parameter | Type | Required |
|-----------|------|----------|
| necropsy_id | number | Yes |

---

### 16. Delete Necropsy
**Function**: `deleteNecropsy(payload)`
**Method**: POST (multipart/form-data)
**Endpoint**: `v2/delete/animal/necropsy`

**Body Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| necropsy_id | number | Yes |
| reason | string | No |

---

### 17. Get Necropsy Body Parts
**Function**: `getNecropsyBodyParts(payload)`
**Method**: POST (application/json)
**Endpoint**: `v1/animal/necropsy/bodyparts`

**Body Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| species_id | number | No |
| taxonomy_id | string | No |

**Response**:
```typescript
{
  success: boolean
  data: BodyPart[]
}
```

---

### 18. Get Necropsy Template
**Function**: `getNecropsyTemplate()`
**Method**: GET
**Endpoint**: `v2/get-template-necropsy`

**Response**:
```typescript
{
  success: boolean
  data: {
    result: NecropsyTemplate[]
  }
}
```

---

### 19. Create Necropsy Template
**Function**: `createNecropsyTemplate(payload)`
**Method**: POST (application/json)
**Endpoint**: `v2/create-necropsy-template`

**Body Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| template_name | string | Yes | Template name |
| description | string | No | Template description |
| is_default | boolean | No | Set as default template |
| body_parts[0][body_part_id] | number | No | Body part ID |
| body_parts[0][organs] | number[] | No | Organ IDs array |

**Response**:
```typescript
{
  success: boolean
  message: string
  data?: unknown
}
```

---

### 20. Update Necropsy Template
**Function**: `updateNecropsyTemplate(templateId, payload)`
**Method**: POST (multipart/form-data)
**Endpoint**: `v2/update-template/{templateId}`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| templateId | number | Yes |

**Body Parameters**: Same as Create Template

---

### 21. Delete Necropsy Template
**Function**: `deleteNecropsyTemplate(templateId)`
**Method**: POST (application/json)
**Endpoint**: `v2/delete-necropsy-template/{templateId}`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| templateId | number | Yes |

**Body**: Empty object `{}`

---

### 22. Get Necropsy Timeline
**Function**: `getNecropsyTimeline(params)`
**Method**: GET
**Endpoint**: `mortality/get-mortality-comments`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| necropsy_id | number | No | Necropsy ID |
| animal_id | number | No | Animal ID |
| mortality_id | number \| string | No | Mortality ID |
| from_date | string | No | Start date (YYYY-MM-DD) |
| to_date | string | No | End date (YYYY-MM-DD) |
| page_no | number | No | Page number |
| limit | number | No | Items per page |
| type | string | No | Timeline type filter |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: NecropsyTimelineItem[]
    total_count: number
  }
}
```

---

### 23. Get Mortality Summary
**Function**: `getMortalitySummary(params)`
**Method**: GET
**Endpoint**: `mortality/summary`

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| mortality_id | number \| string | No |
| necropsy_center_id | number | No |
| site_id | number | No |
| from_date | string | No |
| to_date | string | No |

**Response**:
```typescript
{
  success: boolean
  data: MortalitySummary
}
```

---

### 24. Get Medical Stats
**Function**: `getMedicalStats(params)`
**Method**: GET
**Endpoint**: `medical/get-medical-record-statistics`

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| animal_id | number \| string | No |
| from_date | string | No |
| to_date | string | No |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: Record<string, number>
  }
}
```

---

### 25. Get Necropsy PDF
**Function**: `getNecropsyPdf(params)`
**Method**: GET
**Endpoint**: `v2/post-mortem-report-pdf2`

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| necropsy_id | number | Yes |

**Response**:
```typescript
{
  success: boolean
  data: {
    pdf_url: string
  }
}
```

---

### 26. Delete Necropsy Attachment
**Function**: `deleteNecropsyAttachment(id, payload)`
**Method**: POST (multipart/form-data)
**Endpoint**: `v2/attachment-media-remove/{id}`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| id | number | Yes |

**Body Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| attachment_type | string | No |
| reason | string | No |

---

### 27. Get Manner of Death
**Function**: `getMannerOfDeath()`
**Method**: GET
**Endpoint**: `masters/mannerofDeath`

**Response**:
```typescript
{
  success: boolean
  data: Array<{
    id: number | string
    string_id: string
    name: string
    label: string
    value: string | number
  }>
}
```

---

### 28. Get Carcass Disposition
**Function**: `getCarcassDisposition()`
**Method**: GET
**Endpoint**: `masters/carcassDisposition`

**Response**: Similar to Manner of Death

---

### 29. Get Carcass Transfer List
**Function**: `getCarcassTransferList(params)`
**Method**: GET
**Endpoint**: `v1/get-transfer-list`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page_no | number | No | Page number |
| limit | number | No | Items per page |
| q | string | No | Search query |
| necropsy_center_id | number \| string | No | Center ID |
| reference_type | string | No | Reference type |
| transfer_status | string | No | Transfer status |
| status | string | No | Status filter |
| from_date | string | No | Start date (YYYY-MM-DD) |
| to_date | string | No | End date (YYYY-MM-DD) |
| start_date | string | No | Alternative start date |
| end_date | string | No | Alternative end date |
| site_id | number | No | Site ID |
| entity_type | string | No | Entity type |
| entity_id | number \| string | No | Entity ID |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: CarcassTransfer[]
    total_count: number
    page: number
    limit: number
  }
}
```

---

### 30. Get Measurement Units
**Function**: `getMeasurementUnits()`
**Method**: GET
**Endpoint**: `masters/measurement-units`

**Response**:
```typescript
{
  success: boolean
  data: MeasurementUnit[]
}
```

---

### 31. Add/Update Necropsy Center
**Function**: `addUpdateNecropsyCenter(payload, status, necropsyId?)`
**Method**: POST (application/json)
**Endpoint**: 
- Create: `v1/entity/types/{status}`
- Update: `v1/entity/types/{status}/{necropsyId}`

**Path Parameters**:
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| status | string | Yes | 'add', 'update', 'active', 'inactive' |
| necropsyId | number | No | Required for update |

**Body Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| name | string | Yes |
| code | string | No |
| address | string | No |
| site_id | number \| string | No |
| contact_person | string | No |
| contact_number | string | No |
| email | string | No |
| is_active | boolean \| number | No |

**Response**:
```typescript
{
  success: boolean
  message: string
  data?: unknown
}
```

---

## MEDICAL RECORDS MODULE APIS

### 1. Get Medical Records by Animal
**Function**: `getMedicalRecordsByAnimal(animalId, params)`
**Method**: GET
**Endpoint**: `medical/v2/{animalId}/basic-data-list`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| animalId | string \| number | Yes |

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| page_no | number | No |
| limit | number | No |
| q | string | No |
| from_date | string | No |
| to_date | string | No |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: MedicalRow[]
    total_count: number
  }
}
```

---

### 2. Get Medical Record Report
**Function**: `getMedicalRecordReport(params)`
**Method**: GET
**Endpoint**: `medical/report/medical-record-report`

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| animal_ids | string \| number | No |
| enclosure_ids | string \| number | No |
| section_ids | string \| number | No |
| site_ids | string \| number | No |
| medical_record_id | string \| number | No |

**Response**:
```typescript
{
  success: boolean
  data: {
    pdf_url: string
  }
}
```

---

### 3. Get Medical Record Stats
**Function**: `getMedicalRecordStats(params)`
**Method**: GET
**Endpoint**: `medical/get-medical-record-statistics`

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| animal_id | number \| string | No |
| medical | string | No |
| purpose | string | No |
| till_date | string | No |
| mortality_id | number \| string | No |

**Response**:
```typescript
{
  success: boolean
  message: string
  data: {
    medical_record_count: number
    diagnosis_count: number
    prescription_count: number
    lab_request_count: number
    [key: string]: number
  }
}
```

---

### 4. Get Medical Basic Data List
**Function**: `getMedicalBasicDataList(animalId, params?)`
**Method**: GET
**Endpoint**: `medical/v2/{animalId}/basic-data-list`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| animalId | number | Yes |

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| page_no | number | No |
| limit | number | No |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: MedicalBasicData[]
  } | MedicalBasicData[]
}
```

---

### 5. Get Medical Common Data (Clinical Assessments)
**Function**: `getMedicalCommonData(animalId, params?)`
**Method**: GET
**Endpoint**: `medical/v2/{animalId}/get-medical-common-data-v2`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| animalId | number | Yes |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page_no | number | No | Page number |
| limit | number | No | Items per page |
| from_date | string | No | Start date (YYYY-MM-DD) |
| to_date | string | No | End date (YYYY-MM-DD) |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: MedicalRecord[]
    active: string | number
    closed: string | number
    all: string | number
  }
}
```

---

### 6. Get Lab Requests by Animal
**Function**: `getLabRequestsByAnimal(params)`
**Method**: GET
**Endpoint**: `medical/get-lab-test-request-status-wise-new`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| animal_id | number \| string | No | Animal ID |
| mortality_id | number \| string | No | Mortality ID |
| till_date | string | No | End date |
| type | string | No | Lab type |
| page_no | number | No | Page number |
| limit | number | No | Items per page |
| status | string | No | Request status |
| purpose | string | No | Request purpose |

**Response**:
```typescript
{
  success: boolean
  data: PaginatedData<LabRequest> | LabRequest[]
}
```

---

### 7. Get Assessment Types
**Function**: `getAssessmentTypes(animalId)`
**Method**: GET
**Endpoint**: `v1/assessment/animal/types/{animalId}`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| animalId | number | Yes |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: AssessmentType[]
  }
}
```

---

### 8. Get Assessment Data
**Function**: `getAssessmentData(animalId, params?)`
**Method**: GET
**Endpoint**: `v1/assessment/animal/defaultValue/{animalId}`

**Path Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| animalId | number | Yes |

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| type_id | number | No |
| from_date | string | No |
| to_date | string | No |

**Response**:
```typescript
{
  success: boolean
  data: {
    result: AssessmentData[]
  }
}
```

---

### 9. Get Medical Record Details
**Function**: `getMedicalRecordDetails(medicalRecordId)`
**Method**: GET
**Endpoint**: `medical/v2/details`

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| medical_record_id | number | Yes |
| include_all_animals | number | No |

**Response**:
```typescript
{
  success: boolean
  data: MedicalRecord
}
```

---

### 10. Get Medical Journal Logs
**Function**: `getMedicalJournalLogs(params)`
**Method**: GET
**Endpoint**: `journal/animal-logs`

**Query Parameters**:
| Parameter | Type | Required |
|-----------|------|----------|
| animal_id | number | No |
| medical_record_id | number | No |
| page | number | No |
| page_no | number | No |
| limit | number | No |
| from_date | string | No |
| to_date | string | No |

**Response**:
```typescript
{
  success: boolean
  data: {
    data: MedicalJournalLog[]
    result?: MedicalJournalLog[]
    total_count: number
  }
}
```

---

## COMMON PATTERNS

### 1. Pagination Pattern
**Default Values**:
```typescript
{
  page_no: 1,          // 1-indexed
  limit: 50            // Default items per page
}
```

**Grid Pagination to API Mapping**:
```typescript
// MUI DataGrid: 0-indexed
// API: 1-indexed
apiPage = (gridPage + 1)
```

---

### 2. Date Format Pattern
**Input Format**: `YYYY-MM-DD` (ISO format)
**Transformation**:
```typescript
formatDate(dateValue: string | Date | null): string | null {
  if (!dateValue) return null
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  return date.toISOString().split('T')[0]
}
```

---

### 3. Array Parameters Pattern
**JSON Stringified Arrays** (for multi-select filters):
```typescript
// Single value
sex_type: 'Male'

// Multiple values (JSON stringified)
sex_type: JSON.stringify(['Male', 'Female'])
necropsy_conducted_by: JSON.stringify([1, 2, 3])
```

---

### 4. Filter Construction Pattern
**Base Payload** (Animal/Species-wise lists):
```typescript
{
  page_no: filters.page,
  limit: filters.limit,
  q: filters.q,
  from_date: formatDate(filterDate.startDate),
  til_date: formatDate(filterDate.endDate),  // Note: til_date for species
  to_date: formatDate(filterDate.endDate),   // Note: to_date for animals
  status: activeCard,
  necropsy_center_id: selectedNecropsy?.id,
  use_case: 'necropsy_module'
}
```

---

### 5. Form Data Pattern (Multipart Upload)
**Add Necropsy Example**:
```typescript
const formData = new FormData()
formData.append('animal_id', animalId)
formData.append('necropsy_center_id', centerId)
formData.append('gross_findings', findings)

// Array items
organs.forEach((organ, index) => {
  formData.append(`organs[${index}][organ_id]`, organ.organ_id)
  formData.append(`organs[${index}][findings]`, organ.findings)
  organ.images.forEach((image) => {
    formData.append(`organs[${index}][images]`, image)
  })
})

// Multiple files
attachments.forEach((file) => {
  formData.append('attachments', file)
})
```

---

### 6. Response Structure Patterns

**Success Response with Pagination**:
```typescript
{
  success: true,
  data: {
    result: Item[],
    total_count: number,
    page?: number,
    limit?: number
  }
}
```

**Success Response with Direct Data**:
```typescript
{
  success: true,
  data: {
    list: Item[],
    [otherField]: value
  }
}
```

**Direct Array Response**:
```typescript
{
  success: true,
  data: Item[]
}
```

---

### 7. Error Handling Pattern
**Error Structure**:
```typescript
{
  success: false,
  message: string,
  error?: string,
  code?: string | number
}
```

**Catch Block Pattern**:
```typescript
catch (error) {
  const err = error as Error
  return { success: false, message: err.message || 'Failed to fetch' }
}
```

---

### 8. Form Validation Patterns

**Necropsy Center Form** (Add/Edit):
```typescript
{
  name: string (required, 2-100 chars)
  description: string (optional, max 500 chars)
  site_id: number (optional)
  code: string (optional)
  address: string (optional)
  contact_person: string (optional)
  contact_number: string (optional)
  email: string (optional)
  is_active: boolean | number (optional)
}
```

---

## USAGE EXAMPLES

### Example 1: Fetch Necropsy List with Filters
```typescript
const params: AnimalWiseListParams = {
  page_no: 1,
  limit: 50,
  q: 'search term',
  from_date: '2024-01-01',
  to_date: '2024-12-31',
  status: 'COMPLETED',
  necropsy_center_id: 5,
  site_id: JSON.stringify([1, 2, 3]),
  sex_type: JSON.stringify(['Male', 'Female']),
  necropsy_on_site: '1'
}

const response = await getAnimalWiseNecropsyList(params)
```

### Example 2: Add Necropsy with Organs
```typescript
const payload: AddNecropsyPayload = {
  animal_id: 123,
  necropsy_center_id: 5,
  necropsy_date: '2024-03-15',
  manner_of_death_id: 1,
  weight: 45.5,
  weight_unit_id: 1,
  gross_findings: 'Findings text',
  organs: [
    {
      organ_id: 10,
      findings: 'Normal appearance',
      is_normal: true,
      images: [file1, file2]
    }
  ],
  attachments: [reportFile]
}

const response = await addNecropsy(payload)
```

### Example 3: Get Medical Records with Pagination
```typescript
const params: MedicalRecordsParams = {
  page_no: 1,
  limit: 25,
  q: 'diagnosis',
  from_date: '2024-01-01',
  to_date: '2024-03-31'
}

const animalId = 456
const response = await getMedicalRecordsByAnimal(animalId, params)
```

---

## KEY NOTES

1. **Date Handling**: Always use YYYY-MM-DD format for API calls
2. **Pagination**: API uses 1-indexed pages, MUI DataGrid uses 0-indexed
3. **JSON Stringified Arrays**: Multi-select filters are JSON stringified
4. **FormData**: Multipart uploads use FormData API for file attachments
5. **Headers**: Authorization and ZooId headers are automatically added
6. **Search**: Query parameter 'q' is used for full-text search
7. **Filtering**: Status filters use specific values (INCOMING, PENDING, etc.)
8. **Date Fields**: Different endpoints use 'til_date' vs 'to_date' - check specific endpoint

---

Generated: 2024
Module: Necropsy & Medical Records
