import { useTheme } from '@emotion/react'
import { Box, Grid, Divider, Typography, useMediaQuery } from '@mui/material'
import React from 'react'

const AnimalDetailsCard = ({ data }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const left = [
    { label: 'Animal ID', value: data?.animalId || 'NA' },
    { label: 'Accession Date', value: data?.accessionDate || 'NA' },
    { label: 'Birth Date', value: data?.birthDate || 'NA' },
    { label: 'Age', value: data?.age || 'NA' },
    { label: 'Contraception Status', value: data?.contraceptionStatus || 'NA' },
    { label: 'Sexing Type', value: data?.sexingType || 'NA' }
  ]

  const right = [
    { label: 'Collection Type', value: data?.collectionType || 'NA' },
    { label: 'Organisation', value: data?.organisation || 'NA' },
    { label: 'Ownership Term', value: data?.ownershipTerm || 'NA' },
    { label: 'Local Identifier', value: data?.localIdentifier || 'NA' },
    { label: 'Micro Chip', value: data?.microChip || 'NA' },
    { label: 'Identifier Name', value: data?.identifierName || 'NA' }
  ]

  return (
    <Box
      sx={{
        background: theme.palette.customColors.displaybgPrimary,
        borderRadius: 1,
        p: { xs: 2, sm: 5 },
        mt: 3
      }}
    >
      <Grid container spacing={0} alignItems='stretch'>
        <Grid item size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              justifyContent: 'space-between',
              pl: { xs: 0, sm: 4 },
              py: 1,
              height: '100%',
              gap: 4,
              pr: 40
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {left.map(item => (
                <Typography
                  key={item.label}
                  sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: 400, fontSize: '14px' }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'start' }}>
              {left.map(item => (
                <Typography
                  key={item.label + '-value'}
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: '14px' }}
                >
                  {item.value}
                </Typography>
              ))}
            </Box>
          </Box>
        </Grid>
        {!isMobile && (
          <Divider
            flexItem
            orientation='vertical'
            sx={{ mx: 0, borderColor: theme.palette.customColors.OutlineVariant }}
          />
        )}
        <Grid item size={{ xs: 12, md: 5 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              justifyContent: 'space-between',
              pl: { xs: 0, sm: 4 },
              py: 1,
              gap: 4,
              pr: { xs: 30, md: 10 }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {right.map(item => (
                <Typography
                  key={item.label}
                  sx={{ color: theme.palette.customColors.secondaryBg, fontWeight: 400, fontSize: '14px' }}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'start' }}>
              {right.map(item => (
                <Typography
                  key={item.label + '-value'}
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: '14px' }}
                >
                  {item.value}
                </Typography>
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AnimalDetailsCard
