import React from 'react'
import { Box, Paper, Typography, useTheme } from '@mui/material'
import { LoaderIcon } from 'react-hot-toast'

const ProductDetailsCard = ({ packageDetails, manufacture, totalAvailableCount, batchLoading }) => {
  const theme = useTheme()

  if (!packageDetails) return null

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: 'customColors.Surface',
        padding: 3,
        borderRadius: 1,
        border: `1px solid ${theme.palette.primary.main}`,
        mt: 5
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <InfoRow label='Package:' value={packageDetails} />
        <InfoRow label='Manufactured by:' value={manufacture} />
        <InfoRow label='Availability:' value={batchLoading ? <LoaderIcon /> : totalAvailableCount} />
      </Box>
    </Paper>
  )
}

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
    <Typography
      component='span'
      color='customColors.neutralSecondary'
      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '0.75rem', mb: 1 }}
    >
      {label}
    </Typography>
    <Typography
      component='span'
      sx={{ fontWeight: 400, fontSize: '0.75rem', color: 'customColors.OnPrimaryContainer' }}
    >
      {value}
    </Typography>
  </Box>
)

export default React.memo(ProductDetailsCard)
