# QR Code Generator Module

## Overview

This module allows users to request QR code generation for enclosures in the zoo. Users can generate QR codes for all enclosures, specific sites, specific sections within a site, or specific enclosures within a section.

## Features

- View job statistics (pending, processing, completed, failed, cancelled)
- Filter jobs by status
- Create new QR code generation requests
- Trigger pending jobs
- Cancel pending/processing jobs
- Download completed QR code files

---

## File Structure

```
src/
├── pages/
│   └── settings/
│       └── request-enclosure-qr-code/
│           └── index.js                    # Main page component
├── views/
│   └── pages/
│       └── settings/
│           └── AddQRRequestDrawer.js       # Add new request drawer
├── lib/
│   └── api/
│       └── settings/
│           └── index.js                    # API functions
└── components/
    └── navigation/
        └── settings/
            └── index.js                    # Navigation configuration
```

---

## Components

### 1. Main Page (`src/pages/settings/request-enclosure-qr-code/index.js`)

**Route:** `/settings/request-enclosure-qr-code`

**Features:**
- **Header:** QR Code Generator title with icon
- **Stats Cards:** Display counts for pending, processing, completed, failed, cancelled, and total requests
- **Filter:** Dropdown to filter jobs by status (All, Pending, Processing, Completed, Failed, Cancelled)
- **Jobs Table:** Lists all QR code generation jobs with columns:
  - Request ID
  - Status (with color-coded chips)
  - Created On (with relative time for pending/processing)
  - Actions
- **Actions:**
  - Play icon: Trigger pending jobs
  - Close icon: Cancel pending/processing jobs
  - Download icon: Download completed files

**Constants:**
```javascript
const JOB_TYPE = 'qr_export_enclosure'
const STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}
```

---

### 2. Add Request Drawer (`src/views/pages/settings/AddQRRequestDrawer.js`)

**Features:**
- **Drill-down Selection:**
  - Site dropdown (optional) - defaults to "All Sites"
  - Section dropdown (optional) - appears when site is selected, defaults to "All Sections"
  - Enclosure multi-select (optional) - appears when section is selected, searchable autocomplete with checkboxes
    - Maximum 10 enclosures can be selected
    - Infinite scroll pagination (loads more on scroll)
    - Search/filter functionality
- **Selection Summary:** Info box showing what will be generated based on current selection
- **Confirmation Dialog:** Asks user to confirm before submitting

**Enclosure Multi-Select Details:**
- Uses MUI Autocomplete with `multiple` and `disableCloseOnSelect`
- Fetches enclosures via `getEnclosureListSectionWise` API with pagination
- API returns 10 items per page (fixed by backend)
- Uses `total_count` from response to determine if more items exist
- Scroll detection triggers loading of next page when user scrolls near bottom
- Maximum selection limit: 10 enclosures
- Displays helper text showing "X/10 selected"

**Selection Logic:**
| Selection | Filter Type | Filter ID/IDs |
|-----------|-------------|---------------|
| No selection | `zoo` | - |
| Site selected | `site` | filter_id: site_id |
| Site + Section selected (all enclosures) | `section` | filter_id: section_id |
| Site + Section + Enclosures selected | `enclosure` | filter_ids: [enclosure_id, ...] |

---

## API Endpoints

### API Functions (`src/lib/api/settings/index.js`)

#### 1. Get Job Statistics
```javascript
getJobStats({ job_type: 'qr_export_enclosure' })
```
**Endpoint:** `GET /v1/jobs/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": 0,
    "processing": 0,
    "completed": 5,
    "failed": 1,
    "cancelled": 0,
    "total": 6
  }
}
```

#### 2. Get Jobs List
```javascript
getJobsList({
  job_type: 'qr_export_enclosure',
  page: 1,
  limit: 50,
  status: 'pending' // optional filter
})
```
**Endpoint:** `GET /v1/jobs`

