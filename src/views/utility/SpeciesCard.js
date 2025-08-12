import { Avatar, Skeleton, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'

function SpeciesCard({ species }) {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [imgSrc, setImgSrc] = useState(species?.default_icon)

  const handleImageLoad = () => {
    setLoading(false)
  }

  const handleImageError = () => {
    setLoading(false)
    setImgSrc('/images/housing/species-icon-colored.svg')
  }


  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

      {species?.default_icon && (
        <Box sx={{ position: 'relative', width: 40, height: 40 }}>
          {loading && <Skeleton variant='circular' width={40} height={40} animation='wave' />}

          <Avatar
            sx={{
              width: 40,
              height: 40,
              '& img': {
                objectFit: 'inherit'
              },
              borderRadius:
                species?.default_icon && species.default_icon.includes('.svg')
                  ? '50%'
                  : species?.default_icon
                    ? '50%'
                    : 'unset'
            }}
            src={imgSrc}
            alt={species.scientific_name}
            slotProps={{
              img: {
                onLoad: handleImageLoad,
                onError: handleImageError
              }
            }}
          />
        </Box>
      )}

      <Box>
        {(species.primary_identifier_type && species.primary_identifier_value) &&
          <Tooltip title={`${species.primary_identifier_type}: ${species.primary_identifier_value}`}><Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter',
              color: theme.palette.primary.OnSurface,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {species.primary_identifier_type}: {species.primary_identifier_value}
          </Typography></Tooltip>}
        {species.common_name && <Tooltip title={species.common_name}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 600,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {species.common_name ? species.common_name : '-'}
            {species?.is_primary === '1' && (
              <Box
                component='span'
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '14px',
                  fontWeight: 400,
                  background: '#37bd6924',
                  px: '5px',
                  py: '2px',
                  borderRadius: '4px',
                  ml: '10px'
                }}
              >
                Primary Diet
              </Box>
            )}
          </Typography>
        </Tooltip>}
        {(species.scientific_name || species.complete_name) && <Tooltip
          title={
            species.scientific_name ? species.scientific_name : species.complete_name ? species.complete_name : '-'
          }
        >
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              fontStyle: 'italic',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              pr: 0.4,
              textOverflow: 'ellipsis'
            }}
          >
            {species.scientific_name ? species.scientific_name : species.complete_name ? species.complete_name : '-'}
          </Typography>
        </Tooltip>}
      </Box>
    </Box>
  )
}

export default SpeciesCard


