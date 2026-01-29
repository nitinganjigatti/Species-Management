# Patient Media Tab Documentation

## Overview
The Patient Media Tab is a comprehensive media management system integrated into the hospital module's patient details view. It allows users to view, upload, filter, and manage all media files associated with a patient's medical records.

## Location
- **Component Path**: `src/components/hospital/inpatient/PatientMedia.js`
- **Supporting Components**:
  - `src/components/hospital/drawer/PatientMediaFilterDrawer.js`
  - `src/components/hospital/drawer/MediaFilterContent.js`
- **API Path**: `src/lib/api/hospital/inpatient.js`

## Features

### 1. Media Display
- **Grid Layout**: Responsive grid displaying media files in cards
- **Media Types Supported**:
  - Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.bmp`, `.webp`
  - Documents: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv`
  - Videos: `.mp4`, `.avi`, `.mov`, `.wmv`, `.flv`, `.webm`
  - Audio: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`
- **Card Information**:
  - File thumbnail/preview
  - File name
  - Upload date
  - Uploader information (name and profile picture)
- **Media Actions**:
  - Three-dot menu on each card with action options
  - Download media files
  - Delete media files with confirmation dialog

### 2. File Upload
- **Drag & Drop Support**: Users can drag and drop files directly onto the upload button
- **Multi-file Upload**: Support for uploading multiple files simultaneously
- **Upload Progress**: Loading indicator during file upload
- **File Validation**: Automatic validation based on accepted file types
- **Success/Error Feedback**: Toast notifications for upload status
- **Auto-refresh**: Media list automatically refreshes after successful upload

### 3. Advanced Filtering
The filter system provides three main categories:

#### Media Type Filter
- Images
- Documents
- Videos
- Audio
- Supports multiple selection

#### Medical Record Filter
- Current Medical Record (default)
- All Medical Records
- Single selection only (radio button behavior)

#### Feature Filter
Filters media by the module/feature where it was uploaded:
- Surgery
- Discharge
- Mortality
- Clinical Assessment
- Symptoms
- Prescription
- Anesthesia
- Treatment
- Supports multiple selection

### 4. Search Functionality
- **Debounced Search**: 500ms delay to optimize API calls
- **Search Field**: Currently hidden but implemented and ready to use
- **Search Parameters**: Searches through file names and metadata

### 5. Infinite Scroll
- **Pagination**: Loads 12 media files per page
- **Intersection Observer**: Automatically loads more content when user scrolls near the bottom
- **Load More Indicator**: Shows loading spinner while fetching next page
- **End of List Message**: Displays message when all files have been loaded

### 6. Active Filter Display
- **Filter Chips**: Shows currently applied filters as removable chips
- **Individual Removal**: Each filter can be removed independently
- **Filter Count Badge**: Displays count of active filters on the filter button

## Component Structure

### PatientMedia Component
Main component that orchestrates the media display and management.

**Props:**
- `hospitalCaseId`: ID of the hospital case
- `animalId`: ID of the patient/animal
- `medicalRecordId`: ID of the current medical record

**Key State:**
```javascript
- filterDrawerOpen: Boolean for filter drawer visibility
- filterCount: Number of active filters
- uploadLoading: Boolean for upload state
- deletingMediaId: ID of media currently being deleted (for loading state)
- filters: Object containing all filter selections
- localSearch: Local search input value
- search: Debounced search value
```

### PatientMediaFilterDrawer Component
Manages the filter drawer UI and filter state.

**Props:**
- `open`: Boolean for drawer visibility
- `onClose`: Callback when drawer closes
- `onApplyFilters`: Callback when filters are applied
- `setFilterCount`: Callback to update filter count
- `initialSelectedOptions`: Initial filter state

**Features:**
- Left menu navigation for filter categories
- Dynamic filter content rendering
- Clear all functionality
- Apply filters with count update

### MediaFilterContent Component
Reusable component for rendering filter options.

**Props:**
- `menuName`: Name of the filter category
- `selectedOptions`: Array of selected option values
- `onOptionChange`: Callback when option changes
- `selectAllHandler`: Callback for select all
- `items`: Array of filter items
- `isAllSelected`: Boolean for select all state
- `hideSelectAll`: Boolean to hide select all option

## API Integration

### Get Patient Media
**Function**: `getPatientMedia(params)`

**Parameters:**
```javascript
{
  medical_record_id: number,  // Optional, for current record filtering
  file_type: string,          // 'all' or comma-separated types
  module: string,             // 'all' or comma-separated features
  page: number,               // Page number for pagination
  limit: number,              // Items per page (default: 12)
  animal_id: number,          // Patient/animal ID
  q: string                   // Optional search query
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    result: [...],           // Array of media objects
    total_count: number      // Total number of files
  }
}
```

### Upload Patient Media
**Function**: `uploadPatientMedia(formData)`

**FormData Fields:**
- `notes_files[]`: File object(s) to upload
- `medical_record_id`: Current medical record ID

**Response:**
```javascript
{
  success: boolean,
  message: string
}
```

### Delete Patient Media
**Function**: `handleDeleteMedia(mediaId)` *(Placeholder - API implementation pending)*

**Parameters:**
- `mediaId`: ID of the media file to delete

**Behavior:**
- Sets loading state for the specific media being deleted
- Shows confirmation dialog before deletion
- Displays success/error toast notifications
- Refreshes media list after successful deletion

**Note**: API endpoint implementation is pending. The handler is ready to integrate with the delete API once available.

## User Interface

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Media Files (count)              [Upload] [Filter (n)]  │
├─────────────────────────────────────────────────────────┤
│ [Active Filter Chips - removable]                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │FileName ⋮│  │FileName ⋮│  │FileName ⋮│  │FileName ⋮││
│  │┌────────┐│  │┌────────┐│  │┌────────┐│  │┌────────┐││
│  ││Preview ││  ││Preview ││  ││Preview ││  ││Preview │││
│  │└────────┘│  │└────────┘│  │└────────┘│  │└────────┘││
│  │👤 User   │  │👤 User   │  │👤 User   │  │👤 User   ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                          │
│                    [Loading More...]                     │
└─────────────────────────────────────────────────────────┘

Media Card Actions Menu (⋮):
├─ Download
└─ Delete
```

