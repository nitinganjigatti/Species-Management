import React, { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { v4 as uuidv4 } from 'uuid'
import { alpha, useTheme } from '@mui/material/styles'
import { useFormContext, useWatch } from 'react-hook-form'
import Toaster from 'src/components/Toaster'
import AddTimeForm from './vitalForms/AddTimeForm'
import GenericMeasurementDialog from './vitalForms/GenericMeasurementDialog'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import { deleteVitalMonitoring } from 'src/lib/api/hospital/anesthesia'

const HEADER_CELL_HEIGHT = '48px'
const DATA_CELL_HEIGHT = '72px'
const BASE_CELL_WIDTH = '164px'

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
      justifyContent: 'space-between',
      backgroundColor: bodyBg,
      border: `0.5px solid ${surfaceVariant}`,
      position: 'relative',
      '&:hover': {
        '& .delete-icon': {
          opacity: 1
        }
      }
    },
    timeTextContainer: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    timeText: {
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '16px',
      letterSpacing: 0,
      color: neutralPrimary
    },
    deleteIconButton: {
      width: '24px',
      height: '24px',
      minWidth: '24px',
      padding: '4px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      opacity: 0.7,
      transition: 'all 0.2s ease',
      color: onSurfaceVariant,
      '&:hover': {
        backgroundColor: alpha(theme.palette.error.main, 0.1),
        color: theme.palette.error.main
      }
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
      cursor: 'pointer'
    },
    stickyIcon: {
      fontSize: '20px',
      color: theme.palette.primary.contrastText
    }
  }
}

function getCellDisplay(rowKey, entry, timeLabel) {
  if (!entry) return null

  const secondary = timeLabel || ''

  // radio / selection first
  if (entry.selection !== undefined && entry.selection !== null && String(entry.selection).trim() !== '') {
    return { primary: String(entry.selection), secondary }
  }

  // single-number shape { value, unit }
  if (entry.value !== undefined && entry.value !== null && String(entry.value).trim() !== '') {
    const u = entry.unit ? ` ${entry.unit}` : ''
    return { primary: `${String(entry.value)}${u}`, secondary }
  }

  // canonical server-style map: fieldsById
  if (entry.fieldsById && typeof entry.fieldsById === 'object') {
    const vals = Object.keys(entry.fieldsById)
      .sort((a, b) => Number(a) - Number(b))
      .map(key => {
        const obj = entry.fieldsById[key]
        if (!obj) return null
        const v = obj.value == null ? '' : String(obj.value).trim()
        if (!v) return null
        return v
      })
      .filter(Boolean)

    if (vals.length > 0) {
      // join with " / " (e.g. "120 mmHg / 80 mmHg") — this shows multiple fields like BP
      //return { primary: vals.join(' / '), secondary }
      const unitFromFields = Object.values(entry.fieldsById).find(f => f?.unit)?.unit
      const unit = unitFromFields || entry.unit || ''

      const primary = unit ? `${vals.join(' / ')} ${unit}` : vals.join(' / ')

      return { primary, secondary }
    }
  }

  const flatKeys = Object.keys(entry).filter(k => !['unit', 'fieldsById', 'selection'].includes(k))
  if (flatKeys.length > 0) {
    const vals = flatKeys
      .map(k => {
        const v = entry[k]
        if (v === undefined || v === null || String(v).trim() === '') return null
        return String(v).trim()
      })
      .filter(Boolean)

    if (vals.length > 0) {
      const u = entry.unit ? ` ${entry.unit}` : ''
      const primary = vals.length === 1 ? `${vals[0]}${u}` : `${vals.join(' / ')}${u}`
      return { primary, secondary }
    }
  }

  return null
}

