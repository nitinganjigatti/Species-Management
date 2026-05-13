'use client'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Checkbox,
  FormControlLabel,
  Icon,
  Avatar,
  Tooltip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'
import CustomDrawer from '../../../views/pages/housing/utils/CustomDrawer'
import Search from 'src/views/utility/Search'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'

interface SitesDrawerProps {
  open: boolean
  onClose: () => void
  data?: any
  onContinue?: (data: any) => void
  localSelections?: any[]
  disabledIds?: any[]
}

const SitesDrawer = ({ open, onClose, data, onContinue, localSelections, disabledIds = [] }: SitesDrawerProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const queryClient = useQueryClient()

  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedSites, setSelectedSites] = useState<any[]>(localSelections || [])
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
    queryKey: ['hospital-sites', search, open],
    queryFn: async ({ pageParam = 1 }: any) => {
      const res: any = await getZooWiseSiteLists({
        ...data?.params,
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search
      })

      return {
        result: res?.data?.result || [],
        nextPage: res?.data?.result?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total: res?.data?.total_count || 0
      }
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    enabled: Boolean(open),
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
      queryClient.cancelQueries({ queryKey: ['hospital-sites', search, open] })
      cooldownRef.current = false
    }
  }, [open, search, queryClient])

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

  // Handle individual site selection - works with full site object
  const handleSiteSelect = (site: any) => {
    console.log('site', site)
    setSelectedSites((prev: any[]) => {
      const isAlreadySelected = prev.some((selectedSite: any) => selectedSite.site_id === site.site_id)

      if (isAlreadySelected) {
        return prev.filter((selectedSite: any) => selectedSite.site_id !== site.site_id)
      } else {
        return [...prev, site]
      }
    })
  }

  // Excludes disabled items from select all
  const selectableList = useMemo(
    () => list.filter((site: any) => !disabledIds.includes(site.site_id)),
    [list, disabledIds]
  )

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSites([])
    } else {
      setSelectedSites([...selectableList])
    }
    setIsAllSelected(!isAllSelected)
  }

  useEffect(() => {
    if (selectableList.length > 0) {
      const allSelected = selectableList.every((site: any) =>
        selectedSites.some((selectedSite: any) => selectedSite.site_id === site.site_id)
      )
      setIsAllSelected(allSelected)
    } else {
      setIsAllSelected(false)
    }
  }, [selectedSites, selectableList])

  // Handle continue button click
  const handleContinue = () => {
    if (onContinue) {
      onContinue({
        selectedSites: selectedSites.map((site: any) => site.site_id),
        selectedSiteData: selectedSites,
        totalSelected: selectedSites.length
      })
    }

    onClose()
  }

  const selectedCount = selectedSites.length

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={t('hospital_module.sites') as string}
      icon='/images/housing/site-icon-colored.svg'
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
          placeholder={t('hospital_module.search_for_site') as string}
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
        {list.map((site: any) => {
          // Check if site is selected by comparing site_id
          const isSelected = selectedSites.some((selectedSite: any) => selectedSite.site_id === site.site_id)
          const isDisabled = disabledIds.includes(site.site_id)

          return (
            <Box
              key={site.site_id}
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
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                onClick={() => handleSiteSelect(site)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={site.site_image}
                    alt={site.site_name}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 0.5
                    }}
                  />
                  <Box sx={{ width: 400 }}>
                    <Tooltip title={site.site_name}>
                      <Typography variant='subtitle1' noWrap sx={{ fontWeight: 500, mb: 0.5 }}>
                        {site.site_name}
                      </Typography>
                    </Tooltip>
                    {site.site_owner && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon {...({ icon: 'mdi:account-outline' } as any)} fontSize={16} color='textSecondary' />
                        <Typography variant='body2' color='textSecondary'>
                          {site.site_owner}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                <Checkbox
                  checked={isDisabled || isSelected}
                  disabled={isDisabled}
                  onChange={() => handleSiteSelect(site)}
                  sx={{ mt: 0.5 }}
                />
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
            {t('hospital_module.no_sites_found')}
          </Typography>
        )}

        {!hasNextPage && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            {t('hospital_module.no_more_sites')}
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

export default React.memo(SitesDrawer)
