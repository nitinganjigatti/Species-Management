import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Avatar, Typography, Grid, Tooltip } from '@mui/material'

export default function AnimalDetails({ image, name, scientificName, ageGender, aid, admittedDays, location, vet }) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        p: 6,
        borderRadius: '8px',
        bgcolor: theme.palette.common.white,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: { xs: 4, md: 12 }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          minWidth: 200,
          width: { xs: '100%', md: 'auto' }
        }}
      >
        <Avatar
          src={image}
          variant='square'
          sx={{
            width: 58,
            height: 58,
            borderRadius: '8px',
            flexShrink: 0
          }}
        />
        <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
          <Tooltip title={name}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '16px',
                color: theme.palette.customColors.OnSurfaceVariant,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 130
              }}
            >
              {name}
            </Typography>
          </Tooltip>
          <Tooltip title={scientificName}>
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 130
              }}
            >
              {scientificName}
            </Typography>
          </Tooltip>
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px', fontWeight: 400 }}>
            {ageGender}
          </Typography>
        </Box>
      </Box>

      <Grid
        container
        spacing={{ xs: 2, md: 6 }}
        sx={{
          flex: 1,
          mt: { xs: 2, md: 0 }
        }}
      >
        <Grid item size={{ xs: 6, md: 2 }}>
          <Typography
            variant='caption'
            sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '14px', fontWeight: 400 }}
          >
            AID
          </Typography>
          <Tooltip title={aid}>
            <Typography
              sx={{
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 70
              }}
            >
              {aid}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid item size={{ xs: 6, md: 3 }}>
          <Typography
            variant='caption'
            sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '14px', fontWeight: 400 }}
          >
            Admitted days
          </Typography>
          <Typography sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px' }}>
            {admittedDays}
          </Typography>
        </Grid>
        <Grid item size={{ xs: 6, md: 4 }}>
          <Typography
            variant='caption'
            sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '14px', fontWeight: 400 }}
          >
            Location
          </Typography>
          <Tooltip title={location}>
            <Typography
              sx={{
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 180
              }}
            >
              {location}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid item size={{ xs: 6, md: 3 }}>
          <Typography
            variant='caption'
            sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '14px', fontWeight: 400 }}
          >
            Consulting Veterinarian
          </Typography>
          <Tooltip title={vet}>
            <Typography
              sx={{
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 170
              }}
            >
              {vet}
            </Typography>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  )
}
