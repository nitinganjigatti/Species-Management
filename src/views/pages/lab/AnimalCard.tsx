import { Box, Typography, useTheme } from '@mui/material'
import React from 'react'
import type { AnimalCardProps } from 'src/types/lab'

const AnimalCard = ({ animalDetails }: AnimalCardProps) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        paddingY: '20px',
        paddingX: '16px',
        width: '345px',
        display: 'flex',
        gap: '10px',
        bgcolor: '#f2f2f2'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <Box
          component='img'
          sx={{
            p: 0.5,
            width: 44,
            height: 44,
            border: '1px solid #C3CEC7',
            borderRadius: '50%',
            objectFit: 'contain'
          }}
          alt={animalDetails?.default_icon}
          src={animalDetails?.default_icon}
        />
        <Box
          sx={{
            width: 24,
            pt: 0.2,
            pr: 0.2,
            height: 24,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor:
              animalDetails?.sex === 'male' ? '#AFEFEB' : animalDetails?.sex === 'female' ? '#FFD3D3' : '#AFEFEB',
            borderRadius: '4px'
          }}
        >
          {animalDetails?.sex === 'male' ? (
            <Typography sx={{ fontSize: 12, fontStyle: 'bold' }}>M</Typography>
          ) : animalDetails?.sex === 'female' ? (
            <Typography sx={{ fontSize: 12, fontStyle: 'bold' }}>F</Typography>
          ) : animalDetails?.sex === 'undetermined' ? (
            <Typography sx={{ fontSize: 12, fontStyle: 'bold' }}>UD</Typography>
          ) : animalDetails?.sex === 'indeterminate' ? (
            <Typography sx={{ fontSize: 12, fontStyle: 'bold' }}>ID</Typography>
          ) : (
            <Typography sx={{ fontSize: 12, fontStyle: 'bold' }}>-</Typography>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1px'
        }}
      >
        {animalDetails?.local_id_type && animalDetails?.local_identifier_value ? (
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            <span> {animalDetails?.local_id_type}: </span>
            <span> {animalDetails?.local_identifier_value}</span>
          </Typography>
        ) : (
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            AID : {animalDetails?.animal_id}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            lineHeight: '19.36px',
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {animalDetails?.default_common_name}
        </Typography>
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            fontStyle: 'italic',
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          ({animalDetails?.scientific_name})
        </Typography>
        {animalDetails?.breed_name && (
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '13px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            Breed : {animalDetails?.breed_name}
          </Typography>
        )}

        {animalDetails?.morph_name && (
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '13px',
              fontWeight: '600',
              lineHeight: '19.36px'
            }}
          >
            Variant : {animalDetails?.morph_name}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '16.94px',
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          <span style={{ fontWeight: 600 }}> Encl: </span>
          {animalDetails?.user_enclosure_name}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '16.94px',
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          <span style={{ fontWeight: 600 }}>Sec: </span>
          {animalDetails?.section_name}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '16.94px',
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          <span style={{ fontWeight: 600 }}>Site: </span>
          {animalDetails?.site_name}
        </Typography>
      </Box>
    </Box>
  )
}

export default AnimalCard
