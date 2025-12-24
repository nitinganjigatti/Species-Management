import {
  Avatar,
  Button,
  Card,
  CircularProgress,
  Drawer,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useForm } from 'react-hook-form'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { addHospitalRoom } from 'src/lib/api/hospital/hospitalRooms'
import Toaster from 'src/components/Toaster'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'

const ShimmerBox = ({ width = '100%', height = '20px', mb = 0, borderRadius = '4px' }) => (
  <Box
    sx={{
      width,
      height,
      mb,
      backgroundColor: theme => theme.palette.grey[300],
      borderRadius,
      animation: 'pulse 1.5s ease-in-out infinite',
      '@keyframes pulse': {
        '0%': { opacity: 0.6 },
        '50%': { opacity: 0.8 },
        '100%': { opacity: 0.6 }
      }
    }}
  />
)

const defaultValues = {
  room: '',
  floor: ''
}

const schema = yup.object().shape({
  room: yup.string().trim().required('Room is required'),
  floor: yup.string().trim().required('Floor is required')
})

const AddRoomDrawer = ({
  open,
  setOpen,
  selectedHospital,
  hospitalStats,
  isHospitalStatsLoading,
  updateHospitalStats
}) => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [addLoading, setAddLoading] = useState(false)

  const handleDrawerClose = () => {
    setOpen(false)
    reset({
      room: '',
      floor: ''
    })
  }

  // Hospital stats
  const fetchAndUpdateHospitalStats = async hospitalId => {
    if (!hospitalId) return

    try {
      const statsResponse = await getHospitalBedStats(hospitalId)
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching hospital stats:', error)
    }
  }

  const onAddClick = async data => {
    setAddLoading(true)
    try {
      const payload = {
        hospital_id: selectedHospital?.id,
        room_name: data?.room,
        floor_name: data?.floor,
        status: '1'
      }
      const res = await addHospitalRoom(payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message })
        setAddLoading(false)
        if (selectedHospital?.id) {
          fetchAndUpdateHospitalStats(selectedHospital?.id)
        }

        // reset({
        //   floor: '',
        //   room: ''
        // })
      } else {
        throw res
      }
    } catch (error) {
      console.error(error, 'Cannot Add Hospital Room')
      Toaster({ type: 'error', message: error?.message })
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        sx={{
          '& .MuiDrawer-paper': {
            width: ['100%', '562px'],
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        open={open}
        onClose={handleDrawerClose}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.OnPrimary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors.OnPrimary,
              px: '1.2rem',
              py: '1rem',
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <img src='/icons/Activity.svg' alt='Cluster Icon' width='32px' />
              <Typography
                sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                Add Rooms
              </Typography>
            </Box>

            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
              <Icon icon='mdi:close' fontSize={30} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', px: 6, pt: 6 }}>
            <Card sx={{ px: 4, py: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Avatar
                  src='/images/hospital/hospital-icon.svg'
                  alt='Hospital Icon'
                  sx={{
                    width: 56,
                    height: 56,
                    backgroundColor: theme.palette.customColors.antzNotes80,
                    borderRadius: '8px',
                    p: '8px'
                  }}
                  slotProps={{
                    img: {
                      style: { objectFit: 'contain' }
                    }
                  }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: 200
                  }}
                >
                  <Tooltip title={selectedHospital?.name}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '20px',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {selectedHospital?.name}
                    </Typography>
                  </Tooltip>
                  {selectedHospital?.site_name && (
                    <Tooltip title={selectedHospital?.site_name || '-'}>
                      <Typography
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '14px'
                        }}
                      >
                        {selectedHospital?.site_name || '-'}
                      </Typography>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              <Grid container spacing={4} alignItems='center' justifyContent='space-between'>
                <Grid item xs={3} md={2}>
                  <Box>
                    {isHospitalStatsLoading ? (
                      <ShimmerBox width='60px' height='24px' mb={1} />
                    ) : (
                      <Typography
                        sx={{
                          mb: 1,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontWeight: 600,
                          fontSize: '16px'
                        }}
                      >
                        {hospitalStats ? hospitalStats.total_rooms : '-'}
                      </Typography>
                    )}
                    <Typography
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontSize: '14px'
                      }}
                    >
                      Total Rooms
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={3} md={2}>
                  <Box>
                    {isHospitalStatsLoading ? (
                      <ShimmerBox width='60px' height='24px' mb={1} />
                    ) : (
                      <Typography
                        sx={{
                          mb: 1,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontWeight: 600,
                          fontSize: '16px'
                        }}
                      >
                        {hospitalStats ? hospitalStats.total_beds : '-'}
                      </Typography>
                    )}
                    <Typography
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontSize: '14px'
                      }}
                    >
                      Total beds
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={3} md={2}>
                  <Box>
                    {isHospitalStatsLoading ? (
                      <ShimmerBox width='60px' height='24px' mb={1} />
                    ) : (
                      <Typography
                        sx={{
                          mb: 1,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontWeight: 600,
                          fontSize: '16px'
                        }}
                      >
                        {hospitalStats ? hospitalStats.available_beds : '-'}
                      </Typography>
                    )}
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontSize: '14px'
                      }}
                    >
                      Available Beds
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={3} md={2}>
                  <Box>
                    {isHospitalStatsLoading ? (
                      <ShimmerBox width='60px' height='24px' mb={1} />
                    ) : (
                      <Typography
                        sx={{
                          mb: 1,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontWeight: 600,
                          fontSize: '16px'
                        }}
                      >
                        {hospitalStats ? hospitalStats.occupied_beds : '-'}
                      </Typography>
                    )}
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontSize: '14px'
                      }}
                    >
                      Occupied Beds
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>
            <form onSubmit={handleSubmit(onAddClick)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 8 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Room
                </Typography>
                <ControlledTextField
                  name='room'
                  label='Enter Room Name'
                  control={control}
                  errors={errors}
                  required
                  inputBackgroundColor={theme.palette.customColors.Surface}
                  fullWidth
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Floor
                </Typography>
                <ControlledTextField
                  name='floor'
                  label='Enter Floor'
                  control={control}
                  errors={errors}
                  required
                  inputBackgroundColor={theme.palette.customColors.Surface}
                  fullWidth
                />
              </Box>
            </form>
          </Box>
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Button
              variant='outlined'
              fullWidth
              onClick={handleDrawerClose}
              sx={{
                borderColor: theme.palette.customColors.OnPrimaryContainer,
                color: theme.palette.customColors.OnPrimaryContainer,
                height: '56px'
              }}
            >
              Close
            </Button>
            <Button
              variant='contained'
              fullWidth
              onClick={handleSubmit(onAddClick)}
              sx={{ height: '56px' }}
              disabled={addLoading}
            >
              {addLoading ? <CircularProgress size={24} /> : 'ADD ROOM'}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default AddRoomDrawer
