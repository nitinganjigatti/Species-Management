import { Box, flex, Grid } from '@mui/system'
import { debounce } from 'lodash'
import React, { useCallback, useState } from 'react'
import Search from 'src/views/utility/Search'
import Icon from 'src/@core/components/icon'
import { Typography } from '@mui/material'
import { useTheme } from '@emotion/react'
import AnimalDetailsHistory from 'src/views/pages/housing/animals/AnimalDetailsHistory'
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator
} from '@mui/lab'
import Paper from 'src/@core/theme/overrides/paper'

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
  const [inputValue, setInputValue] = useState('')

  const fetchHistoryData = () => {}

  const searchHistoryData = useCallback(
    debounce(async q => {
      setInputValue(q)
      try {
        await fetchHistoryData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = useCallback(
    value => {
      setInputValue(value)
      searchHistoryData(value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchHistoryData, inputValue]
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
          <Grid size={{ xs: 12, sm: 6 }}></Grid> {/* For Enclosure dropdown in ui */}
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              width: '100%',
              height: '48px',
              background: 'rgba(0, 0, 0, 0.05)',
              py: 3,
              pl: 3,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 2
            }}
          >
            <Icon icon='mdi-calendar-blank' />
            <Typography sx={{ fontWeight: 500, color: theme.palette.common.black, fontSize: '20px' }}>
              21 Mar 2024
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ width: '100%' }}>
          <Timeline
            position='right'
            sx={{
              [`& .${timelineItemClasses.root}:before`]: {
                flex: 0,
                padding: 0
              }
            }}
          >
            {data.map((item, idx) => (
              <TimelineItem key={item.label}>
                <TimelineSeparator>
                  <img src='/images/housing/current_enclosure.svg' alt='current_enclosure' />
                  {idx < data.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 5,
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: flex, flexDirection: 'row' }}>
                    <Typography variant='subtitle2' sx={{ color: '#6b7a7a' }}>
                      {item.label}
                    </Typography>
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                      {item.enclosure}
                    </Typography>
                    <Typography variant='caption'>{item.time}</Typography>
                  </Box>
                  <AnimalDetailsHistory />
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Grid>
      </Grid>
    </>
  )
}

export default AnimalHistory
