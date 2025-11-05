import React, { useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Grid,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
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

const toggleButtonGroupStyles = {
  flexWrap: 'wrap',
  gap: '12px',
  '& .MuiToggleButtonGroup-grouped': {
    margin: 0,
    borderRadius: '4px !important',
    border: '1px solid #B5D3C0 !important',
    padding: '10px 18px',
    textTransform: 'none',
    backgroundColor: '#EFF5F2',
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: 1,
    letterSpacing: 0,
    color: '#44544A',
    '&:hover': {
      backgroundColor: '#E8F4F2'
    },
    '&.Mui-selected': {
      backgroundColor: '#E8F4F2',
      borderColor: '#37BD69 !important',
      color: '#006D35'
    }
  }
}

const ventilationToggleGroupStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  '& .MuiToggleButtonGroup-grouped': {
    margin: 0
  }
}

const ventilationToggleButtonStyles = {
  width: '257.3333435058594px',
  height: '56px',
  padding: '0 12px',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: '4px !important',
  border: '1px solid #C3CEC7 !important',
  backgroundColor: '#FFFFFF',
  textTransform: 'none',
  color: '#839D8D',
  fontFamily: 'Inter',
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: 1,
  letterSpacing: 0,
  '&:hover': {
    backgroundColor: '#FFFFFF'
  },
  '& .ventilation-radio-circle': {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '1.5px solid #839D8D'
  },
  '&.Mui-selected': {
    borderColor: '#37BD69 !important',
    color: '#006D35'
  },
  '&.Mui-selected .ventilation-radio-circle': {
    borderColor: '#37BD69',
    boxShadow: 'inset 0 0 0 4px #37BD69'
  }
}

const ventilationLabelStyles = {
  fontFamily: 'Inter',
  fontWeight: 400,
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
  backgroundColor: '#52F99033',
  border: '1px solid #37BD69',
  borderRadius: '8px',
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: 1,
  letterSpacing: 0,
  color: '#006D35',
  '& .MuiChip-label': {
    paddingInline: '12px'
  }
}

const addButtonStyles = {
  minWidth: '120px',
  height: '48px',
  backgroundColor: '#0B8A46',
  color: '#FFFFFF',
  textTransform: 'none',
  fontFamily: 'Inter',
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: 1,
  letterSpacing: 0,
  borderRadius: '12px',
  '&:hover': {
    backgroundColor: '#0A7A3F'
  },
  '&.Mui-disabled': {
    backgroundColor: '#C7D9CF',
    color: '#F5F9F7'
  }
}

const addItemLabelStyles = {
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: 1,
  letterSpacing: 0,
  color: '#44544A'
}

const AnesthesiaBasicDetails = () => {
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

  const handleCheckboxToggle = key => event => {
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
            sx={toggleButtonGroupStyles}
          >
            {['IV', 'IO'].map(option => (
              <ToggleButton key={option} value={option}>
                {option}
              </ToggleButton>
            ))}
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
            sx={ventilationToggleGroupStyles}
          >
            {ventilationOptions.map(option => (
              <ToggleButton key={option} value={option} sx={ventilationToggleButtonStyles}>
                <Typography component='span' sx={ventilationLabelStyles}>
                  {option}
                </Typography>
                <Box className='ventilation-radio-circle' />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )
      case 'monitoring':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

            <Box>
              <Typography sx={firstColumnTextStyles}>Other Monitoring Items Added</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mt: 2 }}>
                {formState.monitoring.otherItems.length ? (
                  formState.monitoring.otherItems.map(item => (
                    <Chip
                      key={item}
                      label={item}
                      onDelete={() => handleRemoveOtherItem(item)}
                      deleteIcon={<CloseRoundedIcon sx={{ color: '#839D8D', width: '11.67px', height: '11.67px' }} />}
                      sx={chipStyles}
                    />
                  ))
                ) : (
                  <Typography sx={{ ...firstColumnTextStyles, fontSize: '14px', color: '#839D8D' }}>
                    No additional items added yet.
                  </Typography>
                )}
              </Box>
            </Box>

            <Box
              sx={{
                backgroundColor: '#E8F4F2',
                borderRadius: '16px',
                padding: { xs: '16px', sm: '20px' },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'flex-end' },
                gap: { xs: 2, sm: 3 }
              }}
            >
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={addItemLabelStyles}>Add New Other Item</Typography>
                <TextField
                  fullWidth
                  placeholder='Enter item'
                  value={newMonitoringItem}
                  onChange={event => setNewMonitoringItem(event.target.value)}
                  onKeyDown={handleNewItemKeyDown}
                  sx={textFieldStyles}
                />
              </Box>
              <Button
                variant='contained'
                onClick={handleAddOtherItem}
                sx={addButtonStyles}
                disabled={!newMonitoringItem.trim()}
              >
                ADD
              </Button>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: { md: '220px' } }}>
                <Checkbox
                  checked={checked}
                  onChange={handleCheckboxToggle(key)}
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
              {checked && <Box sx={{ flex: 1, width: '100%' }}>{renderRowContent(key)}</Box>}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default AnesthesiaBasicDetails
