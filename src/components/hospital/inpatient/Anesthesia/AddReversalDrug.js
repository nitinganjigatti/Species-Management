import React, { useState, useCallback, useEffect } from 'react'
import { Box, Card, Chip, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { alpha, Grid } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

const schema = yup.object().shape({
  drug_name: yup.object().required('Drug Name is required').nullable(),
  amount: yup
    .string()
    .trim()
    .required('Amount is required')
    .test('is-valid-amount', 'Amount must be greater than 0', value => {
      if (!value) return false
      const num = parseFloat(value)
      return !isNaN(num) && num > 0
    }),
  unit: yup.string().required('Unit is required'),
  delivery_time: yup
    .date()
    .nullable()
    .required('Delivery Time is required')
    .typeError('Please select a valid delivery time'),
  delivery_route: yup.object().required('Delivery Route is required').nullable(),
  max_effect_time: yup
    .date()
    .nullable()
    .required('Max Effect Time is required')
    .typeError('Please select a valid max effect time')
    .test('is-after-delivery', 'Max effect time cannot be less than delivery time', function (value) {
      const { delivery_time } = this.parent
      if (!delivery_time || !value) return true

      const delivery = dayjs(delivery_time)
      const maxEffect = dayjs(value)

      return maxEffect.isAfter(delivery) || maxEffect.isSame(delivery)
    }),
  delivery_status: yup.string().nullable()
})

const deliveryStatus = [
  { label: 'Complete', value: 'Complete' },
  { label: 'Partial', value: 'Partial' },
  { label: 'None', value: 'None' }
]

const defaultValues = {
  drug_name: null,
  amount: '',
  unit: '',
  delivery_route: null,
  delivery_time: null,
  delivery_status: null,
  max_effect_time: null
}

function AddReversalDrug({
  handleSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  submitLoader,
  editData,
  drugOptions = [],
  unitList = [],
  deliveryRouteOptions = [],
  onLoadMoreDrugs,
  hasMoreDrugs = false,
  isLoadingDrugs = false
}) {
  const theme = useTheme()
  const [selectedStatus, setSelectedStatus] = useState(null)

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const formValues = watch()

  useEffect(() => {
    console.log(' Form Values:', formValues)
    console.log(' Form Errors:', errors)
    console.log(' Is Valid:', isValid)
    console.log(' Selected Status:', selectedStatus)
  }, [formValues, errors, isValid, selectedStatus])

  useEffect(() => {
    if (!handleSidebarOpen) return

    if (editData) {
      const parseTime = t => {
        if (!t) return null

        if (dayjs.isDayjs(t)) return t
        if (t instanceof Date) return dayjs(t)

        const formats = ['YYYY-MM-DD HH:mm:ss', 'HH:mm:ss', 'HH:mm', 'hh:mm A', 'hh:mm a']
        for (const format of formats) {
          const parsed = dayjs(t, format, true)
          if (parsed.isValid()) {
            if (format.includes('hh:mm') || format.includes('HH:mm')) {
              const today = dayjs().format('YYYY-MM-DD')
              return dayjs(`${today} ${parsed.format('HH:mm:ss')}`, 'YYYY-MM-DD HH:mm:ss', true)
            }
            return parsed
          }
        }
        return null
      }

      Object.keys(defaultValues).forEach(key => {
        if (key !== 'delivery_time' && key !== 'max_effect_time') {
          setValue(key, editData[key] ?? defaultValues[key], { shouldValidate: true })
        }
      })

      setValue('delivery_time', parseTime(editData.delivery_time), { shouldValidate: true })
      setValue('max_effect_time', parseTime(editData.max_effect_time), { shouldValidate: true })

      if (editData.delivery_status) {
        setSelectedStatus(editData.delivery_status)
        setValue('delivery_status', editData.delivery_status, { shouldValidate: true })
      }
    } else {
      reset(defaultValues)
      setSelectedStatus(null)
    }
  }, [editData, setValue, reset, handleSidebarOpen])

  useEffect(() => {
    setValue('delivery_status', selectedStatus, { shouldValidate: true })
  }, [selectedStatus, setValue])

  const onSubmit = useCallback(
    async formData => {
      const fmt = v => (v && dayjs(v).isValid() ? dayjs(v).format('hh:mm A') : null)

      const payload = {
        drug_name: formData.drug_name,
        amount: formData.amount,
        unit: formData.unit,
        delivery_route: formData.delivery_route,
        delivery_time: fmt(formData.delivery_time),
        delivery_status: selectedStatus,
        max_effect_time: fmt(formData.max_effect_time)
      }

      try {
        await handleSubmitData(payload)
        reset(defaultValues)
        setSelectedStatus(null)
        handleSidebarClose()
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    },
    [handleSubmitData, reset, handleSidebarClose, selectedStatus]
  )

  const handleClose = useCallback(() => {
    reset(defaultValues)
    setSelectedStatus(null)
    handleSidebarClose()
  }, [reset, handleSidebarClose])

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 560] } }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Hospital Icon' />

          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {editData ? 'Edit Reversal Drug' : 'Add Reversal Drug'}
          </Typography>
        </Box>

        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      {/* Sidebar Body */}
      <Box
        className='sidebar-body'
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1,
          pb: 26
        }}
      >
        <form autoComplete='off' onSubmit={submitLoader ? undefined : handleSubmit(onSubmit)}>
          <Card sx={{ p: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <ControlledAutocomplete
                  control={control}
                  name='drug_name'
                  errors={errors}
                  label='Enter Drug Name*'
                  options={drugOptions}
                  getOptionLabel={option => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                  )}
                  loading={isLoadingDrugs}
                  autocompleteProps={{
                    slotProps: {
                      listbox: {
                        onScroll: event => {
                          const listboxNode = event.currentTarget
                          const scrollBottom = listboxNode.scrollTop + listboxNode.clientHeight
                          const threshold = listboxNode.scrollHeight - 50

                          if (scrollBottom >= threshold) {
                            if (hasMoreDrugs && !isLoadingDrugs && typeof onLoadMoreDrugs === 'function') {
                              onLoadMoreDrugs()
                            }
                          }
                        }
                      }
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Enter amount*'
                  name='amount'
                  placeholder='Enter amount'
                  fullWidth
                  type='number'
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledSelect
                  control={control}
                  name='unit'
                  errors={errors}
                  label='Unit*'
                  options={unitList}
                  getOptionLabel={option => option.uom_abbr}
                  getOptionValue={option => option.id}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTimePicker
                  control={control}
                  name={'delivery_time'}
                  label='Delivery Time*'
                  format='hh:mm a'
                  errors={errors}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledAutocomplete
                  control={control}
                  name='delivery_route'
                  errors={errors}
                  label='Delivery Route*'
                  options={deliveryRouteOptions}
                  getOptionLabel={option => option?.delivery || ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.delivery}
                    </li>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mr: 2 }}>
                  Delivery status:{' '}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  {deliveryStatus.map((status, index) => (
                    <Chip
                      key={index}
                      label={status.label}
                      onClick={() => setSelectedStatus(status.value)}
                      clickable
                      sx={{
                        gap: '10px',
                        backgroundColor:
                          selectedStatus === status.value
                            ? theme.palette.customColors.OnSecondaryContainer
                            : theme.palette.action.hover,
                        color:
                          selectedStatus === status.value
                            ? theme.palette.primary.contrastText
                            : theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor:
                            selectedStatus === status.value
                              ? theme.palette.customColors.OnSecondaryContainer
                              : theme.palette.action.selected
                        },

                        '&.MuiChip-clickable:active': {
                          boxShadow: 'none',
                          transform: 'scale(0.98)'
                        }
                      }}
                    />
                  ))}
                </Box>
                {errors.delivery_status && (
                  <Typography variant='caption' color='error' sx={{ ml: 2 }}>
                    {errors.delivery_status.message}
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ControlledTimePicker
                  control={control}
                  name={'max_effect_time'}
                  label='Max Effect Time*'
                  format='hh:mm a'
                  errors={errors}
                />
              </Grid>
            </Grid>
          </Card>

          {/* Footer button */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: { xs: '100%', sm: '560px' },
              p: 4,
              display: 'flex',
              justifyContent: 'center',
              boxShadow: `0px -2px 8px ${theme.palette.customColors.shadowColor}`,
              backgroundColor: theme.palette.background.paper,
              zIndex: 1200
            }}
          >
            <Box sx={{ display: 'flex', gap: 4, width: '100%' }}>
              <LoadingButton
                variant='outlined'
                type='button'
                loading={submitLoader}
                sx={{
                  flex: 1,
                  py: 4,
                  color: theme.palette.customColors.OnPrimaryContainer,
                  borderColor: theme.palette.customColors.OnPrimaryContainer
                }}
                onClick={handleSidebarClose}
              >
                Cancel
              </LoadingButton>
              <LoadingButton
                variant='contained'
                type='submit'
                loading={submitLoader}
                sx={{ flex: 1, py: 4 }}
                disabled={!isValid || submitLoader || !selectedStatus}
              >
                {editData ? 'Update' : 'Add'}
              </LoadingButton>
            </Box>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddReversalDrug
