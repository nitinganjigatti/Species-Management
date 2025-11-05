import React, { useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
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

const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '4px',
    backgroundColor: '#FFFFFF',
    '& fieldset': {
      borderColor: '#D5E8E0'
    },
    '&:hover fieldset': {
      borderColor: '#37BD69'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#37BD69'
    }
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '14px',
    lineHeight: 1,
    letterSpacing: 0,
    color: '#839D8D'
  },
  '& .MuiInputBase-input': {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: 1,
    letterSpacing: 0,
    color: '#44544A'
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#44544A',
    opacity: 1
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

const radioTileButtonStyles = {
  width: '257.3333435058594px',
  height: '56px',
  padding: '0 12px',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: '4px !important',
  border: '1px solid #C3CEC7 !important',
  backgroundColor: '#FFFFFF !important',
  textTransform: 'none',
  color: '#44544A',
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: 1,
  letterSpacing: 0,
  '&:hover': {
    backgroundColor: '#FFFFFF'
  },
  '&.Mui-selected': {
    borderColor: '#37BD69 !important',
    color: '#006D35',
    backgroundColor: '#FFFFFF !important'
  },
  '&.Mui-selected:hover': {
    backgroundColor: '#FFFFFF'
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

const monitoringToggleButtonStyles = {
  width: '189px',
  height: '56px',
  padding: '0 12px',
  borderRadius: '4px !important',
  border: '1.5px solid #C3CEC7 !important',
  backgroundColor: '#FFFFFF',
  textTransform: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#44544A',
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: 1,
  letterSpacing: 0,
  '&:hover': {
    backgroundColor: '#FFFFFF'
  },
  '&.Mui-selected': {
    borderColor: '#37BD69 !important',
    backgroundColor: '#FFFFFF !important'
  },
  '&.Mui-selected:hover': {
    backgroundColor: '#FFFFFF'
  },
  '& .MuiCheckbox-root': {
    padding: 0,
    color: '#C3CEC7'
  },
  '& .MuiCheckbox-root.Mui-checked': {
    color: '#37BD69'
  }
}

const sectionTitleStyles = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '20px',
  lineHeight: 1,
  letterSpacing: 0,
  color: '#44544A'
}

const firstColumnTextStyles = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: 1,
  letterSpacing: 0,
  color: '#44544A'
}

const chipStyles = {
  width: '174px',
  minWidth: '174px',
  height: '48px',
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '8px',
  border: '1px solid #37BD69',
  backgroundColor: '#52F99033',
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: 0,
  color: '#006D35',
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
    color: '#839D8D',
    marginLeft: '8px'
  }
}

const AnesthesiaSetUpSection = () => {
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
                      color: '#C3CEC7',
                      '&.Mui-checked': {
                        color: '#37BD69'
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Tube Size(s) Ex: 1mm, 2mm, 3mm'
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
                      color: '#C3CEC7',
                      '&.Mui-checked': {
                        color: '#37BD69'
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
                border: '0.5px solid #C3CEC7',
                backgroundColor: '#DDEBE9',
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
                  color: '#44544A'
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
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px',
                      backgroundColor: '#FFFFFF',
                      '& fieldset': {
                        borderColor: '#D5E8E0'
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
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: 1,
                      letterSpacing: 0,
                      color: '#44544A'
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#44544A',
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
                    backgroundColor: newMonitoringItem.trim() ? '#006D35' : '#C3CEC7',
                    color: '#FFFFFF',
                    '&:hover': {
                      backgroundColor: newMonitoringItem.trim() ? '#00592A' : '#C3CEC7'
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
          const backgroundColor = checked ? '#E8F4F2' : '#EFF5F2'
          const borderColor = checked ? '#C3CEC7' : '#D5E8E0'

          return (
            <Box
              key={key}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 2, md: 3 },
                padding: { xs: '16px', md: '20px' },
                borderRadius: '8px',
                border: `0.5px solid ${borderColor}`,
                backgroundColor,
                transition: 'background-color 0.2s ease'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  maxWidth: { md: '240px' },
                  flexBasis: { md: '240px' },
                  flexShrink: 0,
                  cursor: 'pointer'
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
                    color: '#37BD69',
                    '&.Mui-checked': {
                      color: '#37BD69'
                    }
                  }}
                />
                <Typography sx={firstColumnTextStyles}>{label}</Typography>
              </Box>
              <Collapse in={checked} timeout={300} unmountOnExit sx={{ flex: 1, width: '100%', display: 'flex' }}>
                <Box sx={{ width: '100%' }}>{renderRowContent(key)}</Box>
              </Collapse>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default AnesthesiaSetUpSection
