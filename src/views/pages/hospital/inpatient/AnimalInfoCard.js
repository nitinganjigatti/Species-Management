import React from 'react'
import { Card, Grid, Box, alpha, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import AnimalCardBasic from 'src/views/utility/AnimalCardBasic'
import AnimalDetailsShimmer from 'src/views/pages/hospital/inpatient/shimmer/AnimalDetailsShimmer'

const AnimalInfoCard = ({ backgroundColor, additionalFields, image, name, scientificName, age, gender, isLoading }) => {
  const theme = useTheme()

  const StatBox = ({ label, value, isStatusCard }) => {
    const isCritical = (value || "")?.toLowerCase() === 'critical'
    const capitalizedStatus = value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'

    return (
      <Box sx={{ minWidth: 0 }}>
        <TextEllipsisWithModal
          enableDialog={false}
          text={label || '-'}
          style={{
            fontSize: '14px',
            fontWeight: 400,
            color: theme.palette.customColors.neutralSecondary,
            maxWidth: '100%'
          }}
        />
        {isStatusCard ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: '4px 0px',
              gap: '8px'
            }}
          >
            <Box
              sx={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: isCritical
                  ? alpha(theme.palette.error.main, 0.2)
                  : theme.palette.customColors.OnBackground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Box
                sx={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isCritical ? theme.palette.customColors.Tertiary : theme.palette.primary.main
                }}
              ></Box>
            </Box>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              {capitalizedStatus}
            </Typography>
          </Box>
        ) : (
            <TextEllipsisWithModal
              enableDialog={false}
              text={value || '-'}
              style={{
                fontSize: '16px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                maxWidth: '100%'
              }}
            />
        )}
      </Box>
    )
  }

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
      <Grid container rowSpacing={4} columnSpacing={4} alignItems='center'>
        <Grid size={{ xs: 12, sm: 12, md: 3.5, lg: 3 }}>
          <AnimalCardBasic image={image} name={name} scientificName={scientificName} age={age} gender={gender} />
        </Grid>
        {additionalFields?.map(({ label, value, isStatusCard }, index) => (
          <Grid key={index} size={{ xs: 6, sm: 3, md: 2.125, lg: index == 0 ? 2.1 : 2.3 }}>
            <StatBox label={label} value={value} isStatusCard={isStatusCard} />
          </Grid>
        ))}
      </Grid>
    </Card>
  )
}

export default AnimalInfoCard
