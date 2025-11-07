import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, TextField, Typography } from '@mui/material'
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

const unitValue = '%'

export default function Spo2Form({ open, onClose, onSubmit, timeLabel, initialData }) {
  const theme = useTheme()
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

  const renderHeader = () => {
    const displayTime = timeLabel || '--'

    return (
      <Box sx={measurementHeaderContainerSx(theme)}>
        <Typography sx={measurementHeaderTitleSx(theme)}>SpO2</Typography>
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
      title='SpO2'
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
            inputProps={{ min: 0, max: 100, inputMode: 'numeric' }}
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
            fullWidth
            value={unit}
            InputProps={{ readOnly: true }}
            sx={createMeasurementFieldSx(
              theme,
              theme.palette.customColors?.neutral05,
              theme.palette.customColors?.neutralSecondary
            )}
          />
        </Box>
      </Box>
    </VitalFormDialog>
  )
}

Spo2Form.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    value: PropTypes.string
  })
}
