# API Parameters Quick Reference Guide
## Antz Web Dashboard

### NECROPSY LIST ENDPOINTS

#### Animal-Wise List
```
GET /v2/species-wise-necropsy-list
Query: page_no, limit, q, from_date, to_date, status, necropsy_center_id, 
       use_case, site_id, priority, sex_type, necropsy_on_site, 
       necropsy_conducted_by, created_by
```

#### Species-Wise List  
```
GET /v2/species-wise-necropsy
Query: page_no, limit, q, from_date, til_date, status, necropsy_center_id, site_id, priority
```

#### Stats
```
GET /v2/necropsy/stats
Query: necropsy_center_id(required), from_date, til_date, type, use_case
Returns: incoming_count, pending_count, draft_count, completed_count, transfer_count
```

---

### NECROPSY OPERATIONS

#### Add Necropsy
```
POST /v2/animal/necropsy/add (multipart/form-data)
Required: animal_id, necropsy_center_id
Optional: necropsy_date, manner_of_death_id, carcass_disposition_id, 
          gross_findings, weight, weight_unit_id, organs[], attachments[]
```

#### Edit Necropsy
```
POST /v2/animal/necropsy/edit (multipart/form-data)
Required: necropsy_id, animal_id, necropsy_center_id
Optional: Same as Add
```

#### Delete Necropsy
```
POST /v2/delete/animal/necropsy (multipart/form-data)
Required: necropsy_id
Optional: reason
```

#### Get Summary
```
GET /v2/necropsy/summary/{necropsyId}
Path: necropsyId (required)
```

---

### TRANSFER OPERATIONS

#### Get Transfer Summary
```
GET /v1/get-transfer-summary
Query: transfer_id (required)
```

#### Get Checklist Details
```
GET /v1/request/{transferId}/activity
Path: transferId (required)
Query: entity_type (required)
```

#### Accept Transfer
```
POST /v1/transfer/update-btn-status/{transferId} (multipart/form-data)
Path: transferId (required)
Body: status ('COMPLETED'|'REJECTED'), reason
```

#### Get Transfer Animals
```
GET /v1/transfer/get-animal-list/{transferId}
Path: transferId (required)
Query: page_no, limit, q, status
```

---

### NECROPSY TEMPLATES

#### Get Templates
```
GET /v2/get-template-necropsy
Returns: Array of templates
```

#### Create Template
```
POST /v2/create-necropsy-template (application/json)
Required: template_name
Optional: description, is_default, body_parts[]
```

#### Update Template
```
POST /v2/update-template/{templateId} (multipart/form-data)
Path: templateId (required)
Body: Same as Create
```

#### Delete Template
```
POST /v2/delete-necropsy-template/{templateId} (application/json)
Path: templateId (required)
Body: {} (empty)
```

---

### MEDICAL RECORDS

#### Get Records by Animal
```
GET /medical/v2/{animalId}/basic-data-list
Path: animalId (required)
Query: page_no, limit, q, from_date, to_date
```

#### Get Medical Stats
```
GET /medical/get-medical-record-statistics
Query: animal_id, from_date, to_date
```

#### Get Common Data
```
GET /medical/v2/{animalId}/get-medical-common-data-v2
Path: animalId (required)
Query: page_no, limit, from_date, to_date
```

#### Get Lab Requests
```
GET /medical/get-lab-test-request-status-wise-new
Query: animal_id, mortality_id, till_date, type, page_no, limit, status, purpose
```

#### Get Assessment Types
```
GET /v1/assessment/animal/types/{animalId}
Path: animalId (required)
```

#### Get Assessment Data
```
GET /v1/assessment/animal/defaultValue/{animalId}
Path: animalId (required)
Query: type_id, from_date, to_date
```

---

### MASTERS/OPTIONS

#### Manner of Death
```
GET /masters/mannerofDeath
Returns: Array of {id, string_id, name, label, value}
```

#### Carcass Disposition
```
GET /masters/carcassDisposition
Returns: Array of options (same structure as above)
```

#### Measurement Units
```
GET /masters/measurement-units
Returns: Array of units
```

#### Body Parts
```
POST /v1/animal/necropsy/bodyparts (application/json)
Optional Body: species_id, taxonomy_id
Returns: Array of body parts
```

---

### NECROPSY CENTER MANAGEMENT

#### Get Centers
```
GET /v1/entity/types/withUserPermission/{userId}/necropsy_centre
Query: q, has_permission
```

#### Add/Update Center
```
POST /v1/entity/types/{status}
POST /v1/entity/types/{status}/{necropsyId}
Path: status ('add'|'update'|'active'|'inactive'), necropsyId (for update)
Body: name(required), code, address, site_id, contact_person, 
      contact_number, email, is_active
```

---

### CARCASS TRANSFERS

#### Get Transfer List
```
GET /v1/get-transfer-list
Query: page_no, limit, q, necropsy_center_id, reference_type, transfer_status,
       status, from_date, to_date, start_date, end_date, site_id, entity_type, entity_id
```

#### Add Comment
```
POST /v1/request/comment/create (multipart/form-data)
Required: transfer_id, comment
```

---

### TIMELINE & REPORTS

#### Get Timeline
```
GET /mortality/get-mortality-comments
Query: necropsy_id, animal_id, mortality_id, from_date, to_date, page_no, limit, type
```

#### Get Mortality Summary
```
GET /mortality/summary
Query: mortality_id, necropsy_center_id, site_id, from_date, to_date
```

#### Get PDF Report
```
GET /v2/post-mortem-report-pdf2
Query: necropsy_id (required)
Returns: {pdf_url}
```

#### Get Report
```
GET /medical/report/medical-record-report
Query: animal_ids, enclosure_ids, section_ids, site_ids, medical_record_id
```

---

### COMMON HEADERS
```
Authorization: Bearer {token}
ZooId: {zoo_id}
CurrentTimeZone: {timezone}
Selectedstore: {store_id} (pharmacy only)
```

---

### DATE FORMAT
```
YYYY-MM-DD (ISO format)
Example: 2024-03-15
```

---

### PAGINATION
```
page_no: 1 (1-indexed, not 0-indexed)
limit: 50 (default)
Response includes total_count
```

---

### FILTERS WITH ARRAYS (JSON Stringified)
```
Single value: sex_type: 'Male'
Multiple: sex_type: JSON.stringify(['Male', 'Female'])
Example: '[\"Male\",\"Female\"]'
```

---

### RESPONSE PATTERNS
```
Success with list:
{
  success: true,
  data: {
    result: [],
    total_count: 100
  }
}

Success with object:
{
  success: true,
  data: {object}
}

Success with array:
{
  success: true,
  data: []
}

Error:
{
  success: false,
  message: "Error message"
}
```

---

### STATUS VALUES
```
INCOMING, PENDING, DRAFT, COMPLETED
CARCASS_TRANSFER
```

---

### CONTENT TYPES
```
GET: application/json
POST (JSON): application/json
POST (Upload): multipart/form-data
DELETE: application/json
```

---

### FORM DATA (Multipart) EXAMPLE
```typescript
const form = new FormData()
form.append('animal_id', 123)
form.append('organs[0][organ_id]', 10)
form.append('organs[0][findings]', 'Normal')
form.append('attachments', file1)
form.append('attachments', file2)
```

