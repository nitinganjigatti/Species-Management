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
import { addIncubator } from 'src/lib/api/egg/incubator'

const AddIncubators = ({ incubatorDetail, actionApi, isEdit, sidebarOpen, handleSidebarClose }) => {
  const [defaultNursery, setDefaultNursery] = useState(null)
  const [nurseryList, setNurseryList] = useState([])
  const [roomList, setRoomList] = useState([])

  const defaultValues = {
    incubator_name: '',
    nursery: '',
    room: '',
    maxNumberOfEggs: ''
  }

  const schema = yup.object().shape({
    incubator_name: yup.string().required('incubator Name is Required'),
    nursery: yup.string().required('Nursery is Required'),
    room: yup.string().required('Room is Required'),
    maxNumberOfEggs: yup.string().required('Max Number Of Eggs is Required')
  })

  // useEffect(() => {
  //   if (isEdit) {
  //     try {
  //       setValue('incubator_name', incubatorDetail?.incubator_name)
  //       setValue('nursery', incubatorDetail?.nursery_id)
  //       setValue('room', incubatorDetail?.room_id)
  //       setValue('maxNumberOfEggs', incubatorDetail?.no_of_eggs)

  //       console.log('incubatorDetail?', incubatorDetail)
  //     } catch (error) {
  //       console.log('error', error)
  //     }
  //   }
  // }, [incubatorDetail])
  useEffect(() => {
    if (isEdit && sidebarOpen) {
      try {
        setValue('incubator_name', incubatorDetail?.incubator_name)
        setValue('nursery', incubatorDetail?.nursery_id)
        setValue('room', incubatorDetail?.room_id)
        setValue('maxNumberOfEggs', incubatorDetail?.no_of_eggs)

        console.log('incubatorDetail?', incubatorDetail)
      } catch (error) {
        console.log('error', error)
      }
    }
  }, [sidebarOpen])

  const NurseryList = async () => {
    try {
      const params = {
        page: 1,
        limit: 50
      }
      await GetNurseryList({ params: params }).then(res => {
        setNurseryList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const RoomList = async () => {
    try {
      const params = {
        page: 1,
        limit: 50
      }
      await GetRoomList({ params: params }).then(res => {
        setRoomList(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    NurseryList()
    RoomList()
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
    if (isEdit) {
      try {
        updateIncubator(id, {
          nursery_id: val?.nursery,
          room_id: val?.room,
          max_eggs: val?.maxNumberOfEggs,
          incubator_name: val?.incubator_name
        }).then(res => {
          if (res.success) {
            console.log('res', res)
            actionApi('')
            reset()
            handleSidebarClose()
          } else {
          }
        })
      } catch (error) {
        console.log(error)
      }
    } else {
      try {
        addIncubator({
          nursery_id: val?.nursery,
          room_id: val?.room,
          max_eggs: val?.maxNumberOfEggs,
          incubator_name: val?.incubator_name
        }).then(res => {
          if (res.success) {
            console.log('res', res)
            actionApi('')
            reset()
            handleSidebarClose()
          } else {
          }
        })
      } catch (error) {
        console.log(error)
      }
    }
  }
  const onError = errors => {
    console.log('Form errros', errors)
  }

  const RenderSidebarFooter = () => {
    return (
      <LoadingButton fullWidth size='large' type='submit' variant='contained'>
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
        '& .MuiDrawer-paper': { width: ['100%', '502px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <Box sx={{ position: 'fixed', top: 0, bgcolor: 'background.default', zIndex: 10, width: '502px' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(4, 5)
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
        </Box>

        <Box sx={{ marginBottom: 84, marginTop: 14, height: '95%', overflowY: 'auto', bgcolor: 'background.default' }}>
          <Box sx={{ m: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <FormControl fullWidth>
                    <Controller
                      name='incubator_name'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          label='Incubator Name'
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
                    <InputLabel error={Boolean(errors?.nursery)} id='nursery'>
                      Nursery
                    </InputLabel>

                    <Controller
                      name='nursery'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        // <Autocomplete
                        //   value={defaultNursery}
                        //   disablePortal
                        //   id='nursery'
                        //   options={nurseryList?.length > 0 ? nurseryList : []}
                        //   getOptionLabel={option => option.nursery_name}
                        //   isOptionEqualToValue={(option, value) => option?.nursery_id === value?.nursery_id}
                        //   onChange={(e, val) => {
                        //     if (val === null) {
                        //       setDefaultNursery(null)

                        //       return onChange('')
                        //     } else {
                        //       setDefaultNursery(val)

                        //       return onChange(val.nursery_id)
                        //     }
                        //   }}
                        //   renderInput={params => (
                        //     <TextField
                        //       {...params}
                        //       label='Select Nursery'
                        //       placeholder='Search & Select'
                        //       error={Boolean(errors.nursery)}
                        //     />
                        //   )}
                        // />

                        <Select
                          name='nursery'
                          value={value}
                          label='Nursery'
                          onChange={onChange}
                          error={Boolean(errors?.nursery)}
                          labelId='nursery'
                        >
                          {nurseryList?.map((item, index) => {
                            return (
                              <MenuItem key={index} value={item?.nursery_id}>
                                {item?.nursery_name}
                              </MenuItem>
                            )
                          })}
                        </Select>
                      )}
                    />
                    {errors?.nursery && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.nursery?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel error={Boolean(errors?.room)} id='room'>
                      Room
                    </InputLabel>
                    <Controller
                      name='room'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='room'
                          value={value}
                          label='Room'
                          onChange={onChange}
                          error={Boolean(errors?.nursery)}
                          labelId='room'
                        >
                          {roomList?.map((item, index) => {
                            return (
                              <MenuItem key={index} value={item?.room_id}>
                                {item?.room_name}
                              </MenuItem>
                            )
                          })}
                        </Select>
                      )}
                    />
                    {errors?.room && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.room?.message}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl fullWidth>
                    <Controller
                      name='maxNumberOfEggs'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          label='Max Number Of Eggs'
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
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box
          sx={{
            height: '100px',
            width: '100%',
            maxWidth: '502px',
            position: 'fixed',
            bottom: 0,
            px: 4,
            zIndex: 199,
            bgcolor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex'
          }}
        >
          <RenderSidebarFooter />
        </Box>
      </form>
    </Drawer>
  )
}

export default AddIncubators
