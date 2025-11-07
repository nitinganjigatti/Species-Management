import React, { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, ToggleButton, ToggleButtonGroup, Typography, Radio } from '@mui/material'
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
  measurementSubmitButtonSx
} from './sharedStyles'

const options = ['No Reflex', 'Normal', 'Reduced']

const getToggleButtonStyles = theme => ({
  flex: 1,
  minWidth: 0,
  height: '56px',
  borderRadius: '4px !important',
  border: `1px solid ${theme.palette.customColors?.Outline || theme.palette.divider} !important`,
  textTransform: 'none',
  color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary,
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '16px',
  letterSpacing: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 12px',
  '&:hover': {
    backgroundColor: theme.palette.primary.contrastText
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.background.OnBackground || theme.palette.action.selected,
    borderColor: `${theme.palette.primary.main} !important`,
    color: theme.palette.customColors?.customHeadingTextColor || theme.palette.text.primary
  }
})

const getRadioStyles = theme => ({
  padding: 0,
  pointerEvents: 'none',
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
    color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
  },
  '&.Mui-checked .MuiSvgIcon-root': {
    color: theme.palette.primary.main
  }
})

export default function CornealReflexForm({ open, onClose, onSubmit, timeLabel, initialData }) {
  const theme = useTheme()
  const [selection, setSelection] = useState(initialData?.selection || '')
  const firstToggleRef = useRef(null)

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

  const renderHeader = () => {
    const displayTime = timeLabel || '--'

    return (
      <Box sx={measurementHeaderContainerSx(theme)}>
        <Typography sx={measurementHeaderTitleSx(theme)}>Corneal Reflex</Typography>
        <Box sx={measurementHeaderTimeContainerSx}>
          <AccessTimeRoundedIcon sx={measurementHeaderTimeIconSx(theme)} />
          <Typography sx={measurementHeaderTitleSx(theme)}>{displayTime}</Typography>
        </Box>
      </Box>
    )
  }

  const toggleButtonStyles = getToggleButtonStyles(theme)
  const radioStyles = getRadioStyles(theme)
  const handleFormSubmit = event => {
    event.preventDefault()
    handleSubmit()
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        firstToggleRef.current?.focus()
      }, 0)
    }
  }, [open])

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Corneal Reflex'
      renderHeader={renderHeader}
      contentSx={measurementContentSx}
      actionsSx={measurementActionsSx}
      cancelButtonSx={measurementCancelButtonSx(theme)}
      submitButtonSx={measurementSubmitButtonSx(theme)}
      paperSx={measurementDialogPaperSx(theme)}
      disableSubmit={disableSubmit}
      submitLabel='Add Entry'
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
        <Typography sx={measurementFieldLabelSx(theme)}>Select Reflex</Typography>
        <Box
          component='form'
          onSubmit={handleFormSubmit}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleSubmit()
            }
          }}
        >
          <ToggleButtonGroup
            value={selection}
            exclusive
            onChange={(event, value) => value && setSelection(value)}
            sx={{ display: 'flex', gap: '12px' }}
          >
            {options.map((option, index) => (
              <ToggleButton
                key={option}
                value={option}
                sx={toggleButtonStyles}
                ref={index === 0 ? firstToggleRef : null}
              >
                <Typography sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: 'inherit' }}>
                  {option}
                </Typography>
                <Radio
                  checked={selection === option}
                  tabIndex={-1}
                  disableRipple
                  sx={radioStyles}
                />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>
    </VitalFormDialog>
  )
}

CornealReflexForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  timeLabel: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    selection: PropTypes.string
  })
}
