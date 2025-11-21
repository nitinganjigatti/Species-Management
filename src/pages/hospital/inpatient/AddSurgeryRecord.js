import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

import { Breadcrumbs, Typography, Card, Box, Avatar, TextField, Button, IconButton, Grid } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Icon } from '@iconify/react'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'

import AddAnaesthesiaRecordDrawer from 'src/components/hospital/inpatient/AddAnaesthesiaRecord'
import SurgeryRecordTemplateList from 'src/views/pages/hospital/inpatient/SurgeryRecordTemplateList'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import Toaster from 'src/components/Toaster'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import RichTextEditor from 'src/components/RichTextEditor'

import {
  addSurgeryRecord,
  getSurgeryMaster,
  getSurgeryTemplates,
  createSurgeryTemplate
} from 'src/lib/api/hospital/surgeryMaster'

const createEmptyRichTextValue = () => {
  const delta = { ops: [{ insert: '\n' }] }

  return {
    delta,
    html: '<p><br></p>',
    text: '',
    ops: delta.ops
  }
}

const DEFAULT_HOSPITAL_ID = '68'
const TEMPLATE_LIST_LIMIT = 20

const getSafeString = value => {
  if (value === undefined || value === null) return ''

  return String(value)
}

const getRichTextHtml = note => {
  if (!note) return ''
  if (typeof note === 'string') return note
  if (note?.html) return note.html
  if (note?.text) return note.text
  if (note?.delta?.ops) {
    try {
      const text = note.delta.ops
        .map(op => (typeof op.insert === 'string' ? op.insert : ''))
        .join('')
        .trim()

      return text
    } catch {
      return ''
    }
  }

  return ''
}

