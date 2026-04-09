'use client'

import { yupResolver } from '@hookform/resolvers/yup'
import { Box, Button, CircularProgress, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { useHospital } from 'src/context/HospitalContext'
import * as yup from 'yup'
import DoctorsDrawer from '../PatientAdmissionForm/DoctorsDrawer'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { debounce } from 'lodash'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

const defaultValues = {
  doctor_role: null,
  selected_user: null,
  doctor_designation: '',
  doctor_specialty: ''
}

const schema = yup.object().shape({
  doctor_role: yup.object().required('Doctor Role is required'),
  selected_user: yup.mixed().required('Doctor is required'),
  doctor_designation: yup.string().nullable().required('Doctor Designation is required'),
  doctor_specialty: yup.string().required('Doctor Specialty is required')
})

const AddStaffsDrawer = ({ open, setOpen }) => {
  const theme = useTheme()
  const { selectedHospital } = useHospital()
  const router = useSafeRouter()

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [addLoading, setAddLoading] = useState(false)
  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [searchRole, setSearchRole] = useState('')
  const [doctorRoles, setDoctorRoles] = useState([])

  const onClose = () => {
    setOpen(false)
  }

  const handleDoctorSelection = doctor => {
    setSelectedDoctor(doctor)
    setValue('selectedDoctor', doctor)
    clearErrors('selectedDoctor')
  }

  const handleRemoveDoctor = () => {
    setSelectedDoctor(null)
    setValue('selectedDoctor', null)
  }

  const debouncedSearch = React.useMemo(() => debounce(val => setSearchRole(val), 1000), [])

  const onSubmit = data => {}

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
                Add Staffs
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
                  Select Role
                </Typography>
                <ControlledAutocomplete
                  name='doctor_role'
                  label='Doctor'
                  control={control}
                  errors={errors}
                  options={doctorRoles}
                  getOptionValue={option => option.value || ''}
                  getOptionLabel={option => option.label || ''}
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  required
                  onInputChange={val => debouncedSearch(val)}
                  sx={{ borderRadius: 1 }}
                  fullWidth
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography
                    sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    Select user
                  </Typography>
                  {selectedDoctor === null ? (
                    <Box
                      sx={{
                        borderRadius: 1,
                        border: errors.selectedDoctor
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
                          color: errors?.selectedDoctor
                            ? theme.palette.error.main
                            : theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Select doctor
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
                {errors.selectedDoctor && (
                  <Typography
                    sx={{
                      color: theme.palette.error.main,
                      mt: '3px',
                      mx: '14px',
                      fontSize: '0.75rem',
                      fontWeight: 400
                    }}
                  >
                    {errors.selectedDoctor.message}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography
                  sx={{ fontSize: '1rem', fontWeight: '400', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Enter Designation
                </Typography>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  name='doctor_designation'
                  placeholder='Chief Veterinarian'
                  fullWidth
                  required
                  sx={{ borderRadius: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography
                  sx={{ fontSize: '1rem', fontWeight: '400', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Enter Specialty
                </Typography>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  name='doctor_specialty'
                  placeholder='Enter Specialty'
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
            {addLoading ? <CircularProgress size={24} /> : 'ADD'}
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
