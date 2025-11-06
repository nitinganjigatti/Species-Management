import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import VitalFormDialog from './VitalFormDialog'

const toggleGroupStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px'
}

const toggleButtonStyles = {
  flex: '1 1 160px',
  minWidth: '148px',
  height: '56px',
  borderRadius: '8px !important',
  border: '1px solid #C3CEC7 !important',
  backgroundColor: '#FFFFFF !important',
  textTransform: 'none',
  color: '#44544A',
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: 0,
  '&:hover': {
    backgroundColor: '#FFFFFF'
  },
  '&.Mui-selected': {
    borderColor: '#37BD69 !important',
    backgroundColor: '#E6F8ED !important',
    color: '#006D35'
  }
}

const options = ['No Reflex', 'Normal', 'Reduced']

export default function PainReflexForm({ open, onClose, onSubmit, timeLabel, initialData }) {
  const [selection, setSelection] = useState(initialData?.selection || '')

  useEffect(() => {
    if (open) {
      setSelection(initialData?.selection || '')
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (!selection) {
      return
    }

    onSubmit({ selection })
  }

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Add Pain Reflex'
      timeLabel={timeLabel}
      disableSubmit={!selection}
      maxWidth='sm'
    >
      <Stack spacing={2}>
        <Typography sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px', color: '#44544A' }}>
          Select Reflex
        </Typography>

        <ToggleButtonGroup
          value={selection}
          exclusive
          onChange={(event, newValue) => {
            if (newValue !== null) {
              setSelection(newValue)
            }
          }}
          sx={toggleGroupStyles}
        >
          {options.map(option => (
            <ToggleButton key={option} value={option} sx={toggleButtonStyles}>
              {option}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </VitalFormDialog>
  )
}

PainReflexForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    selection: PropTypes.string
  })
}
