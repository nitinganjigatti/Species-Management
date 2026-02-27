# Hospital Module Documentation

## Overview
The Hospital Module is a comprehensive patient and medical records management system within the Antz Web Dashboard. It provides healthcare professionals with tools to manage patient information, medical records, treatments, and associated media files.

## Module Location
- **Base Path**: `src/components/hospital/`
- **API Path**: `src/lib/api/hospital/`

## Features

### Patient Management
- Patient details view
- Medical record management
- Patient history tracking
- Animal/patient profile information

### Media Management
- **[Patient Media Tab](./patient-media-tab.md)** - Comprehensive media file management
  - Upload and view patient-related media files
  - Filter by media type, medical record, and feature
  - Infinite scroll for large media collections
  - Support for images, documents, videos, and audio files

### Clinical Features
The module integrates with various clinical features:
- Surgery records
- Discharge summaries
- Mortality records
- Clinical assessments
- Symptoms tracking
- Prescription management
- Anesthesia records
- Treatment plans

## Component Structure

```
src/components/hospital/
├── drawer/
│   ├── MediaFilterContent.js          # Filter UI component
│   └── PatientMediaFilterDrawer.js    # Media filter drawer
├── inpatient/
│   └── PatientMedia.js                # Main media management component
└── PatientDetails/
    └── PatientDetails.js              # Patient details container
```

## API Structure

```
src/lib/api/hospital/
└── inpatient.js                       # API functions for inpatient management
    ├── getPatientMedia()              # Fetch patient media files
    └── uploadPatientMedia()           # Upload media files
```

## Available Documentation

1. **[Patient Media Tab](./patient-media-tab.md)**
   - Detailed documentation of the media management system
   - Upload functionality
   - Advanced filtering
   - API integration
   - Component architecture

## Key Technologies

- **React**: UI component library
- **Material-UI (MUI)**: Component framework
- **React Query**: Data fetching and caching
- **React Hook Form**: Form management
- **Lodash**: Utility functions
- **React Dropzone**: File upload handling

## Development Guidelines

### Adding New Features
1. Follow the existing folder structure
2. Place components in appropriate subdirectories
3. Create API functions in the relevant API file
4. Document new features in this documentation folder

### State Management
- Use React Query for server state
- Use local state (useState/useReducer) for UI state
- Implement proper loading and error states

### Error Handling
- Use toast notifications for user feedback
- Implement proper error boundaries
- Provide meaningful error messages

### Performance
- Implement pagination for large datasets
- Use memoization (useMemo, useCallback) appropriately
- Lazy load components when possible
- Optimize API calls with debouncing

## Testing
- Write unit tests for utility functions
- Integration tests for API calls
- E2E tests for critical user flows
- Test error scenarios and edge cases

## Future Roadmap

### Planned Features
- Enhanced patient dashboard
- Real-time notifications
- Advanced analytics and reporting
- Mobile-responsive improvements
- Offline support for critical features

### Media Management Enhancements
- Bulk operations (download, delete)
- Advanced search capabilities
- File preview modal
- Sorting options
- File organization and tagging

## Contributing

When contributing to the Hospital Module:
1. Follow the established code style
2. Update documentation for new features
3. Write tests for new functionality
4. Ensure backward compatibility
5. Review existing code for similar patterns

## Related Documentation

- [Patient Media Tab](./patient-media-tab.md) - Detailed media management documentation

## Support

For questions or issues related to the Hospital Module:
- Review the documentation in this folder
- Check the component source code
- Consult the API documentation
- Contact the development team
