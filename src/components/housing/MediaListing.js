import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Grid, Typography, Tabs, Tab, CircularProgress } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { fetchMedia, setParams } from 'src/store/slices/housing/mediaSlice'
import Search from 'src/views/utility/Search'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import { ExportButton } from 'src/views/utility/render-snippets'
import { debounce } from 'lodash'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import MediaCard from 'src/views/utility/MediaCard'

const MediaListing = () => {
  const [activeTab, setActiveTab] = useState('image')
  const { list: media, total, loading, page, pageSize, search } = useSelector(state => state.media)
  const dispatch = useDispatch()
  const router = useRouter()
  const { id } = router.query
  const loaderRef = useRef(null)

  useEffect(() => {
    if (!id) return

    const handler = () =>
      dispatch(
        fetchMedia({
          ref_id: id,
          ref_type: 'site',
          filter_type: activeTab,
          page,
          pageSize,
          search
        })
      )

    handler()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, id, activeTab, page, pageSize])

  const handleTabChange = (event, newValue) => {
    console.log('newValue', newValue)

    setActiveTab(newValue)
    dispatch(setParams({ page: 1, list: [] }))
  }

  // Debounced search handler (to avoid too many dispatches)
  const debouncedSearch = useCallback(
    debounce(value => {
      dispatch(setParams({ search: value, page: 1, list: [] }))
    }, 500),
    [dispatch]
  )

  // Call debounced search on input change
  const handleSearch = value => {
    debouncedSearch(value)
  }

  const hasMore = media.length < total

  useInfiniteScroll({
    targetRef: loaderRef,
    onIntersect: () => {
      if (!loading && hasMore) {
        dispatch(setParams({ page: page + 1 }))
      }
    },
    enabled: hasMore
  })

  const getTabLabel = (tabKey, label) => {
    if (activeTab !== tabKey) return label

    if (loading) return label

    return total > 0 ? `${label} (${total})` : label
  }

  return (
    <Box>
      <Box sx={{ display: 'inline-block', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 48 }}>
          <Tab value='image' label={getTabLabel('image', 'Images')} />
          <Tab value='document' label={getTabLabel('document', 'Documents')} />
          <Tab value='video' label={getTabLabel('video', 'Videos')} />
        </Tabs>
      </Box>

      {/* <ListingHeader title='Media Library' totalCount={total} /> */}

      {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, mt: 2 }}>
          <Search
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search media…'
          />
          <ExportButton loading={false} onClick={() => {}} />
        </Box> */}

      <Box p={2} sx={{ p: 2, mt: 4 }}>
        <Grid container spacing={6}>
          {media.map(file => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
              <MediaCard media={file} isBorderedCard />
            </Grid>
          ))}
        </Grid>

        {loading && (
          <Box display='flex' justifyContent='center' p={2}>
            <CircularProgress />
          </Box>
        )}

        {!loading && !hasMore && media.length > 0 && (
          <Typography variant='body2' align='center' sx={{ mt: 6 }}>
            No more media files to load.
          </Typography>
        )}

        <div ref={loaderRef} style={{ height: 1 }} />
      </Box>
    </Box>
  )
}

export default MediaListing
