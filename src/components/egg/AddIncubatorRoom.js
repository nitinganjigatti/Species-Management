import {
  Autocomplete,
  Box,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { AuthContext } from 'src/context/AuthContext'
import { LoadingButton } from '@mui/lab'
import { AddRoom, EditRoom, GetRoomDetails } from 'src/lib/api/egg/room/getRoom'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'

const AddIncubatorRoom = ({ isOpen, setIsOpen, editParams, callApi, isPreFilled, callTableApi }) => {
  const theme = useTheme()

  const [loader, setLoader] = useState(false)
  const authData = useContext(AuthContext)
  const [nurseryList, setNurseryList] = useState([])

  const id = editParams?.room_id
  const [siteDetails, setSiteDetails] = useState({ site_id: '', site_name: '' })
  const [defaultNursery, setDefaultNursery] = useState(null)

  const defaultValues = {
    room_name: '',
    site_id: '',
    nursery: ''
  }

  const schema = yup.object().shape({
    room_name: yup.string().trim().required('Room name is required'),
    site_id: yup.string().required('Select site'),
    nursery: defaultNursery?.nursery_id ? yup.string().notRequired() : yup.string().required('Nursery is required')
  })

  const {
    setValue,
    reset,
    control,
    handleSubmit,
    watch,
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
        type: 'only_active',
        search: q,
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

  useEffect(() => {
    NurseryList()
  }, [])

  const nurseryId = watch('nursery')

  useEffect(() => {
    if (nurseryId) {
      const selectedNursery = nurseryList.find(nursery => nursery.nursery_id === nurseryId)

      // setSiteDetails({ site_id: selectedNursery.site_id, site_name: selectedNursery.site_name })
      setValue('site_id', selectedNursery?.site_id)
      clearErrors('site_id')
    }
  }, [nurseryId])

  useEffect(() => {
    if (isPreFilled) {
      setDefaultNursery({ nursery_id: isPreFilled?.nursery_id, nursery_name: isPreFilled?.nursery_name })

      setValue('site_id', isPreFilled?.site_id)
      setValue('nursery_id', isPreFilled?.nursery_id)
    }
    if (editParams?.nursery_id && editParams?.room_name) {
      setValue('room_name', editParams?.room_name)
      setValue('site_id', editParams?.site_id)
      setDefaultNursery({ nursery_id: editParams?.nursery_id, nursery_name: editParams?.nursery_name })
    }
  }, [isOpen])

  const onSubmit = async values => {
    setLoader(true)
    try {
      const payload = {
        room_name: values?.room_name,
        site_id: values?.site_id,

        nursery_id: defaultNursery?.nursery_id ? defaultNursery?.nursery_id : nurseryId
      }

      if (editParams?.nursery_id) {
        // const payload2 = {
        //   room_name: values?.room_name,
        //   site_id: values?.site_id,

        //   nursery_id: values?.nursery_id
        // }
        // console.log('payload2 :>> ', payload2)

        const response = await EditRoom(id, payload)

        if (response.success) {
          setLoader(false)

          reset()
          if (callApi) {
            callApi()
          }
          if (callTableApi) {
            callTableApi()
          }

          Toaster({ type: 'success', message: response.message })
          handleClose()
        } else {
          setLoader(false)
          // reset()
          Toaster({ type: 'error', message: response.message })
        }
      } else {
        const response = await AddRoom(payload)

        if (response.success) {
          setLoader(false)
          reset()
          Toaster({ type: 'success', message: response.message })
          if (callApi) {
            callApi()
          }
          if (callTableApi) {
            callTableApi()
          }
          handleClose()
        } else {
          setLoader(false)
          // reset()
          Toaster({ type: 'error', message: response.message })
        }
      }
    } catch (error) {
      setLoader(false)
      console.error('Error while adding room:', error)
      reset()
      Toaster({ type: 'error', message: 'An error occurred while adding room' })
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setDefaultNursery(null)
    setValue('site_id', '')
    setValue('nursery', '')

    reset()
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

  return (
    <>
      <Drawer
        anchor='right'
        open={isOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },

          position: 'relative',
          display: 'flex',
          flexDirection: 'column',

          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%' }}>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px',

              bgcolor: theme.palette.customColors.lightBg
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                style={{ marginLeft: -8 }}
                icon='material-symbols-light:add-notes-outline-rounded'
                fontSize={'32px'}
              />
              <Typography variant='h6'> {editParams?.nursery_id ? 'Edit Room' : 'Add Room'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                m: 5,
                px: '16px',
                py: '20px',

                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                bgcolor: '#fff',
                borderRadius: '8px',
                border: 1,
                borderColor: '#c3cec7'
              }}
            >
              <FormControl fullWidth>
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
                      disabled={isPreFilled?.nursery_id}
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

                          // setValue('nursery', e.target.value)
                          setValue('room', '')

                          // RoomList(val.nursery_id)

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
                  )}
                />
                {errors?.nursery && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.nursery?.message}</FormHelperText>
                )}
              </FormControl>

              {/* <FormControl fullWidth>
                <InputLabel error={Boolean(errors?.nursery_id)} id='nursery_id'>
                  Nursery*
                </InputLabel>
                <Controller
                  name='nursery_id'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      name='nursery_id'
                      value={value}
                      label='Nursery*'
                      onChange={onChange}
                      error={Boolean(errors?.nursery_id)}
                      labelId='nursery_id'
                      disabled={isPreFilled?.nursery_id}
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
                {errors?.nursery_id && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.nursery_id?.message}</FormHelperText>
                )}
              </FormControl> */}

              {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors?.site_id)} id='site_id'>
                    Site*
                  </InputLabel>
                  <Controller
                    name='site_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='site_id'
                        value={value}
                        label='Site*'
                        onChange={onChange}
                        error={Boolean(errors?.site_id)}
                        labelId='site_id'
                        disabled
                      >
                        {authData?.userData?.user?.zoos[0].sites?.map((item, index) => {
                          return (
                            <MenuItem key={index} value={item?.site_id}>
                              {item?.site_name}
                            </MenuItem>
                          )
                        })}
                      </Select>
                    )}
                  />
                  {errors?.site_id && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.site_id?.message}</FormHelperText>
                  )}
                </FormControl>
              )}
              <FormControl fullWidth>
                <Controller
                  name='room_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Room Name*'
                      value={value}
                      onChange={onChange}
                      focused={value !== ''}
                      placeholder='Room Name'
                      error={Boolean(errors.room_name)}
                      name='room_name'
                    />
                  )}
                />
                {errors.room_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.room_name?.message}</FormHelperText>
                )}
              </FormControl>
            </Box>

            <Box
              sx={{
                height: '122px',
                width: '100%',
                maxWidth: '562px',
                position: 'fixed',
                bottom: 0,
                px: 4,
                py: '24px',
                bgcolor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex',
                zIndex: 123
              }}
            >
              <LoadingButton
                sx={{ height: '58px' }}
                fullWidth
                variant='contained'
                type='submit'
                size='large'
                loading={loader}
              >
                {editParams?.nursery_id ? 'Edit Room' : 'Add Room'}
              </LoadingButton>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default AddIncubatorRoom
