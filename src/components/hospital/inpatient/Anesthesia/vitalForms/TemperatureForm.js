import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, MenuItem, TextField, Typography } from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import { useTheme } from '@mui/material/styles'

import VitalFormDialog from './VitalFormDialog'
import {
  measurementActionsSx,
  measurementCancelButtonSx,
  measurementContentSx,
  measurementDialogPaperSx,
  measurementFieldLabelSx,
  measurementFieldsContainerSx,
  measurementHeaderContainerSx,
  measurementHeaderTimeContainerSx,
  measurementHeaderTimeIconSx,
  measurementHeaderTitleSx,
  measurementPrimaryFieldColumnSx,
  measurementSecondaryFieldColumnSx,
  measurementSubmitButtonSx,
  createMeasurementFieldSx
} from './sharedStyles'

const unitOptions = ['°C', '°F']

export default function TemperatureForm({ open, onClose, onSubmit, timeLabel, initialData }) {
  const theme = useTheme()
  const [value, setValue] = useState(initialData?.value || '')
  const [unit, setUnit] = useState(initialData?.unit || unitOptions[0])

  useEffect(() => {
    if (open) {
      setValue(initialData?.value || '')
      setUnit(initialData?.unit || unitOptions[0])
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (!value.trim()) {
      return
    }

    onSubmit({ value: value.trim(), unit })
  }

  const disableSubmit = useMemo(() => !value.trim(), [value])

  const renderHeader = () => {
    const displayTime = timeLabel || '--'

    return (
      <Box sx={measurementHeaderContainerSx(theme)}>
        <Typography sx={measurementHeaderTitleSx(theme)}>Temperature</Typography>
        <Box sx={measurementHeaderTimeContainerSx}>
          <AccessTimeRoundedIcon sx={measurementHeaderTimeIconSx(theme)} />
          <Typography sx={measurementHeaderTitleSx(theme)}>{displayTime}</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Temperature'
      renderHeader={renderHeader}
      contentSx={measurementContentSx}
      actionsSx={measurementActionsSx}
      cancelButtonSx={measurementCancelButtonSx(theme)}
      submitButtonSx={measurementSubmitButtonSx(theme)}
      paperSx={measurementDialogPaperSx(theme)}
      disableSubmit={disableSubmit}
      submitLabel='Add Entry'
    >
      <Box sx={measurementFieldsContainerSx}>
        <Box sx={measurementPrimaryFieldColumnSx}>
          <Typography sx={measurementFieldLabelSx(theme)}>Enter Value</Typography>
          <TextField
            fullWidth
            placeholder='Enter Value'
            value={value}
            onChange={event => setValue(event.target.value)}
            type='number'
            inputProps={{ min: 0, inputMode: 'decimal' }}
            sx={createMeasurementFieldSx(
              theme,
              theme.palette.customColors?.Surface,
              theme.palette.customColors?.customHeadingTextColor
            )}
          />
        </Box>

        <Box sx={measurementSecondaryFieldColumnSx}>
          <Typography sx={measurementFieldLabelSx(theme)}>UOM</Typography>
          <TextField
            select
            fullWidth
            value={unit}
            onChange={event => setUnit(event.target.value)}
            sx={createMeasurementFieldSx(
              theme,
              theme.palette.customColors?.Surface,
              theme.palette.customColors?.neutralSecondary
            )}
          >
            {unitOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>
    </VitalFormDialog>
  )
}

TemperatureForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    value: PropTypes.string,
    unit: PropTypes.string
  })
}
