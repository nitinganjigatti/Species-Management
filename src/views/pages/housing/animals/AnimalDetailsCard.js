import { useTheme } from '@emotion/react'
import { Divider, Typography } from '@mui/material'
import { Box, Grid, useMediaQuery } from '@mui/system'
import React from 'react'

const AnimalDetailsCard = ({ data }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const left = [
    { label: 'Animal ID', value: data?.animalId ? data?.animalId : 'NA' },
    { label: 'Accession Date', value: data?.accessionDate },
    { label: 'Birth Date', value: data?.birthDate },
    { label: 'Age', value: data?.age },
    { label: 'Contraception Status', value: data?.contraceptionStatus },
    { label: 'Sexing Type', value: data?.sexingType }
  ]

  const right = [
    { label: 'Collection Type', value: data?.collectionType, bold: true },
    { label: 'Organisation', value: data?.organisation, bold: true },
    { label: 'Ownership Term', value: data?.ownershipTerm, bold: true },
    { label: 'Local Identifier', value: data?.localIdentifier, bold: true },
    { label: 'Micro Chip', value: data?.microChip, bold: true },
    { label: 'Identifier Name', value: data?.identifierName, bold: true }
  ]

  return (
    <>
      <Grid
        container
        gap={10}
        sx={{
          background: theme.palette.customColors.displaybgPrimary,
          borderRadius: 1,
          px: { xs: 2, sm: 6 },
          py: { xs: 2, sm: 5 },
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'stretch',
          mt: 3
        }}
      >
        <Grid
          size={{ sm: 5 }}
          sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', px: 4, justifyContent: 'space-between' }}
        >
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', gap: 1.5 }}
          >
            {left?.map(item => (
              <Typography key={item?.label}>{item?.label}</Typography>
            ))}
          </Box>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', gap: 1.5 }}
          >
            <Box
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', gap: 1.5 }}
            >
              {left?.map(item => (
                <Typography key={item?.value}>{item?.value}</Typography>
              ))}
            </Box>
            {isMobile && <Divider orientation='vertical' flexItem sx={{ borderColor: '#d7e3e3', minHeight: 0 }} />}
          </Box>
        </Grid>

        <Grid
          size={{ sm: 5 }}
          sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', px: 4, justifyContent: 'space-between' }}
        >
          <Box>
            {!isMobile && <Divider orientation='vertical' flexItem sx={{ borderColor: '#d7e3e3', minHeight: 0 }} />}

            <Box
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', gap: 1.5 }}
            >
              {right?.map(item => (
                <Typography key={item?.label}>{item?.label}</Typography>
              ))}
            </Box>
          </Box>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', gap: 1.5 }}
          >
            {right?.map(item => (
              <Typography key={item?.value}>{item?.value}</Typography>
            ))}
          </Box>
        </Grid>
      </Grid>
    </>
  )
}

export default AnimalDetailsCard
