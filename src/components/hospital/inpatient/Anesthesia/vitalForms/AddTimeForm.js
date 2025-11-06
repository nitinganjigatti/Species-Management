import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { TextField } from '@mui/material'

import VitalFormDialog from './VitalFormDialog'

const textFieldStyles = {
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
  '& .MuiInputBase-input': {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '18px',
    lineHeight: 1,
    letterSpacing: 0,
    color: '#133020'
  }
}

export default function AddTimeForm({ open, onClose, onSubmit, initialValue = '' }) {
  const [timeValue, setTimeValue] = useState(initialValue)

  useEffect(() => {
    if (open) {
      setTimeValue(initialValue)
    }
  }, [open, initialValue])

  const handleSubmit = () => {
    if (!timeValue.trim()) {
      return
    }

    onSubmit({ timeLabel: timeValue.trim().toUpperCase() })
  }

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel='Add'
      hideCancel
      title='Add Time'
      disableSubmit={!timeValue.trim()}
    >
      <TextField
        fullWidth
        placeholder='01:00 PM'
        label='Recorded Time'
        value={timeValue}
        onChange={event => setTimeValue(event.target.value)}
        sx={textFieldStyles}
      />
    </VitalFormDialog>
  )
}

AddTimeForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValue: PropTypes.string
}
