'use client'

import { useMemo, CSSProperties } from 'react'
import { alpha, Box, SxProps, Theme, Typography, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

interface SymptomsPriorityChipsProps {
  label?: string
  fontColor?: string
  disabled?: boolean
  backgroundColor?: string
}

export const symptomsPriorityChips = ({
  label,
  fontColor,
  disabled,
  backgroundColor
}: SymptomsPriorityChipsProps) => {
  const theme: any = useTheme()

  return (
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
  )
}

interface MedicalIdChipProps {
  medId?: string | number
  leftImage?: boolean
  rightDot?: boolean
  backgroundColor?: string
  textColor?: string
  dotColor?: string
  fontSize?: string | number
  fontWeight?: number | string
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
}: MedicalIdChipProps) => {
  const theme: any = useTheme()

  if (!medId) return null

  const chipStyles: SxProps<Theme> = {
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

interface VisitTypeProps {
  title?: string
}

export const VisitType = ({ title }: VisitTypeProps) => {
  const theme: any = useTheme()

  const visitTypeMap: Record<string, string> = {
    inpatient: 'INPATIENT',
    checkup: 'Check up',
    emergency: 'Emergency',
    follow_up: 'Follow-up',
    outpatient: 'OUTPATIENT',
    opd: 'OUTPATIENT',
    planned: 'Planned'
  }

  const normalizedTitle = visitTypeMap[title?.toLowerCase?.() ?? ''] || title

  if (!normalizedTitle) return null

  const typeStyles: Record<string, { background: string; color: string }> = {
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

  const style = typeStyles[normalizedTitle]
  if (!style) return null

  const { background, color } = style
  const isAllUpperCase = normalizedTitle === normalizedTitle.toUpperCase()
  const textTransform: CSSProperties['textTransform'] = isAllUpperCase ? 'uppercase' : 'none'

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
        padding: '4px 8px'
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
        {normalizedTitle}
      </Typography>
    </Box>
  )
}

interface StatusChipProps {
  status?: number | string
  chipStyles?: SxProps<Theme>
  labelStyles?: SxProps<Theme>
}

export const StatusChip = ({ status, chipStyles, labelStyles }: StatusChipProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  const styles = useMemo(() => {
    const stylesMap: Record<string, { backgroundColor: string; color: string; label: string }> = {
      0: {
        backgroundColor: theme.palette.customColors.Tertiary30,
        color: theme.palette.customColors.customDropdownColor,
        label: t('inactive')
      },
      1: {
        backgroundColor: alpha(theme.palette.customColors.OnBackground, 0.6),
        color: theme.palette.primary.main,
        label: t('active')
      }
    }

    return (
      stylesMap[String(status as any)] || {
        backgroundColor: theme.palette.grey[300],
        color: theme.palette.text.primary,
        label: 'Unknown'
      }
    )
  }, [status, theme, t])

  return (
    <Box
      sx={{
        py: 1,
        borderRadius: '4px',
        backgroundColor: styles.backgroundColor,
        minWidth: '90px',
        textAlign: 'center',
        ...(chipStyles as object)
      }}
    >
      <Typography
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: styles.color,
          ...(labelStyles as object)
        }}
      >
        {styles.label}
      </Typography>
    </Box>
  )
}
