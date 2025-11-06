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

const unitOptions = ['mmHg']

export default function BloodPressureForm({ open, onClose, onSubmit, timeLabel, initialData }) {
  const [systolic, setSystolic] = useState(initialData?.systolic || '')
  const [mean, setMean] = useState(initialData?.mean || '')
  const [unit, setUnit] = useState(initialData?.unit || unitOptions[0])

  useEffect(() => {
    if (open) {
      setSystolic(initialData?.systolic || '')
      setMean(initialData?.mean || '')
      setUnit(initialData?.unit || unitOptions[0])
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (!systolic.trim() || !mean.trim()) {
      return
    }

    onSubmit({ systolic: systolic.trim(), mean: mean.trim(), unit })
  }

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Add Blood Pressure'
      timeLabel={timeLabel}
      disableSubmit={!systolic.trim() || !mean.trim()}
      maxWidth='sm'
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          <TextField
            fullWidth
            label='Systolic'
            placeholder='Enter Value'
            value={systolic}
            onChange={event => setSystolic(event.target.value)}
            sx={textFieldStyles}
          />
          <TextField
            fullWidth
            label='Mean'
            placeholder='Enter Value'
            value={mean}
            onChange={event => setMean(event.target.value)}
            sx={textFieldStyles}
          />
        </Stack>

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

BloodPressureForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    systolic: PropTypes.string,
    mean: PropTypes.string,
    unit: PropTypes.string
  })
}
