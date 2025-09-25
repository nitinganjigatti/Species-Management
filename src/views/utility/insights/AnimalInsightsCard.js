import { useTheme } from '@emotion/react'
import { alpha, Box, Grid } from '@mui/system'
import React from 'react'
import AnimalInsightsHeader from './AnimalInsightsHeader'
import { Typography, Skeleton } from '@mui/material'
import InfoStatCard from './InfoStatCard'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'

const AnimalInsightsCard = ({
  image,
  isAnimalDetailsPage,
  headerDetails,
  isSpecies,
  isSpeciesDetails,
  isSpeciesListing,
  onAddNew,
  onQrClick,
  showQr,
  statsData = [],
  animalDetails = {},
  loading = false
}) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1.5,
        backgroundImage: image && `url(${image || '/images/housing/testInDev.jpg'})`,
        background: !image && 'linear-gradient(180deg, #37BD69 0%, #1F415B 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        color: theme.palette.common.white
      }}
    >
      {image && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: theme.palette.common.black,
            opacity: 0.4,
            zIndex: 1
          }}
        />
      )}
      <Box sx={{ position: 'relative', zIndex: 2, p: 6 }}>
        {loading ? (
          <>
            {/* Skeleton for header */}
            <Skeleton variant='rounded' width={240} height={48} sx={{ mb: 4, backgroundColor: 'grey.800' }} />
            {/* Main Skeleton Section */}
            <Box sx={{ mt: 10 }}>
              <Grid container spacing={2}>
                {[1, 2, 3].map(idx => (
                  <Grid key={idx} item size={{ xs: 12, md: 4 }}>
                    <Skeleton
                      variant='rectangular'
                      height={90}
                      sx={{ borderRadius: 1, backgroundColor: 'grey.900', mb: 1 }}
                    />
                    <Skeleton width='90%' sx={{ backgroundColor: 'grey.900' }} />
                    <Skeleton width='60%' sx={{ backgroundColor: 'grey.900' }} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        ) : (
          <>
            <AnimalInsightsHeader
              isAnimalDetailsPage={isAnimalDetailsPage}
              headerDetails={headerDetails}
              isSpecies={isSpecies}
              isSpeciesDetails={isSpeciesDetails}
              isSpeciesListing={isSpeciesListing}
              onAddNew={onAddNew}
              onQrClick={onQrClick}
              showQr={showQr}
            />
            <Box
              sx={{
                mt: 4,
                p: { xs: 0.5, sm: 4 },
                border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.common.black, 0.3),
                backdropFilter: 'blur(0.5rem)',
                WebkitBackdropFilter: 'blur(0.5rem)',
                width: '100%',
                maxWidth: '100%',
                color: theme.palette.common.white,
                overflow: 'hidden'
              }}
            >
              {isAnimalDetailsPage && (
                <>
                  <Grid container spacing={2}>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <Typography variant='h6' sx={{ fontWeight: 200, color: theme.palette.common.white }}>
                        {animalDetails?.identifierName && animalDetails?.localIdentifier
                          ? `${animalDetails?.identifierName} : ${animalDetails?.localIdentifier}`
                          : `AID: ${animalDetails?.aid ? animalDetails?.aid : 'NA'}`}
                      </Typography>
                      <Typography variant='h6' sx={{ fontWeight: 200, mt: 2, color: theme.palette.common.white }}>
                        Enclosure: {animalDetails?.enclosure ? animalDetails?.enclosure : 'NA'}
                      </Typography>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <Typography variant='h6' sx={{ fontWeight: 200, color: theme.palette.common.white }}>
                        Breed: {animalDetails?.breed ? animalDetails?.breed : 'NA'}
                      </Typography>
                      <Typography variant='h6' sx={{ fontWeight: 200, mt: 2, color: theme.palette.common.white }}>
                        Morph: {animalDetails?.morph ? animalDetails?.morph : 'NA'}
                      </Typography>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 4 }}>
                      <Typography variant='h6' sx={{ fontWeight: 200, color: theme.palette.common.white }}>
                        Sex: {animalDetails?.sex ? animalDetails?.sex : 'NA'}
                      </Typography>
                      <Typography variant='h6' sx={{ fontWeight: 200, mt: 2, color: theme.palette.common.white }}>
                        Life Stage: {animalDetails?.lifeStage ? animalDetails?.lifeStage : 'NA'}
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              )}
              {isSpecies && (
                <>
                  <Grid container spacing={8}>
                    {statsData.map((item, idx) => (
                      <Grid
                        item
                        key={idx}
                        size={{ xs: 12, sm: 6, md: 2 }}
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-start'
                        }}
                      >
                        <InfoStatCard
                          imagePath={item.imagePath}
                          value={item.value}
                          label={item.label}
                          onClick={item.onClick}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

export default AnimalInsightsCard
