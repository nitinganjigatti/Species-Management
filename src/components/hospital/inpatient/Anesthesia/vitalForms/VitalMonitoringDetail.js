import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { alpha, useTheme } from '@mui/material/styles'

const HEADER_CELL_HEIGHT = '48px'
const DATA_CELL_HEIGHT = '72px'
const BASE_CELL_WIDTH = '164px'

const hasMonitoringData = ({ timeSlots, rows }) =>
  Array.isArray(timeSlots) && timeSlots.length && Array.isArray(rows) && rows.length

export default function VitalMonitoringDetail({ data }) {
  const theme = useTheme()

  const monitoringData = useMemo(() => data || { timeSlots: [], rows: [] }, [data])

  const colors = {
    border: theme.palette.divider,
    headerBg: alpha(theme.palette.primary.main, 0.04),
    dataBg: alpha(theme.palette.primary.light, 0.08),
    dashedBorder: theme.palette.text.disabled,
    noteBg: alpha(theme.palette.warning.light, 0.24)
  }

  const showData = hasMonitoringData(monitoringData)

  if (!showData) {
    return (
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
          Vital Monitoring
        </Typography>
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>
          No vital monitoring data recorded.
        </Typography>
      </Box>
    )
  }

  const rowLabels = ['Recorded Time', ...monitoringData.rows.map(row => row.label)]

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
            {rowLabels.map((label, index) => (
              <Box
                key={label}
                sx={{
                  width: BASE_CELL_WIDTH,
                  minWidth: BASE_CELL_WIDTH,
                  height: index === 0 ? HEADER_CELL_HEIGHT : DATA_CELL_HEIGHT,
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
                <Typography sx={{ fontWeight: 500, fontSize: '15px' }}>{label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Scrollable Columns */}
          <Box sx={{ display: 'flex', gap: '8px' }}>
            {monitoringData.timeSlots.map(slot => (
              <Box key={slot.id} sx={{ display: 'grid', rowGap: '8px' }}>
                {rowLabels.map((label, index) => {
                  if (index === 0) {
                    return (
                      <Box
                        key={`${slot.id}-header`}
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
                        <Typography sx={{ fontWeight: 500 }}>{slot.label}</Typography>
                      </Box>
                    )
                  }

                  const row = monitoringData.rows[index - 1]
                  const value = row?.values?.[slot.id]

                  return (
                    <Box
                      key={`${slot.id}-${row?.key || index}`}
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
              {rowLabels.map((label, index) => (
                <Box
                  key={`add-${label}`}
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
