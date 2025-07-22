import React from 'react'
import { Typography, Box, ListItem, List } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'

// Reusable Enrichment Card Component
const ObservationView = ({ data: { child_enrichment_type, master_enrichment_type, date_time } }) => {
  const theme = useTheme()

  // Parse child enrichment types from comma-separated string
  const childEnrichmentTypes = child_enrichment_type
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)

  // Format date and time
  const formatDateTime = dateTime => {
    const date = new Date(dateTime)

    // Convert to IST using Intl.DateTimeFormat
    const options = {
      timeZone: 'Asia/Kolkata', // Set time zone to IST
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }

    const formatter = new Intl.DateTimeFormat('en-US', options)
    const parts = formatter.formatToParts(date)
    const time = `${parts.find(part => part.type === 'hour')?.value}:${parts.find(part => part.type === 'minute')?.value} ${parts.find(part => part.type === 'dayPeriod')?.value}`

    return { time }
  }

  const { time } = formatDateTime(date_time)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        Enrichment
      </Typography>

      {/* Master Enrichment Type with Dashed Border */}
      <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
        {master_enrichment_type}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        -
      </Typography>
      <List
        dense
        sx={{
          display: 'flex',
          flexWrap: 'wrap', // Arrange items in a row with wrapping
          columnGap: 5, // Add spacing between items
          padding: 0,
          listStyleType: 'disc', // Set list style to 'disc' for visible dots
          pl: 3 // Add padding-left for proper alignment of dots
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
              display: 'list-item', // Ensure the list item displays as a list item
              alignItems: 'flex-start', // Align text properly with the dot
              pl: 0 // Remove extra padding to avoid overlap
            }}
            component='li'
          >
            {type}
          </ListItem>
        ))}
      </List>

      {/* Date and Time */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>
          {Utility.formatDisplayDate(date_time)}
        </Typography>
        <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>•</Typography>
        <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>{time}</Typography>
      </Box>
    </Box>
  )
}

export default ObservationView
