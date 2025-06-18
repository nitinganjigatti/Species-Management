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
import IconButton from '@mui/material/IconButton'
import { CalendarMonth } from '@mui/icons-material'
import FileUpload from 'src/views/forms/form-elements/file-uploader/ComplianceFileUploader'

const validationSchema = yup.object({
  airwaybillvalue: yup
    .string()
    .required('Airway bill number is required')
    .test('valid-awb', 'Enter a valid 11-digit airway bill number', value => {
      const strippedValue = value.replace(/\s/g, '') // Remove spaces
      return /^\d{11}$/.test(strippedValue) // Ensure 11 digits
    }),
  startDate: yup.date().nullable().required('Shipment date is required'),
  uploadedFile: yup.mixed().required('File upload is required')
})

const BasicDetails = () => {
  const [airwaybillvalue, setAirwaybillvalue] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [errors, setErrors] = useState({})

  const validateFields = async () => {
    try {
      await validationSchema.validate({ airwaybillvalue, startDate, uploadedFile }, { abortEarly: false })
      setErrors({})
      return true
    } catch (validationErrors) {
      const formattedErrors = {}
      validationErrors.inner.forEach(error => {
        formattedErrors[error.path] = error.message
      })
      setErrors(formattedErrors)
      return false
    }
  }

  const handleSubmit = async () => {
    const isValid = await validateFields()
    if (isValid) {
      console.log('Form submitted:', { airwaybillvalue, startDate, uploadedFile })
    }
  }

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
        <Button variant='contained' color='primary' onClick={handleSubmit}>
          Save
        </Button>
      </Box>

      {airwaybillvalue ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1px',
            background: '#EFF5F266',
            borderRadius: '10px',
            border: '1px solid #C3CEC7',
            p: 8
          }}
        >
          <Grid container spacing={2}>
            {/* Shipment ID */}
            <Grid item xs={6} md={4}>
              <Typography fontWeight='400' color='#7A8684' fontSize='16px'>
                Shipment ID
              </Typography>
              <Typography color={'#44544A'} sx={{ pt: 1 }}>
                123-12345678
              </Typography>
            </Grid>

            {/* Date Of Issue */}
            <Grid item xs={6} md={4}>
              <Typography fontWeight='400' color='#7A8684' fontSize='16px'>
                Date Of Issue
              </Typography>
              <Typography color='#44544A' sx={{ pt: 1 }}>
                24/01/24
              </Typography>
            </Grid>
          </Grid>

          {/* File Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              border: '1px solid #E0E0E0',
              borderRadius: '10px',
              backgroundColor: '#FFF',
              minWidth: '280px'
            }}
          >
            <img
              src='/icons/pdf_icon2.svg'
              alt='PDF Icon'
              width='18%'
              style={{ marginRight: '8px', background: '#FFBDA84D', borderRadius: '6px', padding: '10px' }}
            />
            <Typography
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100px',
                height: '40px',
                pt: 2
              }}
            >
              AWB_1231244....pdf
            </Typography>
            <IconButton size='small'>{/* <MoreVertIcon /> */}</IconButton>
          </Box>
        </Box>
      ) : (
        ''
      )}
    </>
  )
}

export default BasicDetails
