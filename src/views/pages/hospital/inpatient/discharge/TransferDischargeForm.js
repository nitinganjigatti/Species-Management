import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Button, Divider, Grid, IconButton, Tooltip, Typography, useTheme, TextField, Avatar } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'

// ** Custom Form Components
import Icon from 'src/@core/components/icon'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import RichTextEditor from 'src/components/RichTextEditor'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import SurgeryRecordTemplateList from 'src/views/pages/hospital/inpatient/SurgeryRecordTemplateList'
import Toaster from 'src/components/Toaster'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/router'

/** ----------------- Helpers (same behaviour style as AddSurgery) ----------------- **/

// build a minimal rich text value from html string, compatible with our RichTextEditor
const buildRichTextValueFromHtml = html => {
  const safeHtml = typeof html === 'string' ? html : ''
  const finalHtml = safeHtml || '<p><br></p>'

  return {
    html: finalHtml,
    text: finalHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    delta: undefined,
    ops: undefined
  }
}

const transferHospitalSchema = yup.object({
  discharge_type: yup.string().oneOf(['TransferHospital']).required('Discharge type is required'),

  transfer_hospital_id: yup
    .object({
      value: yup.mixed().required(),
      label: yup.string().required()
    })
    .nullable()
    .required('Hospital is required'),

  reason_for_transfer: yup.string().trim().required('Reason for transferring is required'),
  discharge_date: yup.date().nullable().required('Date of discharge is required'),
  discharge_time: yup.date().nullable().required('Time of discharge is required'),

  // We'll store HTML string here
  reason: yup.string().required('Transfer Hospital summary is required'),

  care_diet_instruction: yup.string().trim().required('Care Diet Instructions is required'),
  care_restriction: yup.string().trim().required('Care Restriction activities is required'),
  care_notes: yup.string().trim().required('Care notes is required'),
  attachments: yup.array().min(1, 'At least one attachment is required').required('Attachments are required')
})

/** Inline "Save as template" UI (copied style from AddSurgery) */
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

