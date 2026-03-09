import { CircularProgress, Grid, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useInfiniteQuery } from '@tanstack/react-query'
import { debounce, DebouncedFunc } from 'lodash'
import { useRouter, NextRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState, SyntheticEvent } from 'react'
import { useInView } from 'react-intersection-observer'
import { getAllMedia } from 'src/lib/api/housing'
import MediaCard from 'src/views/utility/MediaCard'
import Search from 'src/views/utility/Search'

type MediaTabType = 'image' | 'document' | 'video'

interface MediaFile {
  id: number
  file?: string
  file_name?: string
  file_type?: string
  file_size?: number
  [key: string]: unknown
}

interface PageResult {
  result: MediaFile[]
  nextPage: number | undefined
  total: number
}

const MediaListing: React.FC = () => {
  const router: NextRouter = useRouter()
  const { id } = router.query

  const [activeTab, setActiveTab] = useState<MediaTabType>('image')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const PAGE_SIZE = 10

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['media', id, activeTab, search],
    queryFn: async ({ pageParam }) => {
      const res = await getAllMedia({
        ref_id: id as string,
        ref_type: 'enclosure',
        filter_type: activeTab,
        page_no: pageParam as number,
        limit: PAGE_SIZE,
        q: search
      })

      return {
        result: res?.data?.result || [],
        nextPage: (res?.data?.result?.length || 0) === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        total: res?.data?.total_count || 0
      }
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!id
  })

  const media: MediaFile[] = useMemo(() => data?.pages.flatMap((page: any) => page.result) || [], [data])
  const total: number = useMemo(() => data?.pages?.[0]?.total || 0, [data])

  const cooldownRef = useRef<boolean>(false)

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

  const handleTabChange = (_: SyntheticEvent, newValue: MediaTabType): void => {
    setActiveTab(newValue)
    setSearch('')
    setLocalSearch('')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = (): void => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const getTabLabel = (key: MediaTabType, label: string): string => {
    if (activeTab !== key) return label
    if (isFetching && !data) return label

    return total ? `${label} (${total})` : label
  }

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

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, mt: 2 }}>
          {/* <Search
            value={localSearch}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            placeholder='Search media…'
          /> */}
        </Box>

        <Box sx={{ mt: 6 }}>
          <Grid container spacing={6}>
            {media.map((file: MediaFile) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.id}>
                <MediaCard media={file} isBorderedCard />
              </Grid>
            ))}
          </Grid>

          {isFetching && media.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 2
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {media.length === 0 && !isFetching && (
            <Typography align='center' sx={{ mt: 6 }}>
              No media found.
            </Typography>
          )}

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

export default MediaListing
