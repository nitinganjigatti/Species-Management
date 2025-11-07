import React, { useMemo, useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Grid,
  InputAdornment,
  Radio,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { alpha, useTheme } from '@mui/material/styles'

const monitoringOptions = [
  'Pulse ox',
  'Probe, rectal',
  'Tongue',
  'Thermometer',
  'Heated Table',
  'Bair hugger',
  'Doppler',
  'Stethoscope',
  'ECG',
  'BP',
  'Capnography',
  'Pediatric',
  'Adult'
]

const ventilationOptions = ['No', 'Vetronics', 'Manual']
const catheterOptions = ['IV', 'IO']

const getTextFieldStyles = theme => {
  const outline = theme.palette.customColors?.SurfaceVariant || theme.palette.divider
  const mutedText = theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
  const onSurface = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary

  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px',
      backgroundColor: theme.palette.primary.contrastText,
      '& fieldset': {
        borderColor: outline
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main
      }
    },
    '& .MuiInputLabel-root': {
      fontFamily: 'Inter',
      fontWeight: 400,
      fontSize: '14px',
      letterSpacing: 0,
      color: mutedText,
      transform: 'translate(12px, 10px)',
      opacity: 0,
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      '&.MuiInputLabel-shrink': {
        transform: 'translate(12px, -10px) scale(1)',
        backgroundColor: 'transparent',
        padding: 0,
        opacity: 1
      }
    },
    '& .MuiFormLabel-root.MuiInputLabel-shrink': {
      opacity: 1
    },
    '& .MuiInputBase-input': {
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '16px',
      lineHeight: 1,
      letterSpacing: 0,
      color: onSurface
    },
    '& .MuiInputBase-input::placeholder': {
      color: onSurface,
      opacity: 1
    }
  }
}

const radioTileGroupStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  '& .MuiToggleButtonGroup-grouped': {
    margin: 0
  }
}

const getRadioTileButtonStyles = theme => {
  const outline = theme.palette.customColors?.OutlineVariant || theme.palette.divider
  const onSurface = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary

  return {
    width: '257.3333435058594px',
    height: '56px',
    padding: '0 12px',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '4px !important',
    border: `1px solid ${outline} !important`,
    backgroundColor: `${theme.palette.primary.contrastText} !important`,
    textTransform: 'none',
    color: onSurface,
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: 1,
    letterSpacing: 0,
    '&:hover': {
      backgroundColor: theme.palette.primary.contrastText
    },
    '&.Mui-selected': {
      borderColor: `${theme.palette.primary.main} !important`,
      color: theme.palette.primary.dark || theme.palette.primary.main,
      backgroundColor: `${theme.palette.primary.contrastText} !important`
    },
    '&.Mui-selected:hover': {
      backgroundColor: theme.palette.primary.contrastText
    }
  }
}

const radioTileLabelStyles = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: 1,
  letterSpacing: 0,
  color: 'inherit'
}

const monitoringToggleGroupStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  '& .MuiToggleButtonGroup-grouped': {
    margin: 0
  }
}

const getMonitoringToggleButtonStyles = theme => {
  const outline = theme.palette.customColors?.OutlineVariant || theme.palette.divider
  const onSurface = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary

  return {
    width: '189px',
    height: '56px',
    padding: '0 12px',
    borderRadius: '4px !important',
    border: `1.5px solid ${outline} !important`,
    backgroundColor: theme.palette.primary.contrastText,
    textTransform: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: onSurface,
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: 1,
    letterSpacing: 0,
    '&:hover': {
      backgroundColor: theme.palette.primary.contrastText
    },
    '&.Mui-selected': {
      borderColor: `${theme.palette.primary.main} !important`,
      backgroundColor: theme.palette.primary.contrastText
    },
    '&.Mui-selected:hover': {
      backgroundColor: theme.palette.primary.contrastText
    },
    '& .MuiCheckbox-root': {
      padding: 0,
      color: outline
    },
    '& .MuiCheckbox-root.Mui-checked': {
      color: theme.palette.primary.main
    }
  }
}

const getSectionTitleStyles = theme => ({
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '20px',
  lineHeight: 1,
  letterSpacing: 0,
  color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
})

const getFirstColumnTextStyles = theme => ({
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: 1,
  letterSpacing: 0,
  color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
})

