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

const EnclosureDrawer = ({ open, onClose, data }) => {
  const theme = useTheme()
  const queryClient = useQueryClient()

  const [localSearch, setLocalSearch] = useState('')
  const [search, setSearch] = useState('')

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
    isFetchingNextPage,
    remove
  } = useInfiniteQuery({
    queryKey: [data?.queryKey, data?.id, search, open],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getAllEnclosures({
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
    getNextPageParam: lastPage => lastPage.nextPage,
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
      remove()
      cooldownRef.current = false // reset cooldown on close
    }
  }, [open, data?.id, search, queryClient, remove])

  const list = useMemo(() => queryData?.pages?.flatMap(page => page?.result) || [], [queryData])
  const total = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  // cooldownRef to prevent multiple rapid calls
  const cooldownRef = useRef(false)

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

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title='Enclosures'
      icon='/images/housing/enclosure-icon-colored.svg'
      iconColor={theme.palette.primary.main}
    >
      <Box
        sx={{
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.common.white,
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
          imgUrl={data?.image}
          color={theme.palette.customColors.OnSurfaceVariant}
          subtitleColor={theme.palette.customColors.secondaryBg}
        />
      </Box>

      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        Enclosures {total ? `(${total})` : ''}
      </Typography>
      <Box sx={{ my: 2 }}>
        <Search
          sx={{ width: '100%' }}
          textFielsSX={{
            width: '100%',
            height: 52,
            borderRadius: '8px',
            backgroundColor: theme.palette.common.white
          }}
          placeholder='Search for a Enclosure'
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          backgroundColor={theme.palette.common.white}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {list.map(enclosure => (
          <Box key={enclosure?.enclosure_id}>
            <SectionCard section={enclosure} />
          </Box>
        ))}

        {isFetching && list.length === 0 && (
          <Box display='flex' justifyContent='center' p={2} mt={2}>
            <CircularProgress />
          </Box>
        )}

        {(isFetchingNextPage || hasNextPage) && list.length > 0 && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={2} mt={2}>
            <CircularProgress />
          </Box>
        )}

        {!isFetching && list.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
            No Enclosures found
          </Typography>
        )}

        {!hasNextPage && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            No more Enclosures to load
          </Typography>
        )}
      </Box>
    </CustomDrawer>
  )
}

export default React.memo(EnclosureDrawer)
