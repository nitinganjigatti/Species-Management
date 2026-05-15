import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Typography, Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'

import CustomDrawer from '../../../views/pages/housing/utils/CustomDrawer'
import { CellInfo } from 'src/utility/render'
import Search from 'src/views/utility/Search'
import { getAllEnclosures } from 'src/lib/api/housing'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import SectionCard from 'src/views/pages/housing/section/SectionCard'
import EnclosureCard from 'src/views/pages/housing/enclosures/EnclosureCard'
import { useRouter } from 'next/navigation'
import { Enclosure } from 'src/types/housing'
import { useTranslation } from 'react-i18next'

interface EnclosureDrawerData {
  queryKey: string
  id: number | string
  name?: string
  image?: string
  params: Record<string, unknown>
}

interface EnclosureDrawerProps {
  open: boolean
  onClose: () => void
  data: EnclosureDrawerData | null
}

interface PageResult {
  result: Enclosure[]
  nextPage: number | undefined
  total: number
}

const EnclosureDrawer: React.FC<EnclosureDrawerProps> = ({ open, onClose, data }) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const PAGE_SIZE = 20

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
      const res = await getAllEnclosures({
        ...data?.params,
        page_no: pageParam as number,
        limit: PAGE_SIZE,
        q: search
      })

      return {
        result: res?.data?.result || [],
        nextPage: res?.data?.result?.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        total: res?.data?.total_count || 0
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

  const enclosureLabel = Number(total) === (0 || 1) ? t('navigation.enclosure') : t('enclosures')
  const enclosureHeading = total ? `${enclosureLabel} (${total})` : enclosureLabel

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

  const handleEnclosureClick = useCallback(
    (enclosure: Enclosure) => {
      if (!enclosure?.enclosure_id) return
      router.push(`/housing/enclosure/${enclosure.enclosure_id}?enclosureTab=enclosures`)
    },
    [router]
  )

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={t('enclosures')}
      icon='/images/housing/enclosure-icon-colored.svg'
      iconColor={theme.palette.primary.main}
    >
      {data?.name && (
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
            subtitle=''
            imgUrl={data?.image}
            avatarUrl=''
            inchagename=''
            defaultImage={'/images/housing/enclosure-icon-colored.svg'}
            defaultImageAlt={t('enclosure')}
            color={(theme.palette as any).customColors?.OnSurfaceVariant}
            subtitleColor={(theme.palette as any).customColors?.secondaryBg}
          />
        </Box>
      )}
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        {enclosureHeading}
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
          placeholder={t('housing_module.search_for_enclosure') as string}
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          backgroundColor={theme.palette.customColors?.OnPrimary}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {list.map((enclosure: Enclosure) => (
          <Box key={enclosure?.enclosure_id}>
            <EnclosureCard enclosure={enclosure} onClick={() => handleEnclosureClick(enclosure)} />
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
            {t('housing_module.no_enclosure_found')}
          </Typography>
        )}

        {!hasNextPage && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            {t('housing_module.no_more_enclosure_to_load')}
          </Typography>
        )}
      </Box>
    </CustomDrawer>
  )
}

export default React.memo(EnclosureDrawer)