export default function VitalMonitoring({ vitalMonitorList = [] }) {
  const theme = useTheme()
  const styles = useMemo(() => createStyles(theme), [theme])
  const { control, setValue } = useFormContext()
  const columns = useWatch({ control, name: 'vitalMonitoring' }) || []
  const [isTimeFormOpen, setIsTimeFormOpen] = useState(false)
  const [activeCell, setActiveCell] = useState(null)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(true)
  const [editingColumnId, setEditingColumnId] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const scrollContainerRef = useRef(null)

  const handleEditTime = columnId => {
    setEditingColumnId(columnId)
    setIsTimeFormOpen(true)
  }

  const ROWS = useMemo(() => {
    return [
      { key: 'recordedTime', label: 'Recorded Time' },
      ...(vitalMonitorList || []).map(s => ({ key: s.string_id, label: s.section_name }))
    ]
  }, [vitalMonitorList])

  const updateColumns = newColumns => {
    setValue('vitalMonitoring', newColumns, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false
    })
  }

  const handleAddColumn = ({ timeLabel }) => {
    const normalizedTime = timeLabel.trim().toUpperCase()

    if (editingColumnId) {
      const timeExists = columns.some(
        column => column.id !== editingColumnId && column.timeLabel && column.timeLabel.toUpperCase() === normalizedTime
      )

      if (timeExists) {
        Toaster({ type: 'error', message: `Time ${timeLabel} already exists! Please choose a different time.` })

        return
      }

      const updatedColumns = columns.map(column => {
        if (column.id === editingColumnId) {
          return {
            ...column,
            timeLabel: normalizedTime
          }
        }
        return column
      })

      updateColumns(updatedColumns)
      setEditingColumnId(null)
      setIsTimeFormOpen(false)
      return
    }

    const exists = columns.some(column => column.timeLabel && column.timeLabel.toUpperCase() === normalizedTime)
    if (exists) {
      Toaster({ type: 'error', message: `Time ${timeLabel} already exists! Please choose a different time.` })

      return
    }

    const newColumn = {
      id: `temp_${uuidv4()}`,
      timeLabel: normalizedTime,
      entries: {}
    }

    updateColumns([...columns, newColumn])
    setIsTimeFormOpen(false)
  }

  const handleOpenCellForm = (columnId, rowKey) => {
    setActiveCell({ columnId, rowKey })
  }

  const handleCloseForm = () => {
    setActiveCell(null)
  }

  const handleSubmitEntry = data => {
    if (!activeCell) return
    const { columnId, rowKey } = activeCell

    const sectionMeta = (vitalMonitorList || []).find(s => s.string_id === rowKey)

    const updatedColumns = columns.map(column => {
      if (column.id !== columnId) return column

      const existingEntry = column.entries?.[rowKey] ?? {}
      const newEntry = { ...existingEntry }

      const fieldsById = { ...(existingEntry.fieldsById || {}) }

      const keyToFields = {}
      if (sectionMeta && Array.isArray(sectionMeta.fields)) {
        sectionMeta.fields.forEach(f => {
          if (!keyToFields[f.field_key]) keyToFields[f.field_key] = []
          keyToFields[f.field_key].push(f)
        })
      }

      Object.keys(data).forEach(k => {
        if (k === 'unit') {
          newEntry.unit = data.unit
          return
        }

        if (k === 'selection') {
          newEntry.selection = data.selection

          if (sectionMeta && Array.isArray(sectionMeta.fields) && sectionMeta.fields.length === 1) {
            const fld = sectionMeta.fields[0]
            const fid = String(fld.field_id)
            fieldsById[fid] = {
              field_key: fld.field_key,
              value: data.selection == null ? '' : String(data.selection),
              unit: (fieldsById[fid] && fieldsById[fid].unit) ?? newEntry.unit ?? null
            }
          }

          return
        }

        const val = data[k]

        if (keyToFields[k] && keyToFields[k].length > 0) {
          for (const fld of keyToFields[k]) {
            const fid = String(fld.field_id)
            fieldsById[fid] = {
              field_key: fld.field_key,
              value: val == null ? '' : String(val),
              unit: data.unit ?? (fieldsById[fid] && fieldsById[fid].unit) ?? null
            }
          }

          newEntry[k] = val
        } else {
          newEntry[k] = val
        }
      })
      if (Object.keys(fieldsById).length > 0) {
        newEntry.fieldsById = fieldsById
      }

      if (data.unit) newEntry.unit = data.unit

      return {
        ...column,
        entries: {
          ...column.entries,
          [rowKey]: newEntry
        }
      }
    })

    updateColumns(updatedColumns)
    handleCloseForm()
  }

  const activeSectionMeta = useMemo(() => {
    if (!activeCell) return null
    return vitalMonitorList.find(s => s.string_id === activeCell.rowKey) || null
  }, [activeCell, vitalMonitorList])

  const activeInitialData = useMemo(() => {
    if (!activeCell) return null
    const column = columns.find(c => c.id === activeCell.columnId)
    return column?.entries?.[activeCell.rowKey] ?? null
  }, [activeCell, columns])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return undefined

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

  const handleDeleteColumn = columnId => {
    const columnToDelete = columns.find(c => c.id === columnId)
    setColumnToDelete({
      id: columnId,
      timeLabel: columnToDelete?.timeLabel || 'this time'
    })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!columnToDelete) return

    setIsDeleting(true)
    try {
      const response = await deleteVitalMonitoring({
        record_time_id: columnToDelete.id
      })

      if (response.success) {
        const updatedColumns = columns.filter(column => column.id !== columnToDelete.id)
        updateColumns(updatedColumns)

        Toaster({
          type: 'success',
          message: response?.message || 'Time column deleted successfully'
        })
      } else {
        Toaster({
          type: 'error',
          message: response.message || 'Failed to delete time column'
        })
      }
    } catch (error) {
      Toaster({
        type: 'error',
        message: 'An error occurred while deleting the time column'
      })
    } finally {
      setIsDeleting(false)
      setColumnToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleDeleteCancel = () => {
    setColumnToDelete(null)
    setDeleteDialogOpen(false)
  }

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
                        sx={{ ...styles.timeCell, height: HEADER_CELL_HEIGHT, cursor: 'pointer' }}
                        //onClick={() => handleEditTime(column.id)}
                      >
                        <Box sx={styles.timeTextContainer} onClick={() => handleEditTime(column.id)}>
                          <Typography sx={styles.timeText}>{column.timeLabel}</Typography>
                        </Box>
                        <Box
                          className='delete-icon'
                          sx={styles.deleteIconButton}
                          onClick={e => {
                            e.stopPropagation()
                            handleDeleteColumn(column.id)
                          }}
                        >
                          <CloseRoundedIcon sx={{ fontSize: '16px' }} />
                        </Box>
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
                      onClick={() => {
                        handleOpenCellForm(column.id, row.key)
                      }}
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
                        setEditingColumnId(null)
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
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              pointerEvents: 'none',
              zIndex: 2
            }}
          >
            <Box
              sx={styles.stickyButton}
              onClick={() => {
                setEditingColumnId(null)
                setIsTimeFormOpen(true)
              }}
              onMouseDown={event => event.preventDefault()}
            >
              <AddRoundedIcon sx={styles.stickyIcon} />
            </Box>
          </Box>
        ) : null}
      </Box>

      <AddTimeForm
        open={isTimeFormOpen}
        onClose={() => {
          setIsTimeFormOpen(false)
          setEditingColumnId(null)
        }}
        onSubmit={handleAddColumn}
        initialValue={editingColumnId ? columns.find(c => c.id === editingColumnId)?.timeLabel : ''}
      />

      <GenericMeasurementDialog
        open={!!activeCell}
        onClose={handleCloseForm}
        onSubmit={handleSubmitEntry}
        sectionMeta={activeSectionMeta}
        initialData={activeInitialData}
        timeLabel={activeCell ? columns.find(c => c.id === activeCell.columnId)?.timeLabel : ''}
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        handleClose={handleDeleteCancel}
        action={handleDeleteConfirm}
        loading={isDeleting}
        title='Delete Time Column'
        message={`Are you sure you want to delete the time column for ${columnToDelete?.timeLabel}? `}
      />
    </>
  )
}

VitalMonitoring.propTypes = {
  vitalMonitorList: PropTypes.array
}
