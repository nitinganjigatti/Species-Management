'use client'

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import Utility from 'src/utility'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import RenderUtility from 'src/utility/render'

// Enable custom parse format plugin for dayjs
dayjs.extend(customParseFormat)

interface AdministerMedicineSidesheetProps {
  scheduleDosage?: any
  handleSidebarOpen?: boolean
  handleSidebarClose: () => void
  onSubmit: (data: any) => void
  submitLoader?: boolean
  batchList?: any[]
  batchLoading?: boolean
  handleBatchSearch?: (value: any) => void
  isControlledSubstance?: boolean
  selectedDate?: any
  medicalMasterData?: any
  mastersDataLoading?: boolean
}

interface FormValues {
  time: any
  quantity: any
  quantityUnit: string
  wastageQuantity: string
  wastageUnit: string
  notes: string
  batchNumber: any
  attachment: any
}

const AdministerMedicineSidesheet = ({
  scheduleDosage,
  handleSidebarOpen,
  handleSidebarClose,
  onSubmit,
  submitLoader,
  batchList = [],
  batchLoading,
  handleBatchSearch,
  isControlledSubstance = false,
  selectedDate,
  medicalMasterData,
  mastersDataLoading
}: AdministerMedicineSidesheetProps) => {
  const theme: any = useTheme()
  const { t } = useTranslation()

  const commonFieldStyles = {
    textAlign: 'left',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    }
  }

  // Yup validation schema
  const validationSchema = yup.object().shape(
    {
      time: yup.string().required('Time is required'),
      quantity: yup
        .number()
        .typeError('Quantity must be a number')
        .test(
          'quantity-format',
          'Quantity must have up to 8 digits and up to 4 decimal places',
          function (value) {
            if (value === undefined || value === null) return true
            const rawValue = String(this.originalValue ?? value).trim()
            return /^\d{1,8}(\.\d{1,4})?$/.test(rawValue)
          }
        )
        .moreThan(0, 'Quantity must be greater than 0')
        .required('Quantity is required'),
      quantityUnit: yup.string().required('Quantity unit is required'),

      wastageQuantity: yup
        .string()
        .test('is-valid-number', 'Wastage quantity must be a valid number', value => {
          if (!value) return true
          const num = parseFloat(value)

          return !isNaN(num) && num >= 0
        })
        .when('wastageUnit', {
          is: (wastageUnit: string) => wastageUnit && wastageUnit.length > 0,
          then: schema => schema.required('Wastage quantity is required when wastage unit is provided'),
          otherwise: schema => schema.notRequired()
        }),

      wastageUnit: yup.string().when('wastageQuantity', {
        is: (wastageQuantity: string) => wastageQuantity && wastageQuantity.length > 0,
        then: schema => schema.required('Wastage unit is required when wastage unit is provided'),
        otherwise: schema => schema.notRequired()
      }),
      notes: yup.string().max(10000, 'Notes cannot exceed 10000 characters'),
      batchNumber: yup
        .mixed()
        .nullable()
        .test('batch-validation', 'Batch number is required for controlled substances', function (value: any) {
          if (!isControlledSubstance) {
            return true
          }

          if (!value) {
            return false
          }

          return !!(value && value.batch_no && typeof value.batch_no === 'string')
        })
    },
    [
      ['wastageQuantity', 'wastageUnit']
    ]
  )

  const defaultValues: FormValues = {
    time: null,
    quantity: '',
    quantityUnit: '',
    wastageQuantity: '',
    wastageUnit: '',
    notes: '',
    batchNumber: null,
    attachment: null
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: defaultValues,
    resolver: yupResolver(validationSchema) as any,
    mode: 'onChange'
  })

  useEffect(() => {
    if (!handleSidebarOpen) {
      reset(defaultValues)
    }
  }, [handleSidebarOpen, reset])

  const convertTimeToMuiFormat = (timeString: string) => {
    if (!timeString) return null

    let formattedTime = timeString.trim()

    if (!/:\d{2}/.test(formattedTime)) {
      formattedTime = formattedTime.replace(/^(\d{1,2})\s*(AM|PM)$/i, '$1:00 $2')
    }

    const parsedTime = dayjs(formattedTime, 'hh:mm A')

    return parsedTime.isValid() ? parsedTime : null
  }

  const formatTimeTo12Hour = (timeString: string) => {
    if (!timeString) return ''

    try {
      const cleanedTime = timeString.trim().toUpperCase()
      const parts = cleanedTime.split(' ')

      if (parts.length < 2) return timeString

      let timePart = parts[0]
      const period = parts[1]

      let hours: string,
        minutes = '00'

      if (timePart.includes(':')) {
        ;[hours, minutes] = timePart.split(':')
      } else {
        hours = timePart
      }

      let hoursNum = parseInt(hours)

      const formattedHours = String(hoursNum).padStart(2, '0')

      return `${formattedHours}:${minutes} ${period}`
    } catch (error) {
      console.error('Error formatting time:', error)

      return timeString
    }
  }

  const slotStart = scheduleDosage?.scheduledTime ? convertTimeToMuiFormat(scheduleDosage.scheduledTime) : null
  const slotEnd = slotStart ? slotStart.add(59, 'minute') : null

  useEffect(() => {
    if (scheduleDosage && medicalMasterData) {
      let updatedQuantity: any = ''
      let updatedQuantityUnit = ''
      let updatedTime: any = null

      if (scheduleDosage?.scheduledTime) {
        updatedTime = convertTimeToMuiFormat(scheduleDosage.scheduledTime)
      }

      if (scheduleDosage?.dosage) {
        const firstSpaceIndex = scheduleDosage.dosage.indexOf(' ')
        let value, unitRaw

        if (firstSpaceIndex !== -1) {
          value = scheduleDosage.dosage.substring(0, firstSpaceIndex)
          unitRaw = scheduleDosage.dosage.substring(firstSpaceIndex + 1)
        } else {
          value = scheduleDosage.dosage
          unitRaw = ''
        }

        updatedQuantity = value

        const foundUnit = medicalMasterData?.prescriptionDosageMeasurementType?.find(
          (item: any) => item?.unit_name?.toLowerCase() === unitRaw.toLowerCase()
        )

        updatedQuantityUnit = foundUnit ? foundUnit.unit_name : ''
      }

      reset((prev: any) => ({
        ...prev,
        time: updatedTime,
        quantity: updatedQuantity,
        quantityUnit: updatedQuantityUnit
      }))
    }
  }, [scheduleDosage, medicalMasterData, reset])

  const handleClose = () => {
    reset(defaultValues)
    handleSidebarClose()
  }

  const handleFormSubmit = (data: FormValues) => {
    const formattedData = {
      ...data,
      time: data.time ? dayjs(data.time).format('hh:mm A') : ''
    }
    onSubmit(formattedData)
  }

  const handleSkip = () => {
    handleSidebarClose()
  }

  return (
    <Drawer
      anchor='right'
      open={handleSidebarOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '562px' },
          maxWidth: '100%',
          background: theme.palette.customColors.Background
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
                <Typography
                  sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('hospital_module.administer_medicine')}
                </Typography>
              </Box>
            </Box>
            <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary, p: 0 }}>
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
              {RenderUtility?.renderControlLabel(isControlledSubstance, 'CS')}

              {scheduleDosage?.data?.name}
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
                  {Utility?.formatDisplayDate(selectedDate)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {formatTimeTo12Hour(scheduleDosage?.scheduledTime)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 6 }}>
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
                  {scheduleDosage ? (
                    <>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <ControlledTimePicker
                          name={'time'}
                          control={control}
                          label={(t('hospital_module.select_time') as string)}
                          format='hh:mm A'
                          error={errors.time}
                          sx={commonFieldStyles}
                          required
                          minTime={slotStart}
                          maxTime={slotEnd}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <ControlledSelectWithTextField
                          {...({
                            textFieldName: 'quantity',
                            selectFieldName: 'quantityUnit',
                            control,
                            errors,
                            options: medicalMasterData?.prescriptionDosageMeasurementType,
                            label: t('quantity'),
                            placeholder: t('hospital_module.enter_quantity'),
                            type: 'number',
                            maxDecimals: 4,
                            getOptionLabel: (option: any) => option.label,
                            getOptionValue: (option: any) => option.value,
                            required: true,
                            selectWidth: { xs: 50, sm: 80 },
                            showEmptyMenuItem: { xs: false, md: true },
                            showEmptyMenuItemLabel: { xs: false, md: true },
                            loading: mastersDataLoading,
                            sx: commonFieldStyles
                          } as any)}
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <ControlledTimePicker
                          name={'time'}
                          control={control}
                          label={(t('hospital_module.select_time') as string)}
                          format='hh:mm A'
                          sx={{ backgroundColor: theme.palette.customColors.Surface }}
                          error={errors.time}
                          required
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <ControlledSelectWithTextField
                          {...({
                            textFieldName: 'quantity',
                            selectFieldName: 'quantityUnit',
                            control,
                            errors,
                            options: medicalMasterData?.prescriptionDosageMeasurementType,
                            label: t('quantity'),
                            placeholder: t('hospital_module.enter_quantity'),
                            type: 'number',
                            maxDecimals: 4,
                            getOptionLabel: (option: any) => option.label,
                            getOptionValue: (option: any) => option.value,
                            required: true,
                            selectWidth: 80,
                            loading: mastersDataLoading
                          } as any)}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid size={{ xs: 12 }}>
                    <Accordion
                      defaultExpanded={scheduleDosage === undefined || isControlledSubstance}
                      disableGutters
                      sx={{
                        border: 'none',
                        boxShadow: 'none'
                      }}
                    >
                      <AccordionSummary
                        expandIcon={scheduleDosage ? <ExpandMoreIcon /> : null}
                        aria-controls='panel1-content'
                        id='panel1-header'
                        sx={{
                          px: 0,
                          minHeight: 'auto',
                          pointerEvents: scheduleDosage ? 'auto' : 'none',
                          '& .MuiAccordionSummary-content': {
                            margin: '0.5rem 0'
                          },
                          '& .MuiAccordionSummary-content.Mui-expanded': {
                            margin: '0.5rem 0 1rem'
                          }
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          {t('hospital_module.add_wastage_if_any')}
                          <Typography
                            component='span'
                            sx={{
                              fontSize: '1rem',
                              color: theme.palette.customColors.neutralSecondary,
                              ml: 1
                            }}
                          >
                            ({t('optional')})
                          </Typography>
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0, py: 1 }}>
                        <Grid container spacing={4}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <ControlledTextField
                              name='wastageQuantity'
                              control={control}
                              errors={errors}
                              sx={commonFieldStyles}
                              label={(t('quantity') as string)}
                              placeholder={(t('hospital_module.enter_quantity') as string)}
                              type='number'
                            />
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }}>
                            <ControlledSelect
                              name='wastageUnit'
                              label={(t('type') as string)}
                              control={control}
                              sx={commonFieldStyles}
                              errors={errors}
                              options={medicalMasterData?.prescriptionDosageMeasurementType}
                              getOptionLabel={(option: any) => option.label}
                              getOptionValue={(option: any) => option.value}
                              loading={mastersDataLoading}
                            />
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 2 }}>
                              {t('notes')}
                            </Typography>
                            <ControlledTextArea
                              name='notes'
                              control={control}
                              errors={errors}
                              sx={commonFieldStyles}
                              placeholder={(t('hospital_module.enter_notes') as string)}
                              rows={3}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <ControlledAutocomplete
                              name='batchNumber'
                              control={control}
                              errors={errors}
                              sx={commonFieldStyles}
                              label={
                                isControlledSubstance
                                  ? t('hospital_module.enter_batch_number_required') || ""
                                  : t('hospital_module.enter_batch_number_optional') || ""
                              }
                              options={batchList}
                              getOptionLabel={(option: any) => {
                                if (typeof option === 'string') return option

                                return option?.batch_no || ''
                              }}
                              getOptionValue={(option: any) => {
                                if (typeof option === 'string') return option

                                return option?.batch_no || ''
                              }}
                              isOptionEqualToValue={(option: any, value: any) => {
                                if (!option || !value) return false
                                const optionVal = typeof option === 'string' ? option : option?.batch_no
                                const valueVal = typeof value === 'string' ? value : value?.batch_no

                                return optionVal === valueVal
                              }}
                              loading={batchLoading}
                              onInputChange={handleBatchSearch}
                              required={isControlledSubstance}
                              autocompleteProps={{
                                filterOptions: (x: any) => x,
                                noOptionsText: batchLoading ? t('loading') : t('hospital_module.type_to_search_batches')
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <ControlledMultiFileUpload
                              name='attachment'
                              control={control}
                              errors={errors}
                              sx={commonFieldStyles}
                              label={(t('hospital_module.batch_image') as string)}
                              maxFiles={1}
                              maxFileSize={5 * 1024 * 1024}
                              acceptedFileTypes='images'
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                </Grid>

                {/* Hidden submit button for form submission */}
                <button type='submit' style={{ display: 'none' }} />
              </form>
            </CardContent>
          </Card>
        </Box>

        {/* Footer */}
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
          {scheduleDosage ? (
            <LoadingButton
              variant='contained'
              type='submit'
              loading={submitLoader}
              onClick={handleSubmit(handleFormSubmit)}
              sx={{ flex: 1, py: 2 }}
            >
              {t('hospital_module.administer')}
            </LoadingButton>
          ) : (
            <>
              <LoadingButton
                variant='outlined'
                type='button'
                loading={submitLoader}
                sx={{ flex: 1, py: 2 }}
                onClick={handleSkip}
              >
                {t('hospital_module.skipped')}
              </LoadingButton>
              <LoadingButton
                variant='contained'
                type='submit'
                loading={submitLoader}
                onClick={handleSubmit(handleFormSubmit)}
                sx={{ flex: 1, py: 2 }}
              >
                {t('hospital_module.administer')}
              </LoadingButton>
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default AdministerMedicineSidesheet
