import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Typography, Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'
import { useRouter } from 'next/navigation'

import CustomDrawer from '../../../views/pages/housing/utils/CustomDrawer'
import { CellInfo } from 'src/utility/render'
import Search from 'src/views/utility/Search'
import { getAllSections } from 'src/lib/api/housing'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import SectionCard from 'src/views/pages/housing/section/SectionCard'
import { Section } from 'src/types/housing'
import { useTranslation } from 'react-i18next'

interface SectionsDrawerData {
  queryKey: string
  id: number | string
  name?: string
  image?: string
  params: Record<string, unknown>
}

interface SectionsDrawerProps {
  open: boolean
  onClose: () => void
  data: SectionsDrawerData | null
}

interface PageResult {
  result: Section[]
  nextPage: number | undefined
  total: number
}

const SectionsDrawer: React.FC<SectionsDrawerProps> = ({ open, onClose, data }) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')

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
  } = useInfiniteQuery<PageResult>({
    queryKey: [data?.queryKey, data?.id, search, open],
    queryFn: async ({ pageParam }) => {
      const res = await getAllSections({
        ...data?.params,
        page_no: pageParam as number,
        limit: PAGE_SIZE,
        search: search
      })

      const total = res?.data?.total_count || 0
      const loaded = (pageParam as number) * PAGE_SIZE

      return {
        result: res?.data?.result || [],
        nextPage: loaded < total ? (pageParam as number) + 1 : undefined,
        total
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PageResult) => lastPage.nextPage,
    enabled: Boolean(open && !!data?.id && data?.queryKey)
  })

  // Reset local state on open
  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
    }
  }, [open, data?.id])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: [data?.queryKey, data?.id, search, open] })
      queryClient.removeQueries({ queryKey: [data?.queryKey, data?.id, search, open] })
      cooldownRef.current = false // reset cooldown on close
    }
  }, [open, data?.id, search, queryClient])

  const list = useMemo(() => queryData?.pages?.flatMap((page: PageResult) => page?.result) || [], [queryData])
  const total = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  const sectionsLabel = Number(total) > (0 || 1) ? t('sections') : t('section')
  const sectionsHeading = total ? `${sectionsLabel} (${total})` : sectionsLabel

  // cooldownRef to prevent multiple rapid calls
  const cooldownRef = useRef<boolean>(false)

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        // add 300ms cooldown before allowing next fetch
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

  const handleSectionClick = useCallback(
    (sectionId: number | string) => {
      if (!sectionId) return

      router.push(`/housing/sections/${sectionId}`)

      if (onClose) {
        onClose()
      }
    },
    [router, onClose]
  )

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={t('sections')}
      icon='/images/housing/section-icon-colored.png'
      iconColor={theme.palette.primary.main}
    >
      <Box
        sx={{
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors?.OnPrimary,
          paddingX: 4,
          paddingY: 3,
          marginY: 6,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '8px'
        }}
      >
        <CellInfo
          value={data?.name}
          subtitle=""
          imgUrl={data?.image}
          avatarUrl=""
          inchagename=""
          defaultImage=""
          defaultImageAlt=""
          color={(theme.palette as any).customColors?.OnSurfaceVariant}
          subtitleColor={(theme.palette as any).customColors?.secondaryBg}
        />
      </Box>
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        {sectionsHeading}
      </Typography>
      <Box sx={{ my: 2 }}>
        <Search
          sx={{ width: '100%' }}
          textFielsSX={{
            width: '100%',
            height: 52,
            borderRadius: '8px',
            backgroundColor: theme.palette.customColors?.OnPrimary
          }}
          placeholder={t('housing_module.search_section') as string}
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          backgroundColor={theme.palette.customColors?.OnPrimary}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {list.map((section: Section) => (
          <Box
            key={section?.section_id}
            sx={{ cursor: section?.section_id ? 'pointer' : 'default' }}
            onClick={() => handleSectionClick(section?.section_id)}
          >
            <SectionCard section={section} />
          </Box>
        ))}

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
            {t('housing_module.no_sections_found')}
          </Typography>
        )}

        {!hasNextPage && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            {t('housing_module.no_more_sections')}
          </Typography>
        )}
      </Box>
    </CustomDrawer>
  )
}

export default React.memo(SectionsDrawer)
