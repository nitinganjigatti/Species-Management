import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Typography, Box, CircularProgress, Card } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'

import CustomDrawer from '../../../views/pages/housing/utils/CustomDrawer'
import { CellInfo } from 'src/utility/render'
import Search from 'src/views/utility/Search'
import { getAllAnimalList } from 'src/lib/api/housing'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import AnimalCard from 'src/views/pages/housing/animals/AnimalCard'
import SpeciesInnerCard from 'src/views/pages/housing/species/SpeciesInnerCard'
import { useRouter } from 'next/router'

const AnimalsDrawer = ({ open, onClose, data, totalCount, defaultImage, objectFit }) => {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [localSearch, setLocalSearch] = useState('')
  const [search, setSearch] = useState('')

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
    isFetchingNextPage,
    remove
  } = useInfiniteQuery({
    queryKey: [data?.queryKey, data?.id, search, open],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getAllAnimalList({
        ...data?.params,
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search
      })

      return {
        result: res?.data || [],
        nextPage: res?.data?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total: res?.total_count || 0
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage,
    enabled: Boolean(open && !!data?.id && !!data?.queryKey)
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
      queryClient.cancelQueries({ queryKey: [data?.queryKey, data?.id, search] })
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

  const handleAnimalClick = animalId => {
    router.push(`/housing/animals/${animalId}`)
  }

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title='Animals'
      icon='/images/housing/Enclosure icon.png'
      iconColor={theme.palette.primary.main}
    >
      {data?.name && (
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
          {data?.queryKey === 'cluster-animals-drawer' || data?.queryKey === 'enclosure-wise-species-drawer' ? (
            <>
              <SpeciesInnerCard
                completeName={data?.complete_name}
                imgUrl={data?.default_icon || defaultImage}
                commonName={data?.common_name}
                sex={data?.sex_data}
                animalCount={data?.animal_count}
              />
            </>
          ) : (
            <CellInfo
              value={data?.name}
              imgUrl={data?.image}
              defaultImage={defaultImage}
              color={theme.palette.customColors.OnSurfaceVariant}
              subtitleColor={theme.palette.customColors.secondaryBg}
              objectFit={objectFit}
            />
          )}
        </Box>
      )}
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        Animals {totalCount || total ? `(${totalCount || total})` : ''}
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
          placeholder='Search for animals'
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          backgroundColor={theme.palette.common.white}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {list.map(animal => (
          <Box key={animal?.animal_id} onClick={() => handleAnimalClick(animal?.animal_id)}>
            <AnimalCard
              data={animal}
              textColor={theme.palette.customColors.OnSurfaceVariant}
              animalParentCardStyle={{
                border: `1px solid transparent`,
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#37BD69',
                  background: '#F2FFF8'
                }
              }}
            />
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
            No animals found
          </Typography>
        )}

        {!hasNextPage && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            No more animals to load
          </Typography>
        )}
      </Box>
    </CustomDrawer>
  )
}

export default React.memo(AnimalsDrawer)
