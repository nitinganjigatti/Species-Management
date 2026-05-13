import React, { useCallback, useEffect, useState } from 'react'
import { Box, useTheme, Skeleton, CircularProgress } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import { useInView } from 'react-intersection-observer'

import AnimalCard from 'src/views/utility/AnimalCard'
import NoDataFound from 'src/views/utility/NoDataFound'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'
import { TabProps, AnimalItem } from 'src/types/housing/animalsOffspring'

const Mortality: React.FC<TabProps> = props => {
  const theme = useTheme() as any
  const router = useRouter()
  const [mortality, setMortality] = useState<AnimalItem[]>([])
  const [isMortalityFetching, setIsMortalityFetching] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const fetchMortality = async (pageNo: number = 1) => {
    if (!props.animalId) return

    if (pageNo === 1) {
      setIsMortalityFetching(true)
      setHasMore(true)
    } else {
      setIsFetchingMore(true)
    }

    try {
      const response = await getNewAnimalListWithFilters({
        parent_id: props.animalId,
        is_mother: props.isMother,
        use_case: 'mortality_offspring',
        ignore_permission: 1,
        include_dead_animal: 1,
        page_no: pageNo
      })

      if (response?.success) {
        const result = (response?.data || []) as AnimalItem[]

        if (pageNo === 1) {
          setMortality(result)
        } else {
          setMortality(prev => [...prev, ...result])
        }

        if (result.length < 10) {
          setHasMore(false)
        }
      } else {
        if (pageNo === 1) {
          setMortality([])
        }
        setHasMore(false)
      }
    } catch (error: any) {
      console.error(error?.message)
      if (pageNo === 1) {
        setMortality([])
      }
      setHasMore(false)
    } finally {
      setIsMortalityFetching(false)
      setIsFetchingMore(false)
    }
  }

  const handleAnimalClick = (animalId: string) => {
    router.push(`/animals/${animalId}`)
  }

  const handleLoadMore = useCallback(() => {
    if (isMortalityFetching || isFetchingMore || !hasMore) return

    const nextPage = page + 1
    setPage(nextPage)
    fetchMortality(nextPage)
  }, [isMortalityFetching, isFetchingMore, hasMore, page, props.animalId, props.isMother])

  useEffect(() => {
    if (inView && !isMortalityFetching && !isFetchingMore && hasMore && mortality.length) {
      handleLoadMore()
    }
  }, [inView, isMortalityFetching, isFetchingMore, hasMore, mortality.length, handleLoadMore])

  useEffect(() => {
    setPage(1)
    setMortality([])
    setHasMore(true)
    fetchMortality(1)
  }, [props.animalId, props.isMother])

  if (isMortalityFetching) return <LoadingSkeleton />

  if (!mortality.length) return <NoDataFound />

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {mortality?.map((item, index) => {
          return (
            <Box
              key={item?.animal_id || index}
              sx={{
                p: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'inherit',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.04)
                },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                mb: 2,
                cursor: 'pointer'
              }}
              onClick={() => handleAnimalClick(String(item.animal_id))}
            >
              <Box sx={{ flexGrow: 1 }}>
                <AnimalCard data={item} />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  ml: 4
                }}
              >
                <Icon icon={'fe:arrow-right'} fontSize={30} />
              </Box>
            </Box>
          )
        })}
        {(hasMore || isFetchingMore) && mortality.length > 0 && (
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
      </Box>
    </>
  )
}

export default React.memo(Mortality)

const LoadingSkeleton = () => {
  const theme = useTheme() as any
  return (
    <Box
      sx={{
        borderRadius: '8px',
        overflow: 'hidden',
        mb: 4
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {[1, 2, 3].map((_, index) => (
          <Box
            key={index}
            sx={{
              p: 4,
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2,
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant='rounded' width={56} height={56} />

              <Box>
                <Skeleton width={140} height={20} />
                <Skeleton width={100} height={16} />
                <Skeleton width={80} height={16} />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
