import React, { useEffect, useMemo, useState } from 'react'
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

const scoreOptions = ['1', '2', '3', '4']

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

export default function MuscleRelaxForm({ open, onClose, onSubmit, timeLabel, initialData }) {
  const theme = useTheme()
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

  const disableSubmit = useMemo(() => !score, [score])

  const renderHeader = () => {
    const displayTime = timeLabel || '--'

    return (
      <Box sx={measurementHeaderContainerSx(theme)}>
        <Typography sx={measurementHeaderTitleSx(theme)}>Muscle Relax</Typography>
        <Box sx={measurementHeaderTimeContainerSx}>
          <AccessTimeRoundedIcon sx={measurementHeaderTimeIconSx(theme)} />
          <Typography sx={measurementHeaderTitleSx(theme)}>{displayTime}</Typography>
        </Box>
      </Box>
    )
  }

  const toggleButtonStyles = getToggleButtonStyles(theme)
  const radioStyles = getRadioStyles(theme)

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='Muscle Relax'
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
        <Typography sx={measurementFieldLabelSx(theme)}>Select Score (1=None, 4=Full)</Typography>
        <ToggleButtonGroup
          value={score}
          exclusive
          onChange={(event, value) => value && setScore(value)}
          sx={{ display: 'flex', gap: '12px' }}
        >
          {scoreOptions.map(option => (
            <ToggleButton key={option} value={option} sx={toggleButtonStyles}>
              <Typography sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: 'inherit' }}>
                {option}
              </Typography>
              <Radio checked={score === option} tabIndex={-1} disableRipple sx={radioStyles} />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
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
