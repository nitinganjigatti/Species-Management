import { useTheme } from '@emotion/react'
import { Breadcrumbs, Typography, Box, Card, CardHeader, CardContent, Grid, Button, alpha } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import RenderUtility from 'src/utility/render'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'

const defaultValues = {
  treatmentType: 'inpatient',
  animal: null,
  purposeOfVisit: '',
  visitType: '',
  medicalRecordId: '',
  chiefDoctor: '',
  holdingEnclosure: '',
  medicalRecordChoice: 'new'
}

const treatmentType = [
  { label: 'OPD(outpatient)', value: 'opt' },
  { label: 'Hospital Admission(inpatient)', value: 'inpatient' },
  { label: 'In site treatment', value: 'inSite' }
]

const medicalRecordType = [
  { label: 'Create a new ID', value: 'new' },
  { label: 'Add to existing ID', value: 'existing' }
]

const schema = yup.object().shape({})

const AddPatientForm = () => {
  const theme = useTheme()
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [visitTypes, setVisitTypes] = useState([])
  const [medicalId, setMedicalId] = useState([])
  const [doctors, setDoctors] = useState([])
  const [holdingEnclosures, setHoldingEnclosures] = useState([])
  const [openAnimalDrawer, setAnimalDrawer] = useState(false)

  const watchMedicalChoice = watch('medicalRecordChoice')

  const onSubmit = data => {
    console.log(data, 'formData')
  }

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patients</Typography>
          <Typography onClick={() => router.back()} sx={{ cursor: 'pointer', color: 'text.primary' }}>
            Inpatient
          </Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>add-patient</Typography>
        </Breadcrumbs>
        <Card sx={{ mb: 4 }}>
          <CardHeader title={RenderUtility.pageTitle('Add Patient')} />
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: 1,
                  p: 6
                }}
              >
                <Typography
                  sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Select treatment type
                </Typography>
                <Controller
                  name='treatmentType'
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ display: 'flex', flexDirection: { sm: 'row', xs: 'column' }, gap: 6 }}>
                      {treatmentType?.map((item, index) => (
                        <TreatmentTypeRadioButtons
                          key={index}
                          label={item?.label}
                          isSelected={field.value === item?.value}
                          onClick={() => field.onChange(item?.value)}
                          backgroundColor={theme.palette.customColors.Surface}
                          borderColor={theme.palette.customColors.OutlineVariant}
                          selectedBackgroundColor={theme.palette.customColors.Surface}
                        />
                      ))}
                    </Box>
                  )}
                />
              </Box>
              <Box
                sx={{
                  mt: 7,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: 1,
                  p: 6
                }}
              >
                <Typography
                  sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Enter basic details
                </Typography>
                <Grid container spacing={7} alignItems={'baseline'}>
                  <Grid
                    size={{ xs: 12, sm: 6 }}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 3, cursor: 'pointer' }}
                  >
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Selected Animal
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: `1px solid ${theme.palette.customColors.Outline}`,
                        borderRadius: 1,
                        p: 4,
                        background: theme.palette.customColors.Surface
                      }}
                    >
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.OnPrimaryContainer }}
                      >
                        Select Animal
                      </Typography>
                      <Icon icon={'mdi-chevron-down'} />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Purpose of visit
                    </Typography>
                    <ControlledTextField
                      control={control}
                      name={'purposeOfVisit'}
                      errors={errors}
                      sx={{ background: theme.palette.customColors.Surface }}
                      label={'Enter Purpose of Visit'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Visit Type
                    </Typography>
                    <ControlledSelect
                      control={control}
                      name={'visitType'}
                      errors={errors}
                      label={'Select Visit Type'}
                      options={visitTypes}
                      sx={{ background: theme.palette.customColors.Surface }}
                    />
                  </Grid>
                </Grid>
                <Controller
                  name='medicalRecordChoice'
                  control={control}
                  render={({ field }) => (
                    <Grid
                      container
                      spacing={4}
                      sx={{
                        background: alpha(theme.palette.customColors.SecondaryContainer, 0.16),
                        p: 6,
                        borderRadius: 1
                      }}
                    >
                      <Grid size={{ xs: 12 }}>
                        <Typography
                          sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                        >
                          Medical Record ID
                        </Typography>
                      </Grid>
                      {medicalRecordType?.map((item, index) => (
                        <Grid key={index} size={{ xs: 12, sm: 6 }}>
                          <TreatmentTypeRadioButtons
                            label={item?.label}
                            radioPosition='right'
                            backgroundColor={theme.palette.customColors.OnPrimary}
                            borderColor={theme.palette.customColors.Outline}
                            isSelected={field.value === item?.value}
                            onClick={() => field.onChange(item?.value)}
                            selectedBackgroundColor={theme.palette.customColors.OnPrimaryContainer}
                            selectedFontColor='#FFF'
                            selectedBorderColor='none'
                          />
                        </Grid>
                      ))}
                      {watchMedicalChoice === 'existing' && (
                        <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <Typography
                            sx={{
                              fontSize: '16px',
                              fontWeight: 500,
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            Select ID
                          </Typography>
                          <ControlledSelect
                            control={control}
                            name={'medicalRecordId'}
                            errors={errors}
                            label={'Select ID'}
                            options={medicalId}
                            sx={{ background: theme.palette.customColors.Surface }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  )}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  p: 6,
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  borderRadius: 1,
                  mt: 7
                }}
              >
                <Grid container spacing={7}>
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Admission details
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Attending chief doctor
                    </Typography>
                    <ControlledSelect
                      control={control}
                      name={'chiefDoctor'}
                      errors={errors}
                      label={'Select Doctor'}
                      options={doctors}
                      sx={{ background: theme.palette.customColors.Surface }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                    >
                      Holding enclosure
                    </Typography>
                    <ControlledSelect
                      control={control}
                      name={'holdingEnclosure'}
                      errors={errors}
                      label={'Select area/cell/enclosure'}
                      options={holdingEnclosures}
                      sx={{ background: theme.palette.customColors.Surface }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: theme.palette.customColors.OnPrimary,
          py: 4,
          px: 6,
          boxShadow: `0px -2px 8px ${theme.palette.customColors.shadowColor}`,
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100
        }}
      >
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Button
            variant='outlined'
            sx={{ borderColor: theme.palette.customColors.Outline, py: '9px', px: 4, borderRadius: 0.5 }}
            onClick={() => router.back()}
          >
            CANCEL
          </Button>
          <Button
            variant='contained'
            sx={{ backgroundColor: theme.palette.primary.main, px: 4, py: '9px', borderRadius: 0.5 }}
          >
            ADMIT
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default AddPatientForm
