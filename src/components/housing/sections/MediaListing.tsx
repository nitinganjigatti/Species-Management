import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Box, Grid, Typography, Tabs, Tab, CircularProgress, Button } from '@mui/material'
import { useParams } from 'next/navigation'
import { useInView } from 'react-intersection-observer'
import debounce from 'lodash/debounce'

import Search from 'src/views/utility/Search'
import NewMediaCard from 'src/views/utility/NewMediaCard'
import { getAllMedia } from 'src/lib/api/housing'
import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import { Media } from 'src/types/housing'
import NoDataFound from 'src/views/utility/NoDataFound'
import Icon from 'src/@core/components/icon'
import AddMediaDrawer from '../sites/AddMediaDrawer'
import { useTranslation } from 'react-i18next'

type MediaTabType = 'image' | 'document' | 'video'

interface MediaPage {
  result: Media[]
  nextPage: number | undefined
  total: number
}

const MediaListing: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<MediaTabType>('image')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [addMediaDrawerOpen, setAddMediaDrawerOpen] = useState<boolean>(false)
  const { id: routerId, sectionId: routerSectionId } = useParams<{ id: string; sectionId: string }>() ?? {}
  const id = routerSectionId || routerId

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const PAGE_SIZE = 10

  // Debounce search input
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, refetch } = useInfiniteQuery<
    MediaPage,
    Error,
    InfiniteData<MediaPage>,
    [string, string | string[] | undefined, MediaTabType, string],
    number
  >({
    queryKey: ['media', id, activeTab, search],
    queryFn: async ({ pageParam }) => {
      const res = await getAllMedia({
        ref_id: id as string,
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
    getNextPageParam: (lastPage: MediaPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!id
  })

  // Clean up on tab/search change
  // useEffect(() => {
  //   return () => remove()
  // }, [activeTab, search, remove])

  const media = useMemo(() => data?.pages.flatMap((page: MediaPage) => page.result) || [], [data])
  const total = useMemo(() => data?.pages?.[0]?.total || 0, [data])

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

  const handleTabChange = (_: React.SyntheticEvent, newValue: MediaTabType): void => {
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
    <Box sx={{ mt: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'inline-block', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 48 }}>
            <Tab value='image' label={getTabLabel('image', t('housing_module.images') as string)} />
            <Tab value='document' label={getTabLabel('document', t('housing_module.documents') as string)} />
            <Tab value='video' label={getTabLabel('video', t('housing_module.videos') as string)} />
          </Tabs>
        </Box>
        <Button
          variant='contained'
          startIcon={<Icon icon='mdi:plus' />}
          onClick={() => setAddMediaDrawerOpen(true)}
          sx={{ height: 44 }}
        >
          {t('housing_module.add_media')}
        </Button>
      </Box>
      {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, mt: 2 }}>
        <Search
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder='Search media...'
        />
      </Box> */}

      <Box sx={{ mt: 6 }}>
        <Grid container spacing={4}>
          {media.map((file: Media) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.media_id || file.id}>
              <NewMediaCard
                fileUrl={file.file}
                fileName={file.file_original_name}
                fileType={file.file_type || file.type}
                user={{
                  created_at: file.created_at,
                  user_profile: {
                    user_full_name: file.user_name,
                    user_profile_pic: file.user_profile_pic
                  }
                }}
                width='100%'
                height='100%'
                showTitle={true}
                ondownloadaction={() => {}}
              />
            </Grid>
          ))}
        </Grid>

        {isFetching && media.length === 0 && (
          <Box display='flex' justifyContent='center' p={2}>
            <CircularProgress />
          </Box>
        )}

        {media.length === 0 && !isFetching && (
          <Box sx={{ py: 8 }}>
            <NoDataFound height={250} width={250} />
          </Box>
        )}

        {(isFetchingNextPage || hasNextPage) && media.length > 0 && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={2}>
            <CircularProgress />
          </Box>
        )}

        {!hasNextPage && media.length > 0 && (
          <Typography align='center' sx={{ mt: 6, color: 'text.disabled' }}>
            {t('housing_module.no_more_media')}
          </Typography>
        )}
      </Box>

      {/* Add Media Drawer */}
      <AddMediaDrawer
        open={addMediaDrawerOpen}
        onClose={() => setAddMediaDrawerOpen(false)}
        refType='section'
        refId={id as string}
        onSuccess={() => refetch()}
      />
    </Box>
  )
}

export default React.memo(MediaListing)
