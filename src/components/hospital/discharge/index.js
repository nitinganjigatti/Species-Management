import React, { useState } from 'react'

// ** MUI Imports
import { Box, Grid, Tooltip, Typography, useTheme, IconButton } from '@mui/material'
import { alpha, styled } from '@mui/system'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'

// ** Form & Validation Setup
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Controller, useForm } from 'react-hook-form'

// ** Discharge Forms
import MortalityDischargeForm from 'src/views/pages/hospital/inpatient/discharge/MortalityDischargeForm'
import TransferDischargeForm from 'src/views/pages/hospital/inpatient/discharge/TransferDischargeForm'
import EnclosureDischargeForm from 'src/views/pages/hospital/inpatient/discharge/EnclosureDischargeForm'

// ** Custom Form Components
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'

/* -------------------- Constants -------------------- */
const dischargeTypeOptions = [
  { label: 'Mortality', value: 'mortality' },
  { label: 'Transfer to another hospital', value: 'transfer' },
  { label: 'Discharge to enclosure', value: 'discharge' }
]

const defaultValues = {
  dischargeType: 'mortality',

  // Mortality
  dateOfDeath: null,
  timeOfDeath: null,
  causeOfDeath: '',
  carcassCondition: '',
  carcassDeposition: '',
  requestNecropsy: true,
  necropsyPriority: 'high',
  noNecropsyReason: '',
  images: [],

  // Transfer
  hospital: '',
  transferReason: '',
  dischargeDate: null,
  dischargeTime: null,
  dietInstructions: '',
  restrictionActivities: '',
  additionalNotes: '',
  transferSite: '',
  transferSection: '',
  transferEnclosure: '',
  images: [],

  // Enclosure discharge specific
  transferSite: '',
  transferSection: '',
  transferEnclosure: '',

  dischargeDate: null,
  dischargeTime: null,
  ietInstructions: '',
  restrictionActivities: '',
  additionalNotes: ''
}

const schema = yup.object().shape({
  dischargeType: yup.string().required('Discharge type is required'),

  // Mortality validations
  dateOfDeath: yup.date().when('dischargeType', {
    is: 'mortality',
    then: schema => schema.nullable().required('Date of death is required'),
    otherwise: schema => schema.nullable()
  }),
  timeOfDeath: yup.date().when('dischargeType', {
    is: 'mortality',
    then: schema => schema.nullable().required('Time of death is required'),
    otherwise: schema => schema.nullable()
  }),
  causeOfDeath: yup.string().when('dischargeType', {
    is: 'mortality',
    then: schema => schema.required('Cause of death is required'),
    otherwise: schema => schema
  }),
  carcassCondition: yup.string().when('dischargeType', {
    is: 'mortality',
    then: schema => schema.required('Carcass condition is required'),
    otherwise: schema => schema
  }),
  carcassDeposition: yup.string().when('dischargeType', {
    is: 'mortality',
    then: schema => schema.required('Carcass deposition is required'),
    otherwise: schema => schema
  }),
  noNecropsyReason: yup.string().when(['dischargeType', 'requestNecropsy'], {
    is: (dischargeType, requestNecropsy) => dischargeType === 'mortality' && !requestNecropsy,
    then: schema => schema.required('Reason for not performing necropsy is required'),
    otherwise: schema => schema
  }),
  images: yup.array().of(yup.string()).max(5, 'Max 5 images'),

  // Transfer validations
  hospital: yup.string().when('dischargeType', {
    is: 'transfer',
    then: schema => schema.required('Hospital is required'),
    otherwise: schema => schema
  }),
  transferReason: yup.string().when('dischargeType', {
    is: 'transfer',
    then: schema => schema.required('Reason for transferring is required'),
    otherwise: schema => schema
  }),
  dischargeDate: yup.date().when('dischargeType', {
    is: 'transfer',
    then: schema => schema.nullable().required('Date of discharge is required'),
    otherwise: schema => schema.nullable()
  }),
  dischargeTime: yup.date().when('dischargeType', {
    is: 'transfer',
    then: schema => schema.nullable().required('Time of discharge is required'),
    otherwise: schema => schema.nullable()
  }),

  dietInstructions: yup.string().when('dischargeType', {
    is: 'transfer',
    then: schema => schema.required('Diet Instructions is required'),
    otherwise: schema => schema
  }),
  restrictions: yup.string().when('dischargeType', {
    is: 'transfer',
    then: schema => schema.required('Restriction activities  is required'),
    otherwise: schema => schema
  }),

  // additionalNotes: yup.string().when('dischargeType', {
  //   is: 'transfer',
  //   then: schema => schema.required('additional Notes is required'),
  //   otherwise: schema => schema
  // }),

  // Enclosure discharge validations
  transferSite: yup.string().when('dischargeType', {
    is: 'discharge',
    then: schema => schema.required('Site is required'),
    otherwise: schema => schema
  }),
  transferSection: yup.string().when('dischargeType', {
    is: 'discharge',
    then: schema => schema.required('Section is required'),
    otherwise: schema => schema
  }),
  transferEnclosure: yup.string().when('dischargeType', {
    is: 'discharge',
    then: schema => schema.required('Enclosure is required'),
    otherwise: schema => schema
  }),
  dischargeDate: yup.date().when('dischargeType', {
    is: 'discharge',
    then: schema => schema.nullable().required('Date of discharge is required'),
    otherwise: schema => schema.nullable()
  }),
  dischargeTime: yup.date().when('dischargeType', {
    is: 'discharge',
    then: schema => schema.nullable().required('Time of discharge is required'),
    otherwise: schema => schema.nullable()
  })
})
const templates = ['Avian summary', 'Feline summary', 'Reptilian summary']

