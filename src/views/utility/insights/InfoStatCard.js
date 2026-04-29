import React from 'react'
import { alpha, Box, Tooltip, Typography } from '@mui/material'
import IconBox from './IconBox'
import IconifyIcon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'

const InfoStatCard = ({ icon: Icon, imagePath, value, label, onClick, dotColor, iconName, iconColor }) => {
  const theme = useTheme()

  const formatNumber = num => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';

    return num
  }

  return (
    <Box
      elevation={3}
      sx={{
        p: { xs: 1.25, sm: 2 },
        borderRadius: { xs: 2, sm: 3 },
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 2, sm: 4 },
        color: 'white',
        cursor: onClick && 'pointer',
        minWidth: { xs: 120, sm: 150 }
      }}
      onClick={onClick}
    >
      {/* Icon box with Iconify icon */}
      {iconName && (
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 1,
            backgroundColor: alpha(iconColor || theme.palette.common.white, 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <IconifyIcon icon={iconName} fontSize={28} color={iconColor || theme.palette.common.white} />
        </Box>
      )}
      {/* Colored dot indicator */}
      {!iconName && dotColor && (
        <Box
          sx={{
            width: { xs: 8, sm: 10 },
            height: { xs: 8, sm: 10 },
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0
          }}
        />
      )}
      {/* Image-based icon (existing) */}
      {!iconName && !dotColor && imagePath && (
        <IconBox
          icon={Icon}
          imagePath={imagePath}
          size={{ xs: 'small', sm: 'large' }}
          imageSize={{ xs: 24, sm: 32 }}
          padding={{ xs: 1.5, sm: 3 }}
        />
      )}
      <Box>
        <Tooltip title={value?.toLocaleString?.() || value} arrow placement='top'>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.5rem' },
              color: theme.palette.customColors.PrimaryContainer
            }}
          >
            {formatNumber(value)}
          </Typography>
        </Tooltip>
        {label && (
          <Typography
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              color: theme => theme.palette.common.white
            }}
          >
            {label}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default React.memo(InfoStatCard)
