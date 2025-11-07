import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, ToggleButton, ToggleButtonGroup, Typography, Radio } from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'

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
  measurementSubmitButtonSx
} from './sharedStyles'

const options = ['No Reflex', 'Normal', 'Reduced']

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

const toggleButtonStyles = {
  flex: 1,
  minWidth: 0,
  height: '56px',
  borderRadius: '4px !important',
  border: '1px solid #839D8D !important',
  textTransform: 'none',
  color: '#7A8684',
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '16px',
  letterSpacing: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 12px',
  '&:hover': {
    backgroundColor: '#FFFFFF'
  },
  '&.Mui-selected': {
    backgroundColor: '#E1F9ED',
    borderColor: '#37BD69 !important',
    color: '#133020'
  }
}

const radioStyles = {
  padding: 0,
  pointerEvents: 'none',
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
    color: '#7A8684'
  },
  '&.Mui-checked .MuiSvgIcon-root': {
    color: '#37BD69'
  }
}

export default function AnalReflexForm({ open, onClose, onSubmit, timeLabel, initialData }) {
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

  const disableSubmit = useMemo(() => !selection, [selection])

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Anal Reflex'
      renderHeader={() => headerRenderer('Anal Reflex', timeLabel)}
      contentSx={measurementContentSx}
      actionsSx={measurementActionsSx}
      cancelButtonSx={measurementCancelButtonSx}
      submitButtonSx={measurementSubmitButtonSx}
      paperSx={measurementDialogPaperSx}
      disableSubmit={disableSubmit}
      submitLabel='Add Entry'
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
        <Typography sx={measurementFieldLabelSx}>Select Reflex</Typography>
        <ToggleButtonGroup
          value={selection}
          exclusive
          onChange={(event, value) => value && setSelection(value)}
          sx={{ display: 'flex', gap: '12px' }}
        >
          {options.map(option => (
            <ToggleButton key={option} value={option} sx={toggleButtonStyles}>
              <Typography sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: 'inherit' }}>
                {option}
              </Typography>
              <Radio checked={selection === option} tabIndex={-1} disableRipple sx={radioStyles} />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </VitalFormDialog>
  )
}

AnalReflexForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    selection: PropTypes.string
  })
}
