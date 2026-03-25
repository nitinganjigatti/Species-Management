import React, { useState } from 'react'
import { Box, useTheme, Typography, Skeleton } from '@mui/material'
import { TabProps } from 'src/types/housing/animalsOffspring'
import AnimalCard from 'src/views/utility/AnimalCard'
import { useQuery } from '@tanstack/react-query'
import { alpha } from '@mui/material/styles'
import { Icon } from '@iconify/react'
import { getFetusStats, getFetusList } from 'src/lib/api/housing'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'
import FetalDeathDrawer from './FetalDeathDrawer'

const FetalDeath: React.FC<TabProps> = props => {
  const theme = useTheme() as any

  const availableTabs: string[] = ['Still Birth', 'Abortion']
  const [activeTab, setActiveTab] = React.useState<string>(availableTabs[0])
  const [fetusDrawerOpen, setFetusDrawerOpen] = useState<boolean>(false)
  const [selectedFetus, setSelectedFetus] = useState<string | number>('')

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
  }

  const { data: fetusStats, isFetching: isFetusStatsFetching } = useQuery({
    queryKey: ['fetus-stats', props.animalId],
    queryFn: () => getFetusStats({ parent_id: props.animalId }),
    enabled: !!props.animalId
  })

  const fetusStatsData = fetusStats?.data || null

  const { data: fetusData, isFetching: isFetusDataFetching } = useQuery({
    queryKey: ['recent-litter', props.animalId, activeTab],
    queryFn: () =>
      getFetusList({
        parent_id: props.animalId,
        type: activeTab === 'Still Birth' ? 'stillbirth' : 'abortion',
        page_no: 1,
        limit: 10
      }),
    enabled: !!props.animalId
  })
  const fetus = fetusData?.data?.fetus_details || null

  const PillTabs = ({ tabs, activeTab, onTabClick }) => {
    const theme = useTheme() as any

    const tabStatsMap: Record<string, number> = {
      'Still Birth': Number(fetusStatsData?.stillbirth_count ?? 0),
      Abortion: Number(fetusStatsData?.abortion_count ?? 0)
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 5 }}>
        <Box sx={{ display: 'flex', gap: 4 }}>
          {tabs.map(tab => (
            <Box
              key={tab}
              onClick={() => onTabClick(tab)}
              sx={{
                px: 3,
                py: 2,
                borderRadius: '6px',
                backgroundColor:
                  activeTab === tab
                    ? theme.palette.secondary.dark
                    : theme.palette.customColors?.mdAntzNeutral || alpha(theme.palette.grey[500], 0.08),
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Typography
                sx={{
                  color: activeTab === tab ? theme.palette.primary.contrastText : theme.palette.text.primary,
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {tab} - {tabStatsMap[tab]}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <>
      <PillTabs tabs={availableTabs} activeTab={activeTab} onTabClick={handleTabClick} />
      {isFetusDataFetching ? (
        <LoadingSkeleton />
      ) : props.stats.fetal_death_count == 0 ||
        fetus?.length === 0 ||
        (activeTab === 'Still Birth' && fetusStatsData?.stillbirth_count == 0) ||
        (activeTab === 'Abortion' && fetusStatsData?.abortion_count == 0) ? (
        <NoDataFound width={250} height={250} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {fetus?.map((item, index) => {
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
                onClick={() => {
                  setSelectedFetus(item?.fetus_id)
                  setFetusDrawerOpen(true)
                }}
              >
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: { xs: 'flex-start', md: 'center' },
                      flexDirection: { xs: 'column', md: 'row' },
                      justifyContent: { md: 'space-between' }
                    }}
                  >
                    <Typography>
                      Reported by <span style={{ fontWeight: 600 }}>{item.report_by}</span>
                    </Typography>
                    <Typography>
                      {' '}
                      {Utility.convertUtcToLocalReadableDate(item?.discovered)}
                      <span> &bull; </span>
                      {Utility.convertUTCToLocaltime(item?.discovered)}
                    </Typography>
                  </Box>
                  <AnimalCard data={item} cardType='fetus' />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: 4
                  }}
                >
                  <Icon icon={'fe:arrow-right'} fontSize={24} />
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      {fetusDrawerOpen && (
        <FetalDeathDrawer open={fetusDrawerOpen} onClose={() => setFetusDrawerOpen(false)} fetusId={selectedFetus} />
      )}
    </>
  )
}

export default React.memo(FetalDeath)

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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Skeleton width={140} height={20} />
                <Skeleton width={140} height={16} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant='rounded' width={56} height={56} />

                <Box>
                  <Skeleton width={140} height={20} />
                  <Skeleton width={100} height={16} />
                  <Skeleton width={80} height={16} />
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
