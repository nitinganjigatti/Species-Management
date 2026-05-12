import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Search from 'src/views/utility/Search'
import SelectableSpeciesCard from 'src/views/pages/compliance/documents/exports/SelectableSpeciesCard'
import { getSpeciesList } from 'src/lib/api/compliance/exports'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import type { AntzDatabaseTabProps } from 'src/types/compliance'
import type { Species } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

type SpeciesPage = { result: Species[]; nextPage: number | undefined; total: number }

const PAGE_SIZE = 10

const AntzDatabaseTab = ({ data, selectedItems, onToggle, prevSelectedItems }: AntzDatabaseTabProps) => {
  const { t } = useTranslation()
  const theme = useTheme()

  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')

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
  } = useInfiniteQuery<SpeciesPage, Error, InfiniteData<SpeciesPage>, readonly unknown[], number>({
    queryKey: ['antzSpecies', data?.params, search] as const,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await (getSpeciesList as any)({
        ...data?.params,
        page: pageParam,
        limit: PAGE_SIZE,
        q: search
      })

      const items: Species[] = (res?.data?.data || []).map((item: any) => ({
        ...item,
        tsn_id: item.taxonomy_id,
        id: item.taxonomy_id,
        isFromAntzDatabase: true
      }))

      return {
        result: items,
        nextPage: items.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total: res?.data?.total_count || 0
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage,
    enabled: true
  })

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

  const list = useMemo(() => queryData?.pages?.flatMap(page => page?.result) || [], [queryData])
  const total = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  const filteredList = useMemo(
    () => list.filter(species => !prevSelectedItems.some(item => item.tsn_id === species.tsn_id)),
    [list, prevSelectedItems]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Search
        sx={{ width: '100%' }}
        textFielsSX={{
          width: '100%',
          height: 52,
          borderRadius: '8px',
          backgroundColor: theme.palette.common.white
        }}
        placeholder={t('compliance_module.search_for_species')}
        value={localSearch}
        onChange={handleSearchChange}
        onClear={handleSearchClear}
        backgroundColor={theme.palette.common.white}
      />

      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, my: 4 }}>
        {t('species')} {total ? `(${total})` : ''}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 2 }}>
        {filteredList.map(species => (
          <SelectableSpeciesCard
            key={species.tsn_id}
            species={species}
            selected={selectedItems.some(item => item.tsn_id === species.tsn_id)}
            onClick={() => onToggle(species)}
            selectionType='radio'
          />
        ))}

        {isFetching && filteredList.length === 0 && (
          <Box display='flex' justifyContent='center' py={2}>
            <CircularProgress />
          </Box>
        )}

        {(isFetchingNextPage || hasNextPage) && filteredList.length > 0 && (
          <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
            <CircularProgress />
          </Box>
        )}

        {!isFetching && filteredList.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
            {t('compliance_module.no_species_found')}
          </Typography>
        )}

        {!hasNextPage && filteredList.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            {t('compliance_module.no_more_species_to_load')}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(AntzDatabaseTab)
