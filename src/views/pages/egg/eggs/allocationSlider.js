import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Drawer,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'

import { Controller, useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { AddAllocation, GetAssesmentTypes, GetMasterList } from 'src/lib/api/egg/allocation'
import { getIncubatorList } from 'src/lib/api/egg/incubator'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { GetRoomList } from 'src/lib/api/egg/room/getRoom'

const AllocationSlider = ({ setOpenDrawer, allocateEggId, callApi, allocationValues }) => {
  console.log('allocationValues :>> ', allocationValues)
  const [nurseryName, setNurseryName] = useState([])
  const [roomName, setRoomName] = useState([])
  const [incubatorName, setIncubatorName] = useState([])
  const [assesmentTypes, setAssesmentTypes] = useState([])
  const [loader, setLoader] = useState(false)
  const [defaultNursery, setDefaultNursery] = useState(null)
  const [nurseryList, setNurseryList] = useState([])
  const [nurseryId, setNurseryId] = useState([])

  const defaultValues = {
    nursery_name: '',
    room: '',
    incubator: '',
    measurements: ''
  }

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const { fields, append, prepend } = useFieldArray({
    control,
    name: 'measurements'
  })

  // console.log('GetValues >>', getValues())
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoader(true)

        // const nurseryData = await GetNurseryList({ params: '' })
        // if (nurseryData?.data?.result) {
        //   setNurseryName(nurseryData?.data?.result)
        // }

        const assesmentTypes = await GetAssesmentTypes()

        // Append items to the fields array using the API data
        if (assesmentTypes?.data?.length > 0) {
          // console.log('assesment >', assesmentTypes?.data.length)
          assesmentTypes.data.forEach(item => {
            append(item)
          })
        }
        setLoader(false)

        // console.log('Assesment >>', assesmentTypes)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

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

  // const nurseryId = watch('nursery_name')
  const roomId = watch('room')

  // console.log('roomId :>> ', roomId)

  useEffect(() => {
    if (allocationValues?.nursery_id) {
      const fetchData = async () => {
        const params = {
          nursery_id: allocationValues?.nursery_id
        }
        const roomData = await GetRoomList({ params: params })
        if (roomData?.data?.result) {
          setRoomName(roomData?.data?.result)
        }
      }
      fetchData()
    }
  }, [allocationValues?.nursery_id])

  useEffect(() => {
    if (roomId) {
      const fetchIncubatorData = async () => {
        const params = {
          room_id: roomId
        }
        const incubatorName = await getIncubatorList({ params: params })

        // console.log('incubator', incubatorName.data)
        if (incubatorName?.data?.data?.result) {
          setIncubatorName(incubatorName?.data?.data?.result)
        }
      }
      fetchIncubatorData()
    }
  }, [roomId])

  useEffect(() => {
    if (allocationValues?.nursery_id) {
      setDefaultNursery({ nursery_id: allocationValues?.nursery_id, nursery_name: allocationValues?.nursery_name })

      setValue('nursery_name', allocationValues?.nursery_id)
    }
  }, [allocationValues])

  const onSubmit = async values => {
    try {
      let params = {
        egg_id: allocateEggId,
        incubator_id: values.incubator,
        egg_initial_assessment: JSON.stringify(values.measurements)
      }
      const response = await AddAllocation(params)
      if (response.success) {
        Toaster({ type: 'success', message: response.message })

        setOpenDrawer(false)
      } else {
        reset()
        Toaster({ type: 'error', message: response.message })

        if (callApi) {
          callApi()
        }
      }
    } catch (error) {
      reset()
      console.error('Error while adding', error)
      Toaster({ type: 'error', message: 'An error occurred while adding' })
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' }

          // backgroundColor: 'background.default'
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
            <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
            <Typography variant='h6'>Send For Incubation</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDrawer(false)} />
            </IconButton>
          </Box>
        </Box>

        {/* drower */}

        <Box className='sidebar-body' sx={{ backgroundColor: 'background.default' }}>
          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ px: 4 }}>
              {/* <Typography variant='h6' sx={{ mt: 5 }}>
                Incubator Selection
              </Typography> */}

              <CardContent sx={{ mt: 3, bgcolor: '#fff', borderRadius: '8px' }}>
                <FormControl fullWidth sx={{ width: '95%', ml: 3 }}>
                  {/* <InputLabel error={Boolean(errors?.nursery)} id='nursery'>
                      Nursery *
                    </InputLabel> */}

                  <Controller
                    name='nursery_name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Autocomplete
                        name='nursery_name'
                        value={defaultNursery}
                        // value={value}
                        disablePortal
                        disabled={allocationValues?.nursery_id}
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
                            console.log('val', val)

                            // setValue('nursery', e.target.value)
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
                {/* <FormControl sx={{ width: '95%', ml: 3, mt: 4 }}>
                  <InputLabel error={Boolean(errors?.nursery_name)} id='nursery_name_label'>
                    Nursery Name*
                  </InputLabel>
                  <Controller
                    name='nursery_name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='nursery_name'
                        value={value}
                        label='Nursery Name'
                        onChange={onChange}
                        error={Boolean(errors?.nursery_name)}
                        labelId='nursery_name_label'
                        disabled={allocationValues?.nursery_id}
                      >
                        {nurseryName.map(nursery => (
                          <MenuItem key={nursery?.nursery_id} value={nursery?.nursery_id}>
                            {nursery?.nursery_name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.nursery_name?.message}</FormHelperText>
                  )}
                </FormControl> */}

                <FormControl sx={{ width: '95%', ml: 3, mt: 6, mb: 4 }}>
                  <InputLabel error={Boolean(errors?.room)} id='room_label'>
                    Room*
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
                        error={Boolean(errors?.room)}
                        labelId='room_label'
                      >
                        {roomName.map(room => (
                          <MenuItem key={room.room_id} value={room.room_id}>
                            {room.room_name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors && <FormHelperText sx={{ color: 'error.main' }}>{errors?.room?.message}</FormHelperText>}
                </FormControl>

                <FormControl sx={{ width: '95%', ml: 3, mt: 2, mb: 4 }}>
                  <InputLabel error={Boolean(errors?.incubator)} id='incubator_label'>
                    Incubator*
                  </InputLabel>
                  <Controller
                    name='incubator'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='incubator'
                        value={value}
                        label='Incubator'
                        onChange={onChange}
                        error={Boolean(errors?.incubator)}
                        labelId='incubator_label'
                      >
                        {incubatorName.map(incubator => (
                          <MenuItem key={incubator.incubator_id} value={incubator.incubator_id}>
                            {incubator.incubator_name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors && <FormHelperText sx={{ color: 'error.main' }}>{errors?.incubator?.message}</FormHelperText>}
                </FormControl>
              </CardContent>

              <Typography variant='h6' sx={{ mt: 5 }}>
                Egg Measurements
              </Typography>
            </Box>

            {loader ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              fields.map((measurement, index) => (
                <Card fullWidth sx={{ mt: 3, mb: fields.length === index + 1 ? 24 : 7, mx: 4 }} key={index}>
                  <Grid container sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <FormControl sx={{ mt: 5, ml: 3, width: '90%' }}>
                        <Controller
                          name={`measurements[${index}].assessment_value`}
                          control={control}
                          render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <TextField
                              label={`${
                                measurement.assessment_type_string_id.charAt(0).toUpperCase() +
                                measurement.assessment_type_string_id.slice(1)
                              }*`}
                              value={value}
                              onChange={onChange}
                              focused={value !== ''}
                              name={`measurements[${index}].assessment_value`}
                              inputProps={{ type: 'number', step: 'any' }} // Set type to 'number' and step to 'any'
                              error={!!error}
                              helperText={error ? 'Please enter a valid number' : ''}
                            />
                          )}
                          rules={{ required: 'Value is required.' }} // No need for pattern validation for floating point numbers
                        />
                      </FormControl>
                    </Grid>

                    <Grid item xs={6}>
                      <FormControl sx={{ mt: 5, ml: 3, width: '90%' }}>
                        <InputLabel error={Boolean(errors?.site_id)} id='condition_label'>
                          {measurement?.unit_name}
                        </InputLabel>
                        <Controller
                          name={`measurements[${index}].measurement_unit_id`}
                          control={control}
                          rules={{ required: true }}
                          defaultValue={measurement.unit_id}
                          render={({ field: { value, onChange } }) => (
                            <Select
                              name={`measurements[${index}].measurement_unit_id`}
                              value={value}
                              disabled={measurement.default_measurement_unit_string_id && true}
                              label={measurement?.unit_name}
                              onChange={onChange}
                              error={Boolean(errors?.condition)}
                              labelId='condition_label'
                            >
                              <MenuItem key={measurement.unit_id} value={measurement.unit_id}>
                                {measurement?.unit_name}
                              </MenuItem>
                            </Select>
                          )}
                        />
                        {errors && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors?.condition?.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sx={{ display: 'none' }}>
                      <FormControl fullWidth>
                        <Controller
                          name={`measurements[${index}].assessment_type_id`}
                          control={control}
                          render={({ field }) => <input type='hidden' {...field} />}
                          defaultValue={measurement.assessment_type_id}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </Card>
              ))
            )}
            <Card>
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 0,
                  height: '122px',

                  backgroundColor: '#fff',
                  width: '562px',
                  px: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LoadingButton
                  fullWidth
                  variant='contained'
                  type='submit'
                  disabled={loader && true}
                  sx={{ height: '50px' }}
                >
                  Submit
                </LoadingButton>
              </Box>
            </Card>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default AllocationSlider
