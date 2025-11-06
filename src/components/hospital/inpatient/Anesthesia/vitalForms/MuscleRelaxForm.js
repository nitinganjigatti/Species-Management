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
  flex: '1 1 96px',
  minWidth: '88px',
  height: '56px',
  borderRadius: '8px !important',
  border: '1px solid #C3CEC7 !important',
  backgroundColor: '#FFFFFF !important',
  textTransform: 'none',
  color: '#44544A',
  fontFamily: 'Inter',
  fontWeight: 600,
  fontSize: '18px',
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

const scoreOptions = ['1', '2', '3', '4']

export default function MuscleRelaxForm({ open, onClose, onSubmit, timeLabel, initialData }) {
  const [score, setScore] = useState(initialData?.score || '')

  useEffect(() => {
    if (open) {
      setScore(initialData?.score || '')
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (!score) {
      return
    }

    onSubmit({ score })
  }

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Add Muscle Relax Score'
      timeLabel={timeLabel}
      disableSubmit={!score}
      maxWidth='sm'
    >
      <Stack spacing={2}>
        <Typography sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px', color: '#44544A' }}>
          Select Score (1 = None, 4 = Full)
        </Typography>

        <ToggleButtonGroup
          value={score}
          exclusive
          onChange={(event, newValue) => {
            if (newValue !== null) {
              setScore(newValue)
            }
          }}
          sx={toggleGroupStyles}
        >
          {scoreOptions.map(option => (
            <ToggleButton key={option} value={option} sx={toggleButtonStyles}>
              {option}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </VitalFormDialog>
  )
}

MuscleRelaxForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    score: PropTypes.string
  })
}
