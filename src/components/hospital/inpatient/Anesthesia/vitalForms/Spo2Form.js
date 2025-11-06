import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { MenuItem, Stack, TextField } from '@mui/material'

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
    fontSize: '16px',
    lineHeight: 1,
    letterSpacing: 0,
    color: '#133020'
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '14px',
    letterSpacing: 0,
    color: '#839D8D'
  }
}

const unitOptions = ['%']

export default function Spo2Form({ open, onClose, onSubmit, timeLabel, initialData }) {
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

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Add SpO2'
      timeLabel={timeLabel}
      disableSubmit={!value.trim()}
      maxWidth='sm'
    >
      <Stack spacing={3}>
        <TextField
          fullWidth
          label='Enter Value'
          placeholder='Enter Value'
          value={value}
          onChange={event => setValue(event.target.value)}
          sx={textFieldStyles}
        />

        <TextField
          select
          fullWidth
          label='UOM'
          value={unit}
          onChange={event => setUnit(event.target.value)}
          sx={textFieldStyles}
        >
          {unitOptions.map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </VitalFormDialog>
  )
}

Spo2Form.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    value: PropTypes.string,
    unit: PropTypes.string
  })
}
