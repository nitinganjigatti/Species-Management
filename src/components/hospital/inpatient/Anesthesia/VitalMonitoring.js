import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { v4 as uuidv4 } from 'uuid'
import { alpha, useTheme } from '@mui/material/styles'

import AddTimeForm from './vitalForms/AddTimeForm'
import TemperatureForm from './vitalForms/TemperatureForm'
import HeartRateForm from './vitalForms/HeartRateForm'
import RespirationRateForm from './vitalForms/RespirationRateForm'
import Spo2Form from './vitalForms/Spo2Form'
import BloodPressureForm from './vitalForms/BloodPressureForm'
import CornealReflexForm from './vitalForms/CornealReflexForm'
import PainReflexForm from './vitalForms/PainReflexForm'
import AnalReflexForm from './vitalForms/AnalReflexForm'
import MuscleRelaxForm from './vitalForms/MuscleRelaxForm'

const HEADER_CELL_HEIGHT = '48px'
const DATA_CELL_HEIGHT = '72px'
const BASE_CELL_WIDTH = '164px'

const ROWS = [
  { key: 'recordedTime', label: 'Recorded Time' },
  { key: 'temperature', label: 'Temp', formComponent: TemperatureForm },
  { key: 'heartRate', label: 'HR', formComponent: HeartRateForm },
  { key: 'respirationRate', label: 'RR', formComponent: RespirationRateForm },
  { key: 'spo2', label: 'SpO2', formComponent: Spo2Form },
  { key: 'bloodPressure', label: 'BP', formComponent: BloodPressureForm },
  { key: 'cornealReflex', label: 'Corneal Reflex', formComponent: CornealReflexForm },
  { key: 'painReflex', label: 'Pain Reflex', formComponent: PainReflexForm },
  { key: 'analReflex', label: 'Anal Reflex', formComponent: AnalReflexForm },
  { key: 'muscleRelax', label: 'Muscle Relax', formComponent: MuscleRelaxForm }
]

const STICKY_ADD_WRAPPER_STYLES = {
  position: 'absolute',
  top: 0,
  right: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  pointerEvents: 'none',
  zIndex: 2
}

const FORM_COMPONENTS = {
  temperature: TemperatureForm,
  heartRate: HeartRateForm,
  respirationRate: RespirationRateForm,
  spo2: Spo2Form,
  bloodPressure: BloodPressureForm,
  cornealReflex: CornealReflexForm,
  painReflex: PainReflexForm,
  analReflex: AnalReflexForm,
  muscleRelax: MuscleRelaxForm
}

