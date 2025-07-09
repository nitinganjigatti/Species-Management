import React from 'react'
import { Avatar, Typography, Tooltip } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'

function SpeciesCard({ species }) {
  const theme = useTheme()

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
        {/* <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 600
          }}
        >
          {species.common_name ? species.common_name : '-'}
        </Typography>
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            fontStyle: 'italic'
          }}
        >
          {species.scientific_name ? species.scientific_name : '-'}
        </Typography> */}

        <Tooltip title={species.common_name}>
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
          </Typography>
        </Tooltip>
        <Tooltip
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
              textOverflow: 'ellipsis'
            }}
          >
            {species.scientific_name ? species.scientific_name : species.complete_name ? species.complete_name : '-'}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default SpeciesCard
