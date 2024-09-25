import {
  Autocomplete,
  Avatar,
  debounce,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'
import { LoadingButton } from '@mui/lab'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { GetRoomList } from 'src/lib/api/egg/room/getRoom'
import * as yup from 'yup'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { getIncubatorList } from 'src/lib/api/egg/incubator'
import { transferEggToIncubator } from 'src/lib/api/egg/egg'
import Toaster from 'src/components/Toaster'

const TransferEgg = ({ transferEggSideBar, setTransferEggSideBar, eggDetails, getDetails, egg_id }) => {
  const theme = useTheme()

  const [loader, setLoader] = useState(false)
  const [nurseryList, setNurseryList] = useState([])
  const [defaultNursery, setDefaultNursery] = useState(null)
  const [roomList, setRoomList] = useState([])
  const [defaultRoom, setDefaultRoom] = useState(null)
  const [incubatorList, setIncubatorList] = useState([])
  const [defaultIncubator, setDefaultIncubator] = useState(null)

  const schema = yup.object().shape({
    room: yup.string().required('Room is required'),
    incubator: yup.string().required('Incubator name is required')
  })

  const defaultValues = {
    nursery_name: '',
    room: '',
    incubator: ''
  }

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState,
    setError,
    reset,
    clearErrors,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const NurseryList = async q => {
    try {
      const params = {
        page: 1,
        limit: 50,
        search: q
      }
      await GetNurseryList({ params: params }).then(res => {
        setNurseryList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }
  useEffect(() => {
    NurseryList()
  }, [])

  const searchNursery = useCallback(
    debounce(async q => {
      try {
        await NurseryList(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const roomId = watch('room')

  const RoomList = async (id, q) => {
    try {
      const params = {
        page: 1,
        limit: 50,
        status: 'active',
        nursery_id: id,
        search: q
      }
      await GetRoomList({ params: params }).then(res => {
        setRoomList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const searchRoom = useCallback(
    debounce(async (id, q) => {
      try {
        await RoomList(id, q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    if (eggDetails?.nursery_id) {
      RoomList(eggDetails?.nursery_id)
    }
  }, [eggDetails?.nursery_id])
  // useEffect(() => {
  //   if (eggDetails?.room_id) {
  //     fetchIncubatorData(eggDetails?.room_id)
  //   }
  // }, [eggDetails?.room_id])

  const fetchIncubatorData = async (id, q) => {
    const params = {
      room_id: id,
      q,
      type: 'only_active'
    }
    const incubatorName = await getIncubatorList({ params: params })

    if (incubatorName?.data?.data?.result) {
      setIncubatorList(incubatorName?.data?.data?.result)
    }
  }

  const searchIncubator = useCallback(
    debounce(async (id, q) => {
      try {
        await fetchIncubatorData(id, q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )
  useEffect(() => {
    if (roomId) {
      fetchIncubatorData(roomId)
    }
  }, [roomId])

  useEffect(() => {
    if (eggDetails?.nursery_id) {
      setDefaultNursery({ nursery_id: eggDetails?.nursery_id, nursery_name: eggDetails?.nursery_name })
      setValue('nursery_name', eggDetails?.nursery_id)
    }
    if (eggDetails?.room_id) {
      setDefaultRoom({ room_id: eggDetails?.room_id, room_name: eggDetails?.room_name })
      setValue('room', eggDetails?.room_id)
    }
  }, [eggDetails])

  const onSubmit = async values => {
    // console.log('values', values)

    try {
      setLoader(true)
      let params = {
        incubator_id: values.incubator,
        egg_ids: [egg_id]
      }
      const response = await transferEggToIncubator(params)
      if (response.success) {
        Toaster({ type: 'success', message: response.message })
        if (getDetails) {
          getDetails(egg_id)
        }
        reset()
        setDefaultIncubator(null)
        setDefaultNursery(null)
        setDefaultRoom(null)
        setTransferEggSideBar(false)
        setLoader(false)
      } else {
        Toaster({ type: 'error', message: response.message })
        setLoader(false)
      }
    } catch (error) {
      console.error('Error while adding', error)
      Toaster({ type: 'error', message: 'An error occurred while adding' })
      setLoader(false)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={transferEggSideBar}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 560], height: '100vh' } }}
    >
      <Box sx={{ height: '100%', backgroundColor: 'background.default' }}>
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            height: '80px',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'background.default'
            }}
          >
            <Box sx={{ mt: 2 }}>
              <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
            </Box>
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontWeight: 500,
                fontSize: '24px',
                lineHeight: '29.05px',
                height: '32px'
              }}
            >
              Transfer Eggs
            </Typography>
          </Box>
          <IconButton
            size='small'
            onClick={() => setTransferEggSideBar(false)}
            sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Box
            sx={{
              backgroundColor: 'background.default',
              px: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 500,
                  fontSize: '20px',
                  lineHeight: '24.2px'
                }}
              >
                Eggs Selected -
              </Typography> */}
              <Box
                sx={{
                  backgroundColor: theme.palette.primary.contrastText,
                  borderRadius: '8px',
                  border: '1px solid #C3CEC7',
                  paddingY: '20px',
                  paddingX: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '19.36px',
                    height: '24px'
                  }}
                >
                  Current Location of Egg
                </Typography>
                <Box
                  sx={{
                    backgroundColor: theme.palette.customColors.mdAntzNeutral,
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16.94px',
                        height: '17px'
                      }}
                    >
                      Incubator ID
                    </Typography>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '19.36px',
                        height: '19px'
                      }}
                    >
                      {eggDetails?.incubator_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16.94px',
                        height: '17px'
                      }}
                    >
                      Room
                    </Typography>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '19.36px',
                        height: '19px'
                      }}
                    >
                      {eggDetails?.room_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.neutralSecondary,
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16.94px',
                        height: '17px'
                      }}
                    >
                      Nursery Name
                    </Typography>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '19.36px',
                        height: '19px'
                      }}
                    >
                      {eggDetails?.nursery_name}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Typography
                sx={{
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontWeight: 500,
                  fontSize: '20px',
                  lineHeight: '24.2px',
                  height: '24.2px'
                }}
              >
                Select room and incubator
              </Typography>
              <Box
                sx={{
                  backgroundColor: theme.palette.primary.contrastText,
                  borderRadius: '8px',
                  border: '1px solid #C3CEC7',
                  paddingY: '20px',
                  paddingX: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px'
                }}
              >
                <FormControl fullWidth>
                  <Controller
                    name='nursery_name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        name='nursery_name'
                        value={defaultNursery}
                        disablePortal
                        disabled={eggDetails?.nursery_id}
                        id='nursery_name'
                        options={nurseryList?.length > 0 ? nurseryList : []}
                        getOptionLabel={option => option.nursery_name}
                        isOptionEqualToValue={(option, value) => option?.nursery_id === value?.nursery_id}
                        onChange={(e, val) => {
                          if (val === null) {
                            setDefaultNursery(null)

                            return onChange('')
                          } else {
                            setDefaultNursery(val)

                            setValue('nursery_name', '')
                            RoomList(val.nursery_id)

                            return onChange(val.nursery_id)
                          }
                        }}
                        renderInput={params => (
                          <TextField
                            onChange={e => {
                              searchNursery(e.target.value)
                            }}
                            {...params}
                            label='Select Nursery *'
                            placeholder='Search & Select'
                            error={Boolean(errors.nursery_name)}
                          />
                        )}
                      />
                    )}
                  />
                  {errors?.nursery && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.nursery?.message}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth>
                  <Controller
                    name='room'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        name='room'
                        value={defaultRoom}
                        disablePortal
                        id='room'
                        // disabled={eggDetails?.room_id}
                        options={roomList?.length > 0 ? roomList : []}
                        getOptionLabel={option => option.room_name}
                        isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
                        onChange={(e, val) => {
                          if (val === null) {
                            setDefaultRoom(null)

                            return onChange('')
                          } else {
                            setDefaultRoom(val)
                            setValue('room', '')

                            return onChange(val.room_id)
                          }
                        }}
                        renderInput={params => (
                          <TextField
                            onChange={e => {
                              searchRoom(eggDetails?.nursery_id, e.target.value)
                            }}
                            {...params}
                            label='Select Room *'
                            placeholder='Search & Select'
                            error={Boolean(errors.room)}
                          />
                        )}
                      />
                    )}
                  />
                  {errors?.room && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.room?.message}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth>
                  <Controller
                    name='incubator'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        name='incubator'
                        value={defaultIncubator}
                        disablePortal
                        id='incubator'
                        options={incubatorList?.length > 0 ? incubatorList : []}
                        getOptionLabel={option => option.incubator_name}
                        isOptionEqualToValue={(option, value) => option?.incubator_id === value?.incubator_id}
                        onChange={(e, val) => {
                          if (val === null) {
                            setDefaultIncubator(null)

                            return onChange('')
                          } else {
                            setDefaultIncubator(val)
                            setValue('incubator', '')
                            return onChange(val.incubator_id)
                          }
                        }}
                        renderInput={params => (
                          <TextField
                            onChange={e => {
                              searchIncubator(roomId, e.target.value)
                            }}
                            {...params}
                            label='Select Incubator *'
                            placeholder='Search & Select'
                            error={Boolean(errors.incubator)}
                          />
                        )}
                      />
                    )}
                  />
                  {errors?.incubator && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.incubator?.message}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              height: '122px',
              width: '100%',
              maxWidth: '562px',
              position: 'fixed',
              bottom: 0,
              zIndex: 1,
              px: '32px',
              bgcolor: 'white',
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex'
            }}
          >
            <LoadingButton
              fullWidth
              variant='contained'
              type='submit'
              disabled={!formState.isValid || loader}
              sx={{ height: '58px' }}
            >
              Transfer
            </LoadingButton>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default TransferEgg
