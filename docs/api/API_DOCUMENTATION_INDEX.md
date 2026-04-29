# API Documentation - Index

## Overview
This directory contains comprehensive documentation for all API endpoints used in the Antz Web Dashboard Necropsy and Medical Records modules.

## Documentation Files

### 1. API_QUICK_REFERENCE.md
**Purpose**: Quick lookup guide for developers
**Size**: ~6 KB
**Best For**: Finding specific endpoints quickly, checking parameter names, remembering common patterns

**Sections**:
- Necropsy List Endpoints
- Necropsy Operations
- Transfer Operations
- Templates
- Medical Records
- Masters/Options
- Common Headers & Patterns

**Use When**: You need to quickly find an endpoint or parameter name

---

### 2. API_PARAMETERS_DOCUMENTATION.md
**Purpose**: Comprehensive, detailed reference documentation
**Size**: ~28 KB
**Best For**: Understanding full API specifications, parameter details, response structures, usage examples

**Sections**:
- API Call Infrastructure
- 31 Necropsy Module Endpoints (fully documented)
- 10 Medical Records Module Endpoints (fully documented)
- Common Patterns & Best Practices
- Usage Examples
- Key Notes

**Features**:
- Request method and content type
- Path parameters with details
- Query parameters (type, required, description)
- Body parameters for POST requests
- Complete response structures
- Code examples
- Parameter relationships

**Use When**: Implementing new features, understanding response formats, needing detailed examples

---

### 3. API_DOCUMENTATION_SUMMARY.txt
**Purpose**: Summary of the documentation extraction process and key findings
**Size**: ~7 KB
**Best For**: Understanding what was analyzed, key patterns discovered, methodology used

**Sections**:
- Deliverables Created
- Analysis Summary
- API Infrastructure Details
- Parameter Patterns Identified
- Key Discoveries
- Code Locations Analyzed
- Usage Recommendations
- Maintenance Notes

**Use When**: Onboarding new developers, understanding the API landscape, reviewing what's documented

---

## How to Use These Documents

### Scenario 1: Quick Parameter Lookup
1. Open **API_QUICK_REFERENCE.md**
2. Find your endpoint in the relevant section
3. Check parameter names and types

### Scenario 2: Building a New Feature
1. Read **API_QUICK_REFERENCE.md** to identify the endpoint
2. Open **API_PARAMETERS_DOCUMENTATION.md** for full details
3. Use the code examples provided

### Scenario 3: Understanding Response Format
1. Open **API_PARAMETERS_DOCUMENTATION.md**
2. Find your endpoint
3. Look at the "Response" section with TypeScript types

### Scenario 4: Implementing Complex Filtering
1. Consult **API_PARAMETERS_DOCUMENTATION.md**
2. Check the "Common Patterns" section
3. Review examples for similar endpoints
4. See "USAGE EXAMPLES" section for full implementation

---

## Quick Navigation

### Necropsy Endpoints (31 Total)
**Listing**:
- Get Necropsy Listing (Centers) - with userId and search
- Get Necropsy Stats - returns counts by status
- Get Animal-Wise List - paginated, filterable
- Get Species-Wise List - paginated, filterable

**Operations**:
- Add/Edit/Delete Necropsy - with organs and attachments
- Get Necropsy Summary - by necropsyId

**Transfers**:
- Get Transfer Summary - by transferId
- Get Checklist Details - transfer requirements
- Accept Transfer - complete or reject
- Get Transfer Animals - paginated list

**Templates**:
- Get Templates
- Create/Update/Delete Template

**Master Data**:
- Manner of Death
- Carcass Disposition
- Measurement Units
- Body Parts

**Centers**:
- Get Centers
- Add/Update Centers

**Reporting**:
- Get Timeline
- Get Mortality Summary
- Get Medical Stats
- Get PDF Report

### Medical Records Endpoints (10 Total)
- Get Records by Animal
- Get Medical Report
- Get Medical Stats
- Get Basic Data List
- Get Common Data (Clinical Assessments)
- Get Lab Requests
- Get Assessment Types
- Get Assessment Data
- Get Record Details
- Get Journal Logs

---

## Key Patterns

### Date Handling
```
Format: YYYY-MM-DD
Fields: from_date, to_date, til_date
Note: til_date used in some endpoints, to_date in others
```

### Pagination
```
API uses 1-indexed pages (page_no starts at 1)
Frontend DataGrid uses 0-indexed (starts at 0)
Conversion: apiPage = gridPage + 1
Default limit: 50
```

### Multi-Select Filters
```
Single: sex_type: 'Male'
Multiple: sex_type: JSON.stringify(['Male', 'Female'])
```

### File Uploads
```
Method: multipart/form-data
Format: FormData with nested indexing
Example: organs[0][organ_id], organs[0][images]
```

### Response Structure
```
Success: {success: true, data: {...}}
Error: {success: false, message: "..."}
Pagination: {success: true, data: {result: [], total_count: number}}
```

---

## Common Tasks

### Add a New Endpoint
1. Add constants to `src/constants/ApiConstant.js`
2. Create TypeScript interfaces in `src/types/`
3. Create API function in `src/lib/api/`
4. Update both documentation files
5. Create Redux slice if needed
6. Document in both markdown files

### Update Existing Endpoint
1. Verify changes in API implementation
2. Update TypeScript types
3. Update response structures in docs
4. Update examples if parameters changed
5. Add migration note to summary

### Debug API Call
1. Check quick reference for parameter names
2. Review full documentation for required fields
3. Look at component usage examples
4. Check Redux slice for filter construction
5. Verify date formatting

---

## Related Files in Codebase

### API Implementation
- `src/lib/api/necropsy/index.ts` - All necropsy endpoints
- `src/lib/api/medical/records.ts` - Medical records endpoints
- `src/lib/api/necropsy/medicalHistory.ts` - Medical history in necropsy
- `src/lib/api/utility/index.js` - HTTP client utilities

### Type Definitions
- `src/types/necropsy/api.ts` - Necropsy API types
- `src/types/medical/api.ts` - Medical API types

### Constants
- `src/constants/ApiConstant.js` - API endpoints (1100+ lines)
- `src/constants/medical-module/medicalApiConstants.ts` - Medical constants

### State Management
- `src/store/slices/necropsy/necropsySlice.ts` - Redux for necropsy

### Hooks
- `src/hooks/necropsy/useNecropsyList.ts` - List data hook
- `src/hooks/necropsy/useNecropsyCenter.ts` - Center selection hook

### Components
- `src/components/necropsy/NecropsyFilterDrawer.tsx` - Filter UI
- `src/components/necropsy/AddnecropsyCenterDrawer.tsx` - Add center UI
- `src/components/medical/medicalRecords/MedicalRecord.tsx` - Medical records UI

---

## Authentication & Headers

All requests automatically include:
```
Authorization: Bearer {token}
ZooId: {zoo_id}
CurrentTimeZone: {browser_timezone}
Selectedstore: {store_id} (pharmacy requests only)
```

---

## Environment Configuration

```
NEXT_PUBLIC_API_BASE_URL: Main API base URL
NEXT_PUBLIC_ML_OPERATIONS_BASE_URL: ML operations base URL
```

---

## Support & Maintenance

### When to Update Docs
- New endpoints added
- Parameter changes
- Response structure changes
- Breaking changes
- New patterns discovered

### How to Update
1. Update relevant markdown file
2. Keep both files in sync
3. Add examples from actual code
4. Update this index if structure changes

---

## Version History

- **v1.0** - Initial extraction (March 17, 2024)
  - 41 total endpoints documented
  - Complete parameter specifications
  - Usage examples for complex patterns
  - Quick reference guide created

---

## Contact & Questions

For questions about:
- **Quick lookups**: Check API_QUICK_REFERENCE.md
- **Implementation details**: See API_PARAMETERS_DOCUMENTATION.md
- **What's documented**: Review API_DOCUMENTATION_SUMMARY.txt
- **Adding new endpoints**: Follow patterns in existing endpoints

---

## Document Maintenance Checklist

- [ ] When adding endpoint: Update API_QUICK_REFERENCE.md
- [ ] When adding endpoint: Update API_PARAMETERS_DOCUMENTATION.md
- [ ] When changing endpoint: Update both docs
- [ ] When adding pattern: Add to Common Patterns section
- [ ] When finding bug: Note in relevant documentation
- [ ] Quarterly: Review docs for accuracy

---

Generated: March 17, 2024
Module: Necropsy & Medical Records
Scope: Complete API parameter documentation
