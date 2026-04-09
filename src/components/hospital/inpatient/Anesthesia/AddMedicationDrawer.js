'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Box, Card, Chip, Drawer, IconButton, Select, Typography, useTheme } from '@mui/material'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
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
  drug_name: yup
    .object()
    .nullable()
    .required('Please select a drug from the list')
    .test('is-valid-drug', 'Please select a valid drug from the list', function (value) {
      if (!value) return false
      return Boolean(value.id && value.name)
    }),
  purpose_stage: yup.string().required('Purpose or stage is required'),
  amount: yup.string().trim().required('Amount is required'),
  unit: yup.string().required('Unit is required'),
  delivery_time: yup
    .date()
    .nullable()
    .required('Delivery Time is required')
    .typeError('Please select a valid delivery time')
    .test('is-before-max-effect', 'Delivery time cannot be greater than max effect time', function (value) {
      const { max_effect_time } = this.parent
      if (!value || !max_effect_time) return true

      const delivery = dayjs(value)
      const maxEffect = dayjs(max_effect_time)

      return delivery.isBefore(maxEffect) || delivery.isSame(maxEffect)
    }),
  delivery_status: yup.string().required('Delivery status is required'),
  delivery_route: yup.object().required('Delivery Route is required'),
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
    })

  // notes: yup.string().trim().required('Note is required')
})

const deliveryStatus = [
  { label: 'Complete', value: 'Complete' },
  { label: 'Partial', value: 'Partial' },
  { label: 'None', value: 'None' }
]

// Default Form Values
const defaultValues = {
  drug_name: null,
  purpose_stage: '',
  amount: '',
  unit: '',
  delivery_route: null,
  delivery_time: null,
  delivery_status: null,
  max_effect_time: null,
  notes: ''
}

