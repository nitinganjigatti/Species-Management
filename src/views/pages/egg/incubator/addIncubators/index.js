import { useState, useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import React, { useRef } from 'react'
import { DatePicker, LoadingButton } from '@mui/lab'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import * as yup from 'yup'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  LinearProgress,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Typography,
  debounce
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { DateField } from '@mui/x-date-pickers'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { GetRoomList } from 'src/lib/api/egg/room/getRoom'
import Popper from '@mui/material/Popper'
import { styled } from '@mui/material/styles'
import { addIncubator, updateIncubator } from 'src/lib/api/egg/incubator'
import { useRouter } from 'next/router'
import Toaster from 'src/components/Toaster'

const AddIncubators = ({
  incubatorDetail,
  actionApi,
  isEdit,
  sidebarOpen,
  handleSidebarClose,
  isPreFilled,
  detailsApi
}) => {
  const router = useRouter()
  const { id } = router.query
  const [defaultNursery, setDefaultNursery] = useState(null)
  const [defaultRoom, setDefaultRoom] = useState(null)
  const [nurseryList, setNurseryList] = useState([])
  const [roomList, setRoomList] = useState([])
  const [btnDisabled, setBtnDisabled] = useState(false)

  const defaultValues = {
    incubator_name: '',
    nursery: '',
    room: '',
    maxNumberOfEggs: ''
  }

  const schema = yup.object().shape({
    incubator_name: yup.string().trim().required('Incubator name is required'),
    nursery: yup.string().required('Nursery is required'),
    room: yup.string().required('Room is required'),
    maxNumberOfEggs: yup.string().required('Max number of eggs is required')
  })

  useEffect(() => {
    if (isEdit && sidebarOpen) {
      try {
        setValue('incubator_name', incubatorDetail?.incubator_name)
        setValue('nursery', incubatorDetail?.nursery_id)
        setValue('room', incubatorDetail?.room_id)
        setValue('maxNumberOfEggs', incubatorDetail?.max_eggs)
        RoomList(incubatorDetail?.nursery_id)
      } catch (error) {
        console.log('error', error)
      }
    }
    if (isPreFilled) {
      // console.log('isPreFilled :>> ', isPreFilled)
      RoomList(isPreFilled?.nursery_id)
      setDefaultNursery({ nursery_id: isPreFilled?.nursery_id, nursery_name: isPreFilled?.nursery_name })
      setValue('nursery', isPreFilled?.nursery_id)
      setDefaultRoom({ room_id: isPreFilled?.room_id, room_name: isPreFilled?.room_name })
      setValue('room', isPreFilled?.room_id)
    }
  }, [sidebarOpen])

  useEffect(() => {
    if (incubatorDetail) {
      RoomList(incubatorDetail?.nursery_id)
      setValue('nursery', incubatorDetail?.nursery_id)
      setDefaultNursery({ nursery_id: incubatorDetail?.nursery_id, nursery_name: incubatorDetail?.nursery_name })
      setValue('room', incubatorDetail?.room_id)
      setDefaultRoom({ room_id: incubatorDetail?.room_id, room_name: incubatorDetail?.room_name })
      setValue('incubator_name', incubatorDetail?.incubator_name)
      setValue('maxNumberOfEggs', Number(incubatorDetail?.max_eggs))
    }
  }, [incubatorDetail])

  const NurseryList = async (q, id) => {
    try {
      const params = {
        page: 1,
        limit: 50,
        nursery_id: id,
        search: q
      }
      await GetNurseryList({ params: params }).then(res => {
        setNurseryList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

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

  const RoomList = async (id, q) => {
    try {
      const params = {
        page: 1,
        limit: 50,
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
    NurseryList()
  }, [])

  const {
    reset,
    control,
    setValue,
    setError,
    watch,
    getValues,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = val => {
    setBtnDisabled(true)
    if (isEdit) {
      try {
        updateIncubator(id, {
          nursery_id: val?.nursery,
          room_id: val?.room,
          max_eggs: Number(val?.maxNumberOfEggs),
          incubator_name: val?.incubator_name
        }).then(res => {
          if (res.success) {
            reset()
            handleSidebarClose()
            setBtnDisabled(false)
            Toaster({ type: 'success', message: res.message })
            if (actionApi) {
              actionApi('')
            }
          } else {
            setBtnDisabled(false)
            Toaster({ type: 'error', message: res.message })
          }
        })
      } catch (error) {
        setBtnDisabled(false)
        console.log(error)
      }
    } else {
      try {
        addIncubator({
          nursery_id: val?.nursery,
          room_id: val?.room,
          max_eggs: val?.maxNumberOfEggs
          // incubator_name: val?.incubator_name
        }).then(res => {
          if (res.success) {
            reset()
            if (actionApi) {
              actionApi('')
            }
            if (detailsApi) {
              detailsApi()
            }
            handleSidebarClose()
            setBtnDisabled(false)
            Toaster({ type: 'success', message: res.message })
          } else {
            setBtnDisabled(false)
            Toaster({ type: 'error', message: res.message })
          }
        })
      } catch (error) {
        setBtnDisabled(false)
        console.log(error)
      }
    }
  }

  const onError = errors => {
    console.log('Form errros', errors)
  }

  const RenderSidebarFooter = () => {
    return (
      <LoadingButton
        sx={{ height: '58px' }}
        disabled={btnDisabled}
        fullWidth
        size='large'
        type='submit'
        variant='contained'
      >
        {isEdit ? 'EDIT' : 'ADD'} INCUBATOR
      </LoadingButton>
    )
  }

  // const CustomPopper = styled(props => <Popper {...props} placement='bottom-start' />)({
  //   zIndex: 2000 // Ensure it appears above other elements
  // })
  return (
    <Drawer
      anchor='right'
      open={sidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: '562px' }
      }}
    >
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            justifyContent: 'space-between'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              px: '20px',
              bgcolor: 'background.default',
              height: '80px',
              width: '562px'
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                style={{ marginLeft: -8 }}
                icon='material-symbols-light:add-notes-outline-rounded'
                fontSize={'32px'}
              />
              <Typography variant='h6'>{isEdit ? 'Edit' : 'Add'} Incubator</Typography>
            </Box>
            <IconButton
              size='small'
              onClick={() => {
                handleSidebarClose()
                reset()
              }}
              sx={{ color: 'text.primary' }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
          <Box flexGrow={1} sx={{ alignSelf: 'stretch' }}>
            <Box
              sx={{
                mx: '20px',
                border: 1,
                px: '16px',
                py: '24px',
                borderColor: '#C3CEC7',
                borderRadius: '8px',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
            >
              <FormControl fullWidth>
                {/* <InputLabel error={Boolean(errors?.nursery)} id='nursery'>
                      Nursery *
                    </InputLabel> */}

                <Controller
                  name='nursery'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Autocomplete
                      name='nursery'
                      value={defaultNursery}
                      // value={value}
                      disablePortal
                      disabled={isEdit || isPreFilled}
                      id='nursery'
                      options={nurseryList?.length > 0 ? nurseryList : []}
                      getOptionLabel={option => option.nursery_name}
                      isOptionEqualToValue={(option, value) => option?.nursery_id === value?.nursery_id}
                      onChange={(e, val) => {
                        if (val === null) {
                          setDefaultNursery(null)

                          return onChange('')
                        } else {
                          setDefaultNursery(val)
                          // console.log('val', val)
                          setValue('room', '')
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
                          error={Boolean(errors.nursery)}
                        />
                      )}
                    />

                    // <Select
                    //   name='nursery'
                    //   value={value}
                    //   label='Nursery *'
                    //   onChange={e => {
                    //     // onChange()
                    //     setValue('nursery', e.target.value)
                    //     setValue('room', '')
                    //     RoomList(e.target.value)
                    //   }}
                    //   disabled={isEdit || isPreFilled}
                    //   error={Boolean(errors?.nursery)}
                    //   labelId='nursery'
                    // >
                    //   {nurseryList?.map((item, index) => {
                    //     return (
                    //       <MenuItem key={index} value={item?.nursery_id}>
                    //         {item?.nursery_name}
                    //       </MenuItem>
                    //     )
                    //   })}
                    // </Select>
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
                    // <Select
                    //   name='room'
                    //   value={value}
                    //   label='Room'
                    //   onChange={onChange}
                    //   error={Boolean(errors?.nursery)}
                    //   labelId='room'
                    //   disabled={isEdit || isPreFilled}
                    // >
                    //   {roomList?.map((item, index) => {
                    //     return (
                    //       <MenuItem key={index} value={item?.room_id}>
                    //         {item?.room_name}
                    //       </MenuItem>
                    //     )
                    //   })}
                    // </Select>

                    <Autocomplete
                      name='room'
                      value={defaultRoom}
                      // value={value}
                      disablePortal
                      disabled={isEdit || isPreFilled}
                      id='room'
                      options={roomList?.length > 0 ? roomList : []}
                      getOptionLabel={option => option.room_name}
                      isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
                      onChange={(e, val) => {
                        if (val === null) {
                          setDefaultRoom(null)

                          return onChange('')
                        } else {
                          setDefaultRoom(val)
                          console.log('val', val)
                          setValue('room', '')
                          return onChange(val.room_id)
                        }
                      }}
                      renderInput={params => (
                        <TextField
                          onChange={e => {
                            searchRoom(defaultNursery.nursery_id, e.target.value)
                          }}
                          {...params}
                          label='Select Room *'
                          placeholder='Search & Select'
                          error={Boolean(errors.nursery)}
                        />
                      )}
                    />
                  )}
                />
                {errors?.room && <FormHelperText sx={{ color: 'error.main' }}>{errors?.room?.message}</FormHelperText>}
              </FormControl>
              <FormControl fullWidth>
                <Controller
                  name='incubator_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Incubator Name *'
                      value={value}
                      onChange={onChange}
                      placeholder='Incubator Name'
                      error={Boolean(errors.incubator_name)}
                      name='incubator_name'
                    />
                  )}
                />
                {errors.incubator_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.incubator_name?.message}</FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth>
                <Controller
                  name='maxNumberOfEggs'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Max Number Of Eggs *'
                      value={value}
                      type='number'
                      inputProps={{ min: 1 }}
                      onChange={onChange}
                      placeholder='Max Number Of Eggs'
                      error={Boolean(errors.maxNumberOfEggs)}
                      name='maxNumberOfEggs'
                    />
                  )}
                />
                {errors.maxNumberOfEggs && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.maxNumberOfEggs?.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
          </Box>

          <Box
            sx={{
              height: '122px',
              width: '100%',
              bgcolor: 'white',
              px: '16px',
              py: '32px'
            }}
          >
            <RenderSidebarFooter />
          </Box>
        </Box>
      </form>
    </Drawer>
  )
}

export default AddIncubators
