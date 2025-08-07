import { CircularProgress, Tab, Tabs, Typography, Skeleton } from '@mui/material'
import { Box, Grid } from '@mui/system'
import { useInfiniteQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { getAnimalMedia } from 'src/lib/api/housing'
import MediaCard from 'src/views/utility/MediaCard'
import NoDataFound from 'src/views/utility/NoDataFound'
import Search from 'src/views/utility/Search'

const AnimalMedia = () => {
  const router = useRouter()
  const { id } = router.query

  const [activeTab, setActiveTab] = useState('image')
  const [localSearch, setLocalSearch] = useState('')
  const [search, setSearch] = useState('')

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const PAGE_SIZE = 10

  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, refetch, remove } = useInfiniteQuery({
    queryKey: ['animal-media', id, activeTab, search],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getAnimalMedia({
        animal_id: id,
        type: activeTab,
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search
      })

      console.log('Full API Response:', res)
      console.log('res.data (should be array):', res?.data)
      console.log('res.total_count:', res?.total_count)

      return {
        result: res?.data || [],
        nextPage: res?.data?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total: parseInt(res?.total_count) || 0
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage,
    enabled: !!id
  })

  const media = useMemo(() => data?.pages.flatMap(page => page.result) || [], [data])
  const total = useMemo(() => data?.pages?.[0]?.total || 0, [data])

  const cooldownRef = useRef(false)

  const loadMore = useCallback(() => {
    if (cooldownRef.current || !hasNextPage || isFetchingNextPage) return
    cooldownRef.current = true
    fetchNextPage().finally(() => {
      setTimeout(() => {
        cooldownRef.current = false
      }, 300)
    })
  }, [fetchNextPage, isFetchingNextPage, hasNextPage])

  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue)
    setSearch('')
    setLocalSearch('')
  }

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const getTabLabel = (key, label) => {
    if (activeTab !== key) return label
    if (isFetching && !data) return label

    return total ? `${label} (${total})` : label
  }

  const MediaCardSkeleton = () => (
    <Box
      sx={{
        height: '100%',
        bgcolor: 'common.white',
        position: 'relative',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      {/* File name skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: '1rem', pt: '1.5rem' }}>
        <Skeleton variant='text' width={20} height={20} sx={{ mr: 2 }} />
        <Skeleton variant='text' width={150} height={20} />
      </Box>

      {/* Media content skeleton */}
      <Box sx={{ p: 5 }}>
        <Skeleton variant='rectangular' height={160} sx={{ borderRadius: 2.6 }} />
      </Box>

      {/* Timestamp skeleton */}
      <Box sx={{ px: '1rem', pb: '1rem' }}>
        <Skeleton variant='text' width={120} height={16} />
      </Box>
    </Box>
  )

  // Grid skeleton for loading state
  const MediaGridSkeleton = () => (
    <Grid container spacing={6}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(item => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item}>
          <MediaCardSkeleton />
        </Grid>
      ))}
    </Grid>
  )

  return (
    <>
      <Box>
        <Box sx={{ display: 'inline-block', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 48 }}>
            <Tab value='image' label={getTabLabel('image', 'Images')} />
            <Tab value='document' label={getTabLabel('document', 'Documents')} />
            <Tab value='video' label={getTabLabel('video', 'Videos')} />
          </Tabs>
        </Box>

        <Box sx={{ display: 'none', alignItems: 'center', justifyContent: 'flex-end', gap: 4, mt: 2 }}>
          <Search
            value={localSearch}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            placeholder='Search media…'
          />
        </Box>

        <Box sx={{ mt: 6 }}>
          <Grid container spacing={6}>
            {media.map(file => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.id}>
                <MediaCard media={file} isBorderedCard={true} />
              </Grid>
            ))}
          </Grid>

          {isFetching && media.length === 0 && <MediaGridSkeleton />}

          {media.length === 0 && !isFetching && <NoDataFound height={250} width={250} />}

          {(isFetchingNextPage || hasNextPage) && media.length > 0 && (
            <Box
              ref={loaderRef}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 2
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {!hasNextPage && media.length > 0 && (
            <Typography align='center' sx={{ mt: 6, color: 'text.disabled' }}>
              No more media files to load.
            </Typography>
          )}
        </Box>
      </Box>
    </>
  )
}

export default AnimalMedia
