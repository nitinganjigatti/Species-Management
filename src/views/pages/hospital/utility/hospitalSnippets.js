import React from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

export const symptomsPriorityChips = ({ label, fontColor, disabled, backgroundColor }) => {
  const theme = useTheme()

  return (
    <>
      <Box
        sx={{
          background: backgroundColor ? backgroundColor : theme.palette.customColors.OnPrimary,
          px: 2,
          py: 1,
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Typography
          sx={{
            color: disabled ? theme.palette.customColors.neutralSecondary : fontColor,
            fontWeight: 500,
            fontSize: '14px'
          }}
        >
          {label}
        </Typography>
      </Box>
    </>
  )
}

export const MedicalIdChip = ({
  medId,
  leftImage = false,
  rightDot = false,
  backgroundColor,
  textColor,
  dotColor,
  fontSize = '14px',
  fontWeight = 500
}) => {
  const theme = useTheme()

  if (!medId) return null

  const chipStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 0.5,
    cursor: 'default',
    py: backgroundColor ? 1 : 0,
    px: backgroundColor ? 2 : 0,
    gap: 1,
    backgroundColor: backgroundColor ? backgroundColor : 'transparent'
  }

  return (
    <Box sx={chipStyles}>
      {leftImage && <img src='/icons/medId_icon.svg' alt='med_id_icon' style={{ display: 'block' }} />}
      <Typography
        sx={{ fontSize, fontWeight, color: textColor ? textColor : theme.palette.customColors.OnPrimaryContainer }}
      >
        {medId}
      </Typography>
      {rightDot && (
        <Box
          sx={{
            width: '8px',
            height: '8px',
            backgroundColor: dotColor ? dotColor : theme.palette.customColors.OnPrimaryContainer,
            borderRadius: '50%'
          }}
        />
      )}
    </Box>
  )
}

export const VisitType = ({ title }) => {
  const theme = useTheme()

  const normalizeMap = {
    checkup: 'Check up',
    inpatient: 'INPATIENT',
    followup: 'Follow-up',
    emergency: 'Emergency',
    planned: 'Planned',
    outpatient: 'OUTPATIENT'
  }

  const typeStyles = {
    'Check up': { background: theme.palette.customColors.antzInfoLight, color: theme.palette.customColors.addPrimary },
    INPATIENT: { background: theme.palette.customColors.OnBackground, color: theme.palette.primary.main },
    'Follow-up': { background: theme.palette.customColors.OnBackground, color: theme.palette.primary.OnSurface },
    Emergency: { background: theme.palette.customColors.Tertiary30, color: theme.palette.customColors.Tertiary },
    Planned: {
      background: hexToRGBA(theme.palette.customColors.AntzTertiary, 0.4),
      color: theme.palette.customColors.Error
    },
    OUTPATIENT: { background: hexToRGBA(theme.palette.customColors.antzNotes, 0.3), color: '#E4B819' }
  }

  if (!title) return null

  // Normalize input title: lower case, remove spaces/hyphens for mapping
  const normalizedKey = normalizeMap[title.toLowerCase().replace(/\s|-/g, '')] || title

  if (!typeStyles[normalizedKey]) {
    // Optional: fallback style for unknown types
    return (
      <Box
        sx={{
          px: 2,
          py: 1,
          borderRadius: 0.5,
          background: '#eee',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 24
        }}
      >
        <Typography sx={{ color: '#666', fontWeight: 500, fontSize: '0.88rem' }}>{title}</Typography>
      </Box>
    )
  }

  const { background, color } = typeStyles[normalizedKey]
  const isAllUpperCase = normalizedKey === normalizedKey.toUpperCase()
  const textTransform = isAllUpperCase ? 'uppercase' : 'none'

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        borderRadius: 0.5,
        background,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 24
      }}
    >
      <Typography
        sx={{
          color,
          fontWeight: 500,
          fontSize: '0.88rem',
          letterSpacing: 1,
          textTransform
        }}
      >
        {title}
      </Typography>
    </Box>
  )
}