const necropsyPriorityList = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]

const deathCauses = [
  { label: 'Infection', value: 'infection' },
  { label: 'Trauma', value: 'trauma' }
]

const carcassCondition = [
  { label: 'Good', value: 'good' },
  { label: 'Decomposed', value: 'decomposed' }
]

const carcassDeposition = [
  { label: 'Buried', value: 'buried' },
  { label: 'Incinerated', value: 'incinerated' }
]

const hospitals = [
  { label: 'Wildlife Rescue Center', value: 'rescue_center' },
  { label: 'Animal Care Hospital', value: 'animal_care' }
]

const medicationsData = [
  {
    id: 1,
    MedicineName: 'Levothyroxine',
    BrandName: 'Synthroid',
    DosageTimesFrequency: '3 Times / Everyday',
    StartingDate: '2025-01-07',
    EndingDate: '2025-01-11',
    Duration: '5 Days',
    DeliveryRoute: 'Oral'
  },
  {
    id: 2,
    MedicineName: 'Acepromazine',
    BrandName: 'Antiemetic',
    DosageTimesFrequency: '2 Times / Everyday',
    StartingDate: '2025-01-05',
    EndingDate: '2025-01-09',
    Duration: '4 Days',
    DeliveryRoute: 'Oral'
  }
]

/* -------------------- Styles -------------------- */
const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))