const getChipStyles = theme => ({
  width: '174px',
  minWidth: '174px',
  height: '48px',
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '8px',
  border: `1px solid ${theme.palette.primary.main}`,
  backgroundColor: alpha(theme.palette.customColors?.PrimaryContainer || theme.palette.primary.light, 0.2),
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: 0,
  color: theme.palette.primary.dark || theme.palette.primary.main,
  '& .MuiChip-label': {
    paddingInline: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  '& .MuiChip-deleteIcon': {
    width: '16px',
    height: '16px',
    fontSize: '16px',
    color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary,
    marginLeft: '8px'
  }
})

const AnesthesiaSetUpSection = () => {
  const theme = useTheme()
  const textFieldStyles = useMemo(() => getTextFieldStyles(theme), [theme])
  const radioTileButtonStyles = useMemo(() => getRadioTileButtonStyles(theme), [theme])
  const monitoringToggleButtonStyles = useMemo(() => getMonitoringToggleButtonStyles(theme), [theme])
  const sectionTitleStyles = useMemo(() => getSectionTitleStyles(theme), [theme])
  const firstColumnTextStyles = useMemo(() => getFirstColumnTextStyles(theme), [theme])
  const chipStyles = useMemo(() => getChipStyles(theme), [theme])
  const outlineColor = theme.palette.customColors?.OutlineVariant || theme.palette.divider
  const borderMutedColor = theme.palette.customColors?.customTableBorderBg || outlineColor
  const selectedBackground = theme.palette.customColors?.displaybgPrimary || alpha(theme.palette.primary.main, 0.12)
  const unselectedBackground = theme.palette.customColors?.bodyBg || theme.palette.background.default
  const displayBgSecondary = theme.palette.customColors?.displaybgSecondary || alpha(theme.palette.primary.main, 0.06)
  const onSurface = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
  const neutralSecondary = theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
  const contrastText = theme.palette.primary.contrastText
  const primaryMain = theme.palette.primary.main
  const primaryDark = theme.palette.primary.dark || theme.palette.primary.main

  const [formState, setFormState] = useState({
    fluids: { checked: false, fluidType: '', quantity: '' },
    catheterSetup: { checked: false, method: '' },
    syringePump: { checked: false, rate: '' },
    etIntubation: { checked: false, tubeSizes: '' },
    nasalIntubation: { checked: false, fluidType: '', quantity: '' },
    ventilation: { checked: false, mode: '' },
    monitoring: { checked: false, selected: monitoringOptions, otherItems: [] }
  })
  const [newMonitoringItem, setNewMonitoringItem] = useState('')

  const toggleRowChecked = key => {
    setFormState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        checked: !prev[key].checked
      }
    }))
  }

  const handleCheckboxToggle = key => event => {
    event.stopPropagation()
    const { checked } = event.target
    setFormState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        checked
      }
    }))
  }

  const handleFieldChange = (section, field) => event => {
    const { value } = event.target
    setFormState(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleExclusiveToggle = (section, field) => (_, newValue) => {
    setFormState(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: newValue ?? ''
      }
    }))
  }

  const handleMonitoringToggle = (_, newValues) => {
    setFormState(prev => ({
      ...prev,
      monitoring: {
        ...prev.monitoring,
        selected: newValues
      }
    }))
  }

  const handleAddOtherItem = () => {
    const trimmedValue = newMonitoringItem.trim()
    if (!trimmedValue) {
      return
    }

    setFormState(prev => ({
      ...prev,
      monitoring: {
        ...prev.monitoring,
        otherItems: prev.monitoring.otherItems.includes(trimmedValue)
          ? prev.monitoring.otherItems
          : [...prev.monitoring.otherItems, trimmedValue]
      }
    }))
    setNewMonitoringItem('')
  }

  const handleRemoveOtherItem = itemToRemove => {
    setFormState(prev => ({
      ...prev,
      monitoring: {
        ...prev.monitoring,
        otherItems: prev.monitoring.otherItems.filter(item => item !== itemToRemove)
      }
    }))
  }

  const handleNewItemKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddOtherItem()
    }
  }

  const rows = [
    { key: 'fluids', label: 'Fluids' },
    { key: 'catheterSetup', label: 'Catheter set-up' },
    { key: 'syringePump', label: 'Syringe pump' },
    { key: 'etIntubation', label: 'ET intubation' },
    { key: 'nasalIntubation', label: 'Nasal Intubation' },
    { key: 'ventilation', label: 'Ventilation' },
    { key: 'monitoring', label: 'Monitoring' }
  ]

  const renderRowContent = key => {
    switch (key) {
      case 'fluids':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Fluid Type'
                placeholder='Enter'
                value={formState.fluids.fluidType}
                onChange={handleFieldChange('fluids', 'fluidType')}
                InputLabelProps={{ shrink: true }}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Quantity'
                placeholder='Enter'
                value={formState.fluids.quantity}
                onChange={handleFieldChange('fluids', 'quantity')}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography sx={{ ...firstColumnTextStyles, fontSize: '14px' }}>ml / hr</Typography>
                    </InputAdornment>
                  )
                }}
                sx={textFieldStyles}
              />
            </Grid>
          </Grid>
        )
      case 'catheterSetup':
        return (
          <ToggleButtonGroup
            exclusive
            value={formState.catheterSetup.method}
            onChange={handleExclusiveToggle('catheterSetup', 'method')}
            sx={radioTileGroupStyles}
          >
            {catheterOptions.map(option => {
              const isSelected = formState.catheterSetup.method === option

              return (
                <ToggleButton key={option} value={option} sx={radioTileButtonStyles}>
                  <Typography component='span' sx={radioTileLabelStyles}>
                    {option}
                  </Typography>
                  <Radio
                    checked={isSelected}
                    disableRipple
                    inputProps={{ readOnly: true }}
                    sx={{
                      pointerEvents: 'none',
                      color: outlineColor,
                      '&.Mui-checked': {
                        color: primaryMain
                      }
                    }}
                  />
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        )
      case 'syringePump':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Rate'
                placeholder='Enter'
                value={formState.syringePump.rate}
                onChange={handleFieldChange('syringePump', 'rate')}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography sx={{ ...firstColumnTextStyles, fontSize: '14px' }}>ml / hr</Typography>
                    </InputAdornment>
                  )
                }}
                sx={textFieldStyles}
              />
            </Grid>
          </Grid>
        )
      case 'etIntubation':
        return (
          <Grid container spacing={3}>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                width: '270px'
              }}
            >
              <TextField
                fullWidth
                label='Tube Size(s) Ex: 1mm, 2mm, 3mm &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
                placeholder='Enter'
                value={formState.etIntubation.tubeSizes}
                onChange={handleFieldChange('etIntubation', 'tubeSizes')}
                InputLabelProps={{ shrink: true }}
                sx={textFieldStyles}
              />
            </Grid>
          </Grid>
        )
      case 'nasalIntubation':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Fluid Type'
                placeholder='Enter'
                value={formState.nasalIntubation.fluidType}
                onChange={handleFieldChange('nasalIntubation', 'fluidType')}
                InputLabelProps={{ shrink: true }}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Quantity'
                placeholder='Enter'
                value={formState.nasalIntubation.quantity}
                onChange={handleFieldChange('nasalIntubation', 'quantity')}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography sx={{ ...firstColumnTextStyles, fontSize: '14px' }}>ml / hr</Typography>
                    </InputAdornment>
                  )
                }}
                sx={textFieldStyles}
              />
            </Grid>
          </Grid>
        )
      case 'ventilation':
        return (
          <ToggleButtonGroup
            exclusive
            value={formState.ventilation.mode}
            onChange={handleExclusiveToggle('ventilation', 'mode')}
            sx={radioTileGroupStyles}
          >
            {ventilationOptions.map(option => {
              const isSelected = formState.ventilation.mode === option

              return (
                <ToggleButton key={option} value={option} sx={radioTileButtonStyles}>
                  <Typography component='span' sx={radioTileLabelStyles}>
                    {option}
                  </Typography>
                  <Radio
                    checked={isSelected}
                    disableRipple
                    inputProps={{ readOnly: true }}
                    sx={{
                      pointerEvents: 'none',
                      color: outlineColor,
                      '&.Mui-checked': {
                        color: primaryMain
                      }
                    }}
                  />
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        )
      case 'monitoring':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ToggleButtonGroup
              value={formState.monitoring.selected}
              onChange={handleMonitoringToggle}
              sx={monitoringToggleGroupStyles}
            >
              {monitoringOptions.map(option => {
                const isSelected = formState.monitoring.selected.includes(option)

                return (
                  <ToggleButton key={option} value={option} sx={monitoringToggleButtonStyles}>
                    <Typography component='span' sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '16px' }}>
                      {option}
                    </Typography>
                    <Checkbox
                      checked={isSelected}
                      disableRipple
                      inputProps={{ readOnly: true }}
                      sx={{ pointerEvents: 'none' }}
                    />
                  </ToggleButton>
                )
              })}
            </ToggleButtonGroup>

            {formState.monitoring.otherItems.length > 0 && (
              <Box>
                <Typography sx={{ ...firstColumnTextStyles, mb: '10px' }}>Other Monitoring Items Added</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px', mt: '10px', mb: '10px' }}>
                  {formState.monitoring.otherItems.map(item => (
                    <Tooltip key={item} title={item} arrow placement='top'>
                      <Chip
                        label={item}
                        onDelete={() => handleRemoveOtherItem(item)}
                        deleteIcon={<CloseRoundedIcon />}
                        sx={chipStyles}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            )}

            <Box
              sx={{
                width: '430px',
                height: '115px',
                gap: '10px',
                borderRadius: '8px',
                padding: '16px',
                border: `0.5px solid ${outlineColor}`,
                backgroundColor: displayBgSecondary,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: 1,
                  letterSpacing: 0,
                  color: onSurface
                }}
              >
                Add New Other Item
              </Typography>
              <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  placeholder='New Monitoring'
                  value={newMonitoringItem}
                  onChange={event => setNewMonitoringItem(event.target.value)}
                  onKeyDown={handleNewItemKeyDown}
                  sx={{
                    ...textFieldStyles,
                    '& .MuiInputBase-input': {
                      fontFamily: 'Inter',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: 1,
                      letterSpacing: 0,
                      color: onSurface
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: onSurface,
                      opacity: 1,
                      fontWeight: 400
                    }
                  }}
                />
                <Button
                  variant='contained'
                  onClick={handleAddOtherItem}
                  disabled={!newMonitoringItem.trim()}
                  sx={{
                    width: '108px',
                    height: '56px',
                    borderRadius: '4px',
                    padding: '9px 16px',
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: 1,
                    letterSpacing: 0,
                    textTransform: 'none',
                    backgroundColor: newMonitoringItem.trim() ? primaryDark : outlineColor,
                    color: contrastText,
                    '&:hover': {
                      backgroundColor: newMonitoringItem.trim() ? primaryMain : outlineColor
                    }
                  }}
                >
                  ADD
                </Button>
              </Box>
            </Box>
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography sx={sectionTitleStyles}>Anesthesia Set-Up</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {rows.map(({ key, label }) => {
          const checked = formState[key].checked
          const backgroundColor = checked ? selectedBackground : unselectedBackground
          const borderColor = checked ? outlineColor : borderMutedColor

          return (
            <Box
              key={key}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 2, md: checked ? 3 : 0 },
                padding: { xs: '16px', md: '20px' },
                borderRadius: '8px',
                border: `0.5px solid ${borderColor}`,
                backgroundColor,
                transition: 'background-color 0.2s ease, width 0.24s ease, max-width 0.24s ease',
                width: { xs: '100%', md: checked ? '100%' : '240px' },
                maxWidth: { xs: '100%', md: checked ? '100%' : '240px' },
                alignSelf: { md: checked ? 'stretch' : 'flex-start' }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: { xs: '100%', md: '240px' },
                  maxWidth: { md: '240px' },
                  flexBasis: { md: '240px' },
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'max-width 0.24s ease, flex-basis 0.24s ease, width 0.24s ease'
                }}
                role='button'
                tabIndex={0}
                aria-expanded={checked}
                onClick={() => toggleRowChecked(key)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleRowChecked(key)
                  }
                }}
              >
                <Checkbox
                  checked={checked}
                  onChange={handleCheckboxToggle(key)}
                  onClick={event => event.stopPropagation()}
                  sx={{
                    p: 0,
                    width: '24px',
                    height: '24px',
                    color: primaryMain,
                    '&.Mui-checked': {
                      color: primaryMain
                    }
                  }}
                />
                <Typography sx={firstColumnTextStyles}>{label}</Typography>
              </Box>
              <Box
                sx={{
                  flex: checked ? '1 1 auto' : '0 0 0px',
                  width: { xs: '100%', md: checked ? '100%' : 0 },
                  maxWidth: { xs: '100%', md: checked ? '100%' : 0 },
                  overflow: checked ? 'visible' : 'hidden',
                  maxHeight: checked ? 'none' : 0,
                  opacity: checked ? 1 : 0,
                  transition: 'opacity 0.24s ease, max-width 0.24s ease, width 0.24s ease, flex 0.24s ease',
                  mt: { xs: checked ? 2 : 0, md: 0 }
                }}
                aria-hidden={!checked}
              >
                {checked && <Box sx={{ width: '100%' }}>{renderRowContent(key)}</Box>}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default AnesthesiaSetUpSection
