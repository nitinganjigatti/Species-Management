import { useTheme } from '@emotion/react'
import { IconButton, Typography } from '@mui/material'
import { Box, Stack } from '@mui/system'
import React from 'react'
import QrCodeIcon from '@mui/icons-material/QrCode'
import AddIcon from '@mui/icons-material/Add'

const AnimalInsightsHeader = ({
  isAnimalDetailsPage,
  headerDetails,
  isSpecies,
  isSpeciesListing,
  isSpeciesDetails,
  onAddNew,
  onQrClick,
  showQr
}) => {
  const theme = useTheme()

  const { commonName, scientificName, speciesTitle } = headerDetails

  return (
    <>
      {isAnimalDetailsPage && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',

            flexWrap: { sm: 'nowrap', xs: 'wrap' },
            gap: 6
          }}
        >
          <Box>
            {commonName && (
              <Typography sx={{ color: theme.palette.common.white, fontSize: '2.5rem', fontWeight: '600' }}>
                {commonName}
              </Typography>
            )}
            {scientificName && (
              <Typography sx={{ mt: 0.5, color: theme.palette.common.white, fontSize: '1.4rem' }}>
                {scientificName}
              </Typography>
            )}
          </Box>
          <Box>
            {showQr && (
              <IconButton
                sx={{
                  color: theme.palette.common.white,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)'
                  }
                }}
                onClick={onQrClick}
              >
                <QrCodeIcon sx={{ fontSize: 34 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      )}
      {isSpecies && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: { sm: 'nowrap', xs: 'wrap' },
            gap: 6
          }}
        >
          <Box>
            {speciesTitle && (
              <Typography sx={{ color: theme.palette.common.white, fontSize: '1.5rem', fontWeight: '600' }}>
                {speciesTitle}
              </Typography>
            )}
            {isSpeciesDetails && (
              <>
                {commonName && (
                  <Typography sx={{ color: theme.palette.common.white, fontSize: '2.5rem', fontWeight: '600' }}>
                    {commonName}
                  </Typography>
                )}
                {scientificName && (
                  <Typography sx={{ mt: 0.5, color: theme.palette.common.white, fontSize: '1.4rem' }}>
                    {scientificName}
                  </Typography>
                )}
              </>
            )}
            {isSpeciesListing && ( //Will start working when collection module starts
              <>
                <Box></Box>
              </>
            )}
          </Box>
          <Box>
            {onAddNew && (
              <Stack direction='row' spacing={2} alignItems='center'>
                <Typography
                  sx={{
                    color: theme.palette.customColors.PrimaryContainer,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Add new
                </Typography>
                <IconButton
                  onClick={onAddNew}
                  sx={{
                    border: '1px solid',
                    borderColor: theme.palette.customColors.PrimaryContainer,
                    color: theme.palette.customColors.PrimaryContainer,
                    transition: 'color 0.2s',
                    borderRadius: 0.5,
                    padding: 0
                  }}
                >
                  <AddIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Stack>
            )}
          </Box>
        </Box>
      )}
    </>
  )
}

export default AnimalInsightsHeader