const stripHtmlTags = input => {
  if (!input) return ''

  return String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const buildRichTextValueFromHtml = html => {
  const safeHtml = typeof html === 'string' ? html : ''
  const finalHtml = safeHtml || '<p><br></p>'

  return {
    html: finalHtml,
    text: stripHtmlTags(finalHtml),
    delta: undefined,
    ops: undefined
  }
}

const mapSurgeryToOption = surgery => {
  if (!surgery || typeof surgery !== 'object') return null

  const id = surgery?.id ?? surgery?.surgery_id ?? surgery?.value
  const name = surgery?.surgery_name ?? surgery?.label
  const status = surgery?.status ?? surgery?.surgery_status

  if (status && String(status).toLowerCase() !== 'active') return null
  if (id === undefined || id === null || name === undefined || name === null) return null

  return {
    ...surgery,
    value: String(id),
    label: String(name).trim()
  }
}

const mapTemplateRecord = record => {
  if (!record || typeof record !== 'object') return null

  const id = record?.id ?? record?.template_id ?? record?.hospital_template_id ?? record?.value
  const name = record?.template_name ?? record?.name ?? record?.title

  if (!id || !name) return null

  return {
    id: String(id),
    title: String(name).trim(),
    description: record?.description ?? '',
    type: record?.type ?? 'Surgery',
    category: record?.category ?? record?.type ?? 'Surgery',
    raw: record
  }
}

// Save Template UI Component
const SaveTemplateUI = ({ onClose, onSave, loading = false }) => {
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
            height: '48px',
            '& fieldset': {}
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

const SurgeryRecordForm = ({
  control,
  errors,
  templates,
  activeTemplate,
  setOpenSurgeryTemplateDrawer,
  setOpenAddAnaesthesiaDrawer,
  richNote,
  onRichNoteChange = () => {},
  isSubmitting = false,
  procedureOptions = [],
  procedureLoading = false,
  onProcedureInputChange = () => {},
  onProcedureClear = () => {},
  procedureGetOptionLabel = option => option?.label || '',
  procedureIsOptionEqualToValue = (option, value) => option?.value === value?.value,
  onSaveTemplate = async () => false,
  isSavingTemplate = false,
  clearFieldErrors,
  onTemplateSelect = () => {}
}) => {
  const theme = useTheme()
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

  const handleSaveTemplate = async templateName => {
    const success = await onSaveTemplate(templateName)

    if (success) {
      setShowSaveTemplate(false)
    }
  }

  return (
    <>
      <Grid container spacing={'24px'}>
        <Grid item size={{ xs: 12 }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Date and time of surgery
            <Typography sx={{ color: theme.palette.customColors.Error }} variant='span'>
              *
            </Typography>
          </Typography>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <ControlledDatePicker
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
                height: '56px'
              }
            }}
            name={'date'}
            label='Date'
            control={control}
            renderInput={params => (
              <ControlledTextField {...params} fullWidth error={!!errors.date} helperText={errors.date?.message} />
            )}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <ControlledTimePicker
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
                height: '56px'
              }
            }}
            label='Start Time'
            name={'startTime'}
            control={control}
            renderInput={params => (
              <ControlledTextField
                {...params}
                fullWidth
                error={!!errors.startTime}
                helperText={errors.startTime?.message}
              />
            )}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <ControlledTimePicker
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
                height: '56px'
              }
            }}
            name={'endTime'}
            control={control}
            label='End Time'
            renderInput={params => (
              <ControlledTextField
                {...params}
                fullWidth
                error={!!errors.endTime}
                helperText={errors.endTime?.message}
              />
            )}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <ControlledTextField
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
                height: '56px'
              }
            }}
            name={'duration'}
            label='Surgery Duration'
            control={control}
            errors={errors}
            onChangeOverride={() => clearFieldErrors?.('duration')}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Surgery details
          <Typography sx={{ color: theme.palette.customColors.Error }} variant='span'>
            *
          </Typography>
        </Typography>
        <Grid container spacing={'24px'}>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <ControlledAutocomplete
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  height: '56px'
                }
              }}
              control={control}
              errors={errors}
              name={'procedure'}
              label='Name of Surgeon'
              options={procedureOptions}
              loading={procedureLoading}
              onInputChange={onProcedureInputChange}
              onItemClear={onProcedureClear}
              getOptionLabel={procedureGetOptionLabel}
              isOptionEqualToValue={procedureIsOptionEqualToValue}
              onChangeOverride={() => clearFieldErrors?.('procedure')}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <ControlledAutocomplete
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  height: '56px'
                }
              }}
              control={control}
              errors={errors}
              name={'procedure'}
              label='Name of Procedure'
              options={procedureOptions}
              loading={procedureLoading}
              onInputChange={onProcedureInputChange}
              onItemClear={onProcedureClear}
              getOptionLabel={procedureGetOptionLabel}
              isOptionEqualToValue={procedureIsOptionEqualToValue}
              onChangeOverride={() => clearFieldErrors?.('procedure')}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <ControlledTextField
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  height: '56px'
                }
              }}
              name={'typeOfSurgery'}
              label='Type of Surgery'
              control={control}
              errors={errors}
              borderRadius='4px'
              onChangeOverride={() => clearFieldErrors?.('typeOfSurgery')}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <ControlledTextField
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  height: '56px'
                }
              }}
              name={'surgicalApproach'}
              label='Surgical Approach'
              control={control}
              errors={errors}
              borderRadius='4px'
              onChangeOverride={() => clearFieldErrors?.('surgicalApproach')}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            backgroundColor: '#E8F4F266',
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '16px',
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Enter surgery notes
            </Typography>

            {/* <ControlledTextArea placeholder={'Enter text'} control={control} name={'notes'} rows={3} errors={errors} /> */}

            <RichTextEditor value={richNote} onChange={onRichNoteChange} placeholder='Enter text...' />
          </Box>

          {showSaveTemplate ? (
            <SaveTemplateUI
              onClose={() => setShowSaveTemplate(false)}
              onSave={handleSaveTemplate}
              loading={isSavingTemplate}
            />
          ) : (
            <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center', mb: '8px', cursor: 'pointer' }}>
              <Avatar
                src='/icons/FloppyDisk.svg'
                variant='square'
                sx={{ objectFit: 'contain', height: '24px', width: '24px' }}
              />
              <Typography
                onClick={() => setShowSaveTemplate(true)}
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '16px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Select from templates
              </Typography>
              <Box
                onClick={() => setOpenSurgeryTemplateDrawer(true)}
                sx={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
              >
                <Typography sx={{ color: theme.palette.primary.dark }}>See all</Typography>
                <Icon icon='fa:angle-right' color={theme.palette.primary.dark} fontSize={24} />
              </Box>
            </Box>
            {/* LEFT: takes remaining space + horizontal scroll */}
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                overflowX: 'auto',
                scrollbarColor: 'transparent transparent'
              }}
            >
              <Box sx={{ display: 'inline-flex', gap: '10px', pr: 1 }}>
                {templates.map(template => {
                  const templateLabel = typeof template === 'string' ? template : String(template || '')
                  if (!templateLabel) {
                    return null
                  }
                  return (
                    <Box
                      key={templateLabel}
                      onClick={() => onTemplateSelect(templateLabel)}
                      sx={{
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: '8px 24px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor:
                          activeTemplate === templateLabel
                            ? theme.palette.secondary.dark
                            : theme.palette.customColors.mdAntzNeutral,
                        cursor: 'pointer'
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            activeTemplate === templateLabel
                              ? theme.palette.primary.contrastText
                              : theme.palette.customColors.neutralPrimary,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {templateLabel}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>
        </Box>

        <ControlledTextField
          name={'complication'}
          control={control}
          errors={errors}
          label={'Complication *'}
          borderRadius='4px'
          onChangeOverride={() => clearFieldErrors?.('complication')}
        />

        {/* <Card sx={{ borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Anaesthesia details
        </Typography>
        <Box
          onClick={() => setOpenAddAnaesthesiaDrawer(true)}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            height: '54px',
            paddingTop: '17px',
            paddingBottom: '18px',
            paddingLeft: '4px',
            borderRadius: '4px',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '4px',
              background: `
               linear-gradient(90deg, ${theme.palette.customColors.Outline} 0px 5px, transparent 5px 13px) 0 0 / 13px 1px,
               linear-gradient(180deg, ${theme.palette.customColors.Outline} 0px 5px, transparent 5px 13px) calc(100% - 1px) 0 / 1px 13px,
               linear-gradient(270deg, ${theme.palette.customColors.Outline} 0px 5px, transparent 5px 13px) 0 calc(100% - 1px) / 13px 1px,
               linear-gradient(0deg, ${theme.palette.customColors.Outline} 0px 5px, transparent 5px 13px) 0 0 / 1px 13px
             `,
              backgroundRepeat: 'repeat-x, repeat-y, repeat-x, repeat-y',
              pointerEvents: 'none'
            }
          }}
        >
          <Icon icon='mdi:plus' color={theme.palette.customColors.OnSurfaceVariant} fontSize={24} />
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Add anaesthesia record{' '}
          </Typography>
        </Box>
      </Card> */}

        <Card sx={{ borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Care Instructions
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '16px',
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Enter diet instructions
            </Typography>
            <ControlledTextField
              control={control}
              name={'dietInstructions'}
              errors={errors}
              borderRadius='4px'
              placeholder={'Enter text'}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '16px',
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Enter restriction activities with duration
            </Typography>
            <ControlledTextField
              control={control}
              name={'restrictions'}
              errors={errors}
              borderRadius='4px'
              placeholder={'Enter text'}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '16px',
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Additional notes
            </Typography>
            <ControlledTextField
              sx={{ borderRadius: '4px', backgroundColor: '#FCF4AE99' }}
              placeholder={'Enter text'}
              control={control}
              name={'additionalNotes'}
              errors={errors}
              borderRadius='4px'
            />
          </Box>
        </Card>

        <Card
          sx={{
            borderRadius: '8px',
            padding: '24px',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Attachments
          </Typography>

          <ControlledMultiFileUpload
            name='attachments'
            control={control}
            label='Upload files'
            acceptedFileTypes='images,pdf,csv,audio,videos'
          />
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type='submit' variant='contained' disabled={isSubmitting} sx={{ minWidth: 160 }}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
          <Button type='submit' variant='contained' disabled={isSubmitting} sx={{ minWidth: 160 }}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </Box>
      </Box>
    </>
  )
}

const extractSurgeryTemplates = response => {
  const candidates = [response, response?.data, response?.data?.data, response?.data?.templates, response?.templates]

  let records = []
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      records = candidate
      break
    }
  }

  const unique = new Map()

  records.forEach(item => {
    const mapped = mapTemplateRecord(item)

    if (mapped && !unique.has(mapped.id)) {
      unique.set(mapped.id, mapped)
    }
  })

  return Array.from(unique.values())
}

const getSurgeryIdentifier = value => {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return value

  return value?.value ?? value?.id ?? value?.surgery_id ?? value?.surgeryId ?? ''
}

const formatDateValue = value => (value ? dayjs(value).format('YYYY-MM-DD') : '')

const formatTimeValue = value => (value ? dayjs(value).format('HH:mm:ss') : '')

const resolveHospitalCaseId = query => {
  const possibleKeys = ['hospital_case_id', 'hospitalCaseId', 'case_id', 'caseId', 'hospitalCaseID', 'id']

  for (const key of possibleKeys) {
    if (query?.[key] !== undefined) {
      const value = query[key]

      return Array.isArray(value) ? value[0] : value
    }
  }

  return undefined
}

// ✅ Validation schema
const schema = yup.object().shape({
  date: yup.date().required('Date is required'),
  startTime: yup.date().required('Start time is required'),
  endTime: yup.date().required('End time is required'),
  procedure: yup
    .mixed()
    .nullable()
    .test('procedure-required', 'Procedure is required', value => Boolean(value)),
  typeOfSurgery: yup.string().required('Type of surgery is required'),
  surgicalApproach: yup.string().required('Surgical approach is required'),
  duration: yup.string().trim().required('Duration is required'),
  complication: yup.string().required('Complication is required')
})

const AddSurgeryRecord = () => {
  const router = useRouter()
  const theme = useTheme()

  const data = {
    animal: {
      common_name: 'Leopard',
      scientific_name: 'Panthera pardus',
      age: '2y 5m',
      sex: 'Male',
      image_url: 'path/to/leopard_image.jpg'
    },
    additional_info: {
      AID: '123456',
      'Admitted Days': '6 Days',
      Location: 'Cage 1, Patient Wing 2',
      'Consulting Veterinarian': 'Dr. Nitin A Ganjigatti'
    }
  }

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      date: null,
      startTime: null,
      endTime: null,
      procedure: null,
      typeOfSurgery: '',
      surgicalApproach: '',
      duration: '',
      notes: '',
      complication: 'None',
      dietInstructions: '',
      restrictions: '',
      additionalNotes: '',
      attachments: []
    }
  })

  const [activeTemplate, setActiveTemplate] = useState('')
  const [openAddAnaesthesiaDrawer, setOpenAddAnaesthesiaDrawer] = useState(false)
  const [openSurgeryTemplateDrawer, setOpenSurgeryTemplateDrawer] = useState(false)
  const [richNote, setRichNote] = useState(() => createEmptyRichTextValue())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('')

  const {
    data: surgeryTemplatesResponse,
    isFetching: isTemplatesLoading,
    refetch: refetchSurgeryTemplates
  } = useQuery({
    queryKey: ['hospital-surgery-templates', DEFAULT_HOSPITAL_ID],
    queryFn: () =>
      getSurgeryTemplates({
        page_no: 1,
        hospital_id: DEFAULT_HOSPITAL_ID,
        limit: TEMPLATE_LIST_LIMIT,
        type: 'surgery'
      }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    retry: false,
    onError: error => {
      console.error('Failed to fetch surgery templates:', error)
      Toaster({ type: 'error', message: error?.message || 'Failed to load surgery templates' })
    }
  })

  const { data: surgeryMasterResponse, isFetching: isProceduresLoading } = useQuery({
    queryKey: ['hospital-surgeries', procedureSearchTerm],
    queryFn: () => {
      const params = {
        page_no: 1,
        limit: 20
      }

      const trimmed = procedureSearchTerm.trim()
      if (trimmed) {
        params.q = trimmed
      }

      return getSurgeryMaster({ params })
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    retry: false,
    onError: error => {
      console.error('Failed to fetch surgeries:', error)
      Toaster({ type: 'error', message: error?.message || 'Failed to load surgery list' })
    }
  })

  const procedureOptions = useMemo(() => {
    const rawSurgeries =
      (Array.isArray(surgeryMasterResponse?.surgeries) && surgeryMasterResponse.surgeries) ||
      (Array.isArray(surgeryMasterResponse?.data?.surgeries) && surgeryMasterResponse.data.surgeries) ||
      []
    const surgeries = Array.isArray(rawSurgeries) ? rawSurgeries : []
    const unique = new Map()

    surgeries.forEach(item => {
      const option = mapSurgeryToOption(item)

      if (option && !unique.has(option.value)) {
        unique.set(option.value, option)
      }
    })

    return Array.from(unique.values())
  }, [surgeryMasterResponse])

  const surgeryTemplates = useMemo(() => extractSurgeryTemplates(surgeryTemplatesResponse), [surgeryTemplatesResponse])

  const templateNames = useMemo(() => surgeryTemplates.map(template => template.title), [surgeryTemplates])

  const templateNamesKey = useMemo(() => templateNames.join('|'), [templateNames])

  useEffect(() => {
    if (!activeTemplate) return

    if (!templateNames.includes(activeTemplate)) {
      setActiveTemplate('')
    }
  }, [activeTemplate, templateNames, templateNamesKey])

  const applyTemplateToRichNote = useCallback(
    template => {
      if (!template) return

      const safeTitle = template?.title ? String(template.title) : ''
      const html = typeof template?.description === 'string' ? template.description : ''
      const richValue = buildRichTextValueFromHtml(html)

      setActiveTemplate(safeTitle)
      setRichNote(prev => {
        if (prev?.html === richValue.html) {
          return prev
        }

        return richValue
      })
    },
    [setRichNote, setActiveTemplate]
  )

  const handleTemplateSelect = useCallback(
    templateName => {
      const safeName = templateName ? String(templateName) : ''

      if (!safeName) {
        setActiveTemplate('')

        return
      }

      const matchedTemplate = surgeryTemplates.find(template => template.title === safeName)

      if (matchedTemplate) {
        applyTemplateToRichNote(matchedTemplate)
      } else {
        setActiveTemplate(safeName)
      }
    },
    [surgeryTemplates, applyTemplateToRichNote, setActiveTemplate]
  )

  const handleProcedureInputChange = useCallback(value => {
    if (typeof value === 'string') {
      setProcedureSearchTerm(value)
    } else {
      setProcedureSearchTerm('')
    }
  }, [])

  const handleProcedureClear = useCallback(() => {
    setProcedureSearchTerm('')
  }, [])

  const procedureGetOptionLabel = useCallback(option => option?.label || '', [])

  const procedureIsOptionEqualToValue = useCallback((option, selected) => {
    if (!option || !selected) return false

    const optionId = getSurgeryIdentifier(option)
    const selectedId = getSurgeryIdentifier(selected)

    if (optionId !== '' && selectedId !== '') {
      return String(optionId) === String(selectedId)
    }

    return option?.label === selected?.label
  }, [])

  const handleSaveTemplate = useCallback(
    async templateName => {
      const trimmedName = templateName?.trim()

      if (!trimmedName) {
        Toaster({ type: 'error', message: 'Template name is required' })

        return false
      }

      const payload = new FormData()
      payload.append('template_name', trimmedName)
      payload.append('type', 'surgery')
      payload.append('hospital_id', DEFAULT_HOSPITAL_ID)
      payload.append('description', getSafeString(getRichTextHtml(richNote)))

      setIsSavingTemplate(true)

      try {
        const response = await createSurgeryTemplate(payload)

        if (response?.success) {
          Toaster({ type: 'success', message: response?.message || 'Template saved successfully' })
          setActiveTemplate(trimmedName)

          const refetchResult = await refetchSurgeryTemplates()
          const refreshedTemplates = extractSurgeryTemplates(refetchResult?.data)
          const newTemplate = refreshedTemplates.find(template => template.title === trimmedName)

          if (newTemplate) {
            applyTemplateToRichNote(newTemplate)
          }

          return true
        }

        Toaster({ type: 'error', message: response?.message || 'Failed to save template' })

        return false
      } catch (error) {
        console.error('Create surgery template error:', error)
        const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred'
        Toaster({ type: 'error', message })

        return false
      } finally {
        setIsSavingTemplate(false)
      }
    },
    [richNote, refetchSurgeryTemplates, applyTemplateToRichNote]
  )

  const onSubmit = async formValues => {
    const hospitalCaseId = resolveHospitalCaseId(router.query)

    if (!hospitalCaseId) {
      Toaster({ type: 'error', message: 'Hospital case id is missing' })

      return
    }

    const payload = new FormData()

    payload.append('hospital_case_id', getSafeString(hospitalCaseId))
    payload.append('surgery_date', getSafeString(formatDateValue(formValues.date)))
    payload.append('start_time', getSafeString(formatTimeValue(formValues.startTime)))
    payload.append('end_time', getSafeString(formatTimeValue(formValues.endTime)))

    const surgeryId = getSurgeryIdentifier(formValues.procedure)

    payload.append('surgery_id', getSafeString(surgeryId))
    payload.append('type_of_surgery', getSafeString(formValues.typeOfSurgery))
    payload.append('surgical_approach', getSafeString(formValues.surgicalApproach))
    payload.append('surgery_notes', getSafeString(getRichTextHtml(richNote)))
    payload.append('complications', getSafeString(formValues.complication))
    payload.append('care_diet_instructions', getSafeString(formValues.dietInstructions))
    payload.append('care_activity_restrictions', getSafeString(formValues.restrictions))
    payload.append('additional_notes', getSafeString(formValues.additionalNotes))
    payload.append('duration', getSafeString(formValues.duration))

    if (Array.isArray(formValues.attachments)) {
      formValues.attachments.forEach(file => {
        if (file instanceof File) {
          payload.append('attachments[]', file)
        }
      })
    }

    setIsSubmitting(true)

    try {
      const response = await addSurgeryRecord(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Surgery record added successfully' })
        reset()
        setRichNote(createEmptyRichTextValue())
        setActiveTemplate('')
        setProcedureSearchTerm('')
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to add surgery record' })
      }
    } catch (error) {
      console.error('Add surgery record error:', error)
      const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred'
      Toaster({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Breadcrumbs aria-label='breadcrumb'>
        <Typography color={theme.palette.customColors.neutralSecondary}>Hospital</Typography>
        <Typography color={theme.palette.customColors.neutralSecondary}>Patients</Typography>
        <Typography color={theme.palette.customColors.neutralSecondary}>Inpatient</Typography>
        <Typography
          color={theme.palette.customColors.neutralSecondary}
          sx={{ cursor: 'pointer' }}
          onClick={() => router.back()}
        >
          Details
        </Typography>

        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            cursor: 'pointer'
          }}
        >
          Add Surgery
        </Typography>
      </Breadcrumbs>

      <Card
        sx={{
          p: '24px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '32px'
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            width: 'fit-content'
          }}
          onClick={() => router.back()}
        >
          <Icon icon='mdi:arrow-left' color={theme.palette.customColors.OnSurfaceVariant} fontSize={24} />
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Add Surgery Record
          </Typography>
        </Box>

        <AnimalInfoCard data={data} />
        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          component='form'
          onSubmit={handleSubmit(onSubmit)}
        >
          <SurgeryRecordForm
            control={control}
            errors={errors}
            templates={templateNames}
            activeTemplate={activeTemplate}
            setOpenSurgeryTemplateDrawer={setOpenSurgeryTemplateDrawer}
            setOpenAddAnaesthesiaDrawer={setOpenAddAnaesthesiaDrawer}
            richNote={richNote}
            onRichNoteChange={setRichNote}
            isSubmitting={isSubmitting}
            procedureOptions={procedureOptions}
            procedureLoading={isProceduresLoading}
            onProcedureInputChange={handleProcedureInputChange}
            onProcedureClear={handleProcedureClear}
            procedureGetOptionLabel={procedureGetOptionLabel}
            procedureIsOptionEqualToValue={procedureIsOptionEqualToValue}
            onSaveTemplate={handleSaveTemplate}
            isSavingTemplate={isSavingTemplate}
            clearFieldErrors={clearErrors}
            onTemplateSelect={handleTemplateSelect}
          />
        </Box>
      </Card>

      <AddAnaesthesiaRecordDrawer
        setOpenAddAnaesthesiaDrawer={setOpenAddAnaesthesiaDrawer}
        openAddAnaesthesiaDrawer={openAddAnaesthesiaDrawer}
      />
      <SurgeryRecordTemplateList
        setOpenSurgeryTemplateDrawer={setOpenSurgeryTemplateDrawer}
        openSurgeryTemplateDrawer={openSurgeryTemplateDrawer}
        templates={surgeryTemplates}
        loading={isTemplatesLoading}
        onApplyTemplate={applyTemplateToRichNote}
      />
    </Box>
  )
}

export default AddSurgeryRecord
