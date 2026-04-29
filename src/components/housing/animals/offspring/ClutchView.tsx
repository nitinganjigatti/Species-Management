import React from 'react'
import { Box, Divider, Typography, useTheme } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

import Utility from 'src/utility'
import { ClutchItem, StyledTypographyProps } from 'src/types/housing/animalsOffspring'

interface ClutchViewProps {
  clutchDetails: ClutchItem | null
  onClick?: () => void
  titleKey?: string
  sx?: any
}

const ClutchView = ({ clutchDetails, onClick, titleKey = 'animals_module.clutch', sx }: ClutchViewProps) => {
  const theme = useTheme() as any
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...sx
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 4,
          gap: 1,
          backgroundColor: alpha(theme.palette.customColors.addPrimary, 0.1)
        }}
      >
        <StyledTypography fontWeight={500}>
          {t(titleKey)} {clutchDetails?.clutch_no}
        </StyledTypography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src='/images/line_start_circle.svg' alt='line-start-circle' />
            <StyledTypography>{Utility.convertUtcToLocalReadableDate(clutchDetails?.start_date)}</StyledTypography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src='/images/line_end_square.svg' alt='line-end-square' />
            <StyledTypography>{Utility.convertUtcToLocalReadableDate(clutchDetails?.end_date)}</StyledTypography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.OnPrimary
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mx: 4, my: 6 }}>
          {Number(clutchDetails?.male_count) > 0 && (
            <SexBadge
              label='M'
              value={clutchDetails?.male_count ?? 0}
              bgColor={alpha(theme.palette.customColors.SecondaryContainer, 0.8)}
            />
          )}

          {Number(clutchDetails?.female_count) > 0 && (
            <SexBadge
              label='F'
              value={clutchDetails?.female_count ?? 0}
              bgColor={alpha(theme.palette.customColors.customDropdownColor, 0.4)}
            />
          )}

          {Number(clutchDetails?.indeterminate_count) > 0 && (
            <SexBadge
              label='ID'
              value={clutchDetails?.indeterminate_count ?? 0}
              color={theme.palette.customColors.OnPrimaryContainer}
              bgColor={theme.palette.customColors.displaybgSecondary}
            />
          )}

          {Number(clutchDetails?.undetermined_count) > 0 && (
            <SexBadge
              label='UD'
              value={clutchDetails?.undetermined_count ?? 0}
              color={theme.palette.customColors.Error}
              bgColor={theme.palette.customColors.SurfaceVariant}
            />
          )}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mx: 4, my: 3 }}>
          <StyledTypography>
            {t('total')}: <span style={{ fontWeight: 600 }}>{clutchDetails?.total_egg_count || 0}</span>
          </StyledTypography>
          <StyledTypography>
            {t('animals_module.discarded')}: <span style={{ fontWeight: 600 }}>{clutchDetails?.discarded_count || 0}</span>
          </StyledTypography>
          <StyledTypography>
            {t('animals_module.hatched')}: <span style={{ fontWeight: 600 }}>{clutchDetails?.hatched_count || 0}</span>
          </StyledTypography>
        </Box>
      </Box>
    </Box>
  )
}

const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || theme.palette.customColors.OnSurfaceVariant || theme.palette.text.primary,
  ...(sx as any)
}))

const SexBadge = ({ label, value, bgColor, color }: any) => (
  <Box
    sx={{
      p: '6px 12px',
      borderRadius: 1,
      backgroundColor: bgColor,
      display: 'inline-flex'
    }}
  >
    <StyledTypography fontWeight={500} color={color}>
      {label} - {value}
    </StyledTypography>
  </Box>
)

export default React.memo(ClutchView)
