import { useTheme } from '@emotion/react'
import { alpha, Box, Grid } from '@mui/system'
import React from 'react'
import AnimalInsightsHeader from './AnimalInsightsHeader'
import { Typography } from '@mui/material'
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
  statsData,
  animalDetails
}) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1.5,
        backgroundImage: image && `url(${image})`,
        background: !image && 'linear-gradient(180deg, #37BD69 0%, #1F415B 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        color: theme.palette.common.white
      }}
    >
      {/* Black overlay */}
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
            mt: 10,
            p: { xs: 1.5, sm: 6 },
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
                    AID: {animalDetails?.aid ? animalDetails?.aid : 'NA'}
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
              {/* <Grid container spacing={3} justifyContent='flex-start'>
                {statsData?.map((item, index) => {
                  const length = statsData.length

                  let xs = 6
                  let sm = 6
                  let md = 12 / length

                  if (length === 2) {
                    xs = 6
                    sm = 3
                    md = 3
                  } else if (length === 1) {
                    sm = 6
                    md = 6
                  } else if (length === 4) {
                    md = 3
                  }

                  return (
                    <Grid item size={{ xs: xs, sm: sm, md: md }} key={index} display='flex' justifyContent='flex-start'>
                      <InfoStatCard
                        imagePath={item.imagePath}
                        value={item.value}
                        label={item.label}
                        onClick={item.onClick}
                      />
                    </Grid>
                  )
                })}
              </Grid> */}
              <Grid container alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
                <Grid item xs={12} md='auto'>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      opacity: 0.85
                    }}
                  >
                    Population till date -{' '}
                    <Box component='span' sx={{ fontWeight: 600, fontSize: '1.3rem', ml: 0.5 }}>
                      1.3K
                    </Box>
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={12}
                  md='auto'
                  sx={{
                    display: 'flex',
                    justifyContent: { xs: 'flex-start', md: 'flex-end' },
                    mt: { xs: 1, md: 0 }
                  }}
                >
                  <CommonDateRangePickers />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                {statsData.map((item, idx) => (
                  <Grid
                    item
                    key={idx}
                    xs={12}
                    sm={6}
                    md={3}
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
      </Box>
    </Box>
  )
}

export default AnimalInsightsCard
