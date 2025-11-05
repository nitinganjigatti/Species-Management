import React from 'react'
import { Box, Typography } from '@mui/material'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import Icon from 'src/@core/components/icon'

const MetricCard = ({
  metric,
  selected,
  onSelect,
  disabled,
  onMedicineNameClick,
  children,
  MetricLabel,
  theme,
  prescriptionCardColorsConfig
}) => (
  <>
    <MUICheckbox checked={selected} onChange={onSelect} disabled={disabled} />
    <MetricLabel
      onClick={onMedicineNameClick}
      disabled={disabled}
      config={prescriptionCardColorsConfig(metric)}
      sx={{
        ...(selected && {
          backgroundColor: theme.palette.customColors.OnBackground,
          border: `1.5px solid ${theme.palette.primary.main}`
        }),
        ...(disabled && {
          opacity: 0.9,
          pointerEvents: 'none'
        })
      }}
    >
      <Box>
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '100%',
            letterSpacing: 0,
            verticalAlign: 'middle',
            fontStyle: 'normal',
            width: '210px',
            display: 'flex',
            gap: 1
          }}
        >
          {(metric?.status === 'stopped' || metric?.status === 'skipped') && (
            <Icon
              icon={metric?.status === 'stopped' ? 'jam:stop-sign' : 'mingcute:check-fill'}
              color={
                metric?.status === 'stopped'
                  ? theme.palette.customColors.Tertiary
                  : theme.palette.customColors.OnSurface
              }
              width='16px'
              height='16px'
            />
          )}
          {metric?.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
          <Icon icon='wi:time-9' width='12px' height='12px' />
          <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.secondaryBg }}>
            {metric.frequency}
          </Typography>
          <Typography
            sx={{
              color: theme.palette.customColors.secondaryBg,
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '100%',
              letterSpacing: 0,
              textAlign: 'right',
              ml: 'auto'
            }}
          >
            {metric.progress}
          </Typography>
        </Box>
      </Box>
      {children}
    </MetricLabel>
  </>
)

export default MetricCard
