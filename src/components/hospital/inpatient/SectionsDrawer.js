import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Typography, Box, CircularProgress, Button, Checkbox, FormControlLabel } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'

import CustomDrawer from '../../../views/pages/housing/utils/CustomDrawer'
import { CellInfo } from 'src/utility/render'
import Search from 'src/views/utility/Search'
import { getAllSections } from 'src/lib/api/housing'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

const SectionsDrawer = ({ open, onClose, data, onContinue, localSelections }) => {
  const theme = useTheme()
  const queryClient = useQueryClient()

  const [localSearch, setLocalSearch] = useState('')
  const [search, setSearch] = useState('')
  const [selectedSections, setSelectedSections] = useState(localSelections || [])
  const [isAllSelected, setIsAllSelected] = useState(false)

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
    isFetchingNextPage,
    remove
  } = useInfiniteQuery({
    queryKey: [data?.queryKey, data?.id, search, open],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getAllSections({
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
    getNextPageParam: lastPage => lastPage.nextPage,
    enabled: Boolean(open && !!data?.id && data?.queryKey)
  })

  // Reset local state on open
  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')

    //   setIsAllSelected(false)
    }
  }, [open, data?.id])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: [data?.queryKey, data?.id, search, open] })
      cooldownRef.current = false // reset cooldown on close
    }
  }, [open, data?.id, search, queryClient])

  const list = useMemo(() => queryData?.pages?.flatMap(page => page?.result) || [], [queryData])
  const total = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  // cooldownRef to prevent multiple rapid calls
  const cooldownRef = useRef(false)

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

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  // Handle individual section selection
  const handleSectionSelect = sectionId => {
    setSelectedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId)
      } else {
        return [...prev, sectionId]
      }
    })
  }

  // Handle select all/deselect all
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSections([])
    } else {
      const allSectionIds = list.map(section => section.section_id)
      setSelectedSections(allSectionIds)
    }
    setIsAllSelected(!isAllSelected)
  }

  // Update select all state when selection changes
  useEffect(() => {
    if (list.length > 0) {
      const allSelected = list.every(section => selectedSections.includes(section.section_id))
      setIsAllSelected(allSelected)
    } else {
      setIsAllSelected(false)
    }
  }, [selectedSections, list])

  // Handle continue button click
  const handleContinue = () => {
    const selectedSectionData = list.filter(section => selectedSections.includes(section.section_id))

    // Call parent callback with selected data
    if (onContinue) {
      onContinue({
        selectedSections: selectedSections,
        selectedSectionData,
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

      {/* Selected count and continue button */}
      {/* {selectedCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            p: 2,
            backgroundColor: theme.palette.action.hover,
            borderRadius: '8px'
          }}
        >
          <Typography>
            {selectedCount} section{selectedCount !== 1 ? 's' : ''} selected
          </Typography>
          <Button variant='contained' onClick={handleContinue} sx={{ minWidth: 120 }}>
            Continue
          </Button>
        </Box>
      )} */}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {list.map(section => {
          const isSelected = selectedSections.includes(section.section_id)
          
          return (
            <Box key={section?.section_id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    backgroundColor: theme.palette.common.white,
                    padding: 4,
                    width: '100%',
                    display: 'flex',
                    borderRadius: '8px',
                    gap: 4,
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <CellInfo
                    value={section?.section_name}
                    imgUrl={section?.images?.[0]?.file}
                    defaultImage={'/images/housing/section-icon-colored.png'}
                    defaultImageAlt={'section image'}
                    inchagename={section?.incharge_name || ''}
                  />
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleSectionSelect(section.section_id)}
                    sx={{ 
                      mt: 0.5,
                      color: '#37BD69',
                      '&.Mui-checked': {
                        color: '#37BD69'
                      }
                    }}
                  />
                </Box>
              </Box>
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
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: theme.palette.background.paper,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    p: 2,
                    mx: -4,
                    mb: -4
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
