import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Typography, Drawer, IconButton, Button, Checkbox, Skeleton, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import debounce from 'lodash/debounce'

import { getAvailableSitesForCluster, assignSitesToCluster, getAllSites } from 'src/lib/api/housing'
import type { AvailableSiteItem } from 'src/lib/api/housing'
import { CellInfo } from 'src/utility/render'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'

interface AddSiteToClusterDrawerProps {
  open: boolean
  onClose: () => void
  clusterId: number
  assignedSiteIds?: number[]
  onSuccess?: () => void
}

interface PageResult {
  result: AvailableSiteItem[]
  nextPage: number | undefined
  total: number
}

const PAGE_SIZE = 10

const AddSiteToClusterDrawer: React.FC<AddSiteToClusterDrawerProps> = ({
  open,
  onClose,
  clusterId,
  assignedSiteIds = [],
  onSuccess
}) => {
  const theme = useTheme() as any
  const queryClient = useQueryClient()

  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [selectedSites, setSelectedSites] = useState<AvailableSiteItem[]>([])

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef<boolean>(false)
  const prevOpenRef = useRef(false)

  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Fetch available sites with pagination
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery<PageResult>({
    queryKey: ['available-sites-for-cluster', clusterId, search, open],
    queryFn: async ({ pageParam }) => {
      const res = await getAvailableSitesForCluster({
        cluster_id: clusterId,
        page_no: pageParam as number,
        limit: PAGE_SIZE,
        q: search
      })

      const resultData = res?.data?.result || []
      const totalCount = res?.data?.total_count || 0

      return {
        result: resultData,
        nextPage: resultData.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        total: totalCount
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PageResult) => lastPage.nextPage,
    enabled: Boolean(open && clusterId)
  })

  // Fetch all currently assigned sites for this cluster (to disable them in the list)
  const { data: assignedSitesData } = useQuery({
    queryKey: ['cluster-assigned-sites', clusterId, open],
    queryFn: async () => {
      const res = await getAllSites({
        cluster_id: clusterId,
        limit: 1000 // Fetch all assigned sites
      })

      return res?.data?.result || []
    },
    enabled: Boolean(open && clusterId)
  })

  // Get all assigned site IDs (from both passed prop and fetched data)
  const allAssignedSiteIds = useMemo(() => {
    const fetchedIds = (assignedSitesData || []).map((site: any) => site.site_id)
    const uniqueIds = new Set([...assignedSiteIds, ...fetchedIds])

    return Array.from(uniqueIds)
  }, [assignedSiteIds, assignedSitesData])

  // Mutation for assigning sites
  const assignMutation = useMutation({
    mutationFn: (siteIds: number[]) =>
      assignSitesToCluster({
        cluster_id: clusterId,
        cluster_sites: siteIds,
        will_add: 1
      }),
    onSuccess: response => {
      // Check if API returned success: false
      if (response?.success === false) {
        Toaster({ type: 'error', message: response?.message || 'Failed to assign sites' })

        return
      }

      Toaster({ type: 'success', message: response?.message || 'Sites assigned successfully' })
      // Only invalidate cluster stats, site listing will be refetched by onSuccess callback
      queryClient.invalidateQueries({ queryKey: ['cluster-detail-stats', String(clusterId)] })
      queryClient.invalidateQueries({ queryKey: ['cluster-assigned-sites', clusterId] })
      onSuccess?.()
      handleDrawerClose()
    },
    onError: (error: any) => {
      Toaster({
        type: 'error',
        message: error?.response?.data?.message || 'Failed to assign sites'
      })
    }
  })

  // Initialize when drawer opens
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setLocalSearch('')
      setSearch('')
      setSelectedSites([])
    }
    prevOpenRef.current = open
  }, [open])

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: ['available-sites-for-cluster', clusterId, search] })
      cooldownRef.current = false
    }
  }, [open, clusterId, search, queryClient])

  const sites = useMemo(() => queryData?.pages?.flatMap((page: PageResult) => page?.result) || [], [queryData])

  // Get only available (non-assigned) sites for selection logic
  const availableSites = useMemo(
    () =>
      sites.filter(site => !site.is_assigned && site.is_assigned !== 1 && !allAssignedSiteIds.includes(site.site_id)),
    [sites, allAssignedSiteIds]
  )

  // Check if a site is already assigned to the cluster
  // Check both API flag and fetched assigned site IDs
  const isSiteAssigned = (site: AvailableSiteItem): boolean => {
    return site.is_assigned === true || site.is_assigned === 1 || allAssignedSiteIds.includes(site.site_id)
  }

  const loadMore = () => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const isSiteSelected = (siteId: number): boolean => {
    return selectedSites.some(s => s.site_id === siteId)
  }

  const handleToggleSite = (site: AvailableSiteItem) => {
    if (isSiteSelected(site.site_id)) {
      setSelectedSites(prev => prev.filter(s => s.site_id !== site.site_id))
    } else {
      setSelectedSites(prev => [...prev, site])
    }
  }

  const isAllSelected = useMemo((): boolean => {
    if (availableSites.length === 0) return false

    return availableSites.every(site => isSiteSelected(site.site_id))
  }, [availableSites, selectedSites])

  const handleToggleAll = () => {
    if (isAllSelected) {
      const siteIdsToRemove = availableSites.map(s => s.site_id)
      setSelectedSites(prev => prev.filter(s => !siteIdsToRemove.includes(s.site_id)))
    } else {
      const newSelections = availableSites.filter(site => !isSiteSelected(site.site_id))
      setSelectedSites(prev => [...prev, ...newSelections])
    }
  }

  const handleAssign = () => {
    if (selectedSites.length === 0) {
      Toaster({ type: 'error', message: 'Please select at least one site' })

      return
    }
    const siteIds = selectedSites.map(s => s.site_id)
    assignMutation.mutate(siteIds)
  }

  const handleDrawerClose = () => {
    setLocalSearch('')
    setSearch('')
    setSelectedSites([])
    onClose()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleDrawerClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            backgroundColor: theme.palette.customColors?.Background,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.customColors?.OnPrimary,
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
            backgroundColor: theme.palette.customColors?.OnPrimary,
            px: 5,
            py: 4,
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Box component='img' src='/images/housing/Site.svg' alt='Site' sx={{ width: 28, height: 28 }} />
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              Add Sites
            </Typography>
          </Box>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
            <Icon icon='mdi:close' fontSize={30} />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ px: 6, pt: 6, pb: 3, flexShrink: 0 }}>
          <Search
            placeholder='Search Sites'
            value={localSearch}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            inputStyle={{ py: '12px', px: '12px' }}
            width='100%'
            autoFocus
          />
        </Box>

        {/* Select All Toggle */}
        {!isFetching && availableSites.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 6,
              py: 2,
              flexShrink: 0,
              cursor: 'pointer'
            }}
            onClick={handleToggleAll}
          >
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 500,
                color: theme.palette.customColors?.OnSurfaceVariant
              }}
            >
              {isAllSelected ? 'Deselect all' : 'Select all'}
            </Typography>
            <Checkbox checked={isAllSelected} />
          </Box>
        )}

        {/* Sites List */}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {isFetching && sites.length === 0 ? (
              <>
                {[1, 2, 3, 4, 5, 6].map(item => (
                  <Skeleton
                    key={item}
                    variant='rectangular'
                    height={72}
                    sx={{
                      borderRadius: 1,
                      bgcolor: theme.palette.action.hover
                    }}
                  />
                ))}
              </>
            ) : (
              <>
                {sites.length === 0 && !isFetching ? (
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
                    <Typography
                      sx={{
                        mt: 2,
                        color: theme.palette.text.secondary,
                        fontSize: '0.875rem'
                      }}
                    >
                      {localSearch ? 'No sites found' : 'No sites available'}
                    </Typography>
                  </Box>
                ) : (
                  sites.map(site => {
                    const isSelected = isSiteSelected(site.site_id)
                    const isAssigned = isSiteAssigned(site)

                    return (
                      <Box
                        key={site.site_id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 4,
                          border: isSelected
                            ? `1px solid ${theme.palette.primary.main}`
                            : `1px solid ${theme.palette.customColors?.SurfaceVariant}`,
                          backgroundColor: isAssigned
                            ? theme.palette.action.disabledBackground
                            : isSelected
                            ? theme.palette.customColors?.Surface
                            : theme.palette.customColors?.OnPrimary,
                          borderRadius: 1,
                          cursor: isAssigned ? 'not-allowed' : 'pointer',
                          opacity: isAssigned ? 0.6 : 1,
                          transition: 'background 0.2s, border-color 0.2s'
                        }}
                        onClick={() => !isAssigned && handleToggleSite(site)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <CellInfo
                            value={site.site_name}
                            subtitle={isAssigned ? 'Already added' : site.site_description || ''}
                            imgUrl={site.images?.[0]?.file}
                            defaultImage='/images/housing/site-icon-colored.svg'
                            defaultImageAlt='site'
                            avatarUrl=''
                            inchagename=''
                            color={
                              isAssigned ? theme.palette.text.disabled : theme.palette.customColors?.OnSurfaceVariant
                            }
                            subtitleColor={
                              isAssigned ? theme.palette.text.disabled : theme.palette.customColors?.secondaryBg
                            }
                          />
                        </Box>
                        <Checkbox checked={isAssigned || isSelected} disabled={isAssigned} />
                      </Box>
                    )
                  })
                )}

                {/* Loader for infinite scroll */}
                {(isFetchingNextPage || hasNextPage) && sites.length > 0 && (
                  <Box
                    ref={loaderRef}
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      p: 2,
                      mt: 2
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
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
            backgroundColor: theme.palette.customColors?.OnPrimary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            boxShadow: '0px -1px 10px 0px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Typography
            sx={{
              fontSize: '1.25rem',
              fontWeight: 500,
              color: theme.palette.customColors?.OnSurface
            }}
          >
            Selected - {selectedSites.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
            <Button
              variant='outlined'
              fullWidth
              onClick={handleDrawerClose}
              sx={{
                borderColor: theme.palette.customColors?.OnPrimaryContainer,
                color: theme.palette.customColors?.OnPrimaryContainer,
                height: '56px'
              }}
            >
              Cancel
            </Button>
            <Button
              variant='contained'
              fullWidth
              onClick={handleAssign}
              disabled={selectedSites.length === 0 || assignMutation.isPending}
              sx={{ height: '56px' }}
            >
              {assignMutation.isPending ? <CircularProgress size={24} color='inherit' /> : 'Add'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddSiteToClusterDrawer
