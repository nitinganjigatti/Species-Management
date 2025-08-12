import React from 'react'
import { Box, Paper, Typography, useTheme } from '@mui/material'
import { LoaderIcon } from 'react-hot-toast'
import Utility from 'src/utility'

const ProductDetailsCard = ({ packageDetails, manufacture, totalAvailableCount, batchLoading, unitPrice }) => {
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
        {unitPrice && (
          <Box
            sx={{
              backgroundColor: 'customColors.OnPrimaryContainer',
              borderRadius: '16px',
              padding: '5px 15px',
              width: 'fit-content',
              color: 'customColors.OnPrimary'
            }}
          >
            <Typography
              variant='body1'
              component='div'
              sx={{
                fontSize: '12px',
                fontWeight: 400,
                color: 'customColors.OnPrimary'
              }}
            >
              Unit Price - {Utility.formatAmountToReadableDigit(unitPrice)}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  )
}

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
    <Typography
      component='span'
      sx={{
        color: 'customColors.neutralSecondary',
        fontWeight: 400,
        fontFamily: 'Inter',
        fontSize: '0.75rem',
        mb: 1
      }}>
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
