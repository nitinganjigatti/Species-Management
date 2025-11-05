import React, { useEffect } from 'react'
import { Box, Button, Divider, Grid, Typography, useTheme } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'

// ** Custom Form Components
import Icon from 'src/@core/components/icon'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import RichTextEditor from 'src/components/RichTextEditor'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { SaveTemplateButton } from 'src/views/utility/render-snippets'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { Controller } from 'react-hook-form' // If RichTextEditor needs it
import { useRouter } from 'next/router'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

const defaultValues = {
  discharge_type: 'TransferEnclosure',
  transferSite: '',
  transferSection: '',
  transferEnclosure: '',
  enclosure_id: '',
  returnToOriginal: false,
  discharge_date: null,
  discharge_time: null,
  reason: '',
  follow_up_required: false,
  follow_up_date: null,
  care_diet_instruction: '',
  care_restriction: '',
  care_notes: '',
  attachments: []
}

const transferEnclosureSchema = yup.object({
  discharge_type: yup.string().oneOf(['TransferEnclosure']).required('Discharge type is required'),

  transferSite: yup.string().required('Site is required'),
  transferSection: yup.string().required('Section is required'),
  transferEnclosure: yup.string().required('Enclosure is required'),
  returnToOriginal: yup.boolean().required('Return to original is required'),
  discharge_date: yup.date().nullable().required('Date of discharge is required'),
  discharge_time: yup.date().nullable().required('Time of discharge is required'),
  reason: yup.string().required('Discharge enclosure summary is required'),
  follow_up_required: yup.boolean().required('Follow up required is required'),
  follow_up_date: yup.date().nullable().required('Follow up date is required'),
  reason: yup.string().required('Transfer Hospital summary is required'),
  care_diet_instruction: yup.string().trim().required('Care Diet Instructions is required'),
  care_restriction: yup.string().trim().required('Care Restriction activities is required'),
  care_notes: yup.string().trim().required('Care notes is required'),
  attachments: yup.array().min(1, 'At least one attachment is required').required('Attachments are required')

  // follow_up_date: yup
  // .date()
  // .nullable()
  // .when('follow_up_required', {
  //   is: true,
  //   then: schema => schema
  //     .required('Follow up date is required')
  //     .min(new Date(), 'Follow up date must be in the future'),
  //   otherwise: schema => schema.nullable()
  // }),
})

const EnclosureDischargeForm = props => {
  const {
    templates,
    activeTemplate,
    setActiveTemplate,
    content,
    setContent,
    medicationsData,
    medicationColumns,
    loading,
    handleSubmitData,
    watchDischargeType,
    resetForm,
    submitLoader,
    fetchLoading
  } = props

  const theme = useTheme()
  const router = useRouter()
  const { animal_id, id } = router.query

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(transferEnclosureSchema),
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StyledTypography>Select location to transfer</StyledTypography>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledSelect
                control={control}
                name='transferSite'
                errors={errors}
                label='Site'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledSelect
                control={control}
                name='transferSection'
                errors={errors}
                label='Section'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledSelect
                control={control}
                name='transferEnclosure'
                errors={errors}
                label='Enclosure'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
          </Grid>

          <MUICheckbox
            name='returnToOriginal'
            control={control}
            label='Transfer back to animal’s original location'
            labelStyle={{
              fontSize: '1rem',
              fontWeight: '400',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
            <StyledTypography>Discharge Date & Time</StyledTypography>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledDatePicker control={control} name='discharge_date' label='Date' errors={errors} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTimePicker control={control} name='discharge_time' label='Time' errors={errors} />
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Summary & Templates */}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <StyledTypography>Enter summary</StyledTypography>
              <RichTextEditor
                name={'reason'}
                value={content}
                onChange={setContent}
                placeholder='Write something amazing...'
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
            {/* Template */}
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

        {/* Follow-up Section */}
        <Grid container alignItems='center' spacing={2} justifyContent='space-between'>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ControlledSwitch
              name='follow_up_required'
              label={<StyledTypography fontSize='1.25rem'>Is any follow up required?</StyledTypography>}
              labelPosition='start'
              control={control}
              errors={errors}
              size='large'
              gap={4}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Grid container spacing={2} alignItems='center'>
              <Grid size={{ xs: 'auto' }}>
                <StyledTypography fontWeight={400}>Enter follow up date</StyledTypography>
              </Grid>
              <Grid
                sx={{
                  flexGrow: {
                    xs: 1,
                    sm: 1
                  },
                  flexBasis: {
                    xs: 'auto',
                    sm: 0
                  }
                }}
              >
                <ControlledDatePicker control={control} name='follow_up_date' label='Date' errors={errors} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider />

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
              <Button variant='outlined' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                Continue Prescriptions
              </Button>
            </Box>
          </Box>
          <CommonTable
            columns={medicationColumns}
            loading={loading}
            indexedRows={medicationsData}
            rowHeight={64}
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
          <ControlledMultiFileUpload name='attachments' control={control} errors={errors} label='Upload attachment' />
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
        <LoadingButton variant='contained' sx={{ px: 12, py: 3 }} disabled={loading} loading={loading} type='submit'>
          Discharge Animal
        </LoadingButton>
      </Box>
    </form>
  )
}

export default EnclosureDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
