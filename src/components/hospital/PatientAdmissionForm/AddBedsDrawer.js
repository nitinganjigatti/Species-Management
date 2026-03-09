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
import React, { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useForm } from 'react-hook-form'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { debounce } from 'lodash'
import { getHospitalRoomsList } from 'src/lib/api/hospital/roomsAndEnclosures'
import { addHospitalBed } from 'src/lib/api/hospital/hospitalBeds'
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
  room: null,
  bed: ''
}

const schema = yup.object().shape({
  room: yup.object().required('Room is required'),
  bed: yup.string().required('Room is required')
})

const AddBedsDrawer = ({
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
    watch,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [addLoading, setAddLoading] = useState(false)
  const [rooms, setRooms] = useState([])
  const [roomLoading, setRoomLoading] = useState(false)
  const [searchRoom, setSearchRoom] = useState('')

  useEffect(() => {
    const getHospitalRooms = async () => {
      setRoomLoading(true)
      try {
        await getHospitalRoomsList({
          hospital_id: selectedHospital?.id,
          page: 1,
          per_page: 20,
          q: searchRoom

          // availability: 'available'
        }).then(res => {
          if (res?.success === true) {
            const filteredRooms = res?.data?.records
              ?.filter(item => item?.status !== '0')
              ?.map(item => ({
                label: item?.room_name,
                value: item?.id
              }))
            setRooms(filteredRooms)
            setRoomLoading(false)
          } else {
            setRooms([])
            setRoomLoading(false)
          }
        })
      } catch (error) {
        console.error(error, 'cannot Fetch hospital rooms listing')
      }
    }

    getHospitalRooms()
  }, [selectedHospital, searchRoom])

  const watchRoom = watch('room')

  const handleDrawerClose = () => {
    setOpen(false)
    reset({
      room: null,
      bed: ''
    })
  }

  useEffect(() => {
    if (selectedHospital?.id && !hospitalStats) {
      fetchAndUpdateHospitalStats(selectedHospital?.id)
    }
  }, [selectedHospital])

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
        room_id: data?.room?.value,
        bed_name: data?.bed,
        status: '1',
        prefix: selectedHospital?.id
      }

      const res = await addHospitalBed(payload)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message })
        setAddLoading(false)
        if (selectedHospital?.id) {
          fetchAndUpdateHospitalStats(selectedHospital?.id)
        }
        handleDrawerClose()

        // reset({
        //   // room: null,
        //   bed: ''
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

  const debouncedSearch = React.useMemo(() => debounce(val => setSearchRoom(val), 1000), [])

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
                Add Enclosures
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
                    maxWidth: {
                      xs: 220,
                      sm: 400
                    }
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
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                      Total Enclosures
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                      Available Enclosures
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                      Occupied Enclosures
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
                <ControlledAutocomplete
                  name='room'
                  label='Select Room*'
                  control={control}
                  errors={errors}
                  options={rooms}
                  getOptionValue={option => option.value || ''}
                  getOptionLabel={option => option.label || ''}
                  isOptionEqualToValue={(option, value) => option.value === value?.value}
                  required
                  onInputChange={val => debouncedSearch(val)}
                  sx={{ borderRadius: 1, background: theme.palette.customColors.Surface }}
                  fullWidth
                  endAdornment={() => <>{roomLoading ? <CircularProgress size={20} /> : null}</>}
                  disabled={roomLoading}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Enclosure
                </Typography>
                <ControlledTextField
                  name='bed'
                  label='Enter Enclosure Name*'
                  control={control}
                  errors={errors}
                  required
                  inputBackgroundColor={theme.palette.customColors.Surface}
                  fullWidth
                  disabled={roomLoading || watchRoom === null}
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
              {addLoading ? <CircularProgress size={24} /> : 'ADD ENCLOSURE'}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default AddBedsDrawer
