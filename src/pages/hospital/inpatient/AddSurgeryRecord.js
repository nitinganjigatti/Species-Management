import { Avatar, Breadcrumbs, Button, Card, Chip, Tooltip, Typography } from '@mui/material'
import { Box, Grid } from '@mui/system'
import { useRouter } from 'next/router'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LocalizationProvider } from '@mui/lab'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

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
  diet: yup.string().required('Diet instructions are required'),
  restrictions: yup.string().required('Restriction activities are required'),
  additionalNotes: yup.string().required('Additional notes are required')
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
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      date: null,
      startTime: null,
      endTime: null,
      procedure: 'Ovariohysterectomy',
      typeOfSurgery: 'Elective',
      surgicalApproach: 'Midline abdominal incision',
      notes: '',
      complication: 'None',
      diet: '',
      restrictions: '',
      additionalNotes: ''
    }
  })

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
      <Box component='form' onSubmit={handleSubmit(onSubmit)}>
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

        {/* <Card sx={{ p: '16px 24px', borderRadius: '8px' }}>
          <Grid container spacing={2} mb={2}>
            <Typography variant='h6' mb={2}>
              Surgery details
            </Typography>
            <Grid item xs={12} sm={4}>
              <Controller
                name='procedure'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Name of procedure</InputLabel>
                    <Select {...field} error={!!errors.procedure}>
                      <MenuItem value='Ovariohysterectomy'>Ovariohysterectomy</MenuItem>
                      <MenuItem value='Appendix Surgery'>Appendix Surgery</MenuItem>
                    </Select>
                    {errors.procedure && (
                      <Typography color='error' variant='caption'>
                        {errors.procedure.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='typeOfSurgery'
                control={control}
                render={({ field }) => (
                  <ControlledTextField
                    label='Type of surgery'
                    {...field}
                    fullWidth
                    error={!!errors.typeOfSurgery}
                    helperText={errors.typeOfSurgery?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='surgicalApproach'
                control={control}
                render={({ field }) => (
                  <ControlledTextField
                    label='Surgical approach'
                    {...field}
                    fullWidth
                    error={!!errors.surgicalApproach}
                    helperText={errors.surgicalApproach?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Card> */}
      </Box>
      {/* <Box
        component='form'
        onSubmit={handleSubmit(onSubmit)}
        p={2}
        sx={{ backgroundColor: '#fff', borderRadius: '8px' }}
      >

       
        

        <Controller
          name='notes'
          control={control}
          render={({ field }) => (
            <ControlledTextField
              label='Enter surgery notes'
              multiline
              rows={3}
              fullWidth
              {...field}
              error={!!errors.notes}
              helperText={errors.notes?.message}
              sx={{ mb: 2 }}
            />
          )}
        />

        <Box mb={2}>
          <Typography variant='subtitle2'>Select from templates</Typography>
          <Box mt={1} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label='appendix surgery' color='primary' />
            <Chip label='ovariohysterectomy' variant='outlined' />
          </Box>
        </Box>

        <Controller
          name='complication'
          control={control}
          render={({ field }) => (
            <ControlledTextField
              label='Complication'
              fullWidth
              {...field}
              error={!!errors.complication}
              helperText={errors.complication?.message}
              sx={{ mb: 3 }}
            />
          )}
        />

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
