import React from 'react'
import { Box, useTheme, Skeleton } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'

import AnimalCard from 'src/views/utility/AnimalCard'
import NoDataFound from 'src/views/utility/NoDataFound'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'
import { TabProps ,AnimalItem} from 'src/types/housing/animalsOffspring'

const Mortality: React.FC<TabProps> = props => {
  const theme = useTheme() as any
  const router = useRouter()

  const { data: mortalityData, isFetching: isMortalityFetching } = useQuery({
    queryKey: ['recent-litter', props.animalId],
    queryFn: () =>
      getNewAnimalListWithFilters({
        parent_id: props.animalId,
        is_mother: props.isMother,
        use_case: 'mortality_offspring',
        ignore_permission: 1,
        include_dead_animal: 1,
        page_no: 1
      }),
    enabled: !!props.animalId
  })
  const mortality: AnimalItem[] | null = mortalityData?.data || null

  const handleAnimalClick = (animalId: string) => {
    router.push(`/housing/animals/${animalId}`)
  }

  if (isMortalityFetching) return <LoadingSkeleton />
    
  if (!mortality || mortality.length === 0) return <NoDataFound />

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {mortality?.map((item, index) => {
          return (
            <Box
              key={index}
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
              onClick={() => handleAnimalClick(item.animal_id)}
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
          mb:4
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