import React from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Button,
  Radio,
  FormControlLabel
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm, Controller } from 'react-hook-form'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'

const AdministerOrSkipModal = ({
  open,
  handleClose,
  onSubmit,
  submitLoader,
  medicineData
}) => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      action: 'administer', // 'administer' or 'skipped'
      time: '',
      quantity: '',
      quantityUnit: 'mg',
      wastageQuantity: '',
      wastageUnit: 'mg',
      notes: '',
      batchNumber: '',
      attachment: null,
      skipReason: ''
    }
  })

  const actionType = watch('action')

  const quantityUnits = [
    { label: 'mg', value: 'mg' },
    { label: 'ml', value: 'ml' },
    { label: 'g', value: 'g' }
  ]

  const handleModalClose = () => {
    reset()
    handleClose()
  }

  const handleFormSubmit = data => {
    onSubmit(data)
    handleModalClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 1,
            maxWidth: '562px'
          }
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
            justifyContent: 'space-between',
            p: 6,
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Activity Icon' />
              <Typography
                sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                Administer / Skip
              </Typography>
            </Box>
          </Box>
          <IconButton size='small' onClick={handleModalClose} sx={{ color: theme.palette.text.primary, p: 0 }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        {/* Medicine Info Section */}
        <Box
          sx={{
            display: 'flex',
            flexFlow: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 6,
            py: 3,
            backgroundColor: theme.palette.customColors.OnPrimary
          }}
        >
          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 500,
              color: theme.palette.primary.deepDark
            }}
          >
            {medicineData?.name || 'Levothyroxine'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {medicineData?.date || '2 Jan 2025'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {medicineData?.time || '12:00 PM'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 6 }}>
        <Card
          sx={{
            borderRadius: 1,
            border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
            boxShadow: 0
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <Grid container spacing={4}>
                {/* Radio Buttons for Action Type */}
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name='action'
                    control={control}
                    render={({ field }) => (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TreatmentTypeRadioButtons
                          label='Administer'
                          isSelected={field.value === 'administer'}
                          onClick={() => field.onChange('administer')}
                          radioPosition='right'
                          sx={{ flex: 1 }}
                        />
                        <TreatmentTypeRadioButtons
                          label='Skipped'
                          isSelected={field.value === 'skipped'}
                          onClick={() => field.onChange('skipped')}
                          radioPosition='right'
                          borderColor={theme.palette.customColors.OutlineVariant}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                    )}
                  />
                </Grid>

                {/* Common Fields - Time and Quantity */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTimePicker
                    name='time'
                    control={control}
                    label='Time'
                    format='hh:mm A'
                    sx={{ backgroundColor: theme.palette.customColors.Surface }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledSelectWithTextField
                    textFieldName='quantity'
                    selectFieldName='quantityUnit'
                    control={control}
                    errors={errors}
                    options={quantityUnits}
                    label='Quantity'
                    placeholder='Enter quantity'
                    type='number'
                    getOptionLabel={option => option.label}
                    getOptionValue={option => option.value}
                    required
                    selectWidth={80}
                  />
                </Grid>

                {/* Conditional Content based on Action Type */}
                {actionType === 'administer' ? (
                  <>
                    {/* Wastage Section for Administer */}
                    <Grid size={{ xs: 12 }}>
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          mb: 3
                        }}
                      >
                        Add wastage if any
                        <Typography
                          component='span'
                          sx={{
                            fontSize: '1rem',
                            color: theme.palette.customColors.neutralSecondary,
                            ml: 1
                          }}
                        >
                          (Optional)
                        </Typography>
                      </Typography>

                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <ControlledTextField
                            name='wastageQuantity'
                            control={control}
                            errors={errors}
                            label='Quantity'
                            placeholder='Enter Quantity'
                            type='number'
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <ControlledSelect
                            name='wastageUnit'
                            label='Unit'
                            control={control}
                            errors={errors}
                            options={quantityUnits}
                            getOptionLabel={option => option.label}
                            getOptionValue={option => option.value}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <ControlledTextArea
                            label='Notes'
                            name='notes'
                            control={control}
                            errors={errors}
                            placeholder='Enter Notes'
                            rows={3}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <ControlledTextField
                            name='batchNumber'
                            control={control}
                            errors={errors}
                            label='Batch Number'
                            placeholder='Enter batch number if any (optional)'
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <ControlledMultiFileUpload
                            name='attachment'
                            control={control}
                            errors={errors}
                            label='Batch Image'
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <>
                    {/* Reason for Skip Section */}
                    <Grid size={{ xs: 12 }}>
                      <ControlledTextArea
                        label='Reason For Skip'
                        name='skipReason'
                        control={control}
                        errors={errors}
                        placeholder='Enter reason for skipping'
                        rows={4}
                        required={actionType === 'skipped'}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </form>
          </CardContent>
        </Card>
      </DialogContent>

      {/* Footer Buttons */}
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
        <LoadingButton
          variant='outlined'
          type='button'
          loading={submitLoader}
          onClick={handleModalClose}
          sx={{ flex: 1, py: 2 }}
        >
          CANCEL
        </LoadingButton>
        <LoadingButton
          variant='contained'
          type='submit'
          loading={submitLoader}
          onClick={handleSubmit(handleFormSubmit)}
          sx={{ flex: 1, py: 2 }}
        >
          {actionType === 'administer' ? 'ADMINISTER' : 'SKIPPED'}
        </LoadingButton>
      </Box>
    </Dialog>
  )
}

export default AdministerOrSkipModal