const createStyles = theme => {
  const bodyBg = theme.palette.customColors?.bodyBg || theme.palette.background.default
  const surfaceVariant = theme.palette.customColors?.SurfaceVariant || theme.palette.divider
  const outlineVariant = theme.palette.customColors?.OutlineVariant || theme.palette.divider
  const neutralPrimary = theme.palette.customColors?.neutralPrimary || theme.palette.text.primary
  const onSurfaceVariant = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.secondary
  const infoBackground = alpha(theme.palette.customColors?.SecondaryContainer || theme.palette.primary.light, 0.24)
  const activeBackground = theme.palette.customColors?.OnBackground || alpha(theme.palette.primary.light, 0.2)
  const dashedActiveBackground = alpha(theme.palette.customColors?.Notes || theme.palette.warning.light, 0.64)

  return {
    firstColumnCell: {
      width: BASE_CELL_WIDTH,
      minWidth: BASE_CELL_WIDTH,
      borderRadius: '4px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundColor: bodyBg,
      border: `0.5px solid ${surfaceVariant}`
    },
    firstColumnText: {
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '16px',
      letterSpacing: 0,
      color: neutralPrimary
    },
    timeCell: {
      width: BASE_CELL_WIDTH,
      minWidth: BASE_CELL_WIDTH,
      borderRadius: '4px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: bodyBg,
      border: `0.5px solid ${surfaceVariant}`
    },
    timeText: {
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '16px',
      letterSpacing: 0,
      color: neutralPrimary
    },
    dataCell: {
      width: BASE_CELL_WIDTH,
      minWidth: BASE_CELL_WIDTH,
      height: DATA_CELL_HEIGHT,
      borderRadius: '4px',
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      justifyContent: 'center',
      backgroundColor: infoBackground,
      border: `0.5px solid ${surfaceVariant}`,
      cursor: 'pointer'
    },
    dataCellActive: {
      border: `1px solid ${theme.palette.primary.main}`,
      backgroundColor: activeBackground
    },
    dataPrimaryText: {
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '16px',
      letterSpacing: 0,
      color: neutralPrimary
    },
    dataSecondaryText: {
      fontFamily: 'Inter',
      fontWeight: 400,
      fontSize: '14px',
      letterSpacing: 0,
      color: onSurfaceVariant
    },
    dashedCell: {
      width: BASE_CELL_WIDTH,
      minWidth: BASE_CELL_WIDTH,
      height: DATA_CELL_HEIGHT,
      borderRadius: '4px',
      padding: '8px',
      borderWidth: '0.5px',
      borderStyle: 'dashed',
      borderColor: outlineVariant,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: outlineVariant,
      backgroundColor: 'transparent',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      opacity: 0.9
    },
    dashedCellActive: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: theme.palette.primary.main,
      backgroundColor: dashedActiveBackground
    },
    dashedIcon: {
      color: outlineVariant
    },
    addTimeBox: {
      width: BASE_CELL_WIDTH,
      minWidth: BASE_CELL_WIDTH,
      borderRadius: '4px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      backgroundColor: bodyBg,
      border: `0.5px solid ${surfaceVariant}`,
      cursor: 'pointer',
      color: onSurfaceVariant
    },
    addIcon: {
      fontSize: '24px',
      color: theme.palette.primary.main
    },
    stickyButton: {
      width: '48px',
      height: HEADER_CELL_HEIGHT,
      minHeight: HEADER_CELL_HEIGHT,
      borderRadius: '4px',
      padding: '8px 12px',
      backgroundColor: theme.palette.primary.main,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      cursor: 'pointer',
      pointerEvents: 'auto'
    },
    stickyIcon: {
      fontSize: '20px',
      color: theme.palette.primary.contrastText
    }
  }
}

function getCellDisplay(rowKey, entry, timeLabel) {
  if (!entry) {
    return null
  }

  switch (rowKey) {
    case 'temperature':
    case 'heartRate':
    case 'respirationRate':
    case 'spo2':
      return {
        primary: `${entry.value}${entry.unit ? ` ${entry.unit}` : ''}`,
        secondary: timeLabel
      }
    case 'bloodPressure':
      return {
        primary: `${entry.systolic}${entry.unit ? ` ${entry.unit}` : ''}`,
        secondary: entry.mean ? `Mean: ${entry.mean} • ${timeLabel}` : timeLabel
      }
    case 'cornealReflex':
    case 'painReflex':
    case 'analReflex':
      return {
        primary: entry.selection,
        secondary: timeLabel
      }
    case 'muscleRelax':
      return {
        primary: `Score ${entry.score}`,
        secondary: timeLabel
      }
    default:
      return null
  }
}

