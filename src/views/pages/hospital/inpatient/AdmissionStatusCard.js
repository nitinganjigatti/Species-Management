import { alpha, Box, Tooltip, Typography, useTheme } from '@mui/material'
import React from 'react'
import Utility from 'src/utility'

const AdmissionStatusCard = ({ type = 'admitted_on', value, isPatientDischarged }) => {
  const theme = useTheme()

  // Define value as styled JSX per config case
  const getCardConfig = type => {
    switch (type) {
      case 'admitted_on':
        return {
          label: 'Admitted on',
          icon: '/images/hospital/HouseSimple-green.svg',
          iconBgColor: theme.palette.customColors.OnBackground,
          value: (
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {Utility.convertUtcToLocalReadableDate(value)} <span>&bull;</span> {Utility.convertUTCToLocaltime(value)}
            </Typography>
          )
        }
      case 'admitted_by':
        return {
          label: 'Admitted by',
          icon: '/images/hospital/doctor-home.svg',
          iconBgColor: theme.palette.customColors.OnBackground,
          value: (
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {value}
            </Typography>
          )
        }
      case 'admitted_for':
        return {
          label: 'Admitted for',
          icon: '/images/hospital/calender-yellow.svg',
          iconBgColor: alpha(theme.palette.customColors.Notes, 0.6),
          value: (
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant,
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {value}
            </Typography>
          )
        }
      case 'holding_location':
        return {
          label: 'Holding Location',
          icon: '/images/hospital/holding-enclosure-yellow.svg',
          iconBgColor: alpha(theme.palette.customColors.Notes, 0.6),
          value: (
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant,
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {value}
            </Typography>
          )
        }
      case 'discharged_on':
        return {
          label: 'Discharged on',
          icon: '/images/hospital/HouseSimple-red.svg',
          iconBgColor: alpha(theme.palette.customColors.TertiaryContainer, 0.4),
          value: (
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,

                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {Utility.convertUtcToLocalReadableDate(value)} <span>&bull;</span> {Utility.convertUTCToLocaltime(value)}
            </Typography>
          )
        }
      case 'discharged_by':
        return {
          label: 'Discharged by',
          icon: '/images/hospital/doctor-home-red.svg',
          iconBgColor: alpha(theme.palette.customColors.TertiaryContainer, 0.4),
          value: (
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {value}
            </Typography>
          )
        }
      default:
        return null
    }
  }

  const config = getCardConfig(type)

  if (!config) return null

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: config.iconBgColor,
          height: '48px',
          width: '48px',
          borderRadius: 1
        }}
      >
        <img src={config.icon} alt={config.label} height={26} width={26} />
      </Box>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}>
          {config.label}
        </Typography>
        <Tooltip title={typeof value === 'string' ? value : ''}>
          {/* Render the styled value directly */}
          {config.value}
        </Tooltip>
      </Box>
    </Box>
  )
}

export default AdmissionStatusCard
