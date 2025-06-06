import { Avatar, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTheme } from '@mui/material/styles'

function SpeciesCard({ species }) {
  const theme = useTheme()
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {species?.default_icon && (
        <Avatar
          sx={{
            '& img': {
              objectFit: 'inherit'
            },
            borderRadius:
              species?.default_icon && species.default_icon.includes('.svg')
                ? 'unset'
                : species?.default_icon
                ? '50%'
                : 'unset'
          }}
          src={species.default_icon ? species.default_icon : '/icons/species.svg'}
          alt={species.scientific_name || species.complete_name}
        />
      )}
      <Box>
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            fontStyle: 'italic'
          }}
        >
          {species.common_name ? species.common_name : '-'}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 600
          }}
        >
          {species.scientific_name ? species.scientific_name : species.complete_name ? species.complete_name : '-'}
        </Typography>
      </Box>
    </Box>
  )
}

export default SpeciesCard
