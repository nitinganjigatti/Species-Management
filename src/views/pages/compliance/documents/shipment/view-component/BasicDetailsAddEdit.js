import React, { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  InputAdornment
} from '@mui/material'
import * as yup from 'yup'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { CalendarMonth } from '@mui/icons-material'
import FileUpload from 'src/views/forms/form-elements/file-uploader/ComplianceFileUploader'

const BasicDetailsAddEdit = ({
  airwaybillvalue,
  setAirwaybillvalue,
  startDate,
  setStartDate,
  uploadedFile,
  setUploadedFile,
  onSave,
  errors,
  setErrors
}) => {
  const handleAirwaybillChange = event => {
    let inputValue = event.target.value.replace(/\D/g, '')
    if (inputValue.length > 11) inputValue = inputValue.slice(0, 11)

    const formattedValue = inputValue
      .split('')
      .map((digit, index) => (index === 2 ? digit + '    ' : digit + '  '))
      .join('')

    setAirwaybillvalue(formattedValue.trim())
    setErrors(prev => ({ ...prev, airwaybillvalue: null }))
  }

  const handleDateChange = date => {
    setStartDate(date)
    setErrors(prev => ({ ...prev, startDate: null }))
  }

  const handleFileUpload = file => {
    setUploadedFile(file)
    setErrors(prev => ({ ...prev, uploadedFile: null }))
  }

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Air Cargo</InputLabel>
            <Select defaultValue='' disabled sx={{ background: '#0000000D' }}>
              <MenuItem value='airCargo1'>Air Cargo 1</MenuItem>
              <MenuItem value='airCargo2'>Air Cargo 2</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label='Enter 11 digit (AWB) airway bill no.*'
            variant='outlined'
            value={airwaybillvalue}
            onChange={handleAirwaybillChange}
            error={Boolean(errors.airwaybillvalue)}
            helperText={errors.airwaybillvalue}
            inputProps={{
              maxLength: 31
            }}
            InputProps={{
              style: { borderRadius: 4 }
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <SingleDatePicker
            selected={startDate}
            onChange={handleDateChange}
            maxDate={new Date()}
            showMonthDropdown
            showYearDropdown
            customInput={
              <TextField
                label='Shipment Date'
                placeholder={!startDate ? 'Shipment Date' : ''}
                value={startDate ? startDate.toLocaleDateString() : ''}
                error={Boolean(errors.startDate)}
                helperText={errors.startDate}
                InputLabelProps={{
                  shrink: true
                }}
                InputProps={{
                  sx: {
                    height: '55px',
                    padding: '0 14px',
                    alignItems: 'center'
                  },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <CalendarMonth style={{ cursor: 'pointer' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    padding: '14px'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#44544a82'
                    }
                  },
                  width: '100%'
                }}
              />
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <FileUpload name='(AWB) Airway Bill' onFileUpload={handleFileUpload} file={uploadedFile} />
          {errors.uploadedFile && <Typography color='error'>{errors.uploadedFile}</Typography>}
        </Grid>
      </Grid>

      {/* Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant='outlined'
          sx={{ mr: 2 }}
          onClick={() => {
            setAirwaybillvalue('')
            setStartDate(null)
            setUploadedFile(null)
            setErrors({})
          }}
        >
          Reset
        </Button>
        <Button variant='contained' color='primary' onClick={onSave}>
          Save
        </Button>
      </Box>
    </>
  )
}

export default BasicDetailsAddEdit
