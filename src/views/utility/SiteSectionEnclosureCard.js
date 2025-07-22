import React from 'react'
import { Typography, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const SiteSectionEnclosureCard = ({ enclosureName, siteName, sectionName }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 2,
      }}
    >
      {enclosureName && <Typography
        sx={{
          fontSize: '14px',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        <span>Encl: </span>
        {enclosureName || '-'}
      </Typography>}

      {sectionName && <Typography
        sx={{
          fontSize: '14px',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        <span>Sec: </span>
        {sectionName || '-'}
      </Typography>}

      {siteName && (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          <span>Site: </span>
          {siteName || '-'}
        </Typography>
      )}
    </Box>
  )
}

export default SiteSectionEnclosureCard