import { Box, Button, CircularProgress, Drawer, IconButton, Typography, useTheme } from '@mui/material'
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import DoctorsDrawer from '../PatientAdmissionForm/DoctorsDrawer'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { useForm } from 'react-hook-form'
import { getRoomsAndEnclosures } from 'src/lib/api/hospital/roomsAndEnclosures'
import { debounce } from 'lodash'
import { useHospital } from 'src/context/HospitalContext'
import { editAnimalAdmissionDetails } from 'src/lib/api/hospital/inpatient'
import Toaster from 'src/components/Toaster'

const defaultValues = {
  holdingEnclosure: null,
  selectedDoctor: null
}

const EditPatientDrawer = ({ open, onClose, patientData, refetch }) => {
  const theme = useTheme()
  const { selectedHospital } = useHospital()

  const [doctorDrawerOpen, setDoctorDrawerOpen] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [holdingEnclosures, setHoldingEnclosures] = useState([])
  const [search, setSearch] = useState('')

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  useEffect(() => {
    if (patientData) {
      const doctorData = {
        name: patientData?.attend_by_full_name,
        default_icon: patientData?.attend_by_profile_pic,
        id: patientData?.attend_by,
        role_name: patientData?.attend_by_role
      }
      reset({
        holdingEnclosure: {
          label: patientData?.bed_name,
          value: patientData?.bed_id
        },
        selectedDoctor: doctorData
      })
      setSelectedDoctor(doctorData)
    }
  }, [patientData, reset])

  useEffect(() => {
    const getHospitalBeds = async () => {
      try {
        await getRoomsAndEnclosures({
          hospital_id: selectedHospital?.id,
          page: 1,
          per_page: 10,
          is_occupied: 'available',
          search
        }).then(res => {
          if (res?.success === true) {
            setHoldingEnclosures(
              res?.data?.records?.map(item => ({
                label: item?.bed_name,
                value: item?.id
              }))
            )
          }
        })
      } catch (error) {
        console.error(error, 'cannot Fetch hospital beds listing')
      }
    }

    getHospitalBeds()
  }, [search, selectedHospital?.id])

  const debouncedSearch = React.useMemo(() => debounce(val => setSearch(val), 1000), [])

  const handleDoctorSelection = doctor => {
    setSelectedDoctor(doctor)
    setValue('selectedDoctor', doctor)
  }

  const handleRemoveDoctor = () => {
    setSelectedDoctor(null)
    setValue('selectedDoctor', null)
  }

  const onSubmit = async data => {
    setSubmitLoader(true)
    try {
      const payload = {
        hospital_case_id: patientData?.hospital_case_id,
        holding_enclosure: data?.holdingEnclosure?.value || '',
        attend_by: data?.selectedDoctor?.id || ''
      }
      await editAnimalAdmissionDetails(payload).then(res => {
        if (res?.success === true) {
          setSubmitLoader(false)
          Toaster({ type: 'success', message: res?.message })
          onClose()
          refetch()
        } else {
          Toaster({ type: 'error', message: res?.message })
          setSubmitLoader(false)
        }
      })
    } catch (error) {
      console.error('Error updating patient details:', error)
      setSubmitLoader(false)
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.customColors.OnPrimary,
              p: 0
            }
          }
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            pb: 0,
            p: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Typography
            variant='h6'
            sx={{ fontWeight: 500, fontSize: '24px', color: theme.palette.customColors.OnSurfaceVariant }}
          >
            Edit Patient Details
          </Typography>
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: theme.palette.customColors.OnPrimary,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            minHeight: 0,
            p: 6
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Attending Chief Doctor
            </Typography>
            {selectedDoctor === null ? (
              <Box
                sx={{
                  // background: theme.palette.customColors.Surface,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
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
                    background: theme.palette.customColors.OnPrimary,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    px: 3,
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
              Holding Enclosure
            </Typography>
            <ControlledAutocomplete
              name='holdingEnclosure'
              label='Select area/cell/enclosure'
              control={control}
              errors={errors}
              options={holdingEnclosures}
              getOptionValue={option => option.value || ''}
              getOptionLabel={option => option.label || ''}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              required
              onInputChange={val => debouncedSearch(val)}
              sx={{ borderRadius: 1 }}
              fullWidth
            />
          </Box>
        </Box>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            width: '100%',
            p: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            zIndex: 1,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
            flexShrink: 0,
            display: 'flex',
            gap: 4
          }}
        >
          <Button
            variant='outlined'
            fullWidth
            color='primary'
            sx={{
              p: 3,
              fontWeight: 600,
              color: theme.palette.customColors.OnPrimaryContainer,
              borderColor: theme.palette.customColors.OnPrimaryContainer
            }}
          >
            CANCEL
          </Button>
          <Button
            variant='contained'
            fullWidth
            color='primary'
            sx={{ p: 3, fontWeight: 600, backgroundColor: theme.palette.customColors.OnPrimaryContainer }}
            onClick={handleSubmit(onSubmit)}
          >
            {submitLoader ? <CircularProgress size={24} /> : 'SAVE'}
          </Button>
        </Box>
      </Drawer>
      {doctorDrawerOpen && (
        <DoctorsDrawer open={doctorDrawerOpen} setOpen={setDoctorDrawerOpen} onSelectDoctor={handleDoctorSelection} />
      )}
    </>
  )
}

export default EditPatientDrawer
