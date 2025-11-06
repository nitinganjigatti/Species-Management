import React, { useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { v4 as uuidv4 } from 'uuid'

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

const FIRST_COLUMN_CELL_STYLES = {
  width: '164px',
  minWidth: '164px',
  borderRadius: '4px',
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  backgroundColor: '#EFF5F2',
  border: '0.5px solid #DAE7DF'
}

const FIRST_COLUMN_TEXT_STYLES = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: 0,
  color: '#000000'
}

const TIME_CELL_STYLES = {
  width: '164px',
  minWidth: '164px',
  borderRadius: '4px',
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#EFF5F2',
  border: '0.5px solid #DAE7DF'
}

const TIME_TEXT_STYLES = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: 0,
  color: '#000000'
}

const DATA_CELL_STYLES = {
  width: '164px',
  minWidth: '164px',
  height: DATA_CELL_HEIGHT,
  borderRadius: '4px',
  padding: '8px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  justifyContent: 'center',
  backgroundColor: '#AFEFEB3D',
  border: '0.5px solid #DAE7DF',
  cursor: 'pointer'
}

const DATA_CELL_ACTIVE_STYLES = {
  border: '1px solid #37BD69',
  backgroundColor: '#E6F8ED'
}

const DATA_PRIMARY_TEXT = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: 0,
  color: '#000000'
}

const DATA_SECONDARY_TEXT = {
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '14px',
  letterSpacing: 0,
  color: '#44544A'
}

const DASHED_BOX_STYLES = {
  width: '164px',
  minWidth: '164px',
  height: DATA_CELL_HEIGHT,
  borderRadius: '4px',
  padding: '8px',
  borderWidth: '0.5px',
  borderStyle: 'dashed',
  borderColor: '#C3CEC7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#C3CEC7',
  backgroundColor: 'transparent',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  opacity: 0.9
}

const DASHED_BOX_ACTIVE_STYLES = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#37BD69',
  backgroundColor: '#FCF4AEA3'
}

const ADD_TIME_BOX_STYLES = {
  ...TIME_CELL_STYLES,
  cursor: 'pointer',
  color: '#44544A',
  display: 'flex',
  gap: '8px'
}

const ADD_ICON_STYLES = {
  fontSize: '24px',
  color: '#37BD69'
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
  const [columns, setColumns] = useState([])
  const [isTimeFormOpen, setIsTimeFormOpen] = useState(false)
  const [formState, setFormState] = useState(null)
  const [activeCell, setActiveCell] = useState(null)

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

  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ flex: '0 0 auto', display: 'grid', rowGap: '8px' }}>
          {ROWS.map(row => (
            <Box
              key={row.key}
              sx={{
                ...FIRST_COLUMN_CELL_STYLES,
                height: row.key === 'recordedTime' ? HEADER_CELL_HEIGHT : DATA_CELL_HEIGHT
              }}
            >
              <Typography sx={FIRST_COLUMN_TEXT_STYLES}>{row.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ flex: 1, overflowX: 'auto', paddingBottom: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            {columns.map(column => (
              <Box key={column.id} sx={{ display: 'grid', rowGap: '8px' }}>
                {ROWS.map((row, index) => {
                  if (index === 0) {
                    return (
                      <Box
                        key={row.key}
                        sx={{
                          ...TIME_CELL_STYLES,
                          height: HEADER_CELL_HEIGHT
                        }}
                      >
                        <Typography sx={TIME_TEXT_STYLES}>{column.timeLabel}</Typography>
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
                          ...DATA_CELL_STYLES,
                          ...(isActive ? DATA_CELL_ACTIVE_STYLES : {})
                        }}
                        onClick={() => handleOpenCellForm(column.id, row.key)}
                      >
                        <Typography sx={DATA_PRIMARY_TEXT}>{display.primary}</Typography>
                        <Typography sx={DATA_SECONDARY_TEXT}>{display.secondary}</Typography>
                      </Box>
                    )
                  }

                  return (
                    <Box
                      key={row.key}
                      sx={{
                        ...DASHED_BOX_STYLES,
                        ...(isActive ? DASHED_BOX_ACTIVE_STYLES : {})
                      }}
                      onClick={() => handleOpenCellForm(column.id, row.key)}
                    >
                      <AddRoundedIcon sx={{ color: '#C3CEC7' }} />
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
                        ...ADD_TIME_BOX_STYLES,
                        height: HEADER_CELL_HEIGHT
                      }}
                      onClick={() => {
                        setIsTimeFormOpen(true)
                      }}
                    >
                      <AddRoundedIcon sx={ADD_ICON_STYLES} />
                    </Box>
                  )
                }

                return <Box key={row.key} sx={{ width: '164px', height: '72px' }} />
              })}
            </Box>
          </Box>
        </Box>
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
