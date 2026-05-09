'use client'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Checkbox,
  FormControlLabel,
  Avatar,
  Chip,
  Tooltip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'

import CustomDrawer from '../../../views/pages/housing/utils/CustomDrawer'
import { CellInfo as CellInfoComponent } from 'src/utility/render'
const CellInfo = CellInfoComponent as any
import Search from 'src/views/utility/Search'
import { getAllSections } from 'src/lib/api/housing'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

interface SectionsDrawerProps {
  open: boolean
  onClose: () => void
  data?: any
  onContinue?: (data: any) => void
  localSelections?: any[]
  disabledIds?: any[]
  showCount?: boolean
  fetchFn?: (params: any) => Promise<any>
  fetchParams?: Record<string, any>
}

const SectionsDrawer = ({
  open,
  onClose,
  data,
  onContinue,
  localSelections,
  disabledIds = [],
  showCount = false,
  fetchFn,
  fetchParams
}: SectionsDrawerProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const queryClient = useQueryClient()

  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedSections, setSelectedSections] = useState<any[]>(localSelections || [])
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false)

  const PAGE_SIZE = 10

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage
  } = useInfiniteQuery<any>({
    queryKey: [data?.queryKey, data?.id, search, open, !!fetchFn],
    queryFn: async ({ pageParam = 1 }: any) => {
      let result: any[] = []
      let total = 0

      if (fetchFn) {
        const res: any = await fetchFn({
          ...(fetchParams || {}),
          page_no: pageParam,
          limit: PAGE_SIZE,
          q: search
        })
        result = res?.data?.result || []
        total = res?.data?.total_count || 0
      } else {
        const res: any = await getAllSections({
          ...data?.params,
          page_no: pageParam,
          limit: PAGE_SIZE,
          search
        })
        result = res?.data?.result || []
        total = res?.data?.total_count || 0
      }

      return {
        result,
        nextPage: result?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total
      }
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    enabled: Boolean(open && data?.queryKey && (fetchFn || !!data?.id)),
    initialPageParam: 1
  } as any)

  // Reset local state on open
  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
      setIsAllSelected(false)
    }
  }, [open, data?.id])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: [data?.queryKey, data?.id, search, open] })
      cooldownRef.current = false
    }
  }, [open, data?.id, search, queryClient])

  const list: any[] = useMemo(() => queryData?.pages?.flatMap((page: any) => page?.result) || [], [queryData])
  const total: number = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  // cooldownRef to prevent multiple rapid calls
  const cooldownRef = useRef<boolean>(false)

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  // Handle individual section selection - works with full section object
  const handleSectionSelect = (section: any) => {
    setSelectedSections((prev: any[]) => {
      const isAlreadySelected = prev.some((selectedSection: any) => selectedSection.section_id === section.section_id)

      if (isAlreadySelected) {
        return prev.filter((selectedSection: any) => selectedSection.section_id !== section.section_id)
      } else {
        return [...prev, section]
      }
    })
  }

  // Excludes disabled items from select all
  const selectableList = useMemo(
    () => list.filter((section: any) => !disabledIds.includes(section.section_id)),
    [list, disabledIds]
  )

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSections([])
    } else {
      setSelectedSections([...selectableList])
    }
    setIsAllSelected(!isAllSelected)
  }

  // Update select all state when selection changes
  useEffect(() => {
    if (selectableList.length > 0) {
      const allSelected = selectableList.every((section: any) =>
        selectedSections.some((selectedSection: any) => selectedSection.section_id === section.section_id)
      )
      setIsAllSelected(allSelected)
    } else {
      setIsAllSelected(false)
    }
  }, [selectedSections, selectableList])

  // Handle continue button click
  const handleContinue = () => {
    // Call parent callback with selected data
    if (onContinue) {
      onContinue({
        selectedSections: selectedSections.map((section: any) => section.section_id),
        selectedSectionData: selectedSections,
        totalSelected: selectedSections.length
      })
    }

    // Close drawer
    onClose()
  }

  const selectedCount = selectedSections.length

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={t('hospital_module.sections') as string}
      icon='/images/housing/section-icon-colored.png'
      iconColor={theme.palette.primary.main}
    >
      <Box sx={{ my: 2 }}>
        <Search
          sx={{ width: '100%' }}
          textFielsSX={{
            width: '100%',
            height: 52,
            borderRadius: '8px',
            backgroundColor: theme.palette.common.white
          }}
          placeholder={t('hospital_module.search_for_a_section') as string}
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          backgroundColor={theme.palette.common.white}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {list.length > 0 && (
          <FormControlLabel
            control={
              <Checkbox
                checked={isAllSelected}
                onChange={handleSelectAll}
                indeterminate={selectedCount > 0 && !isAllSelected}
              />
            }
            label={t('hospital_module.select_all') as string}
            sx={{ mr: 0 }}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {list.map((section: any) => {
          const isSelected = selectedSections.some(
            (selectedSection: any) => selectedSection.section_id === section.section_id
          )
          const isDisabled = disabledIds.includes(section.section_id)

          return (
            <Box
              key={section?.section_id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0.8,
                bgcolor: isDisabled ? theme.palette.action.disabledBackground : theme.palette.common.white,
                justifyContent: 'space-between',
                cursor: isDisabled ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isDisabled ? 0.6 : 1,
                ...(isSelected && {
                  borderColor: theme.palette.success.main,
                  backgroundColor: '#f8fff8'
                })
              }}
            >
              {showCount ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <Avatar
                    src={
                      section?.images?.[0]?.file || section?.default_icon || '/images/housing/section-icon-colored.png'
                    }
                    alt={section?.section_name}
                    sx={{ width: 40, height: 40, borderRadius: 0.5 }}
                  >
                    {section?.section_name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant='subtitle1' sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                      {section?.section_name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ backgroundColor: theme.palette.customColors?.mdAntzNeutral, borderRadius: '4px' }}>
                        <Typography sx={{ fontWeight: 500, fontSize: '12px', p: 1.5 }}>
                          {`Enclosures ${section?.enclosure_count ?? 0}`}
                        </Typography>
                      </Box>
                      <Box sx={{ backgroundColor: theme.palette.customColors?.mdAntzNeutral, borderRadius: '4px' }}>
                        <Typography sx={{ fontWeight: 500, fontSize: '12px', p: 1.5 }}>
                          {`Animals ${section?.animal_count ?? 0}`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      width: '100%',
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <CellInfo
                      value={section?.section_name}
                      imgUrl={section?.images?.[0]?.file || section?.default_icon}
                      defaultImage='/images/housing/section-icon-colored.png'
                      defaultImageAlt='section image'
                      inchagename={section?.incharge_name || ''}
                    />
                  </Box>
                </Box>
              )}
              <Checkbox
                checked={isDisabled || isSelected}
                disabled={isDisabled}
                onChange={() => handleSectionSelect(section)}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                sx={{
                  mt: 0.5,
                  color: '#37BD69',
                  '&.Mui-checked': {
                    color: '#37BD69'
                  }
                }}
              />
            </Box>
          )
        })}

        {isFetching && list.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 2,
              mt: 2
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {(isFetchingNextPage || hasNextPage) && list.length > 0 && (
          <Box
            ref={loaderRef}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 2,
              mt: 2
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {!isFetching && list.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
            {t('hospital_module.no_sections_found')}
          </Typography>
        )}

        {!hasNextPage && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            {t('hospital_module.no_more_sections_to_load')}
          </Typography>
        )}
      </Box>

      {/* Sticky continue button at bottom */}
      {selectedCount > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: '570px', // Exact drawer width
            maxWidth: '100vw',
            margin: '0 auto', // Center it
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            p: 2,
            zIndex: theme.zIndex.drawer + 1
          }}
        >
          <Button variant='contained' onClick={handleContinue} fullWidth size='large'>
            {t('hospital_module.continue')} ({selectedCount})
          </Button>
        </Box>
      )}
    </CustomDrawer>
  )
}

export default React.memo(SectionsDrawer)
