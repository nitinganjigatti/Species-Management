import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import VitalFormDialog from './VitalFormDialog'

dayjs.extend(customParseFormat)

const timePickerTextFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    height: '56px',
    backgroundColor: '#FFFFFF',
    '& fieldset': {
      borderColor: '#C3CEC7'
    },
    '&:hover fieldset': {
      borderColor: '#37BD69'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#37BD69'
    }
  },
  '& .MuiOutlinedInput-input': {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '18px',
    letterSpacing: 0,
    color: '#133020'
  },
  '& .MuiInputAdornment-root': {
    color: '#44544A'
  }
}

const labelStyles = {
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '16px',
  letterSpacing: 0,
  color: '#44544A'
}

const SUBMIT_BUTTON_STYLES = {
  height: '42px',
  borderRadius: '8px',
  boxShadow: '0px 4px 8px -4px #4C4E646B'
}

const parseInitialValue = initialValue => {
  if (!initialValue) {
    return null
  }

  const parsed = dayjs(initialValue, 'hh:mm A', true)
  return parsed.isValid() ? parsed : null
}

export default function AddTimeForm({ open, onClose, onSubmit, initialValue = '' }) {
  const [timeValue, setTimeValue] = useState(() => parseInitialValue(initialValue))

  useEffect(() => {
    if (open) {
      setTimeValue(parseInitialValue(initialValue))
    }
  }, [open, initialValue])

  const handleSubmit = () => {
    if (!timeValue || !timeValue.isValid()) {
      return
    }

    onSubmit({ timeLabel: timeValue.format('hh:mm A') })
  }

  const disableSubmit = useMemo(() => !timeValue || !timeValue.isValid(), [timeValue])

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel='Add'
      hideCancel
      title='Add Time'
      disableSubmit={disableSubmit}
      headerSx={{
        height: '52px',
        padding: '16px',
        backgroundColor: '#E8F4F2',
        gap: '10px'
      }}
      titleTypographySx={{
        fontWeight: 500,
        fontSize: '16px',
        color: '#000000'
      }}
      closeButtonSx={{
        width: '20px',
        height: '20px',
        padding: '4.17px',
        border: 'none',
        color: '#839D8D',
        marginRight: '0px'
      }}
      contentSx={{
        flex: 1,
        paddingTop: '12px !important',
        paddingRight: '16px',
        paddingBottom: '24px',
        paddingLeft: '16px',
        gap: '20px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column'
      }}
      actionsSx={{
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        padding: '0 16px 16px',
        width: '100%'
      }}
      submitButtonSx={{
        ...SUBMIT_BUTTON_STYLES,
        width: '100%'
      }}
      paperSx={{
        width: '293px',
        maxWidth: '293px',
        minWidth: '293px',
        height: '233px',
        borderWidth: '1px'
      }}
      maxWidth='xs'
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Typography sx={labelStyles}>Recorded Time</Typography>

          <TimePicker
            value={timeValue}
            onChange={newValue => setTimeValue(newValue)}
            format='hh:mm A'
            slotProps={{
              textField: {
                fullWidth: true,
                placeholder: '01:00 PM',
                sx: timePickerTextFieldStyles,
                inputProps: {
                  placeholder: '01:00 PM'
                }
              },
              openPickerButton: {
                sx: {
                  color: '#44544A'
                }
              }
            }}
          />
        </Box>
      </LocalizationProvider>
    </VitalFormDialog>
  )
}

AddTimeForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValue: PropTypes.string
}
