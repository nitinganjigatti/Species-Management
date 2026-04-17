'use client'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Typography, Box, CircularProgress, Button, Checkbox, FormControlLabel, Icon, Avatar } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'

import CustomDrawer from '../../../views/pages/housing/utils/CustomDrawer'
import Search from 'src/views/utility/Search'
import { getEnclosureListSectionWise } from 'src/lib/api/housing'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

interface EnclosuresDrawerProps {
  open: boolean
  onClose: () => void
  data?: any
  onContinue?: (data: any) => void
  localSelections?: any[]
}

const EnclosuresDrawer = ({ open, onClose, data, onContinue, localSelections }: EnclosuresDrawerProps) => {
  const theme: any = useTheme()
  const queryClient = useQueryClient()

  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedEnclosures, setSelectedEnclosures] = useState<any[]>(localSelections || [])
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
    queryKey: ['hospital-enclosures', data?.id, search, open],
    queryFn: async ({ pageParam = 1 }: any) => {
      const res: any = await getEnclosureListSectionWise({
        ...data?.params,
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search
      })

      return {
        result: res?.data?.list_items || [],
        nextPage: res?.data?.list_items?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total: res?.data?.total_count || 0
      }
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    enabled: Boolean(open && !!data?.id),
    initialPageParam: 1
  } as any)

  // Reset local state on open
  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
      setIsAllSelected(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: ['hospital-enclosures', data?.id, search, open] })
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

  // Handle individual enclosure selection - works with full enclosure object
  const handleEnclosureSelect = (enclosure: any) => {
    console.log('enclosure', enclosure)
    setSelectedEnclosures((prev: any[]) => {
      const enclosureId = enclosure.enclosure_id || enclosure.id

      const isAlreadySelected = prev.some(
        (selectedEnclosure: any) => (selectedEnclosure.enclosure_id || selectedEnclosure.id) === enclosureId
      )

      if (isAlreadySelected) {
        return prev.filter(
          (selectedEnclosure: any) => (selectedEnclosure.enclosure_id || selectedEnclosure.id) !== enclosureId
        )
      } else {
        return [...prev, enclosure]
      }
    })
  }

  // Handle select all/deselect all
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEnclosures([])
    } else {
      setSelectedEnclosures([...list])
    }
    setIsAllSelected(!isAllSelected)
  }

  // Update select all state when selection changes
  useEffect(() => {
    if (list.length > 0) {
      const allSelected = list.every((enclosure: any) =>
        selectedEnclosures.some(
          (selectedEnclosure: any) =>
            (selectedEnclosure.enclosure_id || selectedEnclosure.id) === (enclosure.enclosure_id || enclosure.id)
        )
      )
      setIsAllSelected(allSelected)
    } else {
      setIsAllSelected(false)
    }
  }, [selectedEnclosures, list])

  // Handle continue button click
  const handleContinue = () => {
    if (onContinue) {
      onContinue({
        selectedEnclosures: selectedEnclosures.map((enclosure: any) => enclosure.enclosure_id || enclosure.id),
        selectedEnclosureData: selectedEnclosures,
        totalSelected: selectedEnclosures.length
      })
    }

    onClose()
  }

  const selectedCount = selectedEnclosures.length

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title='Enclosures'
      icon='/images/housing/enclosure-icon-colored.svg'
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
          placeholder='Search for an enclosure'
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
        {list.map((enclosure: any) => {
          const enclosureId = enclosure.enclosure_id || enclosure.id

          // Check if enclosure is selected by comparing enclosure_id or id
          const isSelected = selectedEnclosures.some(
            (selectedEnclosure: any) => (selectedEnclosure.enclosure_id || selectedEnclosure.id) === enclosureId
          )

          return (
            <Box
              key={enclosureId}
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
                transition: 'all 0.2s ease',
                ...(isSelected && {
                  borderColor: theme.palette.success.main,
                  bgcolor: '#f8fff8'
                })
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={enclosure?.images?.[0]?.file}
                  alt={enclosure?.user_enclosure_name}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 0.5
                  }}
                />
                <Box>
                  <Typography variant='subtitle1' sx={{ fontWeight: 500, mb: 0.5 }}>
                    {enclosure.user_enclosure_name || enclosure.name}
                  </Typography>
                  {(enclosure.enclosure_type || enclosure.type) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' color='textSecondary'>
                        {enclosure.enclosure_type || enclosure.type}
                      </Typography>
                    </Box>
                  )}
                  {(enclosure.capacity || enclosure.animal_capacity) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Icon {...({ icon: 'mdi:account-group-outline' } as any)} fontSize={16} color='textSecondary' />
                      <Typography variant='body2' color='textSecondary'>
                        Capacity: {enclosure.capacity || enclosure.animal_capacity}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              <Checkbox
                checked={isSelected}
                onChange={() => handleEnclosureSelect(enclosure)}
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
            No enclosures found
          </Typography>
        )}

        {!hasNextPage && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            No more enclosures to load
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

export default React.memo(EnclosuresDrawer)
