import React from 'react'
import { Box, Typography, Button, Grid, Paper, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useFieldArray } from 'react-hook-form'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import CloseIcon from '@mui/icons-material/Close'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import { borderColor, borderRadius } from '@mui/system'
import AddIcon from '@mui/icons-material/Add'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'

export default function ScheduleMedicine({ control, errors }) {
  const theme = useTheme()

  // Options for selects
  const frequencyOptions = [
    { id: 1, label: 'Everyday', value: 'everyday' },
    { id: 2, label: 'Alternate Day', value: 'every-other-day' },
    { id: 3, label: 'Weekly', value: 'weekly' },
    { id: 4, label: 'Monthly', value: 'monthly' },
    { id: 5, label: 'As Needed', value: 'as-needed' }
  ]

  const doseTypeOptions = [
    { id: 1, label: 'Fixed Dose', value: 'fixed-dose' },
    { id: 2, label: 'Variable Dose', value: 'variable-dose' },
    { id: 3, label: 'As Prescribed', value: 'as-prescribed' }
  ]

  const unitOptions = [
    { id: 1, label: 'Tablets', value: 'tablets' },
    { id: 2, label: 'Capsules', value: 'capsules' },
    { id: 3, label: 'ml', value: 'ml' },
    { id: 4, label: 'mg', value: 'mg' },
    { id: 5, label: 'Drops', value: 'drops' },
    { id: 6, label: 'Puffs', value: 'puffs' }
  ]

  const deliveryRouteOptions = [
    { id: 1, label: 'Oral', value: 'oral' },
    { id: 2, label: 'Injection', value: 'injection' },
    { id: 3, label: 'Topical', value: 'topical' },
    { id: 4, label: 'Inhalation', value: 'inhalation' },
    { id: 5, label: 'Sublingual', value: 'sublingual' },
    { id: 6, label: 'Rectal', value: 'rectal' }
  ]

  const durationUnitOptions = [
    { id: 1, label: 'Days', value: 'days' },
    { id: 2, label: 'Weeks', value: 'weeks' },
    { id: 3, label: 'Months', value: 'months' }
  ]

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules',
    keyName: 'fieldId' // add this to avoid key prop conflicts
  })

  return (
    <Box
      sx={{
        p: 4,
        textAlign: 'center',
        width: '100%',

        // height: '100%',
        maxHeight: 850,
        overflowY: 'auto',

        background: theme.palette.customColors.OnBackground,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.customColors.OutlineVariant,
          borderRadius: '3px'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: theme.palette.customColors.OnSurfaceVariant
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          container
          sx={{
            background: theme.palette.common.white,
            minHeight: 'fit-content',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            gap: 2,
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            flex: 1,
            overflowY: 'auto',

            '& .MuiGrid-item': {
              paddingLeft: '8px !important',
              paddingTop: '8px !important'
            }
          }}
        >
          <Typography
            sx={{
              mb: 4,
              fontSize: '20px',
              fontWeight: '500',
              textAlign: 'left',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Schedule Medicine
          </Typography>

          <Box sx={{ mb: 3 }}>
            <ControlledSelect
              fullWidth={true}
              name='frequency'
              sx={{
                textAlign: 'left',
                borderRadius: '4px'
              }}
              size='large'
              label='Set Frequency'
              control={control}
              errors={errors}
              options={frequencyOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              required
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <ControlledSelect
              fullWidth={true}
              name='doseType'
              label='Select Dose Type'
              sx={{
                textAlign: 'left',
                borderColor: `${theme.palette.customColors.OutlineVariant} !important`,
                borderRadius: '4px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  borderColor: `${theme.palette.customColors.OutlineVariant} !important`
                }
              }}
              size='large'
              control={control}
              errors={errors}
              options={doseTypeOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              required
            />
          </Box>

          {fields.map((field, idx) => (
            <Grid
              container
              spacing={2}
              key={field.fieldId}
              sx={{
                mb: 3,
                flexDirection: 'row',
                alignItems: 'flex-start',
                '& .MuiFormControl-root': {
                  width: '100%'
                }
              }}
            >
              <Grid item size={4.5}>
                <ControlledTimePicker
                  name={`schedules.${idx}.time`}
                  label='Time'
                  control={control}
                  errors={errors}
                  placeholder='12:30 PM'
                  required
                  sx={{
                    textAlign: 'left',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px'
                    }
                  }}
                  size='large'
                />
              </Grid>

              <Grid item size={6.5}>
                <ControlledSelectWithTextField
                  textFieldName={`schedules.${idx}.quantity`}
                  selectFieldName={`schedules.${idx}.unit`}
                  control={control}
                  errors={errors}
                  options={unitOptions}
                  label='Quantity'
                  placeholder='Enter quantity'
                  type='number'
                  getOptionLabel={option => option.label}
                  getOptionValue={option => option.value}
                  sx={{
                    textAlign: 'left',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px'
                    }
                  }}
                  size='large'
                  required
                />
              </Grid>

              {fields?.length > 1 && (
                <Grid
                  item
                  size={1}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    pt: '20px !important' // Align with input fields
                  }}
                >
                  <IconButton
                    onClick={() => remove(idx)}
                    size='small'
                    sx={{
                      mt: '-4px' // Fine tune alignment with input fields
                    }}
                  >
                    <CloseIcon fontSize='small' />
                  </IconButton>
                </Grid>
              )}
            </Grid>
          ))}

          <Button
            startIcon={<AddIcon />}
            variant='outlined'
            fullWidth
            sx={{
              mb: 3,
              height: '48px',
              fontSize: '16px',
              background: '#EAF8F2',
              color: '#1A7F64',
              borderColor: '#B6E2D3',
              fontWeight: 500,
              padding: '10px 12px'
            }}
            onClick={e => {
              e.preventDefault()
              append({ time: '', quantity: '', unit: '' })
            }}
          >
            Add Time
          </Button>

          <Box sx={{ mb: 3 }}>
            <ControlledSelect
              name='deliveryRoute'
              label='Select Delivery Route'
              fullWidth={true}
              sx={{
                textAlign: 'left',
                borderRadius: '4px'
              }}
              size='large'
              control={control}
              errors={errors}
              options={deliveryRouteOptions}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              required
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <ControlledDatePicker
              fullWidth={true}
              sx={{
                textAlign: 'left',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px'
                }
              }}
              size='large'
              name='prescriptionStartDate'
              label='Prescription Start Date'
              control={control}
              errors={errors}
              required
            />
          </Box>

          <Grid container display='flex' justifyContent={'space-between'} spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <ControlledTextField
                name='dosageDuration.value'
                label='Dosage Duration'
                control={control}
                errors={errors}
                type='number'
                sx={{
                  textAlign: 'left',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px'
                  }
                }}
                size='large'
                required
              />
            </Grid>
            <Grid item xs={6}>
              <ControlledSelect
                name='dosageDuration.unit'
                sx={{
                  textAlign: 'left',
                  borderRadius: '4px'
                }}
                size='large'
                control={control}
                errors={errors}
                options={durationUnitOptions}
                required
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 3 }}>
            <ControlledTextArea
              fullWidth={true}
              sx={{
                textAlign: 'left',
                background: '#FFF9E5',
                borderRadius: '4px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px'
                }
              }}
              name='notes'
              label='Enter Notes'
              control={control}
              errors={errors}
              rows={4}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
