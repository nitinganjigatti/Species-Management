import React, { useEffect } from 'react'
import { Box, Button, Divider, Grid, Typography, useTheme } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'

// ** Custom Form Components
import Icon from 'src/@core/components/icon'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { SaveTemplateButton } from 'src/views/utility/render-snippets'
import RichTextEditor from 'src/components/RichTextEditor'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useRouter } from 'next/router'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

const transferHospitalSchema = yup.object({
  discharge_type: yup.string().oneOf(['TransferHospital']).required('Discharge type is required'),

  // transfer_hospital_id: yup
  //   .object({
  //     value: yup.string().required(),
  //     label: yup.string().required()
  //   })
  //   .required('Hospital is required'),
  transfer_hospital_id: yup.object().required('Hospital is required'),
  reason_for_transfer: yup.string().trim().required('Reason for transferring is required'),
  discharge_date: yup.date().nullable().required('Date of discharge is required'),

  // .min(new Date(), 'Discharge date cannot be in the past'),
  discharge_time: yup.date().nullable().required('Time of discharge is required'),

  // reason: yup.string().required('Transfer Hospital summary is required'),
  care_diet_instruction: yup.string().trim().required('Care Diet Instructions is required'),
  care_restriction: yup.string().trim().required('Care Restriction activities is required'),
  care_notes: yup.string().trim().required('Care notes is required'),
  attachments: yup.array().min(1, 'At least one attachment is required').required('Attachments are required')
})

const defaultValues = {
  discharge_type: 'TransferHospital',
  transfer_hospital_id: null,
  reason_for_transfer: '',
  discharge_date: null,
  discharge_time: null,
  reason: '',
  care_diet_instruction: '',
  care_restriction: '',
  care_notes: '',
  attachments: []
}

const TransferDischargeForm = props => {
  const {
    hospitalList,
    content,
    setContent,
    handleSubmitData,
    loading,
    medicationsData,
    prescriptionsColumns,
    medicationColumns,
    watchDischargeType,
    resetForm,
    submitLoader,
    handleHospitalSearch,
    fetchLoading,
    activeTemplate,
    setActiveTemplate,
    templates
  } = props

  const theme = useTheme()
  const router = useRouter()
  const { animal_id, id } = router.query

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(transferHospitalSchema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Handle form submission
  const onSubmit = async formData => {
    console.log('payload', formData)

    const payload = {
      hospital_case_id: id,
      animal_id: animal_id,
      discharge_type: watchDischargeType,
      transfer_hospital_id: formData.transfer_hospital_id.value,
      discharge_date: formData.discharge_date,
      discharge_time: formData.discharge_time,
      reason: formData.reason,
      reason_for_transfer: formData.reason_for_transfer,
      care_diet_instruction: formData.care_diet_instruction,
      care_restriction: formData.care_restriction,
      care_notes: formData.care_notes,
      attachments: formData.attachments || [],
      request_from: 'web'
    }

    try {
      await handleSubmitData(payload)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  // Reset form when resetForm prop changes
  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }
  }, [resetForm, reset])

  return (
    <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8, mb: 4 }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledAutocomplete
                control={control}
                name='transfer_hospital_id'
                errors={errors}
                label='Select Hospital'
                options={hospitalList}
                getOptionLabel={option => option?.label || ''}
                getOptionValue={option => option?.value || ''}
                isOptionEqualToValue={(option, value) => option?.value === value?.value}
                onInputChange={value => handleHospitalSearch(value)}
                onItemClear={() => handleHospitalSearch('')}
                loading={fetchLoading}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledDatePicker control={control} name={'discharge_date'} label='Date' errors={errors} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledTimePicker control={control} name={'discharge_time'} label='Time' errors={errors} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ControlledTextArea
                control={control}
                errors={errors}
                label='Reason for Transferring'
                name='reason_for_transfer'
                placeholder='Enter Reason'
                fullWidth
                rows={2}
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
            background: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
            borderRadius: 1,
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <StyledTypography>Enter summary</StyledTypography>
              {/* <RichTextEditor
                name={'reason'}
                value={content}
                onChange={setContent}
                placeholder='Write something amazing...'
              /> */}
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
            <SaveTemplateButton sx={{ pl: 1 }} />
          </Box>
          {/* Templates Section */}
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
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: {
                xs: 'flex-start',
                md: 'center'
              },
              flexDirection: {
                xs: 'column',
                sm: 'row'
              },
              justifyContent: {
                xs: 'flex-start',
                sm: 'space-between'
              },
              gap: {
                xs: 3,
                md: 0
              }
            }}
          >
            <Box>
              <StyledTypography fontSize='1.25rem'>Active Prescriptions - 2</StyledTypography>
              <StyledTypography fontSize='0.875rem'>
                You can stop the below prescriptions if its not needed after discharge
              </StyledTypography>
            </Box>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Button
                variant='outlined'
                sx={{
                  color: theme.palette.customColors.OnPrimaryContainer,
                  fontSize: '0.875rem',
                  py: 2,
                  border: `1px solid ${theme.palette.customColors.OnPrimaryContainer}`
                }}
              >
                Stop All
              </Button>
            </Box>
          </Box>
          {console.log('medicationsDatamedicationsData', medicationsData)}
          <CommonTable
            columns={prescriptionsColumns}
            loading={loading}
            indexedRows={medicationsData}
            rowHeight={64}
            total={medicationsData?.length || 0}
            externalTableStyle={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.customColors.neutral05,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant
              }
            }}
          />
        </Box>

        {/* Medications */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: {
                xs: 'flex-start',
                md: 'center'
              },
              flexDirection: {
                xs: 'column',
                sm: 'row'
              },
              justifyContent: {
                xs: 'flex-start',
                sm: 'space-between'
              },
              gap: {
                xs: 3,
                md: 0
              }
            }}
          >
            <StyledTypography fontSize='1.25rem'>Medications</StyledTypography>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Button variant='contained'>Add New Prescription</Button>
              {/* <Button variant='outlined' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                Continue Prescriptions
              </Button> */}
            </Box>
          </Box>
          <CommonTable
            columns={medicationColumns}
            loading={loading}
            indexedRows={medicationsData}
            rowHeight={64}
            total={medicationsData?.length || 0}
            externalTableStyle={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.customColors.neutral05,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant
              }
            }}
          />
        </Box>

        <Divider />

        {/* Care Instructions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <StyledTypography fontSize='1.25rem'>Care Instructions</StyledTypography>

          <ControlledTextField
            control={control}
            name={'care_diet_instruction'}
            errors={errors}
            placeholder={'Enter text'}
            label='Enter diet instructions'
          />
          <ControlledTextField
            control={control}
            name={'care_restriction'}
            errors={errors}
            placeholder={'Enter text'}
            label='Enter restriction activities with duration'
          />
          <ControlledTextField
            inputBackgroundColor={alpha(theme.palette.customColors.antzNotes, 0.6)}
            placeholder={'Enter text'}
            control={control}
            name={'care_notes'}
            errors={errors}
            label=' Additional notes'
          />
        </Box>

        <Divider />

        {/* Attachments */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StyledTypography>Attachments</StyledTypography>
          <ControlledMultiFileUpload name={'attachments'} control={control} errors={errors} label='Upload attachment' />
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

export default TransferDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
