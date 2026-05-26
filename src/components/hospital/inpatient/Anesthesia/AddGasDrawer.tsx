'use client'

import React, { useState, useCallback, useEffect, useMemo, HTMLAttributes } from 'react'
import { AutocompleteChangeReason, AutocompleteInputChangeReason, Box, Card, Chip, Drawer, IconButton, Theme, Typography, useTheme } from '@mui/material'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, ControllerRenderProps, FieldError, Resolver, useForm } from 'react-hook-form'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { Grid } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import { useTranslation } from 'react-i18next'
import { TFunction } from 'i18next'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { DeliveryRoute, DeliveryStatus, Id, MedicationDrugOption, SelectOption } from 'src/types/hospital/models'
import { GasFormData } from '../../shared/AddAnesthesiaRecordPage'
dayjs.extend(customParseFormat)

interface GasDrugRef {
  id?: Id
  name?: string
}

interface GasRouteRef {
  id?: Id
  delivery?: string | number
}
interface ExistingGasItem {
  gas_name?: GasDrugRef | null
  drug_id?: Id
}

interface GasEditData {
  id?: Id
  gas_name?: GasDrugRef | null
  drug_id?: Id
  o2_flow?: string
  concentration?: string
  start_time?: string | Dayjs | Date | null
  end_time?: string | Dayjs | Date | null
  delivery_route?: GasRouteRef | string | null
  delivery_status?: DeliveryStatus | string | null
}

const createSchema = (t: TFunction) => {
  return yup.object().shape({
    gas_name: yup
      .object()
      .nullable()
      .required(t('hospital_module.gas_is_required', 'Please select a Gas from the list'))
      .test('is-valid-drug', t('hospital_module.please_select_valid_gas', 'Please select a valid gas from the list'), function (value: GasDrugRef | null | undefined) {
        if (!value) return false
        return Boolean(value.id && value.name)
      }),
    o2_flow: yup.string().trim().required(t('hospital_module.o2_flow_is_required', 'O2 Flow is required')),
    concentration: yup.string().trim().required(t('hospital_module.concentration_is_required', 'Concentration is required')),
    start_time: yup
      .date()
      .nullable()
      .required(t('hospital_module.start_time_required', 'Start time is required'))
      .typeError(t('hospital_module.please_select_valid_start_time', 'Please select a valid start time'))
      .test('is-before-end-time', t('hospital_module.start_time_cannot_be_greater_than_end_time', 'Start time cannot be greater than end time'), function (value: Date | null | undefined) {
        const { end_time } = this.parent as { end_time: Date | Dayjs | null }
        if (!value || !end_time) return true

        const start = dayjs(value)
        const end = dayjs(end_time)

        return start.isBefore(end) || start.isSame(end)
      }),

    end_time: yup
      .date()
      .nullable()
      .required(t('hospital_module.end_time_required', 'End time is required'))
      .typeError(t('hospital_module.please_select_valid_end_time', 'Please select a valid end time'))
      .test('is-after-start-time', t('hospital_module.end_time_cannot_be_less_than_start_time', 'End time cannot be less than start time'), function (value: Date | null | undefined) {
        const { start_time } = this.parent as { start_time: Date | Dayjs | null }
        if (!value || !start_time) return true

        const start = dayjs(start_time)
        const end = dayjs(value)

        return end.isAfter(start) || end.isSame(start)
      }),
    delivery_status: yup.string().required(t('hospital_module.delivery_status_required', 'Delivery status is required')),
    delivery_route: yup.object().required(t('hospital_module.delivery_route_is_required', 'Delivery Route is required'))
  })
}

const defaultValues: GasFormData = {
  gas_name: null,
  o2_flow: '',
  concentration: '',
  start_time: null,
  delivery_route: '',
  delivery_status: null,
  end_time: null
}

