import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, TextField, Typography } from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'

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

const unitValue = 'per min'

const headerRenderer = (title, timeLabel) => {
  const displayTime = timeLabel || '--'

  return (
    <Box sx={measurementHeaderContainerSx}>
      <Typography sx={measurementHeaderTitleSx}>{title}</Typography>
      <Box sx={measurementHeaderTimeContainerSx}>
        <AccessTimeRoundedIcon sx={measurementHeaderTimeIconSx} />
        <Typography sx={measurementHeaderTitleSx}>{displayTime}</Typography>
      </Box>
    </Box>
  )
}

export default function RespirationRateForm({ open, onClose, onSubmit, timeLabel, initialData }) {
  const [value, setValue] = useState(initialData?.value || '')
  const [unit] = useState(unitValue)

  useEffect(() => {
    if (open) {
      setValue(initialData?.value || '')
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (!value.trim()) {
      return
    }

    onSubmit({ value: value.trim(), unit })
  }

  const disableSubmit = useMemo(() => !value.trim(), [value])

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Respiration Rate (RR)'
      renderHeader={() => headerRenderer('Respiration Rate (RR)', timeLabel)}
      contentSx={measurementContentSx}
      actionsSx={measurementActionsSx}
      cancelButtonSx={measurementCancelButtonSx}
      submitButtonSx={measurementSubmitButtonSx}
      paperSx={measurementDialogPaperSx}
      disableSubmit={disableSubmit}
      submitLabel='Add Entry'
    >
      <Box sx={measurementFieldsContainerSx}>
        <Box sx={measurementPrimaryFieldColumnSx}>
          <Typography sx={measurementFieldLabelSx}>Enter Value</Typography>
          <TextField
            fullWidth
            placeholder='Enter Value'
            value={value}
            onChange={event => setValue(event.target.value)}
            type='number'
            inputProps={{ min: 0, inputMode: 'numeric' }}
            sx={createMeasurementFieldSx('#F2FFF8')}
          />
        </Box>

        <Box sx={measurementSecondaryFieldColumnSx}>
          <Typography sx={measurementFieldLabelSx}>UOM</Typography>
          <TextField
            fullWidth
            value={unit}
            InputProps={{ readOnly: true }}
            sx={createMeasurementFieldSx('rgba(0, 0, 0, 0.05)', '#7A8684')}
          />
        </Box>
      </Box>
    </VitalFormDialog>
  )
}

RespirationRateForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    value: PropTypes.string
  })
}
