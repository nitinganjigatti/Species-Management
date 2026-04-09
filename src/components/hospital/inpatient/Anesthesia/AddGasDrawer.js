'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Box, Card, Chip, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { Grid } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

const schema = yup.object().shape({
  gas_name: yup
    .object()
    .nullable()
    .required('Please select a Gas from the list')
    .test('is-valid-drug', 'Please select a valid gas from the list', function (value) {
      if (!value) return false
      return Boolean(value.id && value.name)
    }),
  o2_flow: yup.string().trim().required('O2 Flow is required'),
  concentration: yup.string().trim().required('Concentration is required'),
  start_time: yup
    .date()
    .nullable()
    .required('Start time is required')
    .typeError('Please select a valid start time')
    .test('is-before-end-time', 'Start time cannot be greater than end time', function (value) {
      const { end_time } = this.parent
      if (!value || !end_time) return true

      const start = dayjs(value)
      const end = dayjs(end_time)

      return start.isBefore(end) || start.isSame(end)
    }),

  end_time: yup
    .date()
    .nullable()
    .required('End time is required')
    .typeError('Please select a valid end time')
    .test('is-after-start-time', 'End time cannot be less than start time', function (value) {
      const { start_time } = this.parent
      if (!value || !start_time) return true

      const start = dayjs(start_time)
      const end = dayjs(value)

      return end.isAfter(start) || end.isSame(start)
    }),
  delivery_status: yup.string().required('Delivery status is required'),
  delivery_route: yup.object().required('Delivery Route is required')
})

const deliveryStatus = [
  { label: 'Complete', value: 'Complete' },
  { label: 'Partial', value: 'Partial' },
  { label: 'None', value: 'None' }
]

const defaultValues = {
  gas_name: null,
  o2_flow: '',
  concentration: '',
  start_time: null,
  delivery_route: '',
  delivery_status: null,
  end_time: null
}

function AddGasDrawer({
  handleSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  submitLoader,
  editData,
  gasOptions = [],
  existingMedications = [],
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

  const filteredGasOptions = useMemo(() => {
    if (!Array.isArray(gasOptions) || !gasOptions.length) return []
    const existing = Array.isArray(existingMedications) ? existingMedications : []

    const excludedIds = new Set(
      existing
        .map(m => m?.gas_name?.id ?? m?.drug_id ?? null)
        .filter(Boolean)
        .map(id => String(id))
    )
    const editingId = editData?.gas_name?.id ?? editData?.drug_id ?? null
    const editingIdStr = editingId ? String(editingId) : null

    return gasOptions.filter(opt => {
      const optId = opt?.id ?? opt?.drug_id ?? null
      if (!optId) return true
      const idStr = String(optId)
      if (editingIdStr && idStr === editingIdStr) return true
      return !excludedIds.has(idStr)
    })
  }, [gasOptions, existingMedications, editData])

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
        if (key !== 'start_time' && key !== 'end_time') {
          setValue(key, editData[key] ?? defaultValues[key], { shouldValidate: true })
        }
      })

      setValue('start_time', parseTime(editData.start_time), { shouldValidate: true })
      setValue('end_time', parseTime(editData.end_time), { shouldValidate: true })

      if (editData.delivery_status) {
        setSelectedStatus(editData.delivery_status)
        setValue('delivery_status', editData.delivery_status, { shouldValidate: true })
      }

      if (editData.gas_name) {
        setDrugNameTouched(true)
      }
    } else {
      const now = dayjs()
      reset({
        ...defaultValues,
        start_time: now,
        end_time: now
      })
      setDrugNameTouched(false)
      setSelectedStatus(null)
    }
  }, [editData, setValue, reset, handleSidebarOpen])

  useEffect(() => {
    if (selectedStatus) {
      setValue('delivery_status', selectedStatus, { shouldValidate: true })
    }
  }, [selectedStatus, setValue])

  const handleDrugNameBlur = useCallback(() => {
    setDrugNameTouched(true)
    trigger('gas_name')
  }, [trigger])

  const handleDrugNameChange = useCallback(
    (event, value) => {
      if (event?.type === 'change' && !value?.id) {
        setDrugNameTouched(true)
      }
      setTimeout(() => trigger('gas_name'), 100)
    },
    [trigger]
  )

  const onSubmit = useCallback(
    async formData => {
      const fmt = v => (v ? dayjs(v).format('hh:mm A') : null)
      const payload = {
        ...(editData && editData.id ? { id: editData.id } : {}),
        gas_name: formData.gas_name,
        o2_flow: formData.o2_flow,
        concentration: formData.concentration,
        start_time: fmt(formData.start_time),
        delivery_route: formData.delivery_route,
        delivery_status: selectedStatus,
        end_time: fmt(formData.end_time)
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
    [handleSubmitData, reset, handleSidebarClose, selectedStatus]
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
            {editData ? 'Edit Gas' : 'Add Gas'}
          </Typography>
        </Box>

        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

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
                  name='gas_name'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <ControlledAutocomplete
                      {...field}
                      control={control}
                      name='gas_name'
                      errors={errors}
                      label='Enter Gas Name*'
                      options={filteredGasOptions}
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
              <Grid size={{ xs: 6 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='O2 Flow (L/min)*'
                  name='o2_flow'
                  placeholder='O2 Flow (L/min)'
                  fullWidth
                  type='number'
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Concentration (%)*'
                  name='concentration'
                  placeholder='Concentration (%)'
                  fullWidth
                  type='number'
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTimePicker
                  control={control}
                  name={'start_time'}
                  label='Start Time*'
                  errors={errors}
                  format='hh:mm a'
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
                  name={'end_time'}
                  label='End Time*'
                  errors={errors}
                  format='hh:mm a'
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

export default AddGasDrawer
