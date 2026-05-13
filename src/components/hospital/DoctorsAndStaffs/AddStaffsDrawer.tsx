'use client'

import { yupResolver } from '@hookform/resolvers/yup'
import { Box, Button, CircularProgress, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import { useHospital } from 'src/context/HospitalContext'
import * as yup from 'yup'
import DoctorsDrawer from '../PatientAdmissionForm/DoctorsDrawer'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { debounce } from 'lodash'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

interface FormValues {
  doctor_role: any
  selected_user: any
  doctor_designation: string
  doctor_specialty: string
}

const defaultValues: FormValues = {
  doctor_role: null,
  selected_user: null,
  doctor_designation: '',
  doctor_specialty: ''
}

const createSchema = (t: any) =>
  yup.object().shape({
    doctor_role: yup.object().required(t('hospital_module.doctor_role_is_required')),
    selected_user: yup.mixed().required(t('hospital_module.doctor_is_required')),
    doctor_designation: yup.string().nullable().required(t('hospital_module.doctor_designation_is_required')),
    doctor_specialty: yup.string().required(t('hospital_module.doctor_specialty_is_required'))
  })

interface AddStaffsDrawerProps {
  open?: boolean
  setOpen?: (v: boolean) => void
}

const AddStaffsDrawer = ({ open, setOpen }: AddStaffsDrawerProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const { selectedHospital }: any = useHospital()
  const router: any = useSafeRouter()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: yupResolver(createSchema(t)) as any,
    defaultValues,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [addLoading, setAddLoading] = useState<boolean>(false)
  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState<boolean>(false)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [searchRole, setSearchRole] = useState<string>('')
  const [doctorRoles, setDoctorRoles] = useState<any[]>([])

  const onClose = () => {
    setOpen && setOpen(false)
  }

  const handleDoctorSelection = (doctor: any) => {
    setSelectedDoctor(doctor)
    setValue('selected_user' as any, doctor)
    clearErrors('selected_user' as any)
  }

  const handleRemoveDoctor = () => {
    setSelectedDoctor(null)
    setValue('selected_user' as any, null)
  }

  const debouncedSearch = React.useMemo(() => debounce((val: string) => setSearchRole(val), 1000), [])

  const onSubmit = (_data: FormValues) => {}

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: {
                xs: '100%',
                sm: '80%',
                md: 560
              },
              backgroundColor: 'customColors.Background',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }
          }
        }}
      >
        <Box
          sx={{
            p: 4,
            position: 'sticky',
            top: 0,
            backgroundColor: theme.palette.customColors.OnPrimary,
            zIndex: 1,
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src='/icons/Activity.svg' alt='activity icons' />

              <Typography
                variant='h6'
                sx={{
                  fontWeight: 'bold'
                }}
              >
                {t('hospital_module.add_staffs')}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: theme.palette.customColors.background,
            p: 6
          }}
        >
          <form>
            <Box
              sx={{
                backgroundColor: theme.palette.customColors.OnPrimary,
                p: 6,
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography
                  sx={{ fontSize: '1rem', fontWeight: '400', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('hospital_module.select_role')}
                </Typography>
                <ControlledAutocomplete
                  name='doctor_role'
                  label={(t('hospital_module.doctor') as string)}
                  control={control}
                  errors={errors}
                  options={doctorRoles}
                  getOptionValue={(option: any) => option.value || ''}
                  getOptionLabel={(option: any) => option.label || ''}
                  isOptionEqualToValue={(option: any, value: any) => option.value === value?.value}
                  required
                  onInputChange={(val: string) => debouncedSearch(val)}
                  sx={{ borderRadius: 1 }}
                  fullWidth
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography
                    sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    {t('hospital_module.select_user')}
                  </Typography>
                  {selectedDoctor === null ? (
                    <Box
                      sx={{
                        borderRadius: 1,
                        border: (errors as any).selectedDoctor
                          ? ` 1px solid ${theme.palette.customColors.Error}`
                          : `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '56px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setDoctorDrawerOpen(true)}
                    >
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 400,
                          color: (errors as any)?.selectedDoctor
                            ? theme.palette.error.main
                            : theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {t('hospital_module.select_doctor')}
                      </Typography>
                      <Icon icon='mdi:chevron-down' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
                    </Box>
                  ) : (
                    <>
                      <Box
                        sx={{
                          background: theme.palette.customColors.displaybgPrimary,
                          borderRadius: 1,
                          p: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: '56px',
                          cursor: 'pointer'
                        }}
                      >
                        <UserAvatarDetails
                          profile_image={selectedDoctor?.default_icon}
                          user_name={selectedDoctor?.name}
                          role={selectedDoctor?.role_name}
                        />
                        <IconButton onClick={handleRemoveDoctor}>
                          <Icon icon='charm:cross' fontSize={24} color={theme.palette.customColors.Error} />
                        </IconButton>
                      </Box>
                    </>
                  )}
                </Box>
                {(errors as any).selectedDoctor && (
                  <Typography
                    sx={{
                      color: theme.palette.error.main,
                      mt: '3px',
                      mx: '14px',
                      fontSize: '0.75rem',
                      fontWeight: 400
                    }}
                  >
                    {(errors as any).selectedDoctor.message}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography
                  sx={{ fontSize: '1rem', fontWeight: '400', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('hospital_module.enter_designation')}
                </Typography>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  name='doctor_designation'
                  placeholder={(t('hospital_module.chief_veterinarian') as string)}
                  fullWidth
                  required
                  sx={{ borderRadius: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography
                  sx={{ fontSize: '1rem', fontWeight: '400', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('hospital_module.enter_specialty')}
                </Typography>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  name='doctor_specialty'
                  placeholder={(t('hospital_module.enter_specialty') as string)}
                  fullWidth
                  required
                  sx={{ borderRadius: 1 }}
                />
              </Box>
            </Box>
          </form>
        </Box>
        <Box
          sx={{
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Button
            onClick={handleSubmit(onSubmit)}
            variant='contained'
            fullWidth
            sx={{ height: '56px', backgroundColor: theme.palette.primary.main }}
          >
            {addLoading ? <CircularProgress size={24} /> : t('add')}
          </Button>
        </Box>
      </Drawer>
      {doctorDrawerOpen && (
        <DoctorsDrawer open={doctorDrawerOpen} setOpen={setDoctorDrawerOpen} onSelectDoctor={handleDoctorSelection} />
      )}
    </>
  )
}

export default AddStaffsDrawer
