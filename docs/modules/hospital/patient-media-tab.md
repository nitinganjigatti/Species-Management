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
  - Images: `.png`, `.jpg`, `.jpeg`, `.svg`, `.heic`, `.webp`
  - Documents: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv`, `.ppt`, `.pptx`, `.txt`
  - Videos: `.mp4`, `.webm`, `.ogv`
  - Audio: `.mp3`, `.wav`
  - Archives: `.zip`, `.rar`
- **Card Information**:
  - File thumbnail/preview
  - File name
  - Upload date
  - Uploader information (name and profile picture)
- **Media Actions**:
  - Three-dot menu on each card with action options
  - Download media files (supports both direct URL and blob-based downloads)
  - Delete media files with confirmation dialog

### 2. File Upload
- **Drag & Drop Support**: Users can drag and drop files directly onto the upload button
- **Multi-file Upload**: Support for uploading multiple files simultaneously
- **Upload Progress**: Loading indicator during file upload
- **File Validation** (dynamic limits from `authData.userData.settings`):
  - Automatic validation based on accepted file types
  - Enforced file extension validation (cannot be bypassed)
  - **Per-type total size limits** (combined size of all files of that type in one upload):
    - Images: `MAX_IMAGE_UPLOAD_SIZE` (default ~25 MB)
    - Videos: `MAX_VIDEO_UPLOAD_SIZE` (default ~28 MB)
    - Audio: `MAX_AUDIO_UPLOAD_SIZE` (default ~50 MB)
    - Documents: `MAX_APPLICATION_UPLOAD_SIZE` (default ~2 MB)
  - **Per-type file count limits**:
    - Images: `MAX_NUMBER_IMAGE_FILE` (default 10)
    - Videos: `MAX_NUMBER_VIDEO_FILE` (default 5)
    - Audio: `MAX_NUMBER_AUDIO_FILE` (default 5)
    - Documents: `MAX_NUMBER_APPLICATION_FILE` (default 5)
  - Validation occurs before upload to prevent invalid files
- **Success/Error Feedback**: Toast notifications for upload status with detailed error messages
- **Auto-refresh**: Media list automatically refreshes after successful upload
- **Allowed File Types**:
  - Images: `.png`, `.jpg`, `.jpeg`, `.svg`, `.heic`
  - Documents: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`
  - Videos: `.mp4`
  - Audio: `.mp3`, `.ogg`, `.m4a`

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
   - **File Type Validation Errors**: Shows list of allowed file types
   - **File Size Validation Errors**: Shows total combined size per type vs the allowed limit (e.g., "Total video file size exceeds 28.0 MB. Your total: 35.42 MB")
   - **File Count Validation Errors**: Shows max allowed count per type (e.g., "You can upload a maximum of 5 video files at a time. You selected 8.")
   - Validation errors appear before upload attempt

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
- **Implementation**: Smart download method selection in `NewMediaCard.js`
- **Download Methods**:
  - If `downloadUrl` is provided: Uses `Utility.downloadFileFromURL()` for direct download
  - If `downloadUrl` is not provided: Uses `Utility.downloadFileFromURLWithBlob()` for blob-based download
- **Behavior**:
  - Downloads file directly to user's device
  - Preserves original filename
  - Works for all supported file types
  - Automatically selects the appropriate download method based on available URLs
- **Component**: `NewMediaCard.js`
- **Props**:
  - `fileUrl`: Primary file URL for display and fallback download
  - `downloadUrl`: Optional URL specifically for downloading (uses direct download method)

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

**File Type Extensions for Upload Validation (Lines 62-77):**
- Images: `.png`, `.jpg`, `.jpeg`, `.heic`, `.svg`
- Documents: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`
- Videos: `.mp4`
- Audio: `.mp3`, `.ogg`, `.m4a`

**File Upload Limits (from `authData.userData.settings`):**
```javascript
// Size limits (total combined size per type in one upload)
MAX_IMAGE_UPLOAD_SIZE: 26214400       // ~25 MB for all image files combined
MAX_VIDEO_UPLOAD_SIZE: 29360128       // ~28 MB for all video files combined
MAX_AUDIO_UPLOAD_SIZE: 52428800       // ~50 MB for all audio files combined
MAX_APPLICATION_UPLOAD_SIZE: 2097152  // ~2 MB for all document files combined

// File count limits (per type in one upload)
MAX_NUMBER_IMAGE_FILE: 10
MAX_NUMBER_VIDEO_FILE: 5
MAX_NUMBER_AUDIO_FILE: 5
MAX_NUMBER_APPLICATION_FILE: 5
```

**File Validation:**
- `validator` function checks file extension against allowed list (runs per file)
- `onDrop` handler validates total combined size and file count per type (runs on batch)
- Rejected files show error toast with filename and reason
- Validation occurs before network upload to save bandwidth
- Falls back to 2 MB if settings are unavailable

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
  mortality: 'Mortality'
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
    { label: 'Mortality', value: 'mortality' }
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

## NewMediaCard Component

### File: `src/views/utility/NewMediaCard.js`

**Purpose**: Reusable component for displaying media files with preview, download, and delete actions.

**Props:**
- `fileUrl` (string, required): Primary file URL for display
- `fileName` (string, optional): File name to display
- `fileType` (string, optional): Type hint from API
- `user` (object, optional): User information for uploader details
- `width` (string/number): Card width
- `height` (string/number): Card height
- `showTitle` (boolean, default: false): Show file name as title
- `showTitleIcon` (boolean, default: false): Show title icon
- `onTitleIconClick` (function): Callback for title icon click
- `cardStyle` (object): Custom card styles
- `actions` (array, optional): Additional custom actions
- `onDeleteaction` (function, optional): Delete handler (shows delete option if provided)
- `ondownloadaction` (function, optional): Download handler (shows download option if provided)
- `isDeleteLoading` (boolean, default: false): Loading state for delete action
- `downloadUrl` (string, optional, default: null): **Optional download URL for direct downloads**

**Key Features:**
- **Smart Download Method Selection**:
  - If `downloadUrl` is provided → uses `Utility.downloadFileFromURL()` for direct download
  - If `downloadUrl` is not provided → uses `Utility.downloadFileFromURLWithBlob()` for blob-based download
- **File Type Detection**: Automatically detects file type from extension
- **Preview Support**: Click to preview images, videos, PDFs, and audio files
- **Responsive Design**: Adapts to different screen sizes
- **Error Handling**: Fallback icons for broken images or unsupported types
- **Memoized File Name**: Uses `useMemo` for optimized performance

**Supported File Type Icons:**
```javascript
const EXT_ICON_MAP = {
  image: ['jpeg', 'jpg', 'png', 'webp', 'heic'],
  pdf: ['pdf'],
  xls: ['xls', 'xlsx'],
  document: ['doc', 'docx'],
  audio: ['mp3', 'wav'],
  video: ['mp4', 'webm', 'ogv'],
  ppt: ['ppt', 'pptx'],
  text: ['txt'],
  csv: ['csv'],
  zip: ['zip', 'rar']
}
```

**Usage Example:**
```javascript
<NewMediaCard
  fileUrl={file.file}
  fileName={file.file_original_name}
  fileType={file.type}
  downloadUrl={file.download_url}  // Optional: for direct downloads
  user={{
    created_at: file.created_at,
    user_profile: file.user_profile
  }}
  width='100%'
  height='100%'
  showTitle={true}
  ondownloadaction={() => {}}
  onDeleteaction={() => handleDeleteMedia(file.id)}
  isDeleteLoading={deletingMediaId === file.id}
/>
```

## Notes

- The search functionality is implemented but currently hidden (display: none)
- Medical Record filter only allows single selection by design
- Default filter is set to "Current Medical Record" for focused viewing
- All file uploads are associated with the current medical record
- Media files maintain metadata including uploader and timestamp
- Download functionality intelligently switches between direct URL and blob-based methods
- Each media card shows a three-dot menu (⋮) when both download and delete actions are available
- Filter checkboxes are designed to be clickable both on the checkbox and the label text
- Delete action only appears for media where `is_created_for_medical_record === '1'`
- The `current_medical_record_id` parameter is always sent to the API regardless of filter selection
- **File validation uses dynamic per-type size and count limits from `authData.userData.settings`**
- **Size limits apply to the total combined size of all files of that type in one upload** (e.g., 10 videos totaling 28 MB, not 28 MB per file)
- **Upload validation cannot be bypassed** - file type checked in validator, size and count checked in onDrop before upload
