import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Button, Divider, Grid, IconButton, Tooltip, Typography, useTheme, TextField, Avatar } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/router'

// ** Custom Form Components
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import RichTextEditor from 'src/components/RichTextEditor'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import SurgeryRecordTemplateList from 'src/views/pages/hospital/inpatient/SurgeryRecordTemplateList'
import Toaster from 'src/components/Toaster'

const transferEnclosureSchema = yup.object({
  discharge_type: yup.string().oneOf(['TransferEnclosure']).required('Discharge type is required'),

  discharge_date: yup.date().nullable().required('Date of discharge is required'),
  discharge_time: yup.date().nullable().required('Time of discharge is required'),
  follow_up_required: yup.boolean().required('Follow up required is required'),

  // summary as HTML string (not marked required in your original schema)
  reason: yup.string().nullable(),

  care_diet_instruction: yup.string().trim().required('Care Diet Instructions is required'),
  care_restriction: yup.string().trim().required('Care Restriction activities is required'),
  care_notes: yup.string().trim().required('Care notes is required'),
  attachments: yup.array().min(1, 'At least one attachment is required').required('Attachments are required'),
  follow_up_date: yup
    .date()
    .nullable()
    .when('follow_up_required', {
      is: true,
      then: schema =>
        schema
          .required('Follow up date required')
          .test('afterNow', 'Follow-up cannot be in past', v => !v || v >= new Date())
    })
})

/** Same inline Save-as-template UI as in AddSurgery */
const SaveTemplateInline = ({ onClose, onSave, loading = false }) => {
  const theme = useTheme()
  const [templateName, setTemplateName] = useState('')

  const handleSave = async () => {
    if (!templateName.trim() || loading) return

    const success = await onSave(templateName.trim())
    if (success) {
      setTemplateName('')
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'start', sm: 'center' },
        gap: '16px',
        flexDirection: { xs: 'column', sm: 'row' }
      }}
    >
      <TextField
        size='small'
        placeholder='Enter template name'
        value={templateName}
        onChange={e => setTemplateName(e.target.value)}
        sx={{
          maxWidth: '413px',
          minWidth: { xs: '100%', sm: '200px' },
          height: '48px',
          flex: 1,
          borderRadius: '4px',
          borderColor: theme.palette.customColors.OutlineVariant,
          backgroundColor: theme.palette.customColors.Surface,
          '& .MuiOutlinedInput-root': {
            height: '48px'
          }
        }}
      />
      <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={loading || !templateName.trim()}
          startIcon={
            <Avatar
              src='/icons/FloppyDisk.svg'
              variant='square'
              sx={{
                objectFit: 'contain',
                height: '24px',
                width: '24px',
                filter: 'brightness(0) invert(1)'
              }}
            />
          }
          sx={{
            height: '48px',
            width: '104px',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            borderRadius: '6px',
            textTransform: 'uppercase',
            fontWeight: 500,
            fontSize: 15,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.primary.light,
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          <Icon icon='mdi:close' fontSize={19} />
        </IconButton>
      </Box>
    </Box>
  )
}

