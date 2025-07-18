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
  CircularProgress
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import FileUpload from 'src/views/forms/form-elements/file-uploader/ComplianceFileUploader'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'

const BasicDetailsAddEdit = ({
  airwaybillvalue,
  setAirwaybillvalue,
  startDate,
  setStartDate,
  uploadedFile,
  setUploadedFile,
  transportType,
  setTransportType,
  loader,
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
  const handleChange = e => {
    setTransportType(e.target.value)
  }

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth>
            {/* <InputLabel>Transport Type</InputLabel> */}
            <Select
              value={transportType}
              onChange={handleChange}
              label=''
              sx={{
                background: '#0000000D',
                border: 'none',
                color: '#839D8D',
                '& .MuiSelect-select': {
                  color: '#839D8D'
                },
                '&.Mui-disabled .MuiSelect-select': {
                  color: '#839D8D'
                },
                '& fieldset': {
                  border: '1px solid #C3CEC7'
                }
              }}
              disabled
            >
              <MenuItem value='airCargo'>Air Cargo</MenuItem>
              <MenuItem value='airCargo1'>Air Cargo 1</MenuItem>
              <MenuItem value='airCargo2'>Air Cargo 2</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label='Enter 11 digit (AWB) airway bill no.*'
            variant='outlined'
            value={airwaybillvalue}
            onChange={handleAirwaybillChange}
            error={Boolean(errors.airwaybillvalue)}
            helperText={errors.airwaybillvalue}
            slotProps={{
              input: {
                maxLength: 31,
                style: { borderRadius: 6 }
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label='Shipment Date*'
              value={startDate ? dayjs(startDate) : null}
              onChange={handleDateChange}
              maxDate={dayjs(new Date())}
              views={['year', 'month', 'day']}
              format='Do MMM YY'
              slotProps={{
                textField: {
                  error: Boolean(errors.startDate),
                  helperText: errors.startDate,
                  sx: {
                    '& .MuiInputBase-input': { padding: '14px' },
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#44544a82' } },
                    width: '100%',
                    height: '55px'
                  }
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FileUpload name='(AWB) Airway Bill' onFileUpload={handleFileUpload} file={uploadedFile} />
          {errors.uploadedFile && (
            <Typography sx={{ color: '#FF4D49', fontSize: '12px', fontWeight: '400', mt: 1 }}>
              {errors.uploadedFile}
            </Typography>
          )}
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
        <Button
          variant='contained'
          color='primary'
          onClick={onSave}
          endIcon={<Icon icon='mdi:arrow-right' fontSize={20} />}
          disabled={loader}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            minWidth: 120
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Save
            {loader && <CircularProgress size={16} sx={{ color: '#ccc' }} />}
          </span>
        </Button>
      </Box>
    </>
  )
}

export default BasicDetailsAddEdit
