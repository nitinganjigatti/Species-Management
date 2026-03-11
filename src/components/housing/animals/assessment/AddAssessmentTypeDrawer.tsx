import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Box, Drawer, Typography, IconButton, Button, Checkbox, CircularProgress, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useInView } from 'react-intersection-observer'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import { getAssessmentCategoryList, getAssessmentTypeList, addAssessmentTypesToAnimal } from 'src/lib/api/assessment'
import type { AssessmentCategoryOption, AssessmentTypeOption } from 'src/types/housing/assessment'

const PAGE_SIZE = 20

interface AddAssessmentTypeDrawerProps {
  open: boolean
  onClose: () => void
  animalId: number | string
  existingTypeIds: string[]
  onSuccess: () => void
}

const AddAssessmentTypeDrawer: React.FC<AddAssessmentTypeDrawerProps> = ({
  open,
  onClose,
  animalId,
  existingTypeIds,
  onSuccess
}) => {
  const theme = useTheme() as any
  const cooldownRef = useRef(false)

  // Search
  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  // Categories
  const [categories, setCategories] = useState<{ label: string; value: string; count?: number }[]>([])
  const [activeTab, setActiveTab] = useState<string>('')
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(false)

  // Types list
  const [availableTypes, setAvailableTypes] = useState<AssessmentTypeOption[]>([])
  const [isTypesLoading, setIsTypesLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [pageNo, setPageNo] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)

  // Selection
  const [selectedTypes, setSelectedTypes] = useState<{ id: string; label: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Infinite scroll
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Reset on open
  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
      setActiveTab('')
      setSelectedTypes([])
      fetchCategories()
      resetAndFetchTypes()
    }
  }, [open])

  // Fetch categories
  const fetchCategories = async () => {
    setIsCategoriesLoading(true)
    try {
      const response = await getAssessmentCategoryList('animal')
      if (response?.success && response.data) {
        const categoryList = [
          { label: 'All', value: '', count: 0 },
          ...response.data.map(cat => ({
            label: cat.label,
            value: cat.assessment_category_id,
            count: 0
          }))
        ]
        setCategories(categoryList)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  // Reset and fetch types
  const resetAndFetchTypes = () => {
    setAvailableTypes([])
    setPageNo(1)
    setHasMore(true)
    fetchTypes(1, true)
  }

  // Fetch types
  const fetchTypes = useCallback(
    async (page: number, reset: boolean = false) => {
      setIsTypesLoading(true)
      try {
        const params: any = {
          page_no: page,
          ref_type: 'animal'
        }

        if (activeTab) {
          params.cat_id = activeTab
        }

        if (search.trim()) {
          params.q = search.trim()
        }

        const response = await getAssessmentTypeList(params)
        if (response?.success) {
          const newTypes = response.data?.result || []
          const total = response.data?.total_count || 0

          setTotalCount(total)

          if (reset) {
            setAvailableTypes(newTypes)
          } else {
            setAvailableTypes(prev => [...prev, ...newTypes])
          }

          const currentTotal = reset ? newTypes.length : availableTypes.length + newTypes.length
          setHasMore(currentTotal < total && newTypes.length === PAGE_SIZE)
        }
      } catch (error) {
        console.error('Error fetching assessment types:', error)
      } finally {
        setIsTypesLoading(false)
      }
    },
    [activeTab, search, availableTypes.length]
  )

  // Refetch when category or search changes
  useEffect(() => {
    if (open) {
      resetAndFetchTypes()
    }
  }, [activeTab, search])

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !isTypesLoading && !cooldownRef.current && open) {
      cooldownRef.current = true
      const nextPage = pageNo + 1
      setPageNo(nextPage)
      fetchTypes(nextPage, false).finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [inView, hasMore, isTypesLoading, pageNo, open])

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleTabClick = (tabValue: string) => {
    setActiveTab(tabValue)
  }

  const handleToggleType = (type: AssessmentTypeOption) => {
    const typeId = String(type.assessment_type_id)

    // Don't allow toggling already assigned types
    const existingIdsArray = Array.isArray(existingTypeIds) ? existingTypeIds : []
    if (existingIdsArray.map(id => String(id)).includes(typeId)) return

    const typeName = type.assessments_type_label || type.assessment_name || 'Unknown'

    setSelectedTypes(prev => {
      const isSelected = prev.some(item => String(item.id) === typeId)

      if (isSelected) {
        return prev.filter(item => String(item.id) !== typeId)
      } else {
        return [
          ...prev,
          {
            id: typeId,
            label: typeName
          }
        ]
      }
    })
  }

  const handleDrawerClose = () => {
    onClose()
    setSelectedTypes([])
  }

  // Submit
  const handleSubmit = async () => {
    if (selectedTypes.length === 0) {
      Toaster({ type: 'warning', message: 'Please select at least one assessment type' })

      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        assessment_types_to_be_removed: JSON.stringify([]),
        new_assessment_types: JSON.stringify(selectedTypes.map(t => t.id))
      }

      const response = await addAssessmentTypesToAnimal(animalId, payload)

      if (response?.success) {
        Toaster({ type: 'success', message: 'Assessment types added successfully' })
        onSuccess()
        handleDrawerClose()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add assessment types' })
      }
    } catch (error) {
      console.error('Error adding assessment types:', error)
      Toaster({ type: 'error', message: 'Failed to add assessment types' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleDrawerClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.customColors?.OnPrimary || theme.palette.background.paper,
            px: '1.2rem',
            py: '1rem',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <img src='/icons/Activity.svg' alt='Assessment Icon' width='32px' />
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
              }}
            >
              Add Assessment Types
            </Typography>
          </Box>

          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
            <Icon icon='mdi:close' fontSize={30} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Search */}
          <Box sx={{ px: 6, pt: 6, pb: 3 }}>
            <Search
              placeholder='Search Assessment Types'
              value={localSearch}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              inputStyle={{ py: '12px', px: '12px' }}
              width='100%'
            />
          </Box>

          {/* Category Tabs */}
          <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {isCategoriesLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  pb: 1,
                  height: 48,
                  alignItems: 'center',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' }
                }}
              >
                {Array.from(new Array(4)).map((_, idx) => (
                  <Skeleton key={idx} variant='rectangular' width={120} height={40} sx={{ borderRadius: 1 }} />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                  pb: 1
                }}
              >
                {categories.map((item, index) => {
                  const isActive = activeTab === item.value
                  const showCount = item.value === '' ? totalCount : item.count ?? 0

                  return (
                    <Button
                      key={index}
                      onClick={() => handleTabClick(item.value)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 1,
                        px: 3,
                        py: 1.5,
                        fontWeight: 500,
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        minWidth: 'auto',
                        flexShrink: 0,
                        border: 'none',
                        backgroundColor: isActive
                          ? theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main
                          : theme.palette.customColors?.mdAntzNeutral || theme.palette.grey[200],
                        color: isActive
                          ? theme.palette.customColors?.OnPrimary
                          : theme.palette.customColors?.OnPrimaryContainer || theme.palette.text.primary,
                        '&:hover': isActive
                          ? {
                              backgroundColor: `${
                                theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main
                              } !important`
                            }
                          : {
                              backgroundColor: theme.palette.customColors?.OutlineVariant || theme.palette.grey[300]
                            }
                      }}
                    >
                      {item.label} {showCount > 0 && `(${showCount})`}
                    </Button>
                  )
                })}
              </Box>
            )}

            {/* Types List */}
            {isTypesLoading && availableTypes.length === 0 ? (
              <Box display='flex' justifyContent='center' alignItems='center' py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {availableTypes.map(type => {
                  // Use assessments_type_label (API field) or fall back to assessment_name
                  const typeName = type.assessments_type_label || type.assessment_name || 'Unknown'
                  // API returns 'label' for category name, not 'assessment_category_name'
                  const categoryName = type.label || type.assessment_category_name || ''
                  const typeId = String(type.assessment_type_id)

                  // Compare as strings to ensure type consistency
                  // Ensure existingTypeIds is an array before mapping
                  const existingIdsArray = Array.isArray(existingTypeIds) ? existingTypeIds : []
                  const isExisting = existingIdsArray.map(id => String(id)).includes(typeId)
                  const isSelected = selectedTypes.some(item => String(item.id) === typeId)

                  return (
                    <Box
                      key={typeId}
                      onClick={() => handleToggleType(type)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 4,
                        border: isSelected
                          ? `1px solid ${theme.palette.primary.main}`
                          : `1px solid ${theme.palette.customColors?.SurfaceVariant || theme.palette.divider}`,
                        backgroundColor: isSelected
                          ? theme.palette.customColors?.Surface || theme.palette.action.selected
                          : isExisting
                          ? theme.palette.action.disabledBackground
                          : theme.palette.customColors?.OnPrimary || theme.palette.background.paper,
                        borderRadius: 1,
                        cursor: isExisting ? 'not-allowed' : 'pointer',
                        opacity: isExisting ? 0.6 : 1,
                        transition: 'background 0.2s, border-color 0.2s'
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                          }}
                        >
                          {typeName}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.85rem',
                            fontWeight: 400,
                            color: theme.palette.text.secondary,
                            mt: 0.5
                          }}
                        >
                          {categoryName}
                          {isExisting && (categoryName ? ' • ' : '') + 'Already added'}
                        </Typography>
                      </Box>
                      <Checkbox
                        checked={isSelected || isExisting}
                        disabled={isExisting}
                        onClick={e => e.stopPropagation()}
                        onChange={() => handleToggleType(type)}
                      />
                    </Box>
                  )
                })}

                {availableTypes.length === 0 && !isTypesLoading && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 200,
                      flexDirection: 'column',
                      p: 4,
                      mt: 6
                    }}
                  >
                    <NoDataFound variant='Meerkat' height={250} width={250} />
                  </Box>
                )}

                {/* Infinite scroll loader */}
                {hasMore && (
                  <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                    {isTypesLoading ? <CircularProgress size={24} /> : null}
                  </Box>
                )}

                {!hasMore && availableTypes.length > 0 && (
                  <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
                    No more types to load
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography
            sx={{
              fontSize: '1.25rem',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurface || theme.palette.text.primary
            }}
          >
            Selected - {selectedTypes.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
            <Button
              variant='outlined'
              fullWidth
              onClick={handleDrawerClose}
              sx={{
                borderColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
                color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main,
                height: '56px'
              }}
            >
              Cancel
            </Button>
            <Button
              variant='contained'
              fullWidth
              onClick={handleSubmit}
              disabled={selectedTypes.length === 0 || isSubmitting}
              sx={{ height: '56px' }}
            >
              {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Add'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddAssessmentTypeDrawer
