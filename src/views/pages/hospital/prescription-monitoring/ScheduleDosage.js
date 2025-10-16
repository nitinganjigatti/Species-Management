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
  Divider,
  Button
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import Icon from 'src/@core/components/icon'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import { LoadingButton } from '@mui/lab'
import TreatmentTypeRadioButtons from '../utility/TreatmentTypeRadioButtons'
import { Controller, useForm, useFieldArray } from 'react-hook-form'

const ScheduleDosage = ({ handleOpen, handleSidebarClose, onSubmit, submitLoader }) => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      schedules: [
        {
          time: '',
          dosageQuantity: '',
          dosageUnit: '',
          dosageWeights: ''
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules',
    keyName: 'fieldId' // add this to avoid key prop conflicts
  })

  const dosageUnits = [
    { label: 'mg', value: 'mg' },
    { label: 'ml', value: 'ml' },
    { label: 'g', value: 'g' }
  ]

  const dosageWeights = [
    { label: 'kg', value: 'kg' },
    { label: 'g', value: 'g' },
    { label: 'mg', value: 'mg' }
  ]

  const handleClose = () => {
    reset()
    handleSidebarClose()
  }

  const handleFormSubmit = data => {
    onSubmit(data)
    handleClose()
  }

  return (
    <Dialog
      open={handleOpen}
      onClose={handleClose}
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
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
            <Typography
              sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              Schedule Dosage
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: theme.palette.text.primary, padding: 0 }}>
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
            Dolo 650 tablet
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              2 Jan 2025
            </Typography>
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
              <Grid container rowSpacing={4} columnSpacing={2}>
                {fields.map((field, idx) => (
                  <React.Fragment key={field.fieldId}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <ControlledTimePicker
                        name={`schedules.${idx}.time`}
                        control={control}
                        label='Select Time'
                        format='hh:mm A'
                        errors={errors?.schedules?.[idx]?.time}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: fields.length > 1 ? 10 : 12, sm: fields.length > 1 ? 7 : 8 }}>
                      <ControlledSelectWithTextField
                        textFieldName={`schedules.${idx}.dosageQuantity`}
                        selectFieldName={`schedules.${idx}.dosageUnit`}
                        secondSelectFieldName={`schedules.${idx}.dosageWeights`}
                        control={control}
                        errors={errors?.schedules?.[idx]}
                        options={dosageUnits}
                        secondOptions={dosageWeights}
                        label='Quantity'
                        placeholder='Enter quantity'
                        type='number'
                        getOptionLabel={option => option.label}
                        getOptionValue={option => option.value}
                        getSecondOptionLabel={option => option.label}
                        getSecondOptionValue={option => option.value}
                        required
                        selectWidth={60}
                        secondSelectWidth={50}
                        showEmptyMenuItem={false}
                        showEmptyMenuItemLabel={false}
                      />
                    </Grid>
                    {fields.length > 1 && (
                      <Grid size={{ xs: 0.5 }} sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => remove(idx)} sx={{ color: theme.palette.text.primary, padding: 0 }}>
                          <Icon icon='mdi:close' fontSize={24} />
                        </IconButton>
                      </Grid>
                    )}
                  </React.Fragment>
                ))}
                <Grid size={{ xs: 12 }}>
                  <Button
                    startIcon={<Icon icon='mdi:plus' fontSize={24} />}
                    variant='outlined'
                    fullWidth
                    sx={{
                      fontSize: '1rem',
                      backgroundColor: theme.palette.customColors.SurfaceVariant,
                      color: theme.palette.customColors.OnSurface,
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: 500,
                      py: '0.625rem'
                    }}
                    onClick={e => {
                      e.preventDefault()
                      append({ time: '', dosageQuantity: '', dosageUnit: 'mg', dosageWeights: 'kg' })
                    }}
                  >
                    Add Time
                  </Button>
                </Grid>
                <Divider sx={{ width: '100%', my: 2, borderColor: theme.palette.customColors.OutlineVariant }} />
                <Grid size={{ xs: 12 }}>
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 500,
                      mb: 3,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Apply Dosage
                  </Typography>

                  <Controller
                    name='applyDosage'
                    control={control}
                    render={({ field }) => (
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12 }}>
                          <TreatmentTypeRadioButtons
                            label='Only for this day'
                            isSelected={field.value === 'this_day'}
                            onClick={() => field.onChange('this_day')}
                            radioPosition='right'
                            selectedFontColor={theme.palette.customColors.OnSurfaceVariant}
                            textColor={theme.palette.customColors.Outline}
                            borderColor={theme.palette.customColors.OutlineVariant}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <TreatmentTypeRadioButtons
                            label='Till prescription ends'
                            isSelected={field.value === 'till_end'}
                            onClick={() => field.onChange('till_end')}
                            radioPosition='right'
                            selectedFontColor={theme.palette.customColors.OnSurfaceVariant}
                            textColor={theme.palette.customColors.Outline}
                            borderColor={theme.palette.customColors.OutlineVariant}
                          />
                        </Grid>
                      </Grid>
                    )}
                  />
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </DialogContent>

      <Box
        sx={{
          p: 6,
          display: 'flex',
          boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: theme.palette.background.paper
        }}
      >
        <LoadingButton variant='contained' type='submit' loading={submitLoader} sx={{ flex: 1, py: 2 }}>
          Schedule
        </LoadingButton>
      </Box>
    </Dialog>
  )
}

export default ScheduleDosage
