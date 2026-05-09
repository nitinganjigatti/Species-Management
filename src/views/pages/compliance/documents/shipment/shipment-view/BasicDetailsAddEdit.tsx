import React from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  CircularProgress
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import FileUpload from 'src/views/forms/form-elements/file-uploader/ComplianceFileUploader'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { useTheme } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'

interface BasicDetailsAddEditProps {
  airwaybillvalue: string
  setAirwaybillvalue: React.Dispatch<React.SetStateAction<string>>
  startDate: string | null
  setStartDate: React.Dispatch<React.SetStateAction<string | null>>
  uploadedFile: File | Record<string, unknown> | null
  setUploadedFile: React.Dispatch<React.SetStateAction<File | Record<string, unknown> | null>>
  transportType: string
  setTransportType: React.Dispatch<React.SetStateAction<string>>
  fileNumberValue: string
  setFileNumberValue: React.Dispatch<React.SetStateAction<string>>
  loader: boolean
  onSave: (event?: React.SyntheticEvent | string) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onCancel?: () => void
}

const BasicDetailsAddEdit = ({
  airwaybillvalue,
  setAirwaybillvalue,
  startDate,
  setStartDate,
  uploadedFile,
  setUploadedFile,
  transportType,
  setTransportType,
  fileNumberValue,
  setFileNumberValue,
  loader,
  onSave,
  errors,
  setErrors
}: BasicDetailsAddEditProps) => {
  const theme = useTheme()

  const handleAirwaybillChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAirwaybillvalue(event.target.value)
    setErrors(prev => ({ ...prev, airwaybillvalue: '' }))
  }

  const handleFileNmbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileNumberValue(e.target.value)
  }

  const handleDateChange = (date: Dayjs | null) => {
    setStartDate(date ? date.toISOString() : null)
    setErrors(prev => ({ ...prev, startDate: '' }))
  }

  const handleFileUpload = (file: File | Record<string, unknown> | null) => {
    setUploadedFile(file)
    setErrors(prev => ({ ...prev, uploadedFile: '' }))
  }

  const handleChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setTransportType(e.target.value as string)
  }

  return (
    <>
      <Grid container spacing={2.8}>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth>
            {/* <InputLabel>Transport Type</InputLabel> */}
            <Select
              value={transportType}
              onChange={handleChange as any}
              label=''
              sx={{
                background: theme.palette.customColors.mdAntzNeutral,
                border: 'none',
                color: theme.palette.customColors.Outline,
                borderBottomRightRadius: '0px',
                borderTopRightRadius: '0px',
                '& .MuiSelect-select': {
                  color: theme.palette.customColors.Outline
                },
                '&.Mui-disabled .MuiSelect-select': {
                  color: theme.palette.customColors.Outline
                },
                '& fieldset': {
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`
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
          <Grid container spacing={3}>
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
                  //maxLength: 31,
                  style: { borderRadius: 6, borderBottomLeftRadius: '0px', borderTopLeftRadius: '0px' }
                }
              }}
            />
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ ml: 0 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label='Shipment Date*'
              value={startDate ? dayjs(startDate) : null}
              onChange={handleDateChange as any}
              maxDate={dayjs(new Date())}
              views={['year', 'month', 'day']}
              format='Do MMM YYYY'
              slotProps={{
                textField: {
                  error: Boolean(errors.startDate),
                  helperText: errors.startDate,
                  sx: {
                    '& .MuiInputBase-input': { padding: '17px' },
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#44544a82' } },
                    width: '100%',
                    height: '56px'
                  }
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={3}>
            <TextField
              fullWidth
              label='Enter File Number*'
              variant='outlined'
              value={fileNumberValue}
              onChange={handleFileNmbChange}
              error={Boolean(errors.fileNumberValue)}
              helperText={errors.fileNumberValue}
              sx={{ marginTop: '4px', mr: 2 }}
              slotProps={{
                input: {
                  //maxLength: 31,
                  style: { height: '52px' }
                }
              }}
            />
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FileUpload
            name='(AWB) Airway Bill'
            onFileUpload={handleFileUpload}
            file={uploadedFile ? uploadedFile : null}
          />
          {errors.uploadedFile && (
            <Typography
              sx={{ color: theme.palette.customColors.errorText, fontSize: '12px', fontWeight: '400', mt: 1 }}
            >
              {errors.uploadedFile}
            </Typography>
          )}
        </Grid>
      </Grid>

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
