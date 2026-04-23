import React, { useState, useEffect, useCallback } from 'react'
import { Box, useTheme, Skeleton, Divider, CircularProgress } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useInView } from 'react-intersection-observer'

import NoDataFound from 'src/views/utility/NoDataFound'
import { TabProps, ClutchItem } from 'src/types/housing/animalsOffspring'
import ClutchDrawer from './ClutchDrawer'
import { getClutchList } from 'src/lib/api/housing'
import ClutchView from './ClutchView'

const Clutch: React.FC<TabProps> = props => {
  const [clutchDrawerOpen, setClutchDrawerOpen] = useState<boolean>(false)
  const [clutch, setClutch] = useState<ClutchItem[]>([])
  const [isClutchFetching, setIsClutchFetching] = useState<boolean>(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [selectedClutch, setSelectedClutch] = useState<ClutchItem | null>(null)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const fetchClutch = async (pageNo: number = 1) => {
    if (!props.animalId) return

    if (pageNo === 1) {
      setIsClutchFetching(true)
      setHasMore(true)
    } else {
      setIsFetchingMore(true)
    }

    try {
      const response = await getClutchList({
        animal_id: props.animalId,
        page_no: pageNo
      })
      if (response?.success) {
        const result = response.data?.result as ClutchItem[] | undefined

        if (pageNo === 1) {
          setClutch(result ?? [])
        } else {
          setClutch(prev => [...prev, ...(result ?? [])])
        }

        if ((result ?? []).length < 10) {
          setHasMore(false)
        }
      } else {
        if (pageNo === 1) {
          setClutch([])
        }
        setHasMore(false)
      }
    } catch (error: any) {
      console.error(error?.message)
      if (pageNo === 1) {
        setClutch([])
      }
      setHasMore(false)
    } finally {
      setIsClutchFetching(false)
      setIsFetchingMore(false)
    }
  }

  const handleClutchDrawerClose = () => {
    setClutchDrawerOpen(false)
    setSelectedClutch(null)
  }

  const handleLoadMore = useCallback(() => {
    if (isClutchFetching || isFetchingMore || !hasMore) return

    const nextPage = page + 1
    setPage(nextPage)
    fetchClutch(nextPage)
  }, [isClutchFetching, isFetchingMore, hasMore, page, props.animalId])

  useEffect(() => {
    if (inView && !isClutchFetching && !isFetchingMore && hasMore && clutch.length) {
      handleLoadMore()
    }
  }, [inView, isClutchFetching, isFetchingMore, hasMore, clutch.length, handleLoadMore])

  useEffect(() => {
    setPage(1)
    setClutch([])
    setHasMore(true)
    fetchClutch(1)
  }, [props.animalId])

  if (isClutchFetching) return <ClutchSkeleton />

  if (!clutch || clutch.length === 0) {
    return <NoDataFound />
  }

  return (
    <>
      {clutch?.map((item, index) => {
        return (
          <ClutchView
            key={item?.clutch_id || index}
            clutchDetails={item}
            sx={{ mb: 4 }}
            onClick={() => {
              setSelectedClutch(item)
              setClutchDrawerOpen(true)
            }}
          />
        )
      })}
      {(hasMore || isFetchingMore) && clutch.length > 0 && (
        <Box
          ref={loaderRef}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4
          }}
        >
          {isFetchingMore && <CircularProgress size={24} />}
        </Box>
      )}
      {clutchDrawerOpen && (
        <ClutchDrawer open={clutchDrawerOpen} onClose={handleClutchDrawerClose} clutchDetails={selectedClutch} />
      )}
    </>
  )
}

export default React.memo(Clutch)

const ClutchSkeleton = () => {
  const theme = useTheme() as any

  return (
    <>
      {[1, 2, 3].map((_, index) => (
        <Box
          key={index}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            overflow: 'hidden',
            mb: 3
          }}
        >
          <Box
            sx={{
              p: 4,
              backgroundColor: alpha(theme.palette.customColors.addPrimary, 0.1),
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Skeleton width={120} height={22} />

            <Box sx={{ display: 'flex', gap: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant='circular' width={20} height={20} />
                <Skeleton width={120} height={18} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant='rectangular' width={20} height={20} />
                <Skeleton width={120} height={18} />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ mx: 4, my: 6 }}>
              <Skeleton variant='rounded' width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>

            <Box sx={{ mx: 4, my: 6 }}>
              <Skeleton variant='rounded' width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>

            <Box sx={{ mx: 4, my: 6 }}>
              <Skeleton variant='rounded' width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>

          <Divider />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mx: 4,
              my: 3
            }}
          >
            <Skeleton width={80} height={20} />
            <Skeleton width={80} height={20} />
            <Skeleton width={80} height={20} />
          </Box>
        </Box>
      ))}
    </>
  )
}
