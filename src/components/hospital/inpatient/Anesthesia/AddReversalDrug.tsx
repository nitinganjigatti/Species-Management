'use client'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Box, Card, Chip, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import { Theme } from '@mui/material/styles'
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
import { useTranslation } from 'react-i18next'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { TFunction } from 'i18next'
import { DeliveryRoute, MedicationDrugOption, UnitParams } from 'src/types/hospital/models'
import { ReversalDrugFormItem } from 'src/components/hospital/shared/AddAnesthesiaRecordPage'
dayjs.extend(customParseFormat)

const createSchema = (t: TFunction) => {
  return yup.object().shape({
    drug_name: yup
      .object()
      .nullable()
      .required(t('hospital_module.drug_is_required', 'Please select a drug from the list'))
      .test('is-valid-drug', t('hospital_module.please_select_valid_drug', 'Please select a valid drug from the list'), function (value: MedicationDrugOption | null | undefined) {
        if (!value) return false
        return Boolean(value.id && value.name)
      }),
    amount: yup
      .string()
      .trim()
      .required(t('hospital_module.amount_is_required', 'Amount is required'))
      .test('is-valid-amount', t('hospital_module.amount_must_be_greater_than_zero', 'Amount must be greater than 0'), (value: string | undefined) => {
        if (!value) return false
        const num = parseFloat(value)
        return !isNaN(num) && num > 0
      }),
    unit: yup.string().required(t('hospital_module.unit_is_required', 'Unit is required')),
    delivery_time: yup
      .date()
      .nullable()
      .required(t('hospital_module.delivery_time_is_required', 'Delivery Time is required'))
      .typeError(t('hospital_module.please_select_valid_delivery_time', 'Please select a valid delivery time')),
    delivery_route: yup.object().required(t('hospital_module.delivery_route_is_required', 'Delivery Route is required')).nullable(),
    max_effect_time: yup
      .date()
      .nullable()
      .required(t('hospital_module.max_effect_time_is_required', 'Max Effect Time is required'))
      .typeError(t('hospital_module.please_select_valid_max_effect_time', 'Please select a valid max effect time'))
      .test('is-after-delivery', t('hospital_module.max_effect_time_cannot_be_less_than_delivery_time', 'Max effect time cannot be less than delivery time'), function (value: Date | null | undefined) {
        const { delivery_time } = this.parent
        if (!delivery_time || !value) return true

        const delivery = dayjs(delivery_time)
        const maxEffect = dayjs(value)

        return maxEffect.isAfter(delivery) || maxEffect.isSame(delivery)
      }),
    delivery_status: yup.string().nullable()
  })
}

interface ReversalDrugFormData {
  drug_name: MedicationDrugOption | null
  amount: string
  unit: string
  delivery_route: DeliveryRoute | null
  delivery_time: Dayjs | Date | string | null
  delivery_status: string | null
  max_effect_time: Dayjs | Date | string | null
}

const defaultValues: ReversalDrugFormData = {
  drug_name: null,
  amount: '',
  unit: '',
  delivery_route: null,
  delivery_time: null,
  delivery_status: null,
  max_effect_time: null
}

interface AddReversalDrugProps {
  handleSidebarOpen: boolean
  handleSidebarClose: () => void
  handleSubmitData: (data: ReversalDrugFormData) => Promise<void> | void
  submitLoader?: boolean
  editData?: ReversalDrugFormItem | null
  drugOptions?: MedicationDrugOption[]
  existingMedications?: ReversalDrugFormItem[]
  unitList?: UnitParams[]
  deliveryRouteOptions?: DeliveryRoute[]
  onLoadMoreDrugs?: () => void
  hasMoreDrugs?: boolean
  isLoadingDrugs?: boolean
  onSearch?: (value: string) => void
}

function AddReversalDrug({
  handleSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  submitLoader,
  editData,
  drugOptions = [],
  existingMedications = [],
  unitList = [],
  deliveryRouteOptions = [],
  onLoadMoreDrugs,
  hasMoreDrugs = false,
  isLoadingDrugs = false,
  onSearch
}: AddReversalDrugProps) {
  const theme: Theme = useTheme()
  const { t } = useTranslation()

  const schema = createSchema(t)

  const deliveryStatus = [
    { label: t('hospital_module.complete', 'Complete'), value: 'Complete' },
    { label: t('hospital_module.partial', 'Partial'), value: 'Partial' },
    { label: t('hospital_module.none', 'None'), value: 'None' }
  ]
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [drugNameTouched, setDrugNameTouched] = useState<boolean>(false)

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid }
  } = useForm<ReversalDrugFormData>({
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

  const filteredDrugOptions = useMemo(() => {
    if (!Array.isArray(drugOptions) || !drugOptions.length) return []
    const existing = Array.isArray(existingMedications) ? existingMedications : []
    const excludedIds = new Set(
      existing
        .map((m: ReversalDrugFormItem) => m?.drug_name?.id ?? m?.drug_id ?? null)
        .filter(Boolean)
        .map((id) => String(id))
    )

    const editingId = editData?.drug_name?.id ?? editData?.drug_id ?? null
    const editingIdStr = editingId ? String(editingId) : null
    return drugOptions.filter((opt: MedicationDrugOption) => {
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
      const parseTime = (t: string | Dayjs | Date | null | undefined) => {
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

      Object.keys(defaultValues).forEach((key) => {
        const k = key as keyof ReversalDrugFormData
        if (k !== 'delivery_time' && k !== 'max_effect_time') {
          setValue(k, (editData as Record<string, unknown>)[k] as ReversalDrugFormData[typeof k] ?? defaultValues[k], { shouldValidate: true })
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
    setValue('delivery_status', selectedStatus, { shouldValidate: true })
  }, [selectedStatus, setValue])

  const handleDrugNameBlur = useCallback(() => {
    setDrugNameTouched(true)
    trigger('drug_name')
  }, [trigger])

  const handleDrugNameChange = useCallback(
    (event: React.SyntheticEvent | null, value: MedicationDrugOption | null) => {
      if (event?.type === 'change' && !value?.id) {
        setDrugNameTouched(true)
      }
      setTimeout(() => trigger('drug_name'), 100)
    },
    [trigger]
  )

  const onSubmit = useCallback(
    async (formData: ReversalDrugFormData) => {
      const fmt = (v: string | Dayjs | Date | null | undefined) => (v && dayjs(v).isValid() ? dayjs(v).format('hh:mm A') : null)

      const payload = {
        ...(editData && editData.id ? { id: editData.id } : {}),
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
          {/* <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Hospital Icon' /> */}
          <Box component = 'img' src = '/icons/activity_icon.png' sx = {{ width: '30px', height: '30px'}} alt = 'Hospital Icon'/>

          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {editData ? t('hospital_module.edit_reversal_drug') : t('hospital_module.add_reversal_drug')}
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
                      label={(t('hospital_module.enter_drug_name') as string)}
                      options={filteredDrugOptions}
                      getOptionLabel={(option: unknown) => (option as MedicationDrugOption)?.name || ''}
                      isOptionEqualToValue={(option: unknown, value: unknown) => (option as MedicationDrugOption)?.id === (value as MedicationDrugOption)?.id}
                      renderOption={(props: React.HTMLAttributes<HTMLLIElement>, option: unknown) => {
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
                        },
                        onChange: (event: React.SyntheticEvent, value: MedicationDrugOption | null, reason: string) => {
                          field.onChange(value)
                          if (reason === 'selectOption') {
                            setDrugNameTouched(false)
                          } else {
                            handleDrugNameChange(event, value)
                          }
                        },
                        onInputChange: (_: React.SyntheticEvent, value: string, reason: string) => {
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
                            onScroll: (event: React.UIEvent<HTMLElement>) => {
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
                  label={(t('hospital_module.enter_amount') as string)}
                  name='amount'
                  placeholder={(t('hospital_module.enter_amount') as string)}
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
                  label={(t('hospital_module.unit', 'Unit') as string)}
                  options={unitList as unknown as { value: string | number; label: string }[]}
                  getOptionLabel={(option: UnitParams) => option.uom_abbr}
                  getOptionValue={(option: UnitParams) => option.id}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledTimePicker
                  control={control}
                  name={'delivery_time'}
                  label={(t('hospital_module.delivery_time', 'Delivery Time') as string)}
                  {...({ format: 'hh:mm a' } as any)}
                  errors={errors}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <ControlledAutocomplete
                  control={control}
                  name='delivery_route'
                  errors={errors}
                  label={(t('navigation.delivery_route') as string)}
                  options={deliveryRouteOptions}
                  getOptionLabel={(option: unknown) => (option as DeliveryRoute)?.delivery?.toString() || ''}
                  isOptionEqualToValue={(option: unknown, value: unknown) => (option as DeliveryRoute)?.id === (value as DeliveryRoute)?.id}
                  renderOption={(props: React.HTMLAttributes<HTMLLIElement>, option: unknown) => {
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
                  {deliveryStatus.map((status: { label: string; value: string }, index: number) => (
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
                  label={(t('hospital_module.max_effect_time') as string)}
                  {...({ format: 'hh:mm a' } as any)}
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
                onClick={handleClose}
              >
                {t('cancel')}
              </LoadingButton>
              <LoadingButton
                variant='contained'
                type='submit'
                loading={submitLoader}
                sx={{ flex: 1, py: 4 }}
                disabled={!isValid || submitLoader || !selectedStatus}
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

export default AddReversalDrug
