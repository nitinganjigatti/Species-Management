import { yupResolver } from '@hookform/resolvers/yup'
import { Box, Breadcrumbs, Button, Card, CardContent, CardHeader, Grid, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { renderUserAvatarDetails } from 'src/utility/render'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import { MedicalIdChip, VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import AnimalCard from 'src/views/utility/AnimalCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import * as yup from 'yup'

const treatmentType = [
  { label: 'OPD (outpatient)', value: 'opd' },
  { label: 'Hospital Admission (inpatient)', value: 'inpatient' }
]

const defaultValues = {
  treatmentType: 'inpatient',
  chiefDoctor: '',
  holdingEnclosure: ''
}

const animalData = {
  sex: 'male',
  animal_id: '6666/66',
  common_name: 'Leopard',
  scientific_name: 'Panthera pardus',
  user_enclosure_name: 'Enclosure 4',
  section_name: 'Leopard section',
  site_name: 'Feline site'
}

const schema = yup.object().shape({})

const PatientAdmitForm = () => {
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

  const [doctors, setDoctors] = useState([])
  const [holdingEnclosures, setHoldingEnclosures] = useState([])

  const onSubmit = data => {
    console.log(data)
  }

  const headerTitle = (
    <Typography sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.customTextColorGray2 }}>
      Patient Admission Form
    </Typography>
  )

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patients</Typography>
          <Typography onClick={() => router.back()} sx={{ cursor: 'pointer', color: 'text.primary' }}>
            Incoming
          </Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>admit-patient</Typography>
        </Breadcrumbs>
        <Card sx={{ mb: 4 }}>
          <CardHeader title={headerTitle} />
          <CardContent>
            <Grid container sx={{ mb: 6 }} spacing={0}>
              <Grid
                size={{ xs: 12, md: 4, sm: 5 }}
                sx={{
                  p: 6,
                  background: theme.palette.customColors.antzInfoLight,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: { sm: '8px', xs: 0 },
                  borderTopRightRadius: { sm: 0, xs: '8px' },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  height: 'auto'
                }}
              >
                <AnimalCard data={animalData} />
              </Grid>
              <Grid
                size={{ xs: 12, md: 8, sm: 7 }}
                sx={{
                  p: 4,
                  background: alpha(theme.palette.customColors.SecondaryContainer, 0.08),
                  borderBottomLeftRadius: { sm: 0, xs: '8px' },
                  borderTopRightRadius: { sm: '8px', xs: 0 },
                  borderBottomRightRadius: '8px'
                }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnPrimaryContainer,
                    mb: 3
                  }}
                >
                  Purpose of visit
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2.5 }}>
                    <MedicalIdChip
                      medId={'MED - 12345/22'}
                      backgroundColor={theme.palette.customColors.mdAntzNeutral}
                    />
                    <VisitType title={'Follow-up'} />
                  </Box>
                  <Typography
                    sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnPrimaryContainer }}
                  >
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim
                  </Typography>
                  <UserAvatarDetails user_name={'Ravi Sharma'} date={'14 Apr 2024'} show_time size='medium' />
                </Box>
              </Grid>
            </Grid>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Typography
                  sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Enter below details
                </Typography>
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
                          />
                        ))}
                      </Box>
                    )}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p: 6,
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: 1
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

export default PatientAdmitForm
