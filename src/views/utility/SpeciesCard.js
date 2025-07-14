import { Avatar, CircularProgress, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'

function SpeciesCard({ species }) {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)

  const handleImageLoad = () => {
    setLoading(false)
  }

  const handleImageError = () => {
    setLoading(false)
  }

  return (
    // <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    //   {species?.default_icon && (
    //     <Avatar
    //       sx={{
    //         '& img': {
    //           objectFit: 'inherit'
    //         },
    //         borderRadius:
    //           species?.default_icon && species.default_icon.includes('.svg')
    //             ? '50%'
    //             : species?.default_icon
    //             ? '50%'
    //             : 'unset'
    //       }}
    //       src={species.default_icon ? species.default_icon : '/icons/species.svg'}
    //       alt={species.scientific_name}
    //     />
    //   )}
    //   <Box>
    //     <Tooltip title={species.common_name}>
    //       <Typography
    //         sx={{
    //           color: theme.palette.customColors.OnSurfaceVariant,
    //           fontSize: '16px',
    //           fontWeight: 600
    //         }}
    //       >
    //         {species.common_name ? species.common_name : '-'}
    //       </Typography>
    //     </Tooltip>
    //     <Tooltip title={species.scientific_name}>
    //       <Typography
    //         sx={{
    //           color: theme.palette.customColors.OnSurfaceVariant,
    //           fontSize: '16px',
    //           fontWeight: 400,
    //           fontStyle: 'italic'
    //         }}
    //       >
    //         {species.scientific_name ? species.scientific_name : '-'}
    //       </Typography>
    //     </Tooltip>
    //   </Box>
    // </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {species?.default_icon && (
        <Box sx={{ position: 'relative', width: 40, height: 40 }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <CircularProgress size={20} />
            </Box>
          )}
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
            src={species.default_icon || '/icons/species.svg'}
            alt={species.scientific_name}
            imgProps={{
              onLoad: handleImageLoad,
              onError: handleImageError
            }}
          />
        </Box>
      )}
      <Box>
        <Tooltip title={species.common_name}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {species.common_name ? species.common_name : '-'}
          </Typography>
        </Tooltip>
        <Tooltip title={species.scientific_name}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              fontStyle: 'italic'
            }}
          >
            {species.scientific_name ? species.scientific_name : '-'}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default SpeciesCard