#### 3. Create Job Request
```javascript
createJobRequest({
  job_type: 'qr_export_enclosure',
  payload: {
    filter_type: 'zoo' | 'site' | 'section',
    filter_id: <id> // required for site/section
  }
})
```
**Endpoint:** `POST /v1/jobs/request`

**Payload Examples:**
```json
// All enclosures (zoo level)
{
  "job_type": "qr_export_enclosure",
  "payload": {
    "filter_type": "zoo"
  }
}

// Site level
{
  "job_type": "qr_export_enclosure",
  "payload": {
    "filter_type": "site",
    "filter_id": 70
  }
}

// Section level
{
  "job_type": "qr_export_enclosure",
  "payload": {
    "filter_type": "section",
    "filter_id": 71
  }
}

// Enclosure level (specific enclosures)
{
  "job_type": "qr_export_enclosure",
  "payload": {
    "filter_type": "enclosure",
    "filter_ids": [101, 102, 103]
  }
}
```

#### 4. Trigger Job
```javascript
triggerJob(jobId)
```
**Endpoint:** `POST /v1/jobs/{jobId}/process`

#### 5. Cancel Job
```javascript
cancelJob(jobId)
```
**Endpoint:** `DELETE /v1/jobs/{jobId}`

---

### Housing API Functions (`src/lib/api/housing/index.js`)

#### 1. Get Sections by Site
```javascript
getAllSections({
  site_id: 16,
  basic_only: 1
})
```
**Endpoint:** `GET /v1/section`

#### 2. Get Enclosures by Section (Paginated)
```javascript
getEnclosureListSectionWise({
  section_id: 147,
  page_no: 1
})
```
**Endpoint:** `GET /v1/enclosure/sub/listing`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_count": "55",
    "list_items": [
      {
        "enclosure_id": "19105",
        "user_enclosure_name": "Enclosure Name",
        "enclosure_name": "Default Name",
        "section_id": "147",
        "section_name": "Section Name",
        "site_name": "Site Name",
        "site_id": "16"
      }
    ]
  }
}
```

**Notes:**
- Backend returns 10 items per page (fixed limit)
- Use `page_no` to paginate through results
- `total_count` indicates total number of enclosures in the section

---

## Navigation

### Settings Navigation (`src/components/navigation/settings/index.js`)

```javascript
const requestEnclosureQRCode = {
  title: 'Request Enclosure QR Code',
  path: '/settings/request-enclosure-qr-code',
  icon: 'mdi:qrcode'
}
```

The settings navigation is added to the main navigation in `src/navigation/vertical/index.js`:
```javascript
const settingsNav = settingsNavigation()
navigationArray.push(...settingsNav)
```

---

## Dependencies

- `@mui/material` - UI components (including Autocomplete for enclosure multi-select)
- `@mui/lab` - LoadingButton
- `moment` - Date/time formatting
- `src/lib/api/housing` - `getAllSections` for fetching sections, `getEnclosureListSectionWise` for fetching enclosures

---

## Usage Flow

1. User navigates to Settings > Request Enclosure QR Code
2. Views current job statistics and list of jobs
3. Clicks "Add New Request" to open the drawer
4. Selects site (optional), section (optional), and/or specific enclosures (optional, multi-select with search)
5. Reviews selection summary
6. Clicks "Submit Request"
7. Confirms in the confirmation dialog
8. Job is created with status "pending"
9. User can trigger the job to start processing
10. Once completed, user can download the QR codes

---

## Status Workflow

```
[Created] → PENDING → [Trigger] → PROCESSING → COMPLETED
                ↓                      ↓
            CANCELLED              FAILED
```

---

## Styling

- Uses theme colors for consistency
- Status chips are color-coded:
  - Pending: Warning (yellow/orange)
  - Processing: Info (blue)
  - Completed: Success (green)
  - Failed: Error (red)
  - Cancelled: Grey
