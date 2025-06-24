import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Search from 'src/views/utility/Search'
import SelectableSpeciesCard from '../SelectableSpeciesCard'
import { getSpeciesList } from 'src/lib/api/compliance/exports'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import debounce from 'lodash/debounce'

const PAGE_SIZE = 10

const AntzDatabaseTab = ({ data, selectedItems, onToggle, prevSelectedItems }) => {
  const theme = useTheme()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')

  // Debounced search
  const debouncedSearch = useRef(
    debounce(searchValue => {
      setSearch(searchValue)
      setPage(1)
    }, 500)
  ).current

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  const fetchData = useCallback(
    async (pageNum = 1, searchQuery = '') => {
      setIsLoading(true)
      try {
        const res = await getSpeciesList({
          ...data?.params,
          page_no: pageNum,
          limit: PAGE_SIZE,
          q: searchQuery
        })

        const newItems = res?.data?.map(item => ({ ...item, tsn_id: item.tsn })) || []
        const totalCount = res?.data?.length || 0

        setTotal(totalCount)
        setList(prev => (pageNum === 1 ? newItems : [...prev, ...newItems]))
        setHasMore(newItems.length === PAGE_SIZE)
      } finally {
        setIsLoading(false)
      }
    },
    [data?.params]
  )

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchData(nextPage, search)
    }
  }, [isLoading, hasMore, page, search, fetchData])

  const loaderRef = useInfiniteScroll(loadMore, isLoading, hasMore)

  useEffect(() => {
    fetchData(1, search)
  }, [search, fetchData])

  const filteredList = list.filter(species => !prevSelectedItems.some(item => item.tsn_id === species.tsn_id))

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
        placeholder='Search for species'
        value={localSearch}
        onChange={e => {
          const value = e.target.value
          setLocalSearch(value)
          debouncedSearch(value)
        }}
        onClear={() => {
          setLocalSearch('')
          debouncedSearch('')
        }}
        backgroundColor={theme.palette.common.white}
      />

      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, my: 4 }}>Species {total ? `(${total})` : ''}</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 2 }}>
        {filteredList.map(species => (
          <SelectableSpeciesCard
            key={species.tsn_id}
            species={species}
            selected={selectedItems.some(item => item.tsn_id === species.tsn_id)}
            onClick={() => onToggle(species)}
            selectionType='checkbox'
          />
        ))}

        {isLoading && filteredList.length === 0 && (
          <Box display='flex' justifyContent='center' py={2}>
            <CircularProgress />
          </Box>
        )}

        {(isLoading || hasMore) && filteredList.length > 0 && (
          <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && filteredList.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
            No species found
          </Typography>
        )}

        {!hasMore && filteredList.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            No more species to load
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(AntzDatabaseTab)