const InpatientDischarge = () => {
  const theme = useTheme()

  const medicationColumns = [
    {
      field: 'No',
      headerName: 'NO',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {params.row.id}
        </Typography>
      )
    },
    {
      field: 'MedicineName',
      headerName: 'MEDICINE NAME',
      minWidth: 180,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Tooltip title={params.row.MedicineName}>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {params.row.MedicineName}
            </Typography>
          </Tooltip>
          <Tooltip title={params.row.BrandName}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontStyle: 'italic'
              }}
            >
              {params.row.BrandName}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      field: 'DosageTimesFrequency',
      headerName: 'DOSAGE TIMES & FREQUENCY',
      minWidth: 200,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {params.row.DosageTimesFrequency}
        </Typography>
      )
    },
    {
      field: 'StartingDate',
      headerName: 'STARTING DATE',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {params.row.StartingDate}
        </Typography>
      )
    },
    {
      field: 'EndingDate',
      headerName: 'ENDING DATE',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {params.row.EndingDate}
        </Typography>
      )
    },
    {
      field: 'Duration',
      headerName: 'DURATION',
      minWidth: 120,
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {params.row.Duration}
        </Typography>
      )
    },
    {
      field: 'DeliveryRoute',
      headerName: 'DELIVERY ROUTE',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {params.row.DeliveryRoute}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'ACTIONS',
      headerAlign: 'center',
      align: 'center',
      width: 120,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => {}}>
              <Icon icon='mdi:pencil-outline' fontSize={20} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => {}}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [activeTemplate, setActiveTemplate] = useState(templates[0])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const watchDischargeType = watch('dischargeType')

  const onSubmit = async data => {
    console.log('data submitted', data)

    setLoading(true)
    try {
      console.log('Form Submitted Data:', { ...data, summary: content })

      // TODO: API integration
      //
      reset(defaultValues)
      setContent('')

      // setActiveTemplate(templates[0])
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reset dependent fields when discharge type changes
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'dischargeType') {
        // Reset form fields that are specific to other discharge types
        const fieldsToReset = {
          // Mortality fields
          dateOfDeath: null,
          timeOfDeath: null,
          causeOfDeath: '',
          carcassCondition: '',
          carcassDeposition: '',
          requestNecropsy: true,
          necropsyPriority: 'high',
          noNecropsyReason: '',
          images: [],

          // Transfer fields
          hospital: '',
          transferReason: '',
          dischargeDate: null,
          dischargeTime: null,
          dietInstructions: '',
          restrictionActivities: '',
          additionalNotes: '',
          transferSite: '',
          transferSection: '',
          transferEnclosure: '',
          followUpDate: null,
          followUpRequired: true,
          images: [],

          // Enclosure fields
          transferSite: '',
          transferSection: '',
          transferEnclosure: '',
          dischargeDate: null,
          dischargeTime: null,
          ietInstructions: '',
          restrictionActivities: '',
          additionalNotes: '',
          images: []
        }

        // Only reset fields that don't belong to the current discharge type
        Object.keys(fieldsToReset).forEach(field => {
          reset(prev => ({ ...prev, [field]: fieldsToReset[field] }))
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [watch, reset])

  return (
    <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Admission Info */}
      <Box
        sx={{
          background: alpha(theme.palette.customColors.antzNotes, 0.6),
          p: 6,
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <StyledTypography color={theme.palette.customColors.neutralPrimary}>Reason of Admission</StyledTypography>
        <StyledTypography color={theme.palette.customColors.neutralPrimary} fontSize={'0.875rem'} fontWeight={400}>
          Leopard was observed with reduced mobility and swelling in the right forelimb, suspected fracture due to fall
        </StyledTypography>
      </Box>

      {/* Discharge Type Selection */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <StyledTypography>Discharge Type</StyledTypography>
        <Controller
          name='dischargeType'
          control={control}
          render={({ field }) => (
            <Grid container spacing={6}>
              {dischargeTypeOptions.map((item, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                  <TreatmentTypeRadioButtons
                    label={item.label}
                    isSelected={field.value === item.value}
                    onClick={() => field.onChange(item.value)}
                    radioPosition='right'
                    selectedBackgroundColor={theme.palette.customColors.OnPrimaryContainer}
                    selectedFontColor={theme.palette.primary.contrastText}
                    selectedBorderColor='none'
                  />
                </Grid>
              ))}
            </Grid>
          )}
        />
      </Box>

      {/* Conditional Forms */}
      {watchDischargeType === 'mortality' && (
        <MortalityDischargeForm
          control={control}
          watch={watch}
          errors={errors}
          templates={templates}
          activeTemplate={activeTemplate}
          setActiveTemplate={setActiveTemplate}
          necropsyPriorityList={necropsyPriorityList}
          deathCauses={deathCauses}
          carcassCondition={carcassCondition}
          carcassDeposition={carcassDeposition}
          content={content}
          setContent={setContent}
          loading={loading}
          onSubmit={handleSubmit(onSubmit)}
          setValue={setValue}
        />
      )}

      {watchDischargeType === 'transfer' && (
        <TransferDischargeForm
          control={control}
          watch={watch}
          errors={errors}
          templates={templates}
          activeTemplate={activeTemplate}
          setActiveTemplate={setActiveTemplate}
          content={content}
          setContent={setContent}
          loading={loading}
          hospitals={hospitals}
          medicationsData={medicationsData}
          medicationColumns={medicationColumns}
          onSubmit={handleSubmit(onSubmit)}
          setValue={setValue}
        />
      )}

      {watchDischargeType === 'discharge' && (
        <EnclosureDischargeForm
          control={control}
          watch={watch}
          errors={errors}
          templates={templates}
          activeTemplate={activeTemplate}
          setActiveTemplate={setActiveTemplate}
          content={content}
          setContent={setContent}
          loading={loading}
          hospitals={hospitals}
          medicationsData={medicationsData}
          medicationColumns={medicationColumns}
          onSubmit={handleSubmit(onSubmit)}
          setValue={setValue}
        />
      )}
    </Box>
  )
}

export default InpatientDischarge
