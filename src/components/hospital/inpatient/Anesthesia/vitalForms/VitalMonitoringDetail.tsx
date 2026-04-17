'use client'

import React, { useMemo } from 'react'
import { Box, Divider, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { alpha, useTheme } from '@mui/material/styles'

const HEADER_CELL_HEIGHT = '48px'
const DATA_CELL_HEIGHT = '72px'
const BASE_CELL_WIDTH = '164px'

const hasMonitoringData = ({ timeSlots, rows }: any) =>
  Array.isArray(timeSlots) && timeSlots.length && Array.isArray(rows) && rows.length

interface VitalMonitoringDetailProps {
  data?: any
}

export default function VitalMonitoringDetail({ data }: VitalMonitoringDetailProps) {
  const theme: any = useTheme()

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
      </Box>
    )
  }

  const rowLabels = ['Recorded Time', ...monitoringData.rows.map((row: any) => row.label)]

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Divider sx={{ mb: 6, mt: 3 }} />
      <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
        Vital Monitoring
      </Typography>

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
            {rowLabels.map((label: any, index: number) => (
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

          <Box sx={{ display: 'flex', gap: '8px' }}>
            {monitoringData.timeSlots.map((slot: any) => (
              <Box key={slot.id} sx={{ display: 'grid', rowGap: '8px' }}>
                {rowLabels.map((label: any, index: number) => {
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
                        <AddRoundedIcon sx={{ fontSize: 20, color: colors.dashedBorder, display: 'none' }} />
                      )}
                    </Box>
                  )
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
