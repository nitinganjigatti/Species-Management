import React from 'react'
import { Box, Typography } from '@mui/material'
import IconBox from './IconBox'
import { useTheme } from '@mui/material/styles'

const InfoStatCard = ({ icon: Icon, imagePath, value, label, onClick }) => {
  const theme = useTheme()

  const formatNumber = num => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'

    return num
  }

  return (
    <Box
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        color: 'white',
        cursor: 'pointer',
        minWidth: 150
      }}
      onClick={onClick}
    >
      <IconBox icon={Icon} imagePath={imagePath} />
      <Box>
        <Typography
          sx={{ fontWeight: '600', fontSize: '1.5rem', color: theme.palette.customColors.PrimaryContainer }}
          color='success.main'
        >
          {formatNumber(value)}
        </Typography>
        {label && (
          <Typography sx={{ fontSize: '0.875rem', color: theme => theme.palette.common.white }}>{label}</Typography>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(InfoStatCard)
