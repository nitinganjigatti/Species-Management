import { CircularProgress, Tab, Tabs, Typography, Skeleton, Button } from '@mui/material'
import { Box, Grid } from '@mui/system'
import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import { debounce, DebouncedFunc } from 'lodash'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { getAnimalMedia } from 'src/lib/api/housing'
import MediaCard from 'src/views/utility/MediaCard'
import NoDataFound from 'src/views/utility/NoDataFound'
import Search from 'src/views/utility/Search'
import { Media } from 'src/types/housing'
import Icon from 'src/@core/components/icon'
import AddMediaDrawer from '../sites/AddMediaDrawer'
import { useTranslation } from 'react-i18next'

interface MediaPageResult {
  result: Media[]
  nextPage: number | undefined
  total: number
}

interface AnimalMediaProps {
  animalId?: number | string
}

const AnimalMedia: React.FC<AnimalMediaProps> = ({ animalId: propAnimalId }) => {
  const router = useSafeRouter()
  const { id } = router.query
  const resolvedId = propAnimalId != null ? String(propAnimalId) : Array.isArray(id) ? id[0] : id
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState<string>('image')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [addMediaDrawerOpen, setAddMediaDrawerOpen] = useState<boolean>(false)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const PAGE_SIZE = 10

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, refetch } = useInfiniteQuery<
    MediaPageResult,
    Error,
    InfiniteData<MediaPageResult>,
    [string, string | string[] | undefined, string, string]
  >({
    queryKey: ['animal-media', resolvedId, activeTab, search],
    queryFn: async ({ pageParam = 1 }) => {
      const animalId = resolvedId

      const res = await getAnimalMedia({
        animal_id: Number(animalId),
        type: activeTab,
        page_no: pageParam as number,
        limit: PAGE_SIZE,
        q: search
      })

      // API returns { success, data: Media[], total_count: N } — `data` is the array directly,
      // `total_count` is at the root. Defensive fallback to `data.result` for envelopes that wrap.
      const rawData = (res as { data?: unknown })?.data
      const mediaItems: Media[] = Array.isArray(rawData)
        ? (rawData as Media[])
        : Array.isArray((rawData as { result?: Media[] })?.result)
        ? (rawData as { result: Media[] }).result
        : []
      const totalCount =
        (res as { total_count?: number })?.total_count ?? (rawData as { total_count?: number })?.total_count ?? 0

      return {
        result: mediaItems,
        nextPage: mediaItems.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        total: (res as any)?.total_count || totalCount
      }
    },
    getNextPageParam: (lastPage: MediaPageResult) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!resolvedId
  })

  const media = useMemo(() => data?.pages.flatMap((page: MediaPageResult) => page.result) || [], [data])
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

  const handleTabChange = (_: React.SyntheticEvent, newValue: string): void => {
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

  const getTabLabel = (key: string, label: string): string => {
    if (activeTab !== key) return label
    if (isFetching && !data) return label

    return total ? `${label} (${total})` : label
  }

  const MediaCardSkeleton: React.FC = () => (
    <Box
      sx={{
        height: '100%',
        bgcolor: 'customColors.OnPrimary',
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
  const MediaGridSkeleton: React.FC = () => (
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
      <Box sx={{ mt: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'inline-block', borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 48 }}>
              <Tab value='image' label={getTabLabel('image', t('animals_module.images'))} />
              <Tab value='document' label={getTabLabel('document', t('animals_module.documents'))} />
              <Tab value='video' label={getTabLabel('video', t('animals_module.videos'))} />
            </Tabs>
          </Box>
          <Button
            variant='contained'
            startIcon={<Icon icon='mdi:plus' />}
            onClick={() => setAddMediaDrawerOpen(true)}
            sx={{ height: 44 }}
          >
            {t('animals_module.add_media')}
          </Button>
        </Box>

        <Box sx={{ display: 'none', alignItems: 'center', justifyContent: 'flex-end', gap: 4, mt: 2 }}>
          <Search
            value={localSearch}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            placeholder={t('animals_module.search_media') as string}
          />
        </Box>

        <Box sx={{ mt: 6 }}>
          <Grid container spacing={6}>
            {media.map((file: Media) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={(file as any).id || (file as any).media_id}>
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
              {t('animals_module.no_more_media_files_to_load')}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Add Media Drawer */}
      <AddMediaDrawer
        open={addMediaDrawerOpen}
        onClose={() => setAddMediaDrawerOpen(false)}
        refType='animal'
        refId={resolvedId as string}
        onSuccess={() => refetch()}
      />
    </>
  )
}

export default AnimalMedia
