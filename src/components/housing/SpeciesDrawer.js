import CustomDrawer from '../../views/pages/housing/utils/CustomDrawer'
import { Typography, Divider, CircularProgress } from '@mui/material'

// import SectionCard from './SectionCard'
import { useTheme } from '@mui/material/styles'
import { CellInfo } from 'src/utility/render'
import { Box, height, width } from '@mui/system'
import Search from 'src/views/utility/Search'
import SpeciesCard from '../../views/pages/housing/species/HousingSpeciesCard'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchSpeciesPages,
  resetSpeciesInfiniteScroll,
  updateSpeciesSearch
} from 'src/store/slices/housing/speciesInfiniteScrollSlice'
import debounce from 'lodash/debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import HousingSpeciesCard from '../../views/pages/housing/species/HousingSpeciesCard'

const SpeciesDrawer = ({ open, onClose, data }) => {
  const theme = useTheme()

  const dispatch = useDispatch()

  const { list = [], loading, hasMore, search, total } = useSelector(state => state.speciesInfiniteScroll || {})

  const [localSearch, setLocalSearch] = useState(search || '')

  // Sync search value into local input when drawer opens
  useEffect(() => {
    if (open) setLocalSearch(search || '')
  }, [open, search])

  // Load more on scroll
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchSpeciesPages({ site_id: data.id })) 
    }
  }, [dispatch, data.id, loading, hasMore])

  const loaderRef = useInfiniteScroll(loadMore, loading, hasMore)

  // Reset and fetch when drawer opens
  useEffect(() => {
    if (open) {
      dispatch(resetSpeciesInfiniteScroll())
      dispatch(fetchSpeciesPages({ site_id: data.id }))
    }
  }, [open, data.id, dispatch])

  // Debounced handler that updates search and fetches
  const debouncedUpdate = useMemo(
    () =>
      debounce(value => {
        dispatch(updateSpeciesSearch(value))
        dispatch(fetchSpeciesPages({ site_id: data.id }))
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
      title='Species'
      icon='/images/housing/Enclosure icon.png'
      iconColor={theme.palette.primary.main}
    >
      <Box
        sx={{
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.common.white,
          padding: '12px',
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

      <Typography sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        Species {total ? `(${total})` : ''}
      </Typography>
      <Box sx={{ my: 2, backgroundColor: theme.palette.common.white }}>
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
          onChange={handleSearchChange}
          onClear={handleSearchClear}
        />
      </Box>

      <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {list.map(species => (
          <HousingSpeciesCard
            key={species.id}
            species={species}
            textColor={theme.palette.customColors.OnSurfaceVariant}
          />
        ))}
        {(loading || hasMore) && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={2} mt={2}>
            {loading && <CircularProgress />}
          </Box>
        )}
        {!loading && list.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
            No species found
          </Typography>
        )}

        {!hasMore && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled, p:2,mb:1 }}>
            No more species to load
          </Typography>
        )}
      </Box>
    </CustomDrawer>
  )
}

export default SpeciesDrawer
