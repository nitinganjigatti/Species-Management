import React from 'react'
import { Typography, Box, ListItem, List } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'

const ObservationView = ({ data: { child_enrichment_type, master_enrichment_type, date_time } }) => {
  const theme = useTheme()

  // Parse child enrichment types from comma-separated string
  const childEnrichmentTypes = child_enrichment_type
    ?.split(',')
    ?.map(item => item.trim())
    ?.filter(item => item.length > 0)

  // Format date and time
  const formatDateTime = dateTime => {
    const formattedDateStr = Utility.convertUTCToLocalDateTime(dateTime)

    // Split into date and time
    const [date, time] = formattedDateStr.split(/(?<=^.{11})\s/) // Split after the first 11 chars (date part)

    // Convert to IST using Intl.DateTimeFormat

    return { date, time }
  }

  const { date, time } = formatDateTime(date_time)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', px: 2, py: '16px' }}>
      <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        {master_enrichment_type}
      </Typography>
      {/* <Typography variant='body2' color='text.secondary'>
        -
      </Typography> */}
      <List
        dense
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          columnGap: 5,
          padding: 0,
          listStyleType: 'disc',
          pl: 3
        }}
        component='ul'
      >
        {childEnrichmentTypes?.map((type, index) => (
          <ListItem
            key={index}
            sx={{
              fontSize: '14px',
              color: theme.palette.customColors.OnSurfaceVariant,
              width: 'auto',
              p: 0,
              display: 'list-item',
              alignItems: 'flex-start',
              pl: 0
            }}
            component='li'
          >
            {type}
          </ListItem>
        ))}
      </List>

      {/* Date and Time */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>{date}</Typography>
        <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>•</Typography>
        <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>{time}</Typography>
      </Box>
    </Box>
  )
}

export default ObservationView
