import React from 'react'
import { Card, Grid, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import AnimalCardBasic from 'src/views/utility/AnimalCardBasic'
import AnimalDetailsShimmer from 'src/views/pages/hospital/inpatient/shimmer/AnimalDetailsShimmer'

const AnimalInfoCard = ({ backgroundColor, additionalFields, image, name, scientificName, age, gender, isLoading }) => {
  const theme = useTheme()

  const StatBox = ({ label, value }) => (
    <Box>
      <TextEllipsisWithModal
        enableDialog={false}
        text={label ?? '-'}
        style={{
          fontSize: '14px',
          fontWeight: 400,
          color: theme.palette.customColors.neutralSecondary,
          maxWidth: '100%'
        }}
      />
      <TextEllipsisWithModal
        enableDialog={false}
        text={value ?? '-'}
        style={{
          fontSize: '16px',
          fontWeight: 500,
          color: theme.palette.customColors.OnSurfaceVariant,
          maxWidth: '100%'
        }}
      />
    </Box>
  )

  if (isLoading) {
    return <AnimalDetailsShimmer additionalFields={additionalFields?.length} backgroundColor={backgroundColor} />
  }

  return (
    <Card
      sx={{
        p: 6,
        borderRadius: '8px',
        backgroundColor: backgroundColor || theme.palette.customColors.displaybgPrimary,
        boxShadow: 'none'
      }}
    >
      <Grid container rowSpacing={4} columnSpacing={4} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, sm: 12, md: 3, lg: 4 }}>
          <AnimalCardBasic image={image} name={name} scientificName={scientificName} age={age} gender={gender} />
        </Grid>
        {additionalFields?.map(({ label, value }, index) => (
          <Grid size={{ xs: 6, sm: 3, md: 2.25, lg: 2 }} key={index}>
            <StatBox label={label} value={value} />
          </Grid>
        ))}
      </Grid>
    </Card>
  )
}

export default AnimalInfoCard
