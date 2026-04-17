import React from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import Icon from 'src/@core/components/icon'
import RenderUtility from 'src/utility/render'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'

interface MetricCardProps {
  metric: any
  selected?: boolean
  onSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  onMedicineNameClick?: (e: React.MouseEvent<HTMLElement>) => void
  children?: React.ReactNode
  MetricLabel: any
  theme: any
  prescriptionCardColorsConfig: (metric: any) => any
}

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
}: MetricCardProps) => (
  <>
    <MUICheckbox
      checked={metric.canEdit === false || metric?.controlled_substance == 1 || selected}
      onChange={onSelect}
      disabled={metric.canEdit === false || metric?.controlled_substance == 1 || disabled}
      label={undefined as any}
      gap={undefined as any}
      checkboxStyle={undefined as any}
      labelStyle={undefined as any}
    />
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: metric?.status === 'restarted' && metric.sideEffects == 1 ? '3px' : '4px'
        }}
      >
        <Box
          sx={{
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '100%',
            letterSpacing: 0,
            verticalAlign: 'middle',
            fontStyle: 'normal',
            width: '210px',
            display: 'flex',
            gap: 1,
            alignItems: 'center'
          }}
        >
          {(metric?.status === 'stopped' || metric?.status === 'skipped') && (
            <Box
              component='img'
              src={metric?.status === 'stopped' ? '/images/hospital/stop.svg' : '/images/hospital/skip.svg'}
              alt={metric?.status === 'stopped' ? 'Stopped' : 'Skipped'}
              sx={{
                width: '16px',
                height: '16px',
                flexShrink: 0
              }}
            />
          )}
          {metric?.status === 'administered' && (
            <Icon
              icon={'mingcute:check-fill'}
              color={theme.palette.customColors.OnSurface}
              width='16px'
              height='16px'
              style={{ flexShrink: 0 }}
            />
          )}
          {metric?.controlled_substance == 1 && (
            <Box sx={{ ml: '4px', flexShrink: 0 }}>
              {RenderUtility?.renderControlLabel(metric?.controlled_substance == 1, 'CS')}
            </Box>
          )}

          <Tooltip title={metric?.name || ''} arrow placement='top'>
            <Box
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                lineHeight: 1.5,
                flex: 1
              }}
            >
              {metric?.name}
            </Box>
          </Tooltip>
        </Box>
        {metric?.sideEffects == 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportProblemIcon sx={{ fontSize: '10px', color: theme.palette.customColors.Tertiary }} />
            <Typography sx={{ fontSize: '10px', color: theme.palette.customColors.Tertiary, fontWeight: 500 }}>
              CAUSED ADVERSE SIDE EFFECTS
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon='wi:time-9' width='12px' height='12px' />
          <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.secondaryBg }}>
            {metric?.progress?.split('/')[1]
              ? `${metric?.progress?.split('/')[1]} ${parseInt(metric?.progress?.split('/')[1]) > 1 ? 'times' : 'time'}`
              : '-'}
          </Typography>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '100%',
              letterSpacing: 0,
              textAlign: 'right',
              ml: 'auto'
            }}
          >
            {(() => {
              const [completed, total] = metric.progress.split('/')
              const isComplete = completed === total

              return (
                <>
                  <Box
                    component='span'
                    sx={{
                      color: isComplete ? theme.palette.primary.main : theme.palette.customColors.Tertiary
                    }}
                  >
                    {completed}
                  </Box>
                  <Box
                    component='span'
                    sx={{
                      color: isComplete ? theme.palette.primary.main : theme.palette.customColors.secondaryBg
                    }}
                  >
                    /{total}
                  </Box>
                </>
              )
            })()}
          </Typography>
        </Box>
      </Box>
      {children}
    </MetricLabel>
  </>
)

export default MetricCard
