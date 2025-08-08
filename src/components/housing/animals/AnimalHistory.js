import { Box, flex, Grid } from '@mui/system'
import { debounce } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import { Typography, Skeleton } from '@mui/material'
import { useTheme } from '@emotion/react'
import AnimalDetailsHistory from 'src/views/pages/housing/animals/AnimalDetailsHistory'
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator
} from '@mui/lab'
import { getAnimalHistory } from 'src/lib/api/housing'
import { useRouter } from 'next/router'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'

const data = [
  {
    label: 'Current Enclosure',
    time: '12:22 PM',
    enclosure: 'Enclosure - 232',
    section: 'Quail Section',
    site: 'Gagva',
    date: '21 Mar 2024',
    reporter: 'Naveen Kumar'
  },
  {
    label: 'Previous Enclosure',
    time: '12:22 PM',
    enclosure: 'Enclosure - 232',
    section: 'Quail Section',
    site: 'Gagva',
    date: '21 Jan 2024',
    reporter: 'Naveen Kumar'
  }
]

const AnimalHistory = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [inputValue, setInputValue] = useState('')
  const [animalHistory, setAnimalHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchHistoryData = async () => {
    setLoading(true)

    try {
      const params = {
        animal_id: id
      }

      await getAnimalHistory(params).then(res => {
        if (res?.success === true) {
          setAnimalHistory(res?.data?.result)
          setLoading(false)
        }
      })
    } catch (error) {
      console.error(error, 'Cannot fetch Animal History')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchHistoryData()
    }
  }, [id])

  const handleSearch = value => {}

  const formatHistoryData = historyData => {
    return historyData.map((item, index) => ({
      id: item.id,
      label: index === 0 ? 'Current Enclosure' : 'Previous Enclosure',
      time: Utility.convertUTCToLocaltime(item.in_date),
      enclosure: item.user_enclosure_name,
      section: item.section_name,
      site: item.site_name,
      inDate: Utility.formatDisplayDate(item.in_date),
      outDate: item.out_date ? Utility.formatDisplayDate(item.out_date) : null,
      totalInmates: item.total_inmates,
      reporter: 'System',
      rawData: item
    }))
  }

  // Skeleton component for timeline items
  const TimelineSkeleton = () => (
    <Timeline
      position='right'
      sx={{
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0
        }
      }}
    >
      {[1, 2, 3].map((item, idx) => (
        <TimelineItem key={item}>
          <TimelineSeparator
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Skeleton variant='circular' width={40} height={40} />
            {idx < 2 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              justifyContent: 'flex-start',
              width: '100%',
              py: 0,
              pl: 2
            }}
          >
            {/* Left side - Timeline info skeleton */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                minWidth: '200px',
                justifyContent: 'center'
              }}
            >
              <Skeleton variant='text' width={140} height={20} />
              <Skeleton variant='text' width={120} height={24} />
              <Skeleton variant='text' width={80} height={16} />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: 1,
                  p: 4,
                  borderRadius: 1,
                  background: theme.palette.customColors.displaybgPrimary,
                  width: { xs: '100%', md: '400px' },
                  maxWidth: '400px',
                  mt: 1
                }}
              >
                <Skeleton variant='text' width={180} height={20} />
                <Skeleton variant='text' width={160} height={20} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Skeleton variant='circular' width={16} height={16} />
                  <Skeleton variant='text' width={120} height={20} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Skeleton variant='rectangular' width={16} height={16} />
                  <Skeleton variant='text' width={120} height={20} />
                </Box>
                <Skeleton variant='text' width={200} height={20} />
              </Box>
            </Box>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )

  return (
    <>
      <Grid container sx={{ mt: 6 }}>
        <Grid size={{ xs: 12 }} sx={{ display: 'none' }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Search
              value={inputValue}
              onChange={e => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
              placeholder='Search…'
              sx={{ justifyContent: 'flex-end' }}
            />
          </Grid>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              width: '100%',
              height: '48px',
              background: 'rgba(0, 0, 0, 0.05)',
              py: 3,
              pl: 3,
              display: 'none',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 2
            }}
          >
            <Icon icon='mdi-calendar-blank' />
            <Typography sx={{ fontWeight: 500, color: theme.palette.common.black, fontSize: '20px' }}>
              {animalHistory.length > 0
                ? Utility.formatDisplayDate(animalHistory[0]?.in_date)
                : Utility.formatDisplayDate(new Date())}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ width: '100%' }}>
          {loading ? (
            <TimelineSkeleton />
          ) : animalHistory.length > 0 ? (
            <Timeline
              position='right'
              sx={{
                [`& .${timelineItemClasses.root}:before`]: {
                  flex: 0,
                  padding: 0
                }
              }}
            >
              {formatHistoryData(animalHistory).map((item, idx) => (
                <TimelineItem key={item.id}>
                  <TimelineSeparator
                    sx={{
                      py: '6px',
                      '& span': {
                        ml: '1px',
                        background: 'transparent',
                        width: '1px',
                        height: '100%',
                        backgroundImage: `repeating-linear-gradient(
                        to bottom,
                        ${theme.palette.customColors.OutlineVariant},
                        ${theme.palette.customColors.OutlineVariant} 5px,
                        transparent 8px,
                        transparent 13px
                      )`,
                        opacity: 1
                      }
                    }}
                  >
                    <img
                      src={
                        item?.label === 'Current Enclosure'
                          ? '/images/housing/current_enclosure.svg'
                          : '/images/housing/previous_enclosure.svg'
                      }
                      alt='current_enclosure'
                    />
                    {idx < animalHistory.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 4,
                      justifyContent: 'flex-start',
                      width: '100%',
                      py: 0
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '200px' }}>
                      <Typography variant='subtitle2' sx={{ color: '#6b7a7a' }}>
                        {item.label}
                      </Typography>
                      <Typography variant='body1' sx={{ fontWeight: 600 }}>
                        {item.enclosure}
                      </Typography>
                      <Typography variant='caption'>{item.time}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                      <AnimalDetailsHistory historyData={item} />
                    </Box>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <NoDataFound />
            </Box>
          )}
        </Grid>
      </Grid>
    </>
  )
}

export default AnimalHistory
