'use client'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Typography, Box, CircularProgress, Button, Checkbox, FormControlLabel, Avatar } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'

import CustomDrawer from '../../../views/pages/housing/utils/CustomDrawer'
import { CellInfo } from 'src/utility/render'
import Search from 'src/views/utility/Search'
import { getAllSections } from 'src/lib/api/housing'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

interface SectionsDrawerProps {
  open: boolean
  onClose: () => void
  data?: any
  onContinue?: (data: any) => void
  localSelections?: any[]
}

const SectionsDrawer = ({ open, onClose, data, onContinue, localSelections }: SectionsDrawerProps) => {
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
    queryKey: [data?.queryKey, data?.id, search, open],
    queryFn: async ({ pageParam = 1 }: any) => {
      const res: any = await getAllSections({
        ...data?.params,
        page_no: pageParam,
        limit: PAGE_SIZE,
        search
      })

      return {
        result: res?.data?.result || [],
        nextPage: res?.data?.result?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total: res?.data?.total_count || 0
      }
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    enabled: Boolean(open && !!data?.id && data?.queryKey),
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

  // Handle select all/deselect all
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSections([])
    } else {
      setSelectedSections([...list])
    }
    setIsAllSelected(!isAllSelected)
  }

  // Update select all state when selection changes
  useEffect(() => {
    if (list.length > 0) {
      const allSelected = list.every((section: any) =>
        selectedSections.some((selectedSection: any) => selectedSection.section_id === section.section_id)
      )
      setIsAllSelected(allSelected)
    } else {
      setIsAllSelected(false)
    }
  }, [selectedSections, list])

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
      title='Sections'
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
          placeholder='Search for a section'
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
            label='Select All'
            sx={{ mr: 0 }}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {list.map((section: any) => {
          // Check if section is selected by comparing section_id
          const isSelected = selectedSections.some((selectedSection: any) => selectedSection.section_id === section.section_id)

          return (
            <Box
              key={section?.section_id}
              sx={{
                display: 'flex',
                gap: 2,
                p: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0.8,
                bgcolor: theme.palette.common.white,
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
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
                  {(CellInfo as any)({
                    value: section?.section_name,
                    imgUrl: section?.images?.[0]?.file,
                    defaultImage: '/images/housing/section-icon-colored.png',
                    defaultImageAlt: 'section image',
                    inchagename: section?.incharge_name || ''
                  })}
                </Box>
              </Box>
              <Checkbox
                checked={isSelected}
                onChange={() => handleSectionSelect(section)}
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
            No sections found
          </Typography>
        )}

        {!hasNextPage && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            No more sections to load
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
            Continue ({selectedCount})
          </Button>
        </Box>
      )}
    </CustomDrawer>
  )
}

export default React.memo(SectionsDrawer)