const EnclosureDischargeForm = props => {
  const {
    patientData,
    watchDischargeType,
    submitLoader,
    handleSubmitData,

    medicationsColumns, // base columns from parent (with actions)
    medicationData,
    isTransferEnclosureMedicationLoading,
    clearData,
    onDirtyChange,

    templates = [],
    activeTemplate,
    setActiveTemplate
  } = props

  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const patientDetails = patientData?.animal_detail
  const { data, updateState } = useDynamicStateContext()

  const enclosureMedicines = data.enclosure_medicines || []

  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [openTemplateDrawer, setOpenTemplateDrawer] = useState(false)

  // Index medicines for table
  const indexedMedicines = useMemo(
    () =>
      enclosureMedicines.map((m, i) => ({
        ...m,
        sl_no: i + 1
      })),
    [enclosureMedicines]
  )

  const defaultValues = useMemo(
    () => ({
      discharge_type: 'TransferEnclosure',
      site_name: patientDetails?.site_name || '',
      section_name: patientDetails?.section_name || '',
      user_enclosure_name: patientDetails?.user_enclosure_name || '',
      discharge_date: null,
      discharge_time: null,
      reason: '',
      follow_up_required: false,
      follow_up_date: null,
      care_diet_instruction: '',
      care_restriction: '',
      care_notes: '',
      attachments: []
    }),
    [patientDetails]
  )

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues,
    resolver: yupResolver(transferEnclosureSchema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // REPORT dirty state to parent for confirmation dialog
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Delete medicine → update context + mark dirty
  const handleDeleteMedicine = useCallback(
    medId => {
      const updated = enclosureMedicines.filter(m => m.id !== medId)
      updateState('enclosure_medicines', updated)
      onDirtyChange?.(true)
    },
    [enclosureMedicines, updateState, onDirtyChange]
  )

  // Wrap medicationsColumns and inject working actions
  const medicationColumnsWithActions = useMemo(
    () =>
      (medicationsColumns || []).map(col =>
        col.field === 'actions'
          ? {
              ...col,
              renderCell: params => (
                <Tooltip title='Delete'>
                  <IconButton size='small' onClick={() => handleDeleteMedicine(params.row.id)}>
                    <Icon icon='mdi:close' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )
            }
          : col
      ),
    [medicationsColumns, handleDeleteMedicine]
  )

  /** Map templates into objects for drawer usage */
  const drawerTemplates = useMemo(
    () =>
      (templates || []).map((tpl, index) => ({
        id: String(index),
        title: typeof tpl === 'string' ? tpl : `Template ${index + 1}`,
        description: typeof tpl === 'string' ? tpl : ''
      })),
    [templates]
  )

  const applyTemplateHtml = useCallback(
    html => {
      const safeHtml = typeof html === 'string' ? html : ''
      setValue('reason', safeHtml, { shouldDirty: true, shouldValidate: true })
    },
    [setValue]
  )

  const handleTemplateChipClick = useCallback(
    tpl => {
      const html = typeof tpl === 'string' ? tpl : ''
      setActiveTemplate?.(tpl)
      applyTemplateHtml(html)
    },
    [applyTemplateHtml, setActiveTemplate]
  )

  const handleApplyTemplateFromDrawer = useCallback(
    template => {
      if (!template) return
      const html = template.description || ''
      setActiveTemplate?.(template.title || '')
      applyTemplateHtml(html)
    },
    [applyTemplateHtml, setActiveTemplate]
  )

  /** Save template handler – stub, same idea as TransferHospital */
  const handleSaveTemplate = useCallback(
    async templateName => {
      const trimmed = templateName?.trim()

      if (!trimmed) {
        Toaster({ type: 'error', message: 'Template name is required' })

        return false
      }

      const currentHtml = (control?._formValues?.reason || '').toString()

      if (!currentHtml) {
        Toaster({ type: 'error', message: 'Please write a summary before saving as template' })

        return false
      }

      Toaster({
        type: 'info',
        message: 'Template save API not wired yet. Please implement it as per your backend.'
      })

      return false
    },
    [control]
  )

  const handleSaveTemplateInline = useCallback(
    async templateName => {
      setIsSavingTemplate(true)
      try {
        const success = await handleSaveTemplate(templateName)
        if (success) {
          setShowSaveTemplate(false)
        }

        return success
      } finally {
        setIsSavingTemplate(false)
      }
    },
    [handleSaveTemplate]
  )

  // Handle form submission
  const onSubmit = async formData => {
    console.log('Enclosure discharge formData', formData)

    const payload = {
      discharge_type: watchDischargeType,

      hospital_case_id: id,
      animal_id: patientDetails.animal_id,
      enclosure_id: patientDetails?.user_enclosure_id,
      discharge_date: formData.discharge_date,
      discharge_time: formData.discharge_time,

      // summary HTML
      reason: formData.reason,

      care_diet_instruction: formData.care_diet_instruction,
      care_restriction: formData.care_restriction,
      care_notes: formData.care_notes,
      attachments: formData.attachments || [],

      // medicationData already indexed, but we send the raw payload you were using
      medications: JSON.stringify(medicationData),

      request_from: 'web'
    }
    console.log('payload', payload)

    const success = await handleSubmitData(payload)
    if (success) {
      reset(defaultValues)
      clearData()
    }
  }

  return (
    <>
      <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <MUICheckbox
              name='returnToOriginal'
              control={control}
              label='Transfer back to animal’s original location'
              labelStyle={{
                fontSize: '1rem',
                fontWeight: '400',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
              checked={true}
              disabled={true}
            />
            <StyledTypography>Select location to transfer</StyledTypography>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTextField
                  control={control}
                  name={'site_name'}
                  label='Site'
                  disabled={true}
                  errors={errors}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTextField
                  control={control}
                  name={'section_name'}
                  label='Section'
                  disabled={true}
                  errors={errors}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTextField
                  control={control}
                  name={'user_enclosure_name'}
                  label='Enclosure'
                  disabled={true}
                  errors={errors}
                />
              </Grid>
            </Grid>

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
                <Controller
                  name='reason'
                  control={control}
                  render={({ field, fieldState }) => (
                    <RichTextEditor
                      name={'reason'}
                      value={field.value || ''}
                      onChange={val => field.onChange(val?.html || '')}
                      placeholder='Write something amazing...'
                    />
                  )}
                />
              </Box>

              {showSaveTemplate ? (
                <SaveTemplateInline
                  onClose={() => setShowSaveTemplate(false)}
                  onSave={handleSaveTemplateInline}
                  loading={isSavingTemplate}
                />
              ) : (
                <Box
                  sx={{ display: 'flex', gap: '4px', alignItems: 'center', mb: '8px', cursor: 'pointer' }}
                  onClick={() => setShowSaveTemplate(true)}
                >
                  <Avatar
                    src='/icons/FloppyDisk.svg'
                    variant='square'
                    sx={{ objectFit: 'contain', height: '24px', width: '24px' }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.primary.dark
                    }}
                  >
                    Save as template
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Templates Section */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <StyledTypography fontWeight={400}>Select from templates</StyledTypography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1.5 }}
                  onClick={() => setOpenTemplateDrawer(true)}
                >
                  <StyledTypography fontWeight={600} color={theme.palette.primary.dark}>
                    See all
                  </StyledTypography>
                  <Icon icon='fa:angle-right' color={theme.palette.primary.dark} fontSize={24} />
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
                  {(templates || []).map(template => {
                    const label = typeof template === 'string' ? template : String(template || '')
                    if (!label) return null

                    return (
                      <Box
                        key={label}
                        onClick={() => handleTemplateChipClick(template)}
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
                          {label}
                        </Typography>
                      </Box>
                    )
                  })}
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
              <StyledTypography fontSize='1.25rem'>Medications - {indexedMedicines?.length}</StyledTypography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Button
                  onClick={() => {
                    router.push({
                      pathname: `/hospital/inpatient/${id}/schedule-prescription`,
                      query: {
                        animal_id: patientData?.animal_detail?.animal_id,
                        medical_record_id: patientData.medical_record_id,
                        discharge_tab: 'TransferEnclosure'
                      }
                    })
                  }}
                  variant='contained'
                >
                  Add New Prescription
                </Button>
              </Box>
            </Box>

            {indexedMedicines.length > 0 && (
              <CommonTable
                columns={medicationColumnsWithActions}
                loading={isTransferEnclosureMedicationLoading}
                indexedRows={indexedMedicines}
                rowHeight={64}
                total={indexedMedicines?.length || 0}
                externalTableStyle={{
                  '--unstable_DataGrid-headWeight': 600,
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: theme.palette.customColors.neutral05,
                    fontSize: '0.75rem',
                    color: theme.palette.customColors.OnSurfaceVariant
                  }
                }}
              />
            )}
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
          <LoadingButton
            variant='contained'
            sx={{ px: 12, py: 3 }}
            disabled={submitLoader}
            loading={submitLoader}
            type='submit'
          >
            Discharge Animal
          </LoadingButton>
        </Box>
      </form>

      {/* Template drawer similar to AddSurgery */}
      <SurgeryRecordTemplateList
        openSurgeryTemplateDrawer={openTemplateDrawer}
        setOpenSurgeryTemplateDrawer={setOpenTemplateDrawer}
        templates={drawerTemplates}
        loading={false}
        onApplyTemplate={handleApplyTemplateFromDrawer}
      />
    </>
  )
}

export default EnclosureDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
