import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { alpha, useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AddIcon from '@mui/icons-material/Add'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import Icon from 'src/@core/components/icon'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import { LoadingButton } from '@mui/lab'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'

const AdministerMedicineModal = ({ open, onClose, medicineData, onSubmit, submitLoader }) => {
  const theme = useTheme()
  const [selectedFile, setSelectedFile] = useState(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      time: '12:00 PM',
      quantity: '350',
      wastageQuantity: '',
      wastageUnit: 'mg',
      notes: '',
      batchNumber: ''
    }
  })

  const wastageUnits = [
    { label: 'mg', value: 'mg' },
    { label: 'ml', value: 'ml' },
    { label: 'g', value: 'g' }
  ]

  const handleClose = () => {
    reset()
    setSelectedFile(null)
    onClose()
  }

  const handleFormSubmit = data => {
    const submissionData = {
      ...data,
      batchImage: selectedFile
    }
    onSubmit(submissionData)
    handleClose()
  }

  const handleFileSelect = event => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: theme.palette.customColors.Background,
          maxWidth: '562px',
          margin: 'auto'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.OnPrimary
        }}
      >
        {/* Title Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            p: 6,
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
              <Typography
                sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                Administer medicine
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        {/* Medicine Info Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 6,
            py: 2.5,
            backgroundColor: theme.palette.customColors.OnPrimary
          }}
        >
          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 500,
              color: theme.palette.primary.deepDark,
              fontFamily: 'Inter'
            }}
          >
            {medicineData?.name || 'Dolo 650 tablet'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontFamily: 'Inter'
                }}
              >
                2 Jan 2025
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontFamily: 'Inter'
                }}
              >
                12:00 PM
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 6 }}>
          <Card
            sx={{
              borderRadius: 1,
              border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
              backgroundColor: theme.palette.customColors.OnPrimary,
              boxShadow: 0
            }}
          >
            <CardContent sx={{ p: 6 }}>
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 6 }}>
                    <ControlledTimePicker
                      name={'time'}
                      control={control}
                      label='Select Time'
                      format='hh:mm A'
                      disabled
                      sx={{ backgroundColor: theme.palette.customColors.Surface }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <ControlledSelectWithTextField
                      firstSelectFieldName={'quantity'}
                      textFieldName={`schedules`}
                      control={control}
                      errors={errors}
                      options={[]}
                      label='Quantity'
                      placeholder='Enter quantity'
                      type='number'
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                      required
                      sx={{ backgroundColor: alpha(theme.palette.customColors.mdAntzNeutral, 0.05) }}
                    />
                    <ControlledSelectWithTextField
                      textFieldName={'quantity'}
                      control={control}
                      errors={errors}
                      options={[]}
                      label='Quantity'
                      placeholder='Enter quantity'
                      type='number'
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontFamily: 'Inter'
                      }}
                    >
                      Add wastage if any
                      <Typography
                        component='span'
                        sx={{
                          fontSize: '1rem',
                          color: theme.palette.customColors.neutralSecondary
                        }}
                      >
                        (Optional)
                      </Typography>
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <ControlledTextField
                      name={'wastageQuantity'}
                      control={control}
                      errors={errors}
                      label={'Quantity*'}
                      placeholder={'Enter Quantity '}
                      type='number'
                    />
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <ControlledSelect
                      name={'wastageUnit'}
                      label={'mg'}
                      control={control}
                      errors={errors}
                      options={wastageUnits}
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <ControlledTextArea
                      name='notes'
                      control={control}
                      errors={errors}
                      placeholder='Enter Notes'
                      rows={3}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <ControlledTextField
                      name={'batchNumber'}
                      control={control}
                      errors={errors}
                      label={'Batch Number*'}
                      placeholder={'Enter batch number if any (optional) '}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <ControlledFileUpload
                      name='attachment'
                      control={control}
                      errors={errors}
                      label='Upload attachment'
                    />
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <Box
        sx={{
          p: 6,
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: theme.palette.background.paper
        }}
      >
        <LoadingButton variant='outlined' type='button' loading={submitLoader} sx={{ flex: 1, py: 2 }}>
          SKIPPED
        </LoadingButton>
        <LoadingButton variant='contained' type='submit' loading={submitLoader} sx={{ flex: 1, py: 2 }}>
          ADMINISTER
        </LoadingButton>
      </Box>
    </Dialog>
  )
}

export default AdministerMedicineModal
