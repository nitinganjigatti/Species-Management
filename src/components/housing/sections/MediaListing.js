import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Box, Grid, Typography, Tabs, Tab, CircularProgress } from '@mui/material'
import { useRouter } from 'next/router'
import { useInView } from 'react-intersection-observer'
import debounce from 'lodash/debounce'

import Search from 'src/views/utility/Search'
import MediaCard from 'src/views/utility/MediaCard'
import { getAllMedia, getMediaList } from 'src/lib/api/housing' // Replace with your actual API function
import { useInfiniteQuery } from '@tanstack/react-query'

const MediaListing = () => {
  const [activeTab, setActiveTab] = useState('image')
  const [localSearch, setLocalSearch] = useState('')
  const [search, setSearch] = useState('')
  const { id } = useRouter().query

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const PAGE_SIZE = 10

  // Debounce search input
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, refetch, remove } = useInfiniteQuery({
    queryKey: ['media', id, activeTab, search],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getAllMedia({
        ref_id: id,
        ref_type: 'section',
        filter_type: activeTab,
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
    getNextPageParam: lastPage => lastPage.nextPage,
    enabled: !!id
  })

  // Clean up on tab/search change
  // useEffect(() => {
  //   return () => remove()
  // }, [activeTab, search, remove])

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

  return (
    <Box>
      <Box sx={{ display: 'inline-block', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 48 }}>
          <Tab value='image' label={getTabLabel('image', 'Images')} />
          <Tab value='document' label={getTabLabel('document', 'Documents')} />
          <Tab value='video' label={getTabLabel('video', 'Videos')} />
        </Tabs>
      </Box>

      {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, mt: 2 }}>
        <Search
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder='Search media…'
        />
      </Box> */}

      <Box sx={{ mt: 6 }}>
        <Grid container spacing={6}>
          {media.map(file => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.id}>
              <MediaCard media={file} isBorderedCard />
            </Grid>
          ))}
        </Grid>

        {isFetching && media.length === 0 && (
          <Box display='flex' justifyContent='center' p={2}>
            <CircularProgress />
          </Box>
        )}

        {media.length === 0 && !isFetching && (
          <Typography align='center' sx={{ mt: 6 }}>
            No media found.
          </Typography>
        )}

        {(isFetchingNextPage || hasNextPage) && media.length > 0 && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={2}>
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
  )
}

export default React.memo(MediaListing)