function AddMedicationDrawer({
  handleSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  submitLoader,
  editData,
  drugOptions = [],
  existingMedications = [],
  purposeStageOptions = [],
  unitList = [],
  deliveryRouteOptions = [],
  onLoadMoreDrugs,
  hasMoreDrugs = false,
  isLoadingDrugs = false,
  onSearch
}) {
  const theme = useTheme()
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [drugNameTouched, setDrugNameTouched] = useState(false)
  const {
    reset,
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const filteredDrugOptions = useMemo(() => {
    if (!Array.isArray(drugOptions) || !drugOptions.length) return []
    const existing = Array.isArray(existingMedications) ? existingMedications : []

    const excludedIds = new Set(
      existing
        .map(m => m?.drug_name?.id ?? m?.drug_id ?? null)
        .filter(Boolean)
        .map(id => String(id))
    )

    const editingId = editData?.drug_name?.id ?? editData?.drug_id ?? null
    const editingIdStr = editingId ? String(editingId) : null

    return drugOptions.filter(opt => {
      const optId = opt?.id ?? opt?.drug_id ?? null
      if (!optId) return true
      const idStr = String(optId)
      if (editingIdStr && idStr === editingIdStr) return true

      return !excludedIds.has(idStr)
    })
  }, [drugOptions, existingMedications, editData])

  useEffect(() => {
    if (!handleSidebarOpen) return
    if (editData) {
      const parseTime = t => {
        if (!t) return null
        if (dayjs.isDayjs(t)) return t
        if (t instanceof Date) return dayjs(t)

        const formats = ['YYYY-MM-DD HH:mm:ss', 'HH:mm:ss', 'hh:mm A', 'hh:mm a']
        for (const format of formats) {
          const parsed = dayjs(t, format, true)
          if (parsed.isValid()) {
            if (format.includes('hh:mm') || format === 'HH:mm:ss') {
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

      if (editData.drug_name) {
        setDrugNameTouched(true)
      }
    } else {
      const now = dayjs()
      reset({
        ...defaultValues,
        delivery_time: now,
        max_effect_time: now
      })
      setSelectedStatus(null)
      setDrugNameTouched(false)
    }
  }, [editData, setValue, reset, handleSidebarOpen])

  useEffect(() => {
    if (selectedStatus) {
      setValue('delivery_status', selectedStatus, { shouldValidate: true })
    }
  }, [selectedStatus, setValue])

  const handleDrugNameBlur = useCallback(() => {
    setDrugNameTouched(true)
    trigger('drug_name')
  }, [trigger])

  const handleDrugNameChange = useCallback(
    (event, value) => {
      if (event?.type === 'change' && !value?.id) {
        setDrugNameTouched(true)
      }
      setTimeout(() => trigger('drug_name'), 100)
    },
    [trigger]
  )

  const onSubmit = useCallback(
    async formData => {
      const fmt = v => (v ? dayjs(v).format('hh:mm A') : null)

      const payload = {
        ...(editData && editData.id ? { id: editData.id } : {}),
        drug_name: formData.drug_name,
        purpose_stage: formData.purpose_stage,
        amount: formData.amount,
        unit: formData.unit,
        delivery_route: formData.delivery_route,
        delivery_time: fmt(formData.delivery_time),
        delivery_status: selectedStatus,
        max_effect_time: fmt(formData.max_effect_time),
        notes: formData.notes
      }

      try {
        await handleSubmitData(payload)
        reset(defaultValues)
        setSelectedStatus(null)
        handleSidebarClose()
        onSearch?.('')
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    },
    [handleSubmitData, reset, handleSidebarClose, selectedStatus, editData]
  )

  const handleClose = useCallback(() => {
    reset(defaultValues)
    setSelectedStatus(null)
    handleSidebarClose()
    onSearch?.('')
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
            {editData ? 'Edit Drug' : 'Add Drug'}
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
                <Controller
                  name='drug_name'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <ControlledAutocomplete
                      {...field}
                      control={control}
                      name='drug_name'
                      errors={errors}
                      label='Enter Drug Name*'
                      options={filteredDrugOptions}
                      getOptionLabel={option => option?.name || ''}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          {option.name}
                        </li>
                      )}
                      loading={isLoadingDrugs}
                      autocompleteProps={{
                        onBlur: event => {
                          handleDrugNameBlur()
                          field.onBlur(event)
                        },
                        onChange: (event, value, reason) => {
                          field.onChange(value)
                          if (reason === 'selectOption') {
                            setDrugNameTouched(false)
                          } else {
                            handleDrugNameChange(event, value)
                          }
                        },
                        onInputChange: (_, value, reason) => {
                          if (reason === 'input') {
                            onSearch?.(value)
                          }
                          if (reason === 'clear') {
                            onSearch?.('')
                            field.onChange(null)
                          }
                        },
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
                          },
                          paper: {
                            onBlur: () => {
                              if (!field.value?.id) {
                                handleDrugNameBlur()
                              }
                            }
                          }
                        },
                        filterOptions: (options, params) => {
                          const filtered = options.filter(option =>
                            option.name.toLowerCase().includes(params.inputValue.toLowerCase())
                          )
                          return filtered
                        }
                      }}
                      error={drugNameTouched || error ? Boolean(error) : false}
                      helperText={drugNameTouched || error ? error?.message : ''}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <ControlledSelect
                  control={control}
                  name='purpose_stage'
                  errors={errors}
                  label='Enter Purpose or Stage*'
                  options={purposeStageOptions}
                  getOptionLabel={option => option.label}
                  getOptionValue={option => option.value}
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
              <Grid size={{ xs: 12 }}>
                <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2 }}>Notes</Typography>
                <ControlledTextArea
                  control={control}
                  errors={errors}
                  name='notes'
                  placeholder='Enter Notes'
                  fullWidth
                  rows={2}
                  inputBackgroundColor={alpha(theme.palette.customColors.antzNotes, 0.6)}
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
                onClick={handleClose}
              >
                Cancel
              </LoadingButton>
              <LoadingButton
                variant='contained'
                type='submit'
                loading={submitLoader}
                sx={{ flex: 1, py: 4 }}
                disabled={!isValid || submitLoader}
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

export default AddMedicationDrawer