### Filter Drawer Structure
```
┌──────────────┬─────────────────────────────┐
│ Media Type   │ ☑ Select All                │
│              │ ───────────────────────────  │
│ Medical      │ ☐ Images                    │
│ Record       │ ☑ Documents                 │
│              │ ☐ Videos                    │
│ Feature      │ ☐ Audio                     │
│              │                              │
│              │                              │
│              │ [Clear All]  [Apply (n)]    │
└──────────────┴─────────────────────────────┘
```

## Performance Optimizations

1. **React Query Integration**
   - Automatic caching of fetched data
   - Refetch on window focus
   - Stale data management

2. **Infinite Scroll**
   - Intersection Observer API for efficient scroll detection
   - Lazy loading of content
   - Prevents loading duplicate pages

3. **Debounced Search**
   - 500ms delay reduces API calls
   - Cleanup on component unmount

4. **Memoization**
   - `useMemo` for computed values (mediaFiles, total)
   - `useCallback` for event handlers
   - Prevents unnecessary re-renders

5. **Skeleton Loading**
   - Provides visual feedback during initial load
   - Improves perceived performance

## State Management

### Filter State
```javascript
{
  'Media Type': ['image', 'document'],    // Array of selected types
  'Medical Record': ['current'],          // Single selection
  'Feature': ['surgery', 'treatment']     // Array of selected features
}
```

### Default State
- Medical Record filter defaults to "Current Medical Record"
- Filter count starts at 1 (due to default selection)
- All other filters start empty

## Error Handling

1. **Upload Errors**
   - Individual file error notifications
   - Partial success handling (some files succeed, others fail)
   - Error messages displayed via toast notifications

2. **Load Errors**
   - Error state managed by React Query
   - Retry functionality available
   - Error boundary protection

3. **Empty States**
   - "No media files found" message when no results
   - "No options available" in empty filter categories

## Testing Considerations

### Unit Tests
- Filter state management
- File type detection logic
- Search debouncing
- Filter count calculation

### Integration Tests
- Upload flow (single and multiple files)
- Filter application and removal
- Infinite scroll behavior
- API integration

### E2E Tests
- Complete user journey: view → filter → upload → view updated list
- Multi-file upload with mixed file types
- Filter combination scenarios

## Media Actions

### Download Functionality
- **Location**: Three-dot menu on media card
- **Implementation**: Uses `Utility.downloadFileFromURL()` utility function
- **Behavior**:
  - Downloads file directly to user's device
  - Preserves original filename
  - Works for all supported file types
- **Component**: `NewMediaCard.js`

### Delete Functionality
- **Location**: Three-dot menu on media card
- **Implementation**: Handler function in `PatientMedia.js`
- **Behavior**:
  - Shows confirmation dialog before deletion
  - Displays loading state on the specific card being deleted
  - Shows success/error notifications
  - Automatically refreshes media list after successful deletion
- **Confirmation Dialog**:
  - Title: "Delete Media"
  - Message: "Are you sure you want to delete this media?"
  - Actions: Cancel / Delete (red button)
  - Image: Warning icon with tertiary light background
- **Component**: `NewMediaCard.js` with `ConfirmationDialog` component

### Filter Checkbox Interaction
- **Location**: Filter drawer (side sheet)
- **Behavior**:
  - Checkboxes are fully clickable
  - Clicking checkbox directly toggles selection
  - Clicking label/row also toggles selection
  - Prevents double-toggling using `stopPropagation`
- **Select All**: Available for Media Type and Feature filters
- **Single Selection**: Medical Record filter uses radio button behavior

## Future Enhancements

1. **Bulk Actions**
   - Select multiple files
   - Bulk download
   - Bulk delete

2. **Enhanced Search**
   - Search by date range
   - Search by uploader
   - Advanced search options

3. **Sorting**
   - Sort by date (newest/oldest)
   - Sort by file type
   - Sort by name (A-Z)

4. **Preview Modal Enhancement**
   - Full-screen media preview
   - Navigation between files
   - Enhanced download options

5. **File Management**
   - Rename files
   - Move files between records
   - Add tags/categories

## Dependencies

- **React Query**: Data fetching and caching
- **Material-UI**: UI components
- **react-dropzone**: File upload functionality
- **react-intersection-observer**: Infinite scroll detection
- **lodash**: Utility functions (debounce)

## Hardcoded Values

### PatientMedia Component (`PatientMedia.js`)

**Business Logic Values:**
- `'1'` (Line 404): String value for `is_created_for_medical_record` check to enable delete action
- `'current'` (Lines 30, 124): Medical record filter value for current record
- `'all'`: Medical record filter value for all records

**Configuration Values:**
- `12` (Line 36): PAGE_SIZE for pagination
- `500` (Line 38): Debounce delay in milliseconds for search
- `240` (Line 279): MediaCardSkeleton height in pixels

**File Type Extensions (Lines 50-58):**
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.bmp`, `.webp`
- Documents: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv`
- Videos: `.mp4`, `.avi`, `.mov`, `.wmv`, `.flv`, `.webm`
- Audio: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`

**Filter Values (Lines 254-273):**
```javascript
{
  // Media Types
  image: 'Images',
  document: 'Documents',
  video: 'Videos',
  audio: 'Audio',

  // Medical Record
  current: 'Current medical record',
  all: 'All Records',

  // Features/Modules
  surgery: 'Surgery',
  discharge: 'Discharge',
  mortality: 'Mortality',
  clinical_assessment: 'Clinical Assessment',
  symptoms: 'Symptoms',
  prescription: 'Prescription',
  anesthesia: 'Anesthesia',
  treatment: 'Treatment'
}
```

### PatientMediaFilterDrawer Component (`PatientMediaFilterDrawer.js`)

**Menu Categories (Line 15):**
```javascript
['Media Type', 'Medical Record', 'Feature']
```

**Filter Options (Lines 18-39):**
```javascript
{
  'Media Type': [
    { label: 'Images', value: 'image' },
    { label: 'Documents', value: 'document' },
    { label: 'Videos', value: 'video' },
    { label: 'Audio', value: 'audio' }
  ],
  'Medical Record': [
    { label: 'Current Medical Record', value: 'current' },
    { label: 'All Medical Records', value: 'all' }
  ],
  Feature: [
    { label: 'Surgery', value: 'surgery' },
    { label: 'Discharge', value: 'discharge' },
    { label: 'Mortality', value: 'mortality' },
    { label: 'Clinical Assessment', value: 'clinical_assessment' },
    { label: 'Symptoms', value: 'symptoms' },
    { label: 'Prescription', value: 'prescription' },
    { label: 'Anesthesia', value: 'anesthesia' },
    { label: 'Treatment', value: 'treatment' }
  ]
}
```

### API Integration

**Delete Media API:**
- **Endpoint**: `medical/attachment-remove/{mediaId}`
- **Method**: POST
- **Constant**: `DELETE_CLINICAL_NOTES` (from `ApiConstant.js`)
- **Function**: `deletePatientMedia(mediaId)` in `src/lib/api/hospital/inpatient.js`
- **Delete Permission**: Only media with `is_created_for_medical_record === '1'` can be deleted

**Get Media API Parameters:**
```javascript
{
  medical_record_id: number | undefined,  // Set when filtering by current record
  current_medical_record_id: number,      // Always sent with current record ID
  file_type: string,                      // 'all' or comma-separated types
  module: string,                         // 'all' or comma-separated features
  page: number,                           // Page number
  limit: number,                          // Items per page (12)
  animal_id: number,                      // Patient/animal ID
  q: string                               // Optional search query
}
```

## Notes

- The search functionality is implemented but currently hidden (display: none)
- Medical Record filter only allows single selection by design
- Default filter is set to "Current Medical Record" for focused viewing
- All file uploads are associated with the current medical record
- Media files maintain metadata including uploader and timestamp
- Download functionality uses the existing `Utility.downloadFileFromURL()` method
- Each media card shows a three-dot menu (⋮) when both download and delete actions are available
- Filter checkboxes are designed to be clickable both on the checkbox and the label text
- Delete action only appears for media where `is_created_for_medical_record === '1'`
- The `current_medical_record_id` parameter is always sent to the API regardless of filter selection
