import { useEffect, useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Typography, Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CustomDrawer from '../utils/CustomDrawer'
import SectionCard from './SectionCard'
import { CellInfo } from 'src/utility/render'
import Search from 'src/views/utility/Search'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import {
  fetchSectionPages,
  resetSectionInfiniteScroll,
  updateSectionSearch
} from 'src/store/slices/housing/sectionInfiniteScrollSlice'
import debounce from 'lodash/debounce'

const SectionsDrawer = ({ open, onClose, data }) => {
  const theme = useTheme()
  const dispatch = useDispatch()

  const { list = [], loading, hasMore, search } = useSelector(state => state.sectionInfiniteScroll || {})

  const [localSearch, setLocalSearch] = useState(search || '')

  // Sync search value into local input when drawer opens
  useEffect(() => {
    if (open) setLocalSearch(search || '')
  }, [open, search])

  // Load more on scroll
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchSectionPages({ site_id: data.id }))
    }
  }, [dispatch, data.id, loading, hasMore])

  const loaderRef = useInfiniteScroll(loadMore, loading, hasMore)

  // Reset and fetch when drawer opens
  useEffect(() => {
    if (open) {
      dispatch(resetSectionInfiniteScroll())
      dispatch(fetchSectionPages({ site_id: data.id }))
    }
  }, [open, data.id, dispatch])

  // Debounced handler that updates search and fetches
  const debouncedUpdate = useMemo(
    () =>
      debounce(value => {
        dispatch(updateSectionSearch(value))
        dispatch(fetchSectionPages({ site_id: data.id }))
      }, 500),
    [dispatch, data.id]
  )

  useEffect(() => {
    return () => {
      debouncedUpdate.cancel()
    }
  }, [debouncedUpdate])

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedUpdate(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedUpdate('')
  }

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title='Sections'
      icon='/images/housing/section-icon-colored.png'
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
        <CellInfo value={data?.name} imgUrl={data?.image} />
      </Box>

      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        Sections {list.length > 0 ? `(${list.length})` : ''}
      </Typography>

      <Box sx={{ mt: 2, mb: 3, backgroundColor: theme.palette.common.white }}>
        <Search
          sx={{ width: '100%' }}
          textFielsSX={{
            width: '100%',
            height: 52,
            borderRadius: '8px',
            backgroundColor: theme.palette.common.white
          }}
          placeholder='Search for a section'
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {list.map(section => (
          <SectionCard key={section.id} section={section} />
        ))}

        {(loading || hasMore) && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={2} mt={2}>
            {loading && <CircularProgress />}
          </Box>
        )}

        {!loading && list.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
            No sections found
          </Typography>
        )}

        {!hasMore && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            No more sections to load
          </Typography>
        )}
      </Box>
    </CustomDrawer>
  )
}

export default SectionsDrawer
