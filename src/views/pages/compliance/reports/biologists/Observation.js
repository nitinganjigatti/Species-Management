import React from 'react'
import { Typography, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'

const ObservationView = ({ data: { child_enrichment_type, master_enrichment_type, date_time } }) => {
  const theme = useTheme()

  // Parse child enrichment types from comma-separated string
  const childEnrichmentTypes = Array.isArray(child_enrichment_type)
    ? child_enrichment_type
        .map(item => (typeof item === 'string' ? item.trim() : item))
        .filter(item => (typeof item === 'string' ? item.length > 0 : Boolean(item)))
    : `${child_enrichment_type ?? ''}`
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)

  // Format date and time
  const formatDateTime = dateTime => {
    const formattedDateStr = Utility.convertUTCToLocalDateTime(dateTime)

    const [date = '', time = ''] = formattedDateStr.split('|').map(part => part.trim())

    return { date, time }
  }

  const { date, time } = formatDateTime(date_time)
  const showConnector = childEnrichmentTypes.length > 1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', px: 2, py: '16px' }}>
      <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        {master_enrichment_type}
      </Typography>
      {/* <Typography variant='body2' color='text.secondary'>
        -
      </Typography> */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {childEnrichmentTypes?.map((type, index) => (
          <React.Fragment key={`${type}-${index}`}>
            {showConnector && index > 0 && (
              <Typography
                component='span'
                sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
              >
                •
              </Typography>
            )}
            <Typography
              component='span'
              sx={{
                fontSize: '14px',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {type}
            </Typography>
          </React.Fragment>
        ))}
      </Box>

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
