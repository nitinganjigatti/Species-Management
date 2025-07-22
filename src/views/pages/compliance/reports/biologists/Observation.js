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
    const formattedDateStr = Utility.convertUTCToLocalDateTime(dateTime)

    // Split into date and time
    const [date, time] = formattedDateStr.split(/(?<=^.{11})\s/) // Split after the first 11 chars (date part)

    // Convert to IST using Intl.DateTimeFormat

    return { date, time }
  }

  const { date, time } = formatDateTime(date_time)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', px: 2, py: '16px' }}>
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
        <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>{date}</Typography>
        <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>•</Typography>
        <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.OnSurfaceVariant }}>{time}</Typography>
      </Box>
    </Box>
  )
}

export default ObservationView