export default function VitalMonitoring() {
  const theme = useTheme()
  const styles = useMemo(() => createStyles(theme), [theme])
  const [columns, setColumns] = useState([])
  const [isTimeFormOpen, setIsTimeFormOpen] = useState(false)
  const [formState, setFormState] = useState(null)
  const [activeCell, setActiveCell] = useState(null)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(true)

  const scrollContainerRef = useRef(null)

  const handleAddColumn = ({ timeLabel }) => {
    const newColumn = {
      id: uuidv4(),
      timeLabel,
      entries: {}
    }

    setColumns(prev => [...prev, newColumn])
    setIsTimeFormOpen(false)
  }

  const handleOpenCellForm = (columnId, rowKey) => {
    setActiveCell({ columnId, rowKey })
    setFormState({ columnId, rowKey })
  }

  const handleCloseForm = () => {
    setFormState(null)
    setActiveCell(null)
  }

  const handleSubmitEntry = data => {
    if (!formState) {
      return
    }

    setColumns(prev =>
      prev.map(column => {
        if (column.id !== formState.columnId) {
          return column
        }

        return {
          ...column,
          entries: {
            ...column.entries,
            [formState.rowKey]: data
          }
        }
      })
    )

    handleCloseForm()
  }

  const activeFormConfig = useMemo(() => {
    if (!formState) {
      return null
    }

    const column = columns.find(item => item.id === formState.columnId)
    if (!column) {
      return null
    }

    const FormComponent = FORM_COMPONENTS[formState.rowKey]
    if (!FormComponent) {
      return null
    }

    return {
      FormComponent,
      column,
      initialData: column.entries?.[formState.rowKey]
    }
  }, [columns, formState])

  const ActiveFormComponent = activeFormConfig?.FormComponent

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return undefined
    }

    const updateOverflowState = () => {
      const overflow = container.scrollWidth > container.clientWidth + 1
      setHasOverflow(overflow)
      setIsScrolledToEnd(container.scrollLeft + container.clientWidth >= container.scrollWidth - 2)
    }

    const handleScroll = () => {
      setIsScrolledToEnd(container.scrollLeft + container.clientWidth >= container.scrollWidth - 2)
    }

    updateOverflowState()
    window.addEventListener('resize', updateOverflowState)
    container.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', updateOverflowState)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [columns])

  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box sx={{ flex: '0 0 auto', display: 'grid', rowGap: '8px' }}>
          {ROWS.map(row => (
            <Box
              key={row.key}
              sx={{
                ...styles.firstColumnCell,
                height: row.key === 'recordedTime' ? HEADER_CELL_HEIGHT : DATA_CELL_HEIGHT
              }}
            >
              <Typography sx={styles.firstColumnText}>{row.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ flex: 1, overflowX: 'auto', paddingBottom: '8px' }} ref={scrollContainerRef}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            {columns.map(column => (
              <Box key={column.id} sx={{ display: 'grid', rowGap: '8px' }}>
                {ROWS.map((row, index) => {
                  if (index === 0) {
                    return (
                      <Box
                        key={row.key}
                        sx={{
                          ...styles.timeCell,
                          height: HEADER_CELL_HEIGHT
                        }}
                      >
                        <Typography sx={styles.timeText}>{column.timeLabel}</Typography>
                      </Box>
                    )
                  }

                  const entry = column.entries?.[row.key]
                  const display = getCellDisplay(row.key, entry, column.timeLabel)
                  const isActive = activeCell?.columnId === column.id && activeCell?.rowKey === row.key

                  if (display) {
                    return (
                      <Box
                        key={row.key}
                        sx={{
                          ...styles.dataCell,
                          ...(isActive ? styles.dataCellActive : {})
                        }}
                        onClick={() => handleOpenCellForm(column.id, row.key)}
                      >
                        <Typography sx={styles.dataPrimaryText}>{display.primary}</Typography>
                        <Typography sx={styles.dataSecondaryText}>{display.secondary}</Typography>
                      </Box>
                    )
                  }

                  return (
                    <Box
                      key={row.key}
                      sx={{
                        ...styles.dashedCell,
                        ...(isActive ? styles.dashedCellActive : {})
                      }}
                      onClick={() => handleOpenCellForm(column.id, row.key)}
                    >
                      <AddRoundedIcon sx={styles.dashedIcon} />
                    </Box>
                  )
                })}
              </Box>
            ))}

            <Box sx={{ display: 'grid', rowGap: '8px' }}>
              {ROWS.map((row, index) => {
                if (index === 0) {
                  return (
                    <Box
                      key={row.key}
                      sx={{
                        ...styles.addTimeBox,
                        height: HEADER_CELL_HEIGHT
                      }}
                      onClick={() => {
                        setIsTimeFormOpen(true)
                      }}
                    >
                      <AddRoundedIcon sx={styles.addIcon} />
                    </Box>
                  )
                }

                return <Box key={row.key} sx={{ width: BASE_CELL_WIDTH, height: DATA_CELL_HEIGHT }} />
              })}
            </Box>
          </Box>
        </Box>

        {hasOverflow && !isScrolledToEnd ? (
          <Box sx={STICKY_ADD_WRAPPER_STYLES}>
            <Box
              sx={styles.stickyButton}
              onClick={() => setIsTimeFormOpen(true)}
              onMouseDown={event => event.preventDefault()}
            >
              <AddRoundedIcon sx={styles.stickyIcon} />
            </Box>
          </Box>
        ) : null}
      </Box>

      <AddTimeForm open={isTimeFormOpen} onClose={() => setIsTimeFormOpen(false)} onSubmit={handleAddColumn} />

      {ActiveFormComponent ? (
        <ActiveFormComponent
          open
          onClose={handleCloseForm}
          timeLabel={activeFormConfig.column.timeLabel}
          onSubmit={handleSubmitEntry}
          initialData={activeFormConfig.initialData}
        />
      ) : null}
    </>
  )
}
