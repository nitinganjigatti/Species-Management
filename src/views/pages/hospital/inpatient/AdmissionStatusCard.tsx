'use client'

import { alpha, Box, Tooltip, Typography, useTheme } from '@mui/material'
import React, { useMemo } from 'react'
import Utility from 'src/utility'
import { useTranslation } from 'react-i18next'

interface AdmissionStatusCardProps {
  type?: string
  value?: any
  isPatientDischarged?: boolean
}

const AdmissionStatusCard = ({ type = 'admitted_on', value, isPatientDischarged }: AdmissionStatusCardProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  // Define value as styled JSX per config case
  const getCardConfig = useMemo(() => (type: string): any => {
    switch (type) {
      case 'admitted_on':
        return {
          label: t('hospital_module.admitted_on'),
          icon: '/images/hospital/HouseSimple-green.svg',
          iconBgColor: theme.palette.customColors.OnBackground,
          value: (
            <Tooltip
              title={`${Utility.convertUtcToLocalReadableDate(value)} • ${Utility.convertUTCToLocaltime(value)}`}
            >
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
                {Utility.convertUtcToLocalReadableDate(value)} <span>&bull;</span>{' '}
                {Utility.convertUTCToLocaltime(value)}
              </Typography>
            </Tooltip>
          )
        }
      case 'admitted_by':
        return {
          label: t('hospital_module.admitted_by'),
          icon: '/images/hospital/doctor-home.svg',
          iconBgColor: theme.palette.customColors.OnBackground,
          value: (
            <Tooltip title={value}>
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
            </Tooltip>
          )
        }
      case 'admitted_for':
        return {
          label: t('hospital_module.admitted_for'),
          icon: '/images/hospital/calender-yellow.svg',
          iconBgColor: alpha(theme.palette.customColors.Notes, 0.6),
          value: (
            <Tooltip title={value}>
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
            </Tooltip>
          )
        }
      case 'holding_location':
        return {
          label: t('hospital_module.holding_location'),
          icon: '/images/hospital/holding-enclosure-yellow.svg',
          iconBgColor: alpha(theme.palette.customColors.Notes, 0.6),
          value: (
            <Tooltip title={value}>
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
            </Tooltip>
          )
        }
      case 'discharged_on':
        return {
          label: t('hospital_module.discharged_on'),
          icon: '/images/hospital/HouseSimple-red.svg',
          iconBgColor: alpha(theme.palette.customColors.TertiaryContainer, 0.4),
          value: (
            <Tooltip
              title={`${Utility.convertUtcToLocalReadableDate(value)} • ${Utility.convertUTCToLocaltime(value)}`}
            >
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
                {Utility.convertUtcToLocalReadableDate(value)} <span>&bull;</span>{' '}
                {Utility.convertUTCToLocaltime(value)}
              </Typography>
            </Tooltip>
          )
        }
      case 'discharged_by':
        return {
          label: t('hospital_module.discharged_by'),
          icon: '/images/hospital/doctor-home-red.svg',
          iconBgColor: alpha(theme.palette.customColors.TertiaryContainer, 0.4),
          value: (
            <Tooltip title={value}>
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
            </Tooltip>
          )
        }
      default:
        return null
    }
  }, [t])

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
        {config.value}
      </Box>
    </Box>
  )
}

export default AdmissionStatusCard