interface AddGasDrawerProps {
  handleSidebarOpen: boolean
  handleSidebarClose: () => void
  handleSubmitData: (data: GasFormData) => Promise<void> | void
  submitLoader?: boolean
  editData?: GasEditData | null
  gasOptions?: MedicationDrugOption[]
  existingMedications?: ExistingGasItem[]
  deliveryRouteOptions?: DeliveryRoute[]
  onLoadMoreDrugs?: () => void
  hasMoreDrugs?: boolean
  isLoadingDrugs?: boolean
  onSearch?: (value: string) => void
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
}: AddGasDrawerProps) {
  const theme: Theme = useTheme()
  const { t } = useTranslation()

  const schema = createSchema(t)

  const deliveryStatus: SelectOption<DeliveryStatus>[] = [
    { label: t('hospital_module.complete'), value: 'Complete' },
    { label: t('hospital_module.partial'), value: 'Partial' },
    { label: t('hospital_module.none'), value: 'None' }
  ]
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus | null>(null)
  const [drugNameTouched, setDrugNameTouched] = useState<boolean>(false)
  const {
    reset,
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<GasFormData>({
    defaultValues,
    resolver: yupResolver(schema) as unknown as Resolver<GasFormData>,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const filteredGasOptions = useMemo<MedicationDrugOption[]>(() => {
    if (!Array.isArray(gasOptions) || !gasOptions.length) return []
    const existing: ExistingGasItem[] = Array.isArray(existingMedications) ? existingMedications : []

    const excludedIds = new Set(
      existing
        .map((m: ExistingGasItem) => m?.gas_name?.id ?? m?.drug_id ?? null)
        .filter(Boolean)
        .map((id: Id | null) => String(id))
    )
    const editingId = editData?.gas_name?.id ?? editData?.drug_id ?? null
    const editingIdStr = editingId ? String(editingId) : null

    return gasOptions.filter((opt: MedicationDrugOption) => {
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
      const parseTime = (value: string | Dayjs | Date | null | undefined): Dayjs | null => {
        if (!value) return null
        if (dayjs.isDayjs(value)) return value
        if (value instanceof Date) return dayjs(value)

        const formats = ['YYYY-MM-DD HH:mm:ss', 'HH:mm:ss', 'hh:mm A', 'hh:mm a']
        for (const format of formats) {
          const parsed = dayjs(value, format, true)
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

      (Object.keys(defaultValues) as (keyof GasFormData)[]).forEach((key) => {
        if (key !== 'start_time' && key !== 'end_time') {
          const editValue = (editData as Record<string, unknown>)[key]
          setValue(key, (editValue ?? defaultValues[key]) as GasFormData[typeof key], { shouldValidate: true })
        }
      })

      setValue('start_time', parseTime(editData.start_time), { shouldValidate: true })
      setValue('end_time', parseTime(editData.end_time), { shouldValidate: true })

      if (editData.delivery_status) {
        setSelectedStatus(editData.delivery_status as DeliveryStatus)
        setValue('delivery_status', editData.delivery_status as DeliveryStatus, { shouldValidate: true })
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
    (event: React.SyntheticEvent | null, value: GasDrugRef | null) => {
      if (event?.type === 'change' && !value?.id) {
        setDrugNameTouched(true)
      }
      setTimeout(() => trigger('gas_name'), 100)
    },
    [trigger]
  )

  const onSubmit = useCallback(
    async (formData: GasFormData) => {
      const fmt = (v: string | Dayjs | Date | null | undefined) => (v ? dayjs(v).format('hh:mm A') : null)
      const payload: GasFormData = {
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
          <Box component='img' src='/icons/activity_icon.png' sx={{ width: '30px', height: '30px' }} alt={t('hospital_module.anaesthesia_icon')} />

          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {editData ? t('hospital_module.edit_gas') : t('hospital_module.add_gas')}
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
                  render={({ field, fieldState: { error } }: { field: ControllerRenderProps<GasFormData, 'gas_name'>; fieldState: { error?: FieldError } }) => (
                    <ControlledAutocomplete
                      {...field}
                      control={control}
                      name='gas_name'
                      errors={errors}
                      label={(t('hospital_module.enter_gas_name') as string)}
                      options={filteredGasOptions}
                      getOptionLabel={(option: unknown) => (option as MedicationDrugOption)?.name || ''}
                      isOptionEqualToValue={(option: unknown, value: unknown) => (option as MedicationDrugOption)?.id === (value as MedicationDrugOption)?.id}
                      renderOption={(props: HTMLAttributes<HTMLLIElement>, option: unknown) => {
                        const opt = option as MedicationDrugOption

                        return (
                          <Box component='li' {...props} key={opt.id}>
                            {opt.name}
                          </Box>
                        )
                      }}
                      loading={isLoadingDrugs}
                      autocompleteProps={{
                        onBlur: (event: React.FocusEvent) => {
                          handleDrugNameBlur()
                          field.onBlur()
                          void event
                        },
                        onChange: (event: React.SyntheticEvent, value: MedicationDrugOption | null, reason: AutocompleteChangeReason) => {
                          field.onChange(value)
                          if (reason === 'selectOption') {
                            setDrugNameTouched(false)
                          } else {
                            handleDrugNameChange(event, value)
                          }
                        },
                        onInputChange: (_: React.SyntheticEvent, value: string, reason: AutocompleteInputChangeReason) => {
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
                            onScroll: (event: React.UIEvent<HTMLUListElement>) => {
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
                        filterOptions: (options: MedicationDrugOption[], params: { inputValue: string }) => {
                          const filtered = options.filter((option: MedicationDrugOption) =>
                            (option.name || '').toLowerCase().includes(params.inputValue.toLowerCase())
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
                  label={(t('hospital_module.o2_flow_label') as string)}
                  name='o2_flow'
                  placeholder={(t('hospital_module.o2_flow_label') as string)}
                  fullWidth
                  type='number'
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label={(t('hospital_module.concentration_label') as string)}
                  name='concentration'
                  placeholder={(t('hospital_module.concentration_label') as string)}
                  fullWidth
                  type='number'
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTimePicker
                  control={control}
                  name={'start_time'}
                  label={(t('hospital_module.start_time', 'Start Time') as string)}
                  errors={errors}
                  format='hh:mm a'
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledAutocomplete
                  control={control}
                  name='delivery_route'
                  errors={errors}
                  label={(t('navigation.delivery_route') as string)}
                  options={deliveryRouteOptions}
                  getOptionLabel={(option: unknown) => String((option as DeliveryRoute)?.delivery ?? '')}
                  isOptionEqualToValue={(option: unknown, value: unknown) => (option as DeliveryRoute)?.id === (value as DeliveryRoute)?.id}
                  renderOption={(props: HTMLAttributes<HTMLLIElement>, option: unknown) => {
                    const opt = option as DeliveryRoute

                    return (
                      <Box component='li' {...props} key={opt.id}>
                        {opt.delivery}
                      </Box>
                    )
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mr: 2 }}>
                  {t('hospital_module.delivery_status_label')}{' '}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  {deliveryStatus.map((status: SelectOption<DeliveryStatus>, index: number) => (
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
                  label={(t('hospital_module.end_time', 'End Time') as string)}
                  errors={errors}
                  format='hh:mm a'
                />
              </Grid>
            </Grid>
          </Card>

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
                {t('cancel')}
              </LoadingButton>
              <LoadingButton
                variant='contained'
                type='submit'
                loading={submitLoader}
                sx={{ flex: 1, py: 4 }}
                disabled={!isValid || submitLoader}
              >
                {editData ? t('update') : t('add')}
              </LoadingButton>
            </Box>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddGasDrawer
