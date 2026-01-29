import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Box, Typography, CircularProgress, Skeleton, Chip, Button } from '@mui/material'
import { Grid } from '@mui/system'
import { useTheme } from '@emotion/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { debounce } from 'lodash'
import { useDropzone } from 'react-dropzone'
import Icon from 'src/@core/components/icon'
import NewMediaCard from 'src/views/utility/NewMediaCard'
import NoDataFound from 'src/views/utility/NoDataFound'
import Search from 'src/views/utility/Search'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import PatientMediaFilterDrawer from 'src/components/hospital/drawer/PatientMediaFilterDrawer'
import { getPatientMedia, uploadPatientMedia, deletePatientMedia } from 'src/lib/api/hospital/inpatient'
import Toaster from 'src/components/Toaster'

const PatientMedia = ({ hospitalCaseId, animalId, medicalRecordId }) => {
  const theme = useTheme()
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  // State management
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [filterCount, setFilterCount] = useState(1) // Start with 1 because "Current Medical Record" is default
  const [uploadLoading, setUploadLoading] = useState(false)
  const [deletingMediaId, setDeletingMediaId] = useState(null)

  const [filters, setFilters] = useState({
    'Media Type': [],
    'Medical Record': ['current'], // Default to current medical record
    Feature: []
  })
  const [localSearch, setLocalSearch] = useState('')
  const [search, setSearch] = useState('')

  const PAGE_SIZE = 12

  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Dropzone configuration for file upload
  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
    },
    onDrop: async acceptedFiles => {
      try {
        setUploadLoading(true)
        let successCount = 0
        let message = ''

        // Upload files one by one or in batch
        for (const file of acceptedFiles) {
          // Create FormData for each file
          const formData = new FormData()
          formData.append('notes_files[]', file)
          formData.append('medical_record_id', medicalRecordId)

          const response = await uploadPatientMedia(formData)

          if (response?.success) {
            successCount++
            message = response?.message || 'Files uploaded successfully'
          } else {
            Toaster({ type: 'error', message: response?.message || 'Failed to upload file' })
          }
        }

        if (successCount === acceptedFiles.length) {
          Toaster({ type: 'success', message: message })

          // Refresh the media list
          refetch()
        } else if (successCount > 0) {
          Toaster({
            type: 'warning',
            message: `${successCount} of ${acceptedFiles.length} files uploaded successfully`
          })
          refetch()
        }

        setUploadLoading(false)
      } catch (error) {
        console.error('Error uploading files:', error)
        Toaster({ type: 'error', message: 'Failed to upload files' })
        setUploadLoading(false)
      }
    }
  })

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, refetch, error, isError } =
    useInfiniteQuery({
      queryKey: ['patient-media', hospitalCaseId, medicalRecordId, animalId, filters, search],
      queryFn: async ({ pageParam = 1 }) => {
        // Prepare file_type parameter
        let fileType = 'all'
        if (filters['Media Type'].length > 0) {
          // If specific types are selected, join them with comma
          fileType = filters['Media Type'].join(',')
        }

        // Prepare module parameter
        let moduleParam = 'all'
        if (filters['Feature'].length > 0) {
          // If specific features are selected, join them with comma
          moduleParam = filters['Feature'].join(',')
        }

        const params = {
          medical_record_id: filters['Medical Record'].includes('current') ? medicalRecordId : undefined,
          current_medical_record_id: medicalRecordId,
          file_type: fileType,
          module: moduleParam,
          page: pageParam,
          limit: PAGE_SIZE,
          animal_id: animalId
        }

        // Add search query if present
        if (search) {
          params.q = search
        }

        const response = await getPatientMedia(params)

        // The API returns: { success: true, data: { result: [...], total_count: number } }
        const mediaData = response?.data?.result || []
        const totalCount = response?.data?.total_count || 0
        const hasMore = mediaData.length === PAGE_SIZE

        return {
          result: mediaData,
          nextPage: hasMore ? pageParam + 1 : undefined,
          total: totalCount
        }
      },
      getNextPageParam: lastPage => lastPage.nextPage,
      enabled: !!hospitalCaseId && !!medicalRecordId && !!animalId
    })

  const mediaFiles = useMemo(() => {
    const files = data?.pages.flatMap(page => page.result) || []

    // Map API response to expected format and determine file type
    const mappedFiles = files.map(file => {
      const fileName = file.file_original_name?.toLowerCase() || ''
      let fileType = 'document'

      // Determine file type from extension
      if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) {
        fileType = 'image'
      } else if (fileName.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
        fileType = 'video'
      } else if (fileName.match(/\.(mp3|wav|ogg|m4a|aac)$/)) {
        fileType = 'audio'
      }

      return {
        ...file,
        type: fileType,
        user_profile: {
          user_full_name: file.user_name,
          user_profile_pic: file.user_profile_pic
        }
      }
    })

    return mappedFiles
  }, [data])

  const total = useMemo(() => data?.pages?.[0]?.total || 0, [data])

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return
    fetchNextPage()
  }, [fetchNextPage, isFetchingNextPage, hasNextPage])

  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  // Handlers
  const handleApplyFilters = useCallback(newFilters => {
    setFilters(newFilters)

    // Filter count is handled by the drawer's setFilterCount callback
  }, [])

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleRemoveFilter = (filterCategory, filterValue) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterCategory]: prev[filterCategory].filter(val => val !== filterValue)
      }

      // Update filter count
      const count = Object.values(newFilters).reduce((acc, curr) => acc + curr.length, 0)
      setFilterCount(count)

      return newFilters
    })
  }

  const handleDeleteMedia = async mediaId => {
    try {
      setDeletingMediaId(mediaId)

      const response = await deletePatientMedia(mediaId)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Media deleted successfully' })

        // Refetch the media list after successful deletion
        await refetch()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete media' })
      }
    } catch (error) {
      console.error('Error deleting media:', error)
      Toaster({ type: 'error', message: 'Failed to delete media' })
    } finally {
      setDeletingMediaId(null)
    }
  }

  // Use filterCount from state (managed by drawer)

  // Get display labels for filter values
  const getFilterLabel = (category, value) => {
    const labels = {
      image: 'Images',
      document: 'Documents',
      video: 'Videos',
      audio: 'Audio',
      current: 'Current medical record',
      all: 'All Records',
      surgery: 'Surgery',
      discharge: 'Discharge',
      mortality: 'Mortality',
      clinical_assessment: 'Clinical Assessment',
      symptoms: 'Symptoms',
      prescription: 'Prescription',
      anesthesia: 'Anesthesia',
      treatment: 'Treatment'
    }

    return labels[value] || value
  }

  // Skeleton loaders
  const MediaCardSkeleton = () => (
    <Box
      sx={{
        height: 240,
        bgcolor: 'common.white',
        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2 }}>
        <Skeleton variant='text' width='80%' height={20} />
      </Box>
      <Skeleton variant='rectangular' height={133} sx={{ mx: 2 }} />
      <Box sx={{ p: 2 }}>
        <Skeleton variant='text' width='60%' height={16} />
      </Box>
    </Box>
  )

  const MediaGridSkeleton = () => (
    <Grid container spacing={4}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(item => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item}>
          <MediaCardSkeleton />
        </Grid>
      ))}
    </Grid>
  )

  return (
    <Box sx={{ mt: 6 }}>
      {/* Header with filter button and total count */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 3,
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          mb: 4
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Media Files
          </Typography>
          {total > 0 && !isFetching && (
            <Chip
              label={`${total} ${total === 1 ? 'file' : 'files'}`}
              size='small'
              sx={{
                bgcolor: theme.palette.customColors.OutlineVariant,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Search - hidden for now */}
          <Box sx={{ display: 'none', maxWidth: 300 }}>
            <Search
              value={localSearch}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              placeholder='Search media…'
            />
          </Box>

          {/* Upload Button */}
          <Button
            size='large'
            variant='outlined'
            sx={{ color: '#7A8684', cursor: 'pointer' }}
            {...getRootProps()}
            disabled={uploadLoading}
          >
            {uploadLoading ? (
              <CircularProgress size={20} sx={{ color: '#7A8684', mr: 1 }} />
            ) : (
              <Icon icon='ic:outline-file-upload' />
            )}
            &nbsp; Upload File
            <input {...getInputProps()} />
          </Button>

          {/* Filter Button */}
          <FilterButtonWithNotification onClick={() => setFilterDrawerOpen(true)} appliedFiltersCount={filterCount} />
        </Box>
      </Box>

      {/* Active Filter Chips */}
      {filterCount > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
          {Object.entries(filters).map(([category, values]) =>
            values.map(value => (
              <Chip
                key={`${category}-${value}`}
                label={getFilterLabel(category, value)}
                size='small'
                onDelete={() => handleRemoveFilter(category, value)}
                color='primary'
                variant='outlined'
                sx={{ fontSize: '0.75rem' }}
              />
            ))
          )}
        </Box>
      )}

      {/* Media Grid */}
      <Box>
        <Grid container spacing={4}>
          {mediaFiles.map(file => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.id}>
              <NewMediaCard
                fileUrl={file.file}
                fileName={file.file_original_name}
                fileType={file.type}
                user={{
                  created_at: file.created_at,
                  user_profile: file.user_profile
                }}
                width='100%'
                height='100%'
                showTitle={true}
                ondownloadaction={() => {}}
                onDeleteaction={file.is_created_for_medical_record === '1' ? () => handleDeleteMedia(file.id) : undefined}
                isDeleteLoading={deletingMediaId === file.id}
              />
            </Grid>
          ))}
        </Grid>

        {/* Loading skeleton */}
        {isFetching && mediaFiles.length === 0 && <MediaGridSkeleton />}

        {/* No data */}
        {mediaFiles.length === 0 && !isFetching && (
          <Box sx={{ py: 8 }}>
            <NoDataFound height={250} width={250} />
            <Typography align='center' color='text.secondary' sx={{ mt: 2 }}>
              No media files found
            </Typography>
          </Box>
        )}

        {/* Load more indicator */}
        {(isFetchingNextPage || hasNextPage) && mediaFiles.length > 0 && (
          <Box
            ref={loaderRef}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 4
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* End of list message */}
        {!hasNextPage && mediaFiles.length > 0 && (
          <Typography align='center' sx={{ mt: 6, color: 'text.disabled' }}>
            No more files to load.
          </Typography>
        )}
      </Box>

      {/* Filter Drawer */}
      <PatientMediaFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApplyFilters={handleApplyFilters}
        setFilterCount={setFilterCount}
        initialSelectedOptions={filters}
      />
    </Box>
  )
}

export default PatientMedia
