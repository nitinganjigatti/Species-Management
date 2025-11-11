import React from 'react'
import { Box, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { alpha, useTheme } from '@mui/material/styles'

const HEADER_CELL_HEIGHT = '48px'
const DATA_CELL_HEIGHT = '72px'
const BASE_CELL_WIDTH = '164px'

const ROWS = [
  { key: 'recordedTime', label: 'Recorded Time' },
  { key: 'temperature', label: 'Temp' },
  { key: 'heartRate', label: 'HR' },
  { key: 'respirationRate', label: 'RR' },
  { key: 'spo2', label: 'SpO2' },
  { key: 'bloodPressure', label: 'BP' },
  { key: 'cornealReflex', label: 'Corneal Reflex' },
  { key: 'painReflex', label: 'Pain Reflex' },
  { key: 'analReflex', label: 'Anal Reflex' },
  { key: 'muscleRelax', label: 'Muscle Relax' }
]

const SAMPLE_DATA = [
  {
    time: '12:26 PM',
    data: { bloodPressure: '180/72 mm Hg' }
  },
  {
    time: '12:35 PM',
    data: { temperature: '37°C', heartRate: '72 bpm', cornealReflex: 'Reduced' }
  },
  {
    time: '12:51 PM',
    data: { heartRate: '72 bpm', respirationRate: '36 bpm', bloodPressure: '180/72 mm Hg' }
  },
  {
    time: '01:03 PM',
    data: {
      temperature: '37°C',
      respirationRate: '34 bpm',
      spo2: '98%',
      bloodPressure: '180/72 mm Hg',
      cornealReflex: 'Normal',
      painReflex: 'Normal'
    }
  },
  {
    time: '01:18 PM',
    data: { heartRate: '72 bpm' }
  },
  {
    time: '01:30 PM',
    data: { heartRate: '72 bpm', analReflex: 'Reduced', muscleRelax: '3' }
  }
]

export default function VitalMonitoringDetail() {
  const theme = useTheme()

  const colors = {
    border: theme.palette.divider,
    headerBg: alpha(theme.palette.primary.main, 0.04),
    dataBg: alpha(theme.palette.primary.light, 0.08),
    dashedBorder: theme.palette.text.disabled,
    noteBg: alpha(theme.palette.warning.light, 0.24)
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Title */}
      <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
        Vital Monitoring
      </Typography>

      {/* Scrollable Table Container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
          display: 'flex',
          pb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {/* Sticky First Column */}
          <Box
            sx={{
              flex: '0 0 auto',
              display: 'grid',
              rowGap: '8px',
              position: 'sticky',
              left: 0,
              zIndex: 2,
              backgroundColor: theme.palette.background.paper,
              boxShadow: `2px 0 4px ${alpha(theme.palette.grey[500], 0.1)}`
            }}
          >
            {ROWS.map(row => (
              <Box
                key={row.key}
                sx={{
                  width: BASE_CELL_WIDTH,
                  minWidth: BASE_CELL_WIDTH,
                  height: row.key === 'recordedTime' ? HEADER_CELL_HEIGHT : DATA_CELL_HEIGHT,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  backgroundColor: theme.palette.customColors.Background,
                  color: theme.palette.customColors.deepDark,
                  fontWeight: 500,
                  fontSize: '16px',
                  px: 2
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '15px' }}>{row.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Scrollable Columns */}
          <Box sx={{ display: 'flex', gap: '8px' }}>
            {SAMPLE_DATA.map((col, colIndex) => (
              <Box key={colIndex} sx={{ display: 'grid', rowGap: '8px' }}>
                {ROWS.map((row, rowIndex) => {
                  if (rowIndex === 0) {
                    return (
                      <Box
                        key={row.key}
                        sx={{
                          width: BASE_CELL_WIDTH,
                          minWidth: BASE_CELL_WIDTH,
                          height: HEADER_CELL_HEIGHT,
                          borderRadius: '4px',
                          border: `0.5px solid ${colors.border}`,
                          color: theme.palette.customColors.deepDark,
                          fontWeight: 500,
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: alpha(theme.palette.customColors.SurfaceVariant, 0.5)
                        }}
                      >
                        <Typography sx={{ fontWeight: 500 }}>{col.time}</Typography>
                      </Box>
                    )
                  }

                  const value = col.data[row.key]
                  return (
                    <Box
                      key={row.key}
                      sx={{
                        width: BASE_CELL_WIDTH,
                        minWidth: BASE_CELL_WIDTH,
                        height: DATA_CELL_HEIGHT,
                        borderRadius: '4px',
                        border: `0.5px dashed ${colors.dashedBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: value ? theme.palette.customColors.mdAntzNeutral : 'transparent'
                      }}
                    >
                      {value ? (
                        <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>{value}</Typography>
                      ) : (
                        <AddRoundedIcon sx={{ fontSize: 20, color: colors.dashedBorder }} />
                      )}
                    </Box>
                  )
                })}
              </Box>
            ))}

            {/* Add Column */}
            <Box sx={{ display: 'grid', rowGap: '8px' }}>
              {ROWS.map((row, index) => (
                <Box
                  key={row.key}
                  sx={{
                    width: BASE_CELL_WIDTH,
                    minWidth: BASE_CELL_WIDTH,
                    height: index === 0 ? HEADER_CELL_HEIGHT : DATA_CELL_HEIGHT,
                    borderRadius: '4px',
                    border: `0.5px dashed ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {index === 0 ? <AddRoundedIcon sx={{ color: theme.palette.primary.main }} /> : null}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Notes Section */}
      <Box
        sx={{
          mt: 2,
          backgroundColor: colors.noteBg,
          borderRadius: '8px',
          p: 2,
          fontSize: '14px'
        }}
      >
        <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
          Notes
        </Typography>
        <Typography variant='body2' sx={{ lineHeight: 1.5 }}>
          Sample Fluid - 10 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </Typography>
      </Box>
    </Box>
  )
}
