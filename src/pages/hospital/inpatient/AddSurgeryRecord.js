import { Avatar, Breadcrumbs, Button, Card, Chip, Tooltip, Typography } from '@mui/material'
import { Box, Grid } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import { LocalizationProvider } from '@mui/lab'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'

// ✅ Validation schema
const schema = yup.object().shape({
  date: yup.date().required('Date is required'),
  startTime: yup.date().required('Start time is required'),
  endTime: yup.date().required('End time is required'),
  procedure: yup.string().required('Procedure is required'),
  typeOfSurgery: yup.string().required('Type of surgery is required'),
  surgicalApproach: yup.string().required('Surgical approach is required'),
  notes: yup.string().required('Surgery notes are required'),
  complication: yup.string().required('Complication is required'),
  dietInstructions: yup.string().required('Diet instructions are required'),
  restrictions: yup.string().required('Restriction activities are required'),
  additionalNotes: yup.string().required('Additional notes are required')
})

const AddSurgeryRecord = () => {
  const router = useRouter()
  const theme = useTheme()

  const templates = [
    'appendix surgery',
    'ovariohysterectomy',
    'ovariohysterectomies',
    'ovariohysterect',
    'hernia repair',
    'spay surgery',
    'neuter surgery',
    'orthopedic surgery',
    'soft tissue surgery',
    'dental extraction',
    'tumor removal',
    'eye surgery',
    'ear surgery',
    'cesarean section',
    'fracture repair',
    'wound closure',
    'foreign body removal',
    'skin graft',
    'joint surgery',
    'biopsy'
  ]

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
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      date: null,
      startTime: null,
      endTime: null,
      procedure: '',
      typeOfSurgery: '',
      surgicalApproach: '',
      notes: '',
      complication: 'None',
      dietInstructions: '',
      restrictions: '',
      additionalNotes: ''
    }
  })

  const [activeTemplate, setActiveTemplate] = useState(templates[0])

  const onSubmit = data => {
    console.log('Form Data:', data)
    alert('Form submitted successfully!')
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
      <Typography
        sx={{ fontWeight: 500, fontSize: '24px', letterSpacing: 0, color: theme.palette.customColors.OnSurfaceVariant }}
      >
        Add Surgery Record Page
      </Typography>

      <Card sx={{ p: '24px', borderRadius: '8px' }}>
        {/* Animal Image */}
        <Grid container spacing={5} sx={{ mb: 3, alignItems: 'center' }}>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              src={data.animal.image_url}
              alt={data.animal.common_name}
              style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover' }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Tooltip title={data.animal.common_name}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '16px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {data.animal.common_name}
                </Typography>
              </Tooltip>
              <Tooltip title={data.animal.scientific_name}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    fontStyle: 'italic',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {data.animal.scientific_name}
                </Typography>
              </Tooltip>
              <Tooltip title={`${data.animal.age} • ${data.animal.sex}`}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {`${data.animal.age} • ${data.animal.sex}`}
                </Typography>
              </Tooltip>
            </Box>
          </Grid>

          {/* Additional Info */}
          {Object.entries(data.additional_info).map(([key, value]) => (
            <Grid item size={{ xs: 12, sm: 4, md: 2.25 }} key={key} sx={{ mt: 2 }}>
              <Tooltip title={value}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {key}
                </Typography>
              </Tooltip>
              <Tooltip title={value}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '16px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {value}
                </Typography>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </Card>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        component='form'
        onSubmit={handleSubmit(onSubmit)}
      >
        <Card sx={{ p: '16px 24px', borderRadius: '8px' }}>
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
              </Typography>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <ControlledDatePicker
                sx={{ width: '100%' }}
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
              <ControlledTextField name={'duration'} label='Duration' value='2 hours' control={control} />
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ display: 'flex', flexDirection: 'column', gap: '24px', p: '16px 24px', borderRadius: '8px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Surgery details
          </Typography>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledAutocomplete control={control} loading={true} errors={errors} name={'procedure'} />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledTextField name={'typeOfSurgery'} label='Type of surgery' control={control} />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledTextField name={'surgicalApproach'} label='Surgical approach' control={control} />
            </Grid>
          </Grid>

          <Box
            sx={{
              backgroundColor: '#E8F4F266', // need to define
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

              <ControlledTextArea
                placeholder={'Enter text'}
                control={control}
                name={'notes'}
                rows={3}
                errors={errors}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center', mb: '8px' }}>
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
                <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                  {templates.map(template => (
                    <Box
                      key={template}
                      onClick={() => setActiveTemplate(template)}
                      sx={{
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        px: '16px',
                        height: '48px',
                        borderRadius: '8px',
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
                          whiteSpace: 'nowrap'
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

          <ControlledTextField name={'complication'} control={control} errors={errors} label={'Complication'} />
        </Card>
      </Box>

      <Card sx={{ borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
      </Card>

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
          <ControlledTextField control={control} name={'dietInstructions'} errors={errors} placeholder={'Enter text'} />
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
          <ControlledTextField control={control} name={'restrictions'} errors={errors} placeholder={'Enter text'} />
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
            sx={{ backgroundColor: '#FCF4AE99' }}
            placeholder={'Enter text'}
            control={control}
            name={'additionalNotes'}
            errors={errors}
          />
        </Box>
      </Card>
      {/* <Box
        component='form'
        onSubmit={handleSubmit(onSubmit)}
        p={2}
        sx={{ backgroundColor: '#fff', borderRadius: '8px' }}
      >

       
        

       

        
        <Typography variant='h6' mb={2}>
          Anaesthesia details
        </Typography>
        <Button variant='outlined' fullWidth sx={{ mb: 3 }}>
          ➕ Add anaesthesia record
        </Button>

        <Typography variant='h6' mb={2}>
          Care Instructions
        </Typography>
        <Controller
          name='diet'
          control={control}
          render={({ field }) => (
            <ControlledTextField
              label='Enter diet instructions'
              fullWidth
              {...field}
              error={!!errors.diet}
              helperText={errors.diet?.message}
              sx={{ mb: 2 }}
            />
          )}
        />
        <Controller
          name='restrictions'
          control={control}
          render={({ field }) => (
            <ControlledTextField
              label='Enter restriction activities with duration'
              fullWidth
              {...field}
              error={!!errors.restrictions}
              helperText={errors.restrictions?.message}
              sx={{ mb: 2 }}
            />
          )}
        />
        <Controller
          name='additionalNotes'
          control={control}
          render={({ field }) => (
            <ControlledTextField
              label='Additional notes'
              fullWidth
              {...field}
              error={!!errors.additionalNotes}
              helperText={errors.additionalNotes?.message}
              sx={{ mb: 2, backgroundColor: '#fffde7' }}
            />
          )}
        />

        <Typography variant='subtitle1' sx={{ mt: 2 }}>
          Attachments
        </Typography>

        <Button type='submit' variant='contained' color='primary' sx={{ mt: 3 }}>
          Submit
        </Button>
      </Box> */}
      {/* </Card> */}
    </Box>
  )
}

export default AddSurgeryRecord
