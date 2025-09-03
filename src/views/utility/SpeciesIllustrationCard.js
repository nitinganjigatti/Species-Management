import React from 'react'
import { Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import FallbackImage from './FallbackImage'

function SpeciesIllustrationCard({ eggDetails, theme }) {
  return (
    <Box
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: 15 / 9,
        backgroundColor: theme.palette.background.default,
        borderRadius: '8px'
      }}
    >
      <Box
        sx={{
          borderRadius: '8px',
          width: '100%',
          height: '100%',
          objectFit: eggDetails?.default_icon?.endsWith('svg') ? 'contain' : 'cover'
        }}
      >
        <FallbackImage
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            objectFit: eggDetails?.default_icon?.endsWith('svg') ? 'contain' : 'cover'
          }}
          // srcSet={eggDetails?.default_icon}
          src={eggDetails?.default_icon}
          alt='default_icon'
          loading='lazy'
        />
      </Box>
      <Box
        sx={{
          borderBottomRightRadius: '8px',
          borderBottomLeftRadius: '8px',
          position: 'relative',
          bottom: '57px',
          backgroundColor: theme.palette.customColors.neutralTeritary,
          py: '8px',
          px: '12px',
          gap: '4px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Tooltip
          title={
            eggDetails?.default_common_name
              ? eggDetails?.default_common_name
              : eggDetails?.animal_data?.common_name
              ? eggDetails?.animal_data?.common_name
              : ''
          }
        >
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '19.36px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: theme.palette.primary.contrastText
            }}
          >
            {eggDetails?.default_common_name
              ? eggDetails?.default_common_name
              : eggDetails?.animal_data?.common_name
              ? eggDetails?.animal_data?.common_name
              : 'Unknown'}
          </Typography>
        </Tooltip>
        <Tooltip
          title={
            eggDetails?.complete_name
              ? eggDetails?.complete_name
              : eggDetails?.animal_data?.complete_name
              ? eggDetails?.animal_data?.complete_name
              : ''
          }
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16.94px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: theme.palette.primary.contrastText
            }}
          >
            {eggDetails?.complete_name
              ? eggDetails?.complete_name
              : eggDetails?.animal_data?.complete_name
              ? eggDetails?.animal_data?.complete_name
              : 'Unknown'}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default SpeciesIllustrationCard
