import { yupResolver } from '@hookform/resolvers/yup'
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
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import { AddAllocation, GetAssesmentTypes } from 'src/lib/api/egg/allocation'
import { getIncubatorList } from 'src/lib/api/egg/incubator'
import { GetNurseryList } from 'src/lib/api/egg/nursery'
import { GetRoomList } from 'src/lib/api/egg/room/getRoom'
import * as yup from 'yup'

const AllocationSlider = ({ setOpenDrawer, allocateEggId, callApi, allocationValues, getDetails }) => {
  // const [nurseryName, setNurseryName] = useState([])
  // const [roomName, setRoomName] = useState([])
  const [incubatorList, setIncubatorList] = useState([])

  const [assesmentTypes, setAssesmentTypes] = useState([])
  const [loader, setLoader] = useState(false)
  const [defaultNursery, setDefaultNursery] = useState(null)
  const [nurseryList, setNurseryList] = useState([])
  const [roomList, setRoomList] = useState([])
  const [defaultRoom, setDefaultRoom] = useState(null)
  const [defaultIncubator, setDefaultIncubator] = useState(null)

  const [nurseryId, setNurseryId] = useState([])

  const schema = yup.object().shape({
    room: yup.string().required('Room is required'),
    incubator: yup.string().required('Incubator name is required'),
    measurements: yup
      .array()
      .of(
        yup.object().shape({
          assessment_value: yup
            .number()
            .typeError('Value must be a number')
            .required('Weight is required')
            .positive('Value must be positive') // Ensure positive
            .min(1, 'Value must be greater than or equal to 1') // Ensure non-negative
        })
      )
      .required('At least one measurement is required')
  })

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

  const { fields, append, prepend } = useFieldArray({
    control,
    name: 'measurements'
  })

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
          // console.log('assesmentTypes :>> ', assesmentTypes)
          assesmentTypes.data.forEach(item => {
            append(item)
          })
        }
        setLoader(false)
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
    if (allocationValues?.nursery_id) {
      RoomList(allocationValues?.nursery_id)
    }
  }, [allocationValues?.nursery_id])

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
    if (allocationValues?.nursery_id) {
      setDefaultNursery({ nursery_id: allocationValues?.nursery_id, nursery_name: allocationValues?.nursery_name })

      setValue('nursery_name', allocationValues?.nursery_id)
    }
  }, [allocationValues])

  const onSubmit = async values => {
    try {
      setLoader(true)

      let params = {
        egg_id: allocateEggId,
        incubator_id: values.incubator,
        egg_initial_assessment: JSON.stringify(values.measurements)
      }
      const response = await AddAllocation(params)
      if (response.success) {
        Toaster({ type: 'success', message: response.message })
        if (getDetails) {
          getDetails(allocateEggId)
        }
        if (callApi) {
          callApi('')
        }
        setLoader(false)
        setOpenDrawer(false)
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
    <>
      <Drawer
        anchor='right'
        open={open}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'

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

        <Box
          className='sidebar-body'
          sx={
            assesmentTypes?.data?.length >= 5
              ? {
                  backgroundColor: 'background.default',
                  height: '120%',
                  overflowY: 'scroll',
                  border: '1px solid #ccc'
                }
              : {
                  backgroundColor: 'background.default',
                  height: '120%'
                }
          }
        >
          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ px: 4 }}>
              {/* <Typography variant='h6' sx={{ mt: 5 }}>
                Incubator Selection
              </Typography> */}

              <CardContent
                sx={{
                  mt: 3,
                  px: 0.5,
                  bgcolor: '#fff',
                  borderRadius: '8px',
                  padding: '20px, 16px, 20px, 16px',
                  border: '1px solid #C3CEC7'
                }}
              >
                <FormControl fullWidth sx={{ width: '95%', ml: 3, mt: 2 }}>
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

                            // console.log('val', val)

                            // setValue('nursery', e.target.value)
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

                <FormControl fullWidth sx={{ width: '95%', ml: 3, mt: 3 }}>
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
                        options={roomList?.length > 0 ? roomList : []}
                        getOptionLabel={option => option.room_name}
                        isOptionEqualToValue={(option, value) => option?.room_id === value?.room_id}
                        onChange={(e, val) => {
                          if (val === null) {
                            setDefaultRoom(null)

                            return onChange('')
                          } else {
                            setDefaultRoom(val)

                            // console.log('val', val)
                            setValue('room', '')

                            return onChange(val.room_id)
                          }
                        }}
                        renderInput={params => (
                          <TextField
                            onChange={e => {
                              searchRoom(allocationValues?.nursery_id, e.target.value)
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

                <FormControl fullWidth sx={{ width: '95%', ml: 3, mt: 3 }}>
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

                            // console.log('val', val)
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

                {/* <FormControl sx={{ width: '95%', ml: 3, mt: 6, mb: 4 }}>
                  <InputLabel error={Boolean(errors?.room)} id='room_label'>
                    Room*
                  </InputLabel>
                  <Controller
                    name='room'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange }, fieldState: { error } }) => (
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
                </FormControl> */}

                {/* <FormControl sx={{ width: '95%', ml: 3, mt: 1, mb: 0 }}>
                  <InputLabel error={Boolean(errors?.incubator)} id='incubator_label'>
                    Incubator*
                  </InputLabel>
                  <Controller
                    name='incubator'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange }, fieldState: { error } }) => (
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
                </FormControl> */}
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
              <Card
                fullWidth
                sx={{ mt: 2, mx: 4, marginBottom: '122px', boxShadow: 'none', border: '1px solid #C3CEC7' }}
              >
                <CardContent sx={{ mt: '-1px' }}>
                  {fields.map((measurement, index) => (
                    <Grid container spacing={3} key={index}>
                      <Grid item xs={6} sx={{ borderRadius: '5px' }}>
                        <FormControl fullWidth sx={{ mt: 3, borderRadius: '5px' }}>
                          <Controller
                            name={`measurements[${index}].assessment_value`}
                            control={control}
                            render={({ field: { value, onChange }, fieldState: { error } }) => (
                              <div>
                                <TextField
                                  sx={{ borderRadius: '4px' }}
                                  label={`${
                                    measurement.assessment_type_string_id.charAt(0).toUpperCase() +
                                    measurement.assessment_type_string_id.slice(1)
                                  }*`}
                                  value={value}
                                  onChange={e => {
                                    // debugger
                                    const inputValue = e.target.value
                                    if (inputValue === '' || parseFloat(inputValue) >= 1) {
                                      onChange(e)
                                      clearErrors(`measurements[${index}].assessment_value`)
                                    } else {
                                      setError(`measurements[${index}].assessment_value`, {
                                        type: 'custom',
                                        message: 'Non-negative '
                                      })

                                      // Update error state in react-hook-form if negative value
                                      onChange(e) // Ensures the negative value is not stored in form state
                                    }
                                  }}
                                  name={`measurements[${index}].assessment_value`}
                                  inputProps={{ type: 'number', step: 'any' }}
                                  error={!!error}
                                  fullWidth
                                />
                                {error && error.type === 'validate' && (
                                  <FormHelperText sx={{ color: 'error.main' }}>{error.message}</FormHelperText>
                                )}
                              </div>
                            )}
                            rules={{
                              required: 'Please enter a value',
                              validate: {
                                nonNegative: value => parseFloat(value) >= 1 || 'Negative values are not allowed'
                              }
                            }}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth sx={{ mt: 3 }}>
                          <InputLabel error={Boolean(errors?.site_id)} id={`unit_label_${index}`}>
                            {measurement?.unit_name.charAt(0).toUpperCase() + measurement?.unit_name.slice(1)}
                          </InputLabel>

                          <Controller
                            name={`measurements[${index}].measurement_unit_id`}
                            control={control}
                            rules={{ required: true }}
                            defaultValue={measurement.unit_id}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                sx={{ borderRadius: '5px' }}
                                name={`measurements[${index}].measurement_unit_id`}
                                value={value}
                                disabled={measurement.default_measurement_unit_string_id && true}
                                label={measurement?.unit_name}
                                onChange={onChange}
                                error={Boolean(errors?.condition)}
                                labelId={`unit_label_${index}`}
                                fullWidth
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
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <Box
                sx={{
                  height: '100px',
                  width: '100%',
                  maxWidth: '562px',
                  position: 'fixed',
                  bottom: 0,
                  zIndex: 1,
                  px: 4,
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
