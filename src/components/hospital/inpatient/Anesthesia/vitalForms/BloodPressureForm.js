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
  measurementHeaderContainerSx,
  measurementHeaderTimeContainerSx,
  measurementHeaderTimeIconSx,
  measurementHeaderTitleSx,
  measurementSubmitButtonSx,
  createMeasurementFieldSx
} from './sharedStyles'

const unitValue = 'mmHg'

export default function BloodPressureForm({ open, onClose, onSubmit, timeLabel, initialData }) {
  const theme = useTheme()
  const [systolic, setSystolic] = useState(initialData?.systolic || '')
  const [mean, setMean] = useState(initialData?.mean || '')

  useEffect(() => {
    if (open) {
      setSystolic(initialData?.systolic || '')
      setMean(initialData?.mean || '')
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (!systolic.trim() || !mean.trim()) {
      return
    }

    onSubmit({ systolic: systolic.trim(), mean: mean.trim(), unit: unitValue })
  }

  const disableSubmit = useMemo(() => !systolic.trim() || !mean.trim(), [systolic, mean])

  const renderHeader = () => {
    const displayTime = timeLabel || '--'

    return (
      <Box sx={measurementHeaderContainerSx(theme)}>
        <Typography sx={measurementHeaderTitleSx(theme)}>Blood Pressure (BP)</Typography>
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
      title='Blood Pressure (BP)'
      renderHeader={renderHeader}
      contentSx={measurementContentSx}
      actionsSx={measurementActionsSx}
      cancelButtonSx={measurementCancelButtonSx(theme)}
      submitButtonSx={measurementSubmitButtonSx(theme)}
      paperSx={measurementDialogPaperSx(theme)}
      disableSubmit={disableSubmit}
      submitLabel='Add Entry'
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr 132px',
          gap: '12px',
          alignItems: 'end',
          padding: '16px'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Typography sx={measurementFieldLabelSx(theme)}>Systolic</Typography>
          <TextField
            type='number'
            placeholder='Enter Value'
            value={systolic}
            onChange={event => setSystolic(event.target.value)}
            inputProps={{ min: 0, inputMode: 'numeric' }}
            sx={createMeasurementFieldSx(
              theme,
              theme.palette.customColors?.Surface,
              theme.palette.customColors?.customHeadingTextColor
            )}
            fullWidth
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}>
          <Typography
            sx={{
              fontFamily: 'Inter',
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: 0,
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
            }}
          >
            /
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Typography sx={measurementFieldLabelSx(theme)}>Mean</Typography>
          <TextField
            type='number'
            placeholder='Enter Value'
            value={mean}
            onChange={event => setMean(event.target.value)}
            inputProps={{ min: 0, inputMode: 'numeric' }}
            sx={createMeasurementFieldSx(
              theme,
              theme.palette.customColors?.Surface,
              theme.palette.customColors?.customHeadingTextColor
            )}
            fullWidth
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Typography sx={measurementFieldLabelSx(theme)}>UOM</Typography>
          <TextField
            value={unitValue}
            InputProps={{
              readOnly: true,
              sx: {
                '& .MuiOutlinedInput-input': {
                  fontWeight: 500,
                  fontSize: '16px',
                  letterSpacing: 0
                }
              }
            }}
            sx={createMeasurementFieldSx(
              theme,
              theme.palette.customColors?.neutral05,
              theme.palette.customColors?.neutralSecondary
            )}
            fullWidth
          />
        </Box>
      </Box>
    </VitalFormDialog>
  )
}

BloodPressureForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    systolic: PropTypes.string,
    mean: PropTypes.string
  })
}
