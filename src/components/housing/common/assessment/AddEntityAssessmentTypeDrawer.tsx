import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Button,
  Checkbox,
  CircularProgress,
  Skeleton,
  Tabs,
  Tab
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useInView } from 'react-intersection-observer'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import {
  getAssessmentCategoryList,
  getAssessmentTypeList,
  addAssessmentTypesToEntity,
  getAssessmentTemplatesList,
  assignAssessmentTemplate
} from 'src/lib/api/assessment'
import type { AssessmentCategoryOption, AssessmentTypeOption } from 'src/types/housing/assessment'
import type { AssessmentTemplate } from 'src/lib/api/assessment'
import type { EntityType } from './EntityAssessment'

const PAGE_SIZE = 20
const TEMPLATE_PAGE_SIZE = 10

interface AddEntityAssessmentTypeDrawerProps {
  open: boolean
  onClose: () => void
  entityId: number | string
  entityType: EntityType
  existingTypeIds: string[]
  onSuccess: () => void
}

type TabType = 'types' | 'templates'

const AddEntityAssessmentTypeDrawer: React.FC<AddEntityAssessmentTypeDrawerProps> = ({
  open,
  onClose,
  entityId,
  entityType,
  existingTypeIds,
  onSuccess
}) => {
  const theme = useTheme() as any
  const cooldownRef = useRef(false)

  // Main tab state
  const [selectedTab, setSelectedTab] = useState<TabType>('types')

  // Search
  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  // Categories (for Types tab)
  const [categories, setCategories] = useState<{ label: string; value: string; count?: number }[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(false)

  // Types list
  const [availableTypes, setAvailableTypes] = useState<AssessmentTypeOption[]>([])
  const [isTypesLoading, setIsTypesLoading] = useState<boolean>(false)
  const [typesHasMore, setTypesHasMore] = useState<boolean>(true)
  const [typesPageNo, setTypesPageNo] = useState<number>(1)
  const [typesTotalCount, setTypesTotalCount] = useState<number>(0)

  // Templates list
  const [availableTemplates, setAvailableTemplates] = useState<AssessmentTemplate[]>([])
  const [isTemplatesLoading, setIsTemplatesLoading] = useState<boolean>(false)
  const [templatesHasMore, setTemplatesHasMore] = useState<boolean>(true)
  const [templatesPageNo, setTemplatesPageNo] = useState<number>(1)
  const [templatesTotalCount, setTemplatesTotalCount] = useState<number>(0)

  // Selection
  const [selectedTypes, setSelectedTypes] = useState<{ id: string; label: string }[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<{ id: string; label: string }[]>([])
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
      setSelectedTab('types')
      setLocalSearch('')
      setSearch('')
      setActiveCategory('')
      setSelectedTypes([])
      setSelectedTemplates([])
      fetchCategories()
      resetAndFetchTypes()
      resetAndFetchTemplates()
    }
  }, [open])

  // Fetch categories - use 'housing' ref_type for entity assessments
  const fetchCategories = async () => {
    setIsCategoriesLoading(true)
    try {
      const response = await getAssessmentCategoryList('housing')
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
    setTypesPageNo(1)
    setTypesHasMore(true)
    fetchTypes(1, true)
  }

  // Reset and fetch templates
  const resetAndFetchTemplates = () => {
    setAvailableTemplates([])
    setTemplatesPageNo(1)
    setTemplatesHasMore(true)
    fetchTemplates(1, true)
  }

  // Fetch types - use 'housing' ref_type for entity assessments
  const fetchTypes = useCallback(
    async (page: number, reset: boolean = false) => {
      setIsTypesLoading(true)
      try {
        const params: any = {
          page_no: page,
          ref_type: 'housing'
        }

        if (activeCategory) {
          params.cat_id = activeCategory
        }

        if (search.trim()) {
          params.q = search.trim()
        }

        const response = await getAssessmentTypeList(params)
        if (response?.success) {
          const newTypes = response.data?.result || []
          const total = response.data?.total_count || 0

          setTypesTotalCount(total)

          if (reset) {
            setAvailableTypes(newTypes)
          } else {
            setAvailableTypes(prev => [...prev, ...newTypes])
          }

          const currentTotal = reset ? newTypes.length : availableTypes.length + newTypes.length
          setTypesHasMore(currentTotal < total && newTypes.length === PAGE_SIZE)
        }
      } catch (error) {
        console.error('Error fetching assessment types:', error)
      } finally {
        setIsTypesLoading(false)
      }
    },
    [activeCategory, search, availableTypes.length]
  )

  // Fetch templates
  const fetchTemplates = useCallback(
    async (page: number, reset: boolean = false) => {
      setIsTemplatesLoading(true)
      try {
        const params: any = {
          page_no: page,
          ref_type: 'housing',
          entity_id: entityId,
          entity_type: entityType
        }

        if (search.trim()) {
          params.q = search.trim()
        }

        const response = await getAssessmentTemplatesList(params)
        if (response?.success) {
          const newTemplates = response.data?.result || []
          const total = response.data?.total_count || 0

          setTemplatesTotalCount(total)

          if (reset) {
            setAvailableTemplates(newTemplates)
          } else {
            setAvailableTemplates(prev => [...prev, ...newTemplates])
          }

          const currentTotal = reset ? newTemplates.length : availableTemplates.length + newTemplates.length
          setTemplatesHasMore(currentTotal < total && newTemplates.length === TEMPLATE_PAGE_SIZE)
        }
      } catch (error) {
        console.error('Error fetching assessment templates:', error)
      } finally {
        setIsTemplatesLoading(false)
      }
    },
    [search, availableTemplates.length, entityId, entityType]
  )

  // Refetch when category or search changes (for types)
  useEffect(() => {
    if (open && selectedTab === 'types') {
      resetAndFetchTypes()
    }
  }, [activeCategory])

  // Refetch when search changes
  useEffect(() => {
    if (open) {
      if (selectedTab === 'types') {
        resetAndFetchTypes()
      } else {
        resetAndFetchTemplates()
      }
    }
  }, [search])

  // Infinite scroll
  useEffect(() => {
    if (inView && !cooldownRef.current && open) {
      cooldownRef.current = true

      if (selectedTab === 'types' && typesHasMore && !isTypesLoading) {
        const nextPage = typesPageNo + 1
        setTypesPageNo(nextPage)
        fetchTypes(nextPage, false).finally(() => {
          setTimeout(() => {
            cooldownRef.current = false
          }, 300)
        })
      } else if (selectedTab === 'templates' && templatesHasMore && !isTemplatesLoading) {
        const nextPage = templatesPageNo + 1
        setTemplatesPageNo(nextPage)
        fetchTemplates(nextPage, false).finally(() => {
          setTimeout(() => {
            cooldownRef.current = false
          }, 300)
        })
      } else {
        cooldownRef.current = false
      }
    }
  }, [
    inView,
    typesHasMore,
    templatesHasMore,
    isTypesLoading,
    isTemplatesLoading,
    typesPageNo,
    templatesPageNo,
    open,
    selectedTab
  ])

  // Handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabType) => {
    setSelectedTab(newValue)
    setLocalSearch('')
    setSearch('')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleCategoryClick = (categoryValue: string) => {
    setActiveCategory(categoryValue)
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

  const handleToggleTemplate = (template: AssessmentTemplate) => {
    const templateId = String(template.assessment_template_id)

    // Don't allow toggling already assigned templates
    if (template.status === 'assigned') return

    const templateName = template.template_name || 'Unknown'

    setSelectedTemplates(prev => {
      const isSelected = prev.some(item => String(item.id) === templateId)

      if (isSelected) {
        return prev.filter(item => String(item.id) !== templateId)
      } else {
        return [
          ...prev,
          {
            id: templateId,
            label: templateName
          }
        ]
      }
    })
  }

  const handleDrawerClose = () => {
    onClose()
    setSelectedTypes([])
    setSelectedTemplates([])
  }

  // Submit
  const handleSubmit = async () => {
    const selectedItems = selectedTab === 'types' ? selectedTypes : selectedTemplates

    if (selectedItems.length === 0) {
      Toaster({
        type: 'warning',
        message: `Please select at least one assessment ${selectedTab === 'types' ? 'type' : 'template'}`
      })

      return
    }

    setIsSubmitting(true)
    try {
      if (selectedTab === 'types') {
        // Use existing API for types
        const payload = {
          assessment_types_to_be_removed: JSON.stringify([]),
          new_assessment_types: JSON.stringify(selectedTypes.map(t => t.id))
        }

        const response = await addAssessmentTypesToEntity(entityId, entityType, payload)

        if (response?.success) {
          Toaster({ type: 'success', message: 'Assessment types added successfully' })
          onSuccess()
          handleDrawerClose()
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to add assessment types' })
        }
      } else {
        // Use assign template API for templates
        const payload = {
          ref_id: entityId,
          entity_type: 'assessment_template' as const,
          ref_type: entityType,
          entity_id: selectedTemplates.map(t => t.id)
        }

        const response = await assignAssessmentTemplate(payload)

        if (response?.success) {
          Toaster({ type: 'success', message: 'Assessment templates added successfully' })
          onSuccess()
          handleDrawerClose()
        } else {
          Toaster({ type: 'error', message: response?.message || 'Failed to add assessment templates' })
        }
      }
    } catch (error) {
      console.error('Error adding assessments:', error)
      Toaster({ type: 'error', message: `Failed to add assessment ${selectedTab === 'types' ? 'types' : 'templates'}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCount = selectedTab === 'types' ? selectedTypes.length : selectedTemplates.length
  const isLoading = selectedTab === 'types' ? isTypesLoading : isTemplatesLoading
  const hasMore = selectedTab === 'types' ? typesHasMore : templatesHasMore
  const items = selectedTab === 'types' ? availableTypes : availableTemplates

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
              Add Assessment
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
              placeholder={selectedTab === 'types' ? 'Search Assessment Types' : 'Search Assessment Templates'}
              value={localSearch}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              inputStyle={{ py: '12px', px: '12px' }}
              width='100%'
            />
          </Box>

          {/* Types/Templates Tabs */}
          <Box sx={{ px: 6, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '16px',
                  minWidth: 'auto',
                  px: 4
                },
                '& .Mui-selected': {
                  color: theme.palette.primary.main
                }
              }}
            >
              <Tab label='Types' value='types' />
              <Tab label='Templates' value='templates' />
            </Tabs>
          </Box>

          {/* Category Tabs (only for Types tab) */}
          {selectedTab === 'types' && (
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
                    const isActive = activeCategory === item.value

                    return (
                      <Button
                        key={index}
                        onClick={() => handleCategoryClick(item.value)}
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
                            : theme.palette.customColors?.displaybgSecondary || theme.palette.grey[200],
                          color: isActive
                            ? theme.palette.customColors?.onPrimary
                            : theme.palette.customColors?.OnPrimaryContainer || theme.palette.text.primary,
                          '&:hover': isActive
                            ? {
                                backgroundColor: `${
                                  theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main
                                } !important`
                              }
                            : {
                                backgroundColor:
                                  theme.palette.customColors?.displaybgSecondary || theme.palette.grey[300]
                              }
                        }}
                      >
                        {item.label}
                      </Button>
                    )
                  })}
                </Box>
              )}
            </Box>
          )}

          {/* List Content */}
          <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {isLoading && items.length === 0 ? (
              <Box display='flex' justifyContent='center' alignItems='center' py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {selectedTab === 'types'
                  ? // Types List
                    availableTypes.map(type => {
                      const typeName = type.assessments_type_label || type.assessment_name || 'Unknown'
                      const categoryName = type.label || type.assessment_category_name || ''
                      const typeId = String(type.assessment_type_id)

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
                    })
                  : // Templates List
                    availableTemplates.map(template => {
                      const templateName = template.template_name || 'Unknown'
                      const templateId = String(template.assessment_template_id)
                      const isAssigned = template.status === 'assigned'
                      const isSelected = selectedTemplates.some(item => String(item.id) === templateId)

                      return (
                        <Box
                          key={templateId}
                          onClick={() => handleToggleTemplate(template)}
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
                              : isAssigned
                              ? theme.palette.action.disabledBackground
                              : theme.palette.customColors?.OnPrimary || theme.palette.background.paper,
                            borderRadius: 1,
                            cursor: isAssigned ? 'not-allowed' : 'pointer',
                            opacity: isAssigned ? 0.6 : 1,
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
                              {templateName}
                            </Typography>
                            {isAssigned && (
                              <Typography
                                sx={{
                                  fontSize: '0.85rem',
                                  fontWeight: 400,
                                  color: theme.palette.text.secondary,
                                  mt: 0.5
                                }}
                              >
                                Already added
                              </Typography>
                            )}
                          </Box>
                          <Checkbox
                            checked={isSelected || isAssigned}
                            disabled={isAssigned}
                            onClick={e => e.stopPropagation()}
                            onChange={() => handleToggleTemplate(template)}
                          />
                        </Box>
                      )
                    })}

                {items.length === 0 && !isLoading && (
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
                    {isLoading ? <CircularProgress size={24} /> : null}
                  </Box>
                )}

                {!hasMore && items.length > 0 && (
                  <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
                    No more {selectedTab === 'types' ? 'types' : 'templates'} to load
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
            {selectedCount} {selectedTab === 'types' ? 'Types' : 'Templates'} Selected
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
              disabled={selectedCount === 0 || isSubmitting}
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

export default AddEntityAssessmentTypeDrawer
