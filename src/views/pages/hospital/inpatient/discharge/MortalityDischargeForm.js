import React, { useEffect, useMemo } from 'react'
import { Box, Divider, Grid, Typography, useTheme } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'

// ** Custom Form Components
import Icon from 'src/@core/components/icon'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import { SaveTemplateButton } from 'src/views/utility/render-snippets'
import RichTextEditor from 'src/components/RichTextEditor'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useRouter } from 'next/router'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

//schema
const mortalitySchema = yup.object({
  discharge_type: yup.string().oneOf(['Mortality']).required('Discharge type is required'),
  date_of_death: yup
    .date()
    .nullable()
    .required('Date of death is required')
    .max(new Date(), 'Date of death cannot be in the future'),
  time_of_death: yup.date().nullable().required('Time of death is required'),

  // manner_of_death: yup.string().required('Cause of death is required'),
  // carcass_condition: yup.string().required('Carcass condition is required'),
  // carcass_disposition: yup.string().required('Carcass disposition is required'),
  // product: yup
  //       .object()
  //       .shape({
  //         label: yup.string().required('Product Name is required'),
  //         value: yup.string().required('Product Name is required'),
  //         stock_type: yup.string().nullable()
  //       })
  //       .required('Product Name is required'),
  manner_of_death: yup
    .object({
      value: yup.string().required(),
      label: yup.string().required()
    })
    .required('Cause of death is required'),
  carcass_condition: yup
    .object({
      value: yup.string().required(),
      label: yup.string().required()
    })
    .required('Carcass condition is required'),
  carcass_disposition: yup
    .object({
      value: yup.string().required(),
      label: yup.string().required()
    })
    .required('Carcass disposition is required'),

  // reason: yup.string().required('Mortality summary is required'),
  necropsy_requested: yup.boolean().required('Necropsy request status is required'),

  // necropsy_reason: yup
  //   .string()
  //   .nullable()
  //   .when('necropsy_requested', {
  //     is: false,
  //     then: schema => schema.required('Reason for not performing necropsy is required').trim(),
  //     otherwise: schema => schema.notRequired().nullable()
  //   }),
  necropsy_reason: yup
    .string()
    .nullable()
    .when('necropsy_requested', {
      is: false,
      then: schema => schema.required('Reason for not performing necropsy is required').trim(),
      otherwise: schema => schema.notRequired().nullable()
    }),
  priority: yup.string().when('necropsy_requested', {
    is: true,
    then: schema => schema.required('Priority is required'),
    otherwise: schema => schema.notRequired()
  }),
  attachments: yup.array().min(1, 'At least one attachment is required').required('Attachments are required')
})

const MortalityDischargeForm = props => {
  const {
    patientData,
    watchDischargeType,
    causeOfDeath,
    carcassCondition,
    fetchLoading,
    carcassDeposition,
    handleMannerSearch,
    handleConditionSearch,
    handleDispositionSearch,
    submitLoader,
    handleSubmitData,
    onDirtyChange,

    activeTemplate,
    setActiveTemplate,
    templates
  } = props

  const theme = useTheme()
  const router = useRouter()
  const { animal_id, id } = router.query

  const defaultValues = useMemo(
    () => ({
      discharge_type: 'Mortality',
      date_of_death: null,
      time_of_death: null,
      manner_of_death: null,
      carcass_condition: null,
      carcass_disposition: null,
      reason: '',
      necropsy_requested: false,
      priority: 'high',
      necropsy_reason: '',
      attachments: []
    }),
    []
  )

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    clearErrors,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues,
    resolver: yupResolver(mortalitySchema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Priority options for Necropsy selection
  const necropsyPriorityList = [
    {
      label: 'High',
      value: 'high',
      bg_color: theme.palette.customColors.ErrorContainer,
      text_color: theme.palette.customColors.Error
    },
    {
      label: 'Low',
      value: 'low',
      bg_color: alpha(theme.palette.customColors.SecondaryContainer, 0.4),
      text_color: theme.palette.customColors.addPrimary
    }
  ]

  const watchRequestNecropsy = watch('necropsy_requested')
  const selectedPriority = watch('priority')

  // Get the selected priority's color configuration
  const selectedPriorityOption = necropsyPriorityList.find(p => p.value === selectedPriority)
  const priorityBgColor = selectedPriorityOption?.bg_color || theme.palette.background.paper
  const priorityColor = selectedPriorityOption?.text_color || theme.palette.text.primary

  // Handle form submission
  const onSubmit = async formData => {
    console.log('formData', formData)

    const payload = {
      hospital_case_id: id,
      animal_id: animal_id,
      discharge_type: watchDischargeType,
      date_of_death: formData.date_of_death,
      time_of_death: formData.time_of_death,
      manner_of_death: formData.manner_of_death.value,
      reason_for_death: formData.manner_of_death.value,
      carcass_condition: formData.carcass_condition.value,
      carcass_disposition: formData.carcass_disposition.value,
      necropsy_requested: formData.necropsy_requested ? '1' : '0',
      priority: formData.necropsy_requested ? formData.priority : null,
      necropsy_reason: !formData.necropsy_requested ? formData.necropsy_reason : null,
      attachments: formData.attachments || [],
      reason: formData.reason

      // death_datetime: formatDateTime(formData.date_of_death, formData.time_of_death),
    }
    console.log('payload', payload)

    const success = await handleSubmitData(payload)
    if (success) {
      reset(defaultValues)
    }
  }

  // Report dirtiness to parent (for confirmation modal)
  useEffect(() => {
    onDirtyChange?.(isDirty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty])

  useEffect(() => {
    if (watchRequestNecropsy) {
      // When necropsy is requested, clear necropsy_reason
      setValue('necropsy_reason', '')
      clearErrors('necropsy_reason')
    } else {
      // When necropsy is not requested, clear priority error
      clearErrors('priority')
    }
  }, [watchRequestNecropsy, setValue, clearErrors])

  return (
    <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
          <StyledTypography>Mortality Details</StyledTypography>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledDatePicker control={control} name={'date_of_death'} label='Date of Death' errors={errors} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledTimePicker control={control} name={'time_of_death'} label='Time of Death' errors={errors} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledAutocomplete
                control={control}
                name={'manner_of_death'}
                errors={errors}
                label={'Cause of Death'}
                options={causeOfDeath}
                getOptionLabel={option => option?.label || ''}
                getOptionValue={option => option?.value || ''}
                onInputChange={(event, value) => handleMannerSearch(value)}
                isOptionEqualToValue={(option, value) => option?.value === value?.value}
                loading={fetchLoading}
                required
                showIcons={false}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledAutocomplete
                control={control}
                name={'carcass_condition'}
                errors={errors}
                label={'Carcass Condition'}
                options={carcassCondition}
                getOptionLabel={option => option?.label || ''}
                getOptionValue={option => option?.value || ''}
                onInputChange={(event, value) => handleConditionSearch(value)}
                isOptionEqualToValue={(option, value) => option?.value === value?.value}
                loading={fetchLoading}
                required
                showIcons={false}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledAutocomplete
                control={control}
                name={'carcass_disposition'}
                errors={errors}
                label={'Carcass Deposition'}
                options={carcassDeposition}
                getOptionLabel={option => option?.label || ''}
                getOptionValue={option => option?.value || ''}
                onInputChange={(event, value) => handleDispositionSearch(value)}
                isOptionEqualToValue={(option, value) => option?.value === value?.value}
                loading={fetchLoading}
                required
                showIcons={false}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Summary Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 5,
            backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
            borderRadius: 1
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <StyledTypography>Enter summary</StyledTypography>
              <Controller
                name='reason'
                control={control}
                render={({ field, fieldState }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder='Write something amazing...'
                    errors={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Box>
            <SaveTemplateButton sx={{ pl: 1 }} iconSize={24} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <StyledTypography fontWeight={400}>Select from templates</StyledTypography>
              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <StyledTypography fontWeight={600} color={theme.palette.primary.dark}>
                  See all
                </StyledTypography>
                <Icon icon='mingcute:right-fill' color={theme.palette.primary.dark} fontSize={24} />
              </Box>
            </Box>

            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                overflowX: 'auto',
                scrollbarColor: 'transparent transparent',
                paddingBottom: 0
              }}
            >
              <Box sx={{ display: 'inline-flex', gap: 3, pr: 1 }}>
                {templates?.map(template => (
                  <Box
                    key={template}
                    onClick={() => setActiveTemplate(template)}
                    sx={{
                      pb: 0,
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      px: 6,
                      py: 2,
                      borderRadius: '4px',
                      backgroundColor:
                        activeTemplate === template
                          ? theme.palette.secondary.dark
                          : theme.palette.customColors.mdAntzNeutral,
                      cursor: 'pointer'
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          activeTemplate === template
                            ? theme.palette.primary.contrastText
                            : theme.palette.customColors.neutralPrimary,
                        whiteSpace: 'nowrap',
                        fontWeight: activeTemplate === template ? 600 : 400
                      }}
                    >
                      {template}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
        <Divider />

        {/* Necropsy Section */}
        <Grid container spacing={4} alignItems='center'>
          <Grid
            size={{ xs: 12, sm: 6, md: 6 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              justifyContent: {
                xs: 'space-between',
                sm: 'flex-start'
              }
            }}
          >
            <StyledTypography fontSize={'1.25rem'}>Request Necropsy</StyledTypography>

            <ControlledSwitch
              name={'necropsy_requested'}
              label={watchRequestNecropsy ? 'Yes' : 'No'}
              control={control}
              errors={errors}
              gap={4}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            {watchRequestNecropsy ? (
              <ControlledSelect
                control={control}
                name={'priority'}
                errors={errors}
                label={'Select Priority'}
                fullWidth
                options={necropsyPriorityList}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                sx={{
                  backgroundColor: priorityBgColor,
                  color: priorityColor,
                  '& .MuiSelect-icon': {
                    color: priorityColor
                  }
                }}
              />
            ) : (
              <ControlledTextField
                control={control}
                errors={errors}
                label={'Enter reason why necropsy will not be performed'}
                name={'necropsy_reason'}
                placeholder={'Enter Reason'}
                fullWidth
              />
            )}
          </Grid>
        </Grid>

        <Divider />

        {/* Attachments */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StyledTypography>Attachments</StyledTypography>
          <ControlledMultiFileUpload
            name={'attachments'}
            control={control}
            errors={errors}
            label='Upload attachment'
            acceptedFileTypes={'images,pdf,document'}
          />
        </Box>
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: {
            xs: 0,
            lg: '270px'
          },
          right: 0,
          width: 'auto',
          backgroundColor: theme.palette.customColors.OnPrimary,
          p: 6,
          boxShadow: `0px -2px 8px ${theme.palette.customColors.shadowColor}`,
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1200
        }}
      >
        <LoadingButton variant='contained' type='submit' loading={submitLoader} sx={{ px: 12, py: 3 }}>
          Discharge Animal
        </LoadingButton>
      </Box>
    </form>
  )
}

export default MortalityDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