const TransferDischargeForm = props => {
  const {
    patientData,
    watchDischargeType,
    isLoadingHospital,
    hospitalData,
    handleHospitalSearch,
    prescriptionsColumns,
    prescriptionData,
    isPrescriptionLoading,
    submitLoader,
    handleSubmitData,

    medicationsColumns, // base columns from parent (with actions field placeholder)
    isTransferHospitalMedicationLoading,
    clearData,
    onDirtyChange,

    // Template + rich text props from parent/hook
    templates = [],
    activeTemplate,
    setActiveTemplate

    // NOTE: content/setContent were in an earlier version; we no longer need them.
  } = props

  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const patientDetails = patientData?.animal_detail || {}

  const { data, updateState } = useDynamicStateContext()
  const transferMedicines = data.transfer_medicines || []

  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [openTemplateDrawer, setOpenTemplateDrawer] = useState(false)

  const indexedMedicines = useMemo(
    () =>
      transferMedicines.map((m, i) => ({
        ...m,
        sl_no: i + 1
      })),
    [transferMedicines]
  )

  const defaultValues = useMemo(
    () => ({
      discharge_type: 'TransferHospital',
      transfer_hospital_id: null,
      reason_for_transfer: '',
      discharge_date: null,
      discharge_time: null,
      reason: '', // summary stored as HTML string
      care_diet_instruction: '',
      care_restriction: '',
      care_notes: '',
      attachments: []
    }),
    []
  )

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues,
    resolver: yupResolver(transferHospitalSchema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // notify parent when form dirtiness changes (for tab switch confirmation)
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // Delete a medicine: update context state
  const handleDeleteMedicine = useCallback(
    medId => {
      const updated = transferMedicines.filter(m => m.id !== medId)
      updateState('transfer_medicines', updated)
    },
    [transferMedicines, updateState]
  )

  // Wrap medicationsColumns from parent and add working actions
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

  /** Map simple `templates` (string/HTML) to objects for the drawer */
  const drawerTemplates = useMemo(
    () =>
      (templates || []).map((tpl, index) => ({
        id: String(index),
        title: typeof tpl === 'string' ? tpl : `Template ${index + 1}`,
        description: typeof tpl === 'string' ? tpl : ''
      })),
    [templates]
  )

  /** Apply template (from chip or drawer) -> fill reason with template HTML */
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

  /** Save template handler – stub for now, you can wire your own API */
  const handleSaveTemplate = useCallback(
    async templateName => {
      const trimmed = templateName?.trim()

      if (!trimmed) {
        Toaster({ type: 'error', message: 'Template name is required' })

        return false
      }

      // Get current summary HTML
      const currentHtml = (control?._formValues?.reason || '').toString()

      if (!currentHtml) {
        Toaster({ type: 'error', message: 'Please write a summary before saving as template' })

        return false
      }

      // 👉 Stub: here you can call your own API similar to createSurgeryTemplate
      // For now, just show info + return false so UI stays open
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
    console.log('TransferHospital formData', formData)

    const payload = {
      hospital_case_id: id,
      animal_id: patientDetails.animal_id,
      discharge_type: watchDischargeType,
      transfer_hospital_id: formData.transfer_hospital_id.value,
      discharge_date: formData.discharge_date,
      discharge_time: formData.discharge_time,

      // reason stored as HTML string
      reason: formData.reason,

      reason_for_transfer: formData.reason_for_transfer,
      care_diet_instruction: formData.care_diet_instruction,
      care_restriction: formData.care_restriction,
      care_notes: formData.care_notes,
      attachments: formData.attachments,
      medications: JSON.stringify(transferMedicines),
      request_from: 'web'
    }

    const success = await handleSubmitData(payload)
    if (success) {
      reset(defaultValues)
      clearData() // clear medicines + reset storage after submit
    }
  }

  return (
    <>
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
                  options={hospitalData}
                  getOptionLabel={option => option?.label || ''}
                  getOptionValue={option => option?.value || ''}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  onInputChange={value => handleHospitalSearch(value)}
                  onItemClear={() => handleHospitalSearch('')}
                  loading={isLoadingHospital}
                  required
                  showIcons={false}
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

          {/* Summary Section (RichText + Template controls, AddSurgery-style) */}
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

                <Controller
                  name='reason'
                  control={control}
                  render={({ field, fieldState }) => (
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={val => field.onChange(val?.html || '')}
                      placeholder='Write something amazing...'
                      minHeight={200}
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

            {/* Templates Row */}
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

          {/* Prescription */}
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
                <StyledTypography fontSize='1.25rem'>
                  Active Prescriptions - {prescriptionData?.length}
                </StyledTypography>
                {prescriptionData?.length > 0 && (
                  <StyledTypography fontSize='0.875rem'>
                    You can stop the below prescriptions if its not needed after discharge
                  </StyledTypography>
                )}
              </Box>
            </Box>
            {prescriptionData?.length > 0 && (
              <CommonTable
                columns={prescriptionsColumns}
                loading={isPrescriptionLoading}
                indexedRows={prescriptionData || []}
                rowHeight={64}
                total={prescriptionData?.length || 0}
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
                  variant='contained'
                  onClick={() => {
                    router.push({
                      pathname: `/hospital/inpatient/${id}/schedule-prescription`,
                      query: {
                        animal_id: patientData?.animal_detail?.animal_id,
                        medical_record_id: patientData.medical_record_id,
                        discharge_tab: 'TransferHospital'
                      }
                    })
                  }}
                >
                  Add New Prescription
                </Button>
              </Box>
            </Box>
            {indexedMedicines?.length > 0 && (
              <CommonTable
                columns={medicationColumnsWithActions}
                loading={isTransferHospitalMedicationLoading}
                indexedRows={indexedMedicines || []}
                rowHeight={64}
                total={indexedMedicines?.length || 0}
                externalTableStyle={{
                  '& .MuiDataGrid-columnHeaders': {
                    '--unstable_DataGrid-headWeight': 600,
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
            <ControlledMultiFileUpload
              name={'attachments'}
              control={control}
              errors={errors}
              label='Upload attachment'
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
          <LoadingButton
            variant='contained'
            disabled={submitLoader}
            loading={submitLoader}
            sx={{ px: 12, py: 3 }}
            type='submit'
          >
            Discharge Animal
          </LoadingButton>
        </Box>
      </form>

      {/* Template Drawer (See all) */}
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

export default TransferDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
