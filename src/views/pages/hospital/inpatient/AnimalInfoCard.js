import React from 'react'
import { Card, Grid, Box, Avatar, Typography, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const AnimalInfoCard = ({ data, bgColor = '' }) => {
  const theme = useTheme()

  return (
    <Card
      sx={{
        p: '24px',
        borderRadius: '8px',
        backgroundColor: bgColor || theme.palette.customColors.displaybgPrimary,
        boxShadow: 'none'
      }}
    >
      {/* Animal Image */}
      <Grid container spacing={5} sx={{ alignItems: 'center' }}>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ maxWidth: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              src={data.animal.image_url}
              alt={data.animal.common_name}
              style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover' }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <Tooltip title={data.animal.common_name}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '16px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%'
                  }}
                >
                  {data.animal.common_name}
                </Typography>
              </Tooltip>
              <Tooltip title={data.animal.scientific_name}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    fontStyle: 'italic',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%'
                  }}
                >
                  {data.animal.scientific_name}
                </Typography>
              </Tooltip>
              <Tooltip title={`${data.animal.age} • ${data.animal.sex}`}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%'
                  }}
                >
                  {`${data.animal.age} • ${data.animal.sex}`}
                </Typography>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        {/* Additional Info */}
        {Object.entries(data.additional_info).map(([key, value]) => (
          <Grid item size={{ xs: 12, sm: 4, md: 2.25 }} key={key} sx={{ mt: 2 }}>
            <Tooltip title={value}>
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '14px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.neutralSecondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {key}
              </Typography>
            </Tooltip>
            <Tooltip title={value}>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '16px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {value}
              </Typography>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Card>
  )
}

export default AnimalInfoCard
