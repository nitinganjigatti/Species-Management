/* eslint-disable react/jsx-key */
/* eslint-disable lines-around-comment */
/* eslint-disable newline-before-return */
import React, { useState, useEffect, useRef } from 'react'

// ** MUI Imports

import {
  Grid,
  Card,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  CardHeader,
  InputLabel,
  CardContent,
  FormControl,
  FormHelperText,
  Box,
  Stack,
  Typography,
  Switch,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'

import { LoadingButton } from '@mui/lab'
import Router from 'next/router'
import { useRouter } from 'next/router'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import FileUploaderSingle from 'src/views/forms/form-elements/file-uploader/FileUploaderSingle'
// ** Source code imports
import TestSample from './sample/sample'
import FallbackSpinner from 'src/@core/components/spinner/index'

const Lab = () => {
  const [loader, setLoader] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [longitude, setLongitude] = useState('')
  const [latitude, setLatitude] = useState('')
  const [open, setOpen] = useState(false)
  const [labType, setLabType] = useState('')

  const [TestData, setTestData] = useState([])
  console.log('longitude', longitude.longitude)
  console.log('latitude', latitude.latitude)
  console.log('TestData', TestData)
  console.log('labType', labType)

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // location
  const handleClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          // Success callback
          const { latitude, longitude } = position.coords
          setLongitude({ longitude })
          setLatitude({ latitude })
        },
        error => {
          // Error callback
          console.error('Error getting location:', error.message)
        }
      )
    } else {
      console.error('Geolocation is not supported by your browser')
    }
  }

  //image upload
  const [uploadedImage, setUploadedImage] = useState()
  const [files, setFiles] = useState([])

  const onImageUpload = async imageData => {
    setFiles(imageData)
  }

  // Form Part

  const defaultValues = {
    lab_name: '',
    lab_type: '',
    lab_incharge_name: '',
    lab_address: '',
    lab_incharge_phone: '',
    latitude: '',
    longitude: '',
    image: ''
  }

  const schema = yup.object().shape({
    lab_name: yup.string().required('Lab name is required'),
    lab_type: yup.string().required('Lab Type is required'),
    lab_incharge_name: yup.string().required('Lab Incharge name  is required'),
    // lab_incharge_phone: yup
    //   .string()
    //   .required('Lab Incharge  No is required')
    //   .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Mobile number')
    //   .max(10, 'Maximum of 10 digits'),

    latitude: yup.string(),
    longitude: yup.string()
  })

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    getValues
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const handleSubmitData = async () => {
    try {
      const errors = await trigger()
      if (errors) {
        handleSubmit(onSubmit)()
      } else {
        scrollToTop()
      }
    } catch (error) {
      console.error(error)
    }
    // handleSubmit(onSubmit)()
  }

  const onSubmit = async params => {
    // setSubmitLoader(true)

    const { lab_name, lab_type, lab_incharge_name, lab_address, lab_incharge_phone, latitude, longitude } = {
      ...params
    }

    const payload = {
      lab_name,
      lab_type,
      lab_incharge_name,
      lab_address,
      lab_incharge_phone,
      latitude,
      longitude
    }

    if (files.length > 0) {
      payload.image = files[0]
    } else {
    }
    console.log('payload', payload)

    // if (id !== undefined && action === 'edit') {
    //   console.log('payload', payload)
    //   // await updateMedicine(payload, id)
    // } else {
    //   // await addMedicineToList(payload)
    // }

    // try {
    //   // Perform any asynchronous operations (e.g., API call) here
    //   console.log('Form data submitted:', params)
    //   // Reset the form if needed
    //   reset()
    // } catch (error) {
    //   console.error('Error submitting form:', error)
    // }
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tests' // Use a unique name for your array field
  })

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  // const handleCheckBox = (sample, parent, child) => {
  //   const sampleIndex = TestData.findIndex(data => data.sample_id === sample.sample_id)

  //   if (sampleIndex === -1) {
  //     // If the sample is not in TestData, add it with the parent and child
  //     setTestData(prevData => [
  //       ...prevData,
  //       {
  //         sample_id: sample.sample_id,
  //         sample_name: sample.sample_name,
  //         tests: [
  //           {
  //             test_id: parent.test_id,
  //             test_name: parent.test_name,
  //             full_test: false,
  //             child_tests: [
  //               {
  //                 test_id: child.test_id,
  //                 test_name: child.test_name,
  //                 value: true,
  //                 input_type: child.input_type
  //               }
  //             ]
  //           }
  //         ]
  //       }
  //     ])
  //   } else {
  //     // If the sample is in TestData, add the child without removing others
  //     setTestData(prevData =>
  //       prevData.map(data =>
  //         data.sample_id === sample.sample_id
  //           ? {
  //               ...data,
  //               tests: data.tests.map(test =>
  //                 test.test_id === parent.test_id
  //                   ? {
  //                       ...test,
  //                       child_tests: [
  //                         ...test.child_tests,
  //                         {
  //                           test_id: child.test_id,
  //                           test_name: child.test_name,
  //                           value: true,
  //                           input_type: child.input_type
  //                         }
  //                       ]
  //                     }
  //                   : test
  //               )
  //             }
  //           : data
  //       )
  //     )
  //   }
  // }

  const handleCheckBox = (sample, parent, child) => {
    const sampleIndex = TestData.findIndex(data => data.sample_id === sample.sample_id)

    if (sampleIndex === -1) {
      // If the sample is not in TestData, add it with the parent and child
      setTestData(prevData => [
        ...prevData,
        {
          sample_id: sample.sample_id,
          sample_name: sample.sample_name,
          tests: [
            {
              test_id: parent.test_id,
              test_name: parent.test_name,
              full_test: false,
              child_tests: [
                {
                  test_id: child.test_id,
                  test_name: child.test_name,
                  value: true,
                  input_type: child.input_type
                }
              ]
            }
          ]
        }
      ])
    } else {
      // If the sample is in TestData, toggle the state of the checkbox
      setTestData(prevData =>
        prevData.map(data =>
          data.sample_id === sample.sample_id
            ? {
                ...data,
                tests: data.tests.map(test =>
                  test.test_id === parent.test_id && test.test_name === parent.test_name
                    ? {
                        ...test,
                        child_tests: test.child_tests.some(
                          childTest => childTest.test_id === child.test_id && childTest.test_name === child.test_name
                        )
                          ? test.child_tests.filter(
                              childTest =>
                                childTest.test_id !== child.test_id || childTest.test_name !== child.test_name
                            )
                          : [
                              ...test.child_tests,
                              {
                                test_id: child.test_id,
                                test_name: child.test_name,
                                value: true,
                                input_type: child.input_type
                              }
                            ]
                      }
                    : test
                )
              }
            : data
        )
      )
    }
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Grid container spacing={6} className='match-height'>
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Add New Lab' />
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={5}>
                      <Grid item xs={12} sm={12}>
                        <Card>
                          <CardHeader title='Upload LAB Picture' />
                          <CardContent>
                            <FileUploaderSingle onImageUpload={onImageUpload} image={uploadedImage} />
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6} sm={6}>
                        {/* <div>Add Lab Basic Info</div> */}
                        <FormControl fullWidth>
                          <Controller
                            name='lab_name'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Lab Name*'
                                name='lab_name'
                                error={Boolean(errors.lab_name)}
                                onChange={onChange}
                                placeholder=''
                              />
                            )}
                          />
                          {errors.lab_name && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.lab_name?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6} sm={6}>
                        <FormControl fullWidth mt={2}>
                          <InputLabel error={Boolean(errors?.lab_type)} id='lab_type'>
                            Lab Type*
                          </InputLabel>
                          <Controller
                            name='lab_type'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                name='lab_type'
                                value={value}
                                label='Lab Type*'
                                onChange={e => {
                                  onChange(e.target.value)
                                  setLabType(e.target.value)
                                }}
                                error={Boolean(errors?.lab_type)}
                                labelId='lab_type'
                              >
                                <MenuItem value='internal_lab'>Internal Lab</MenuItem>
                                <MenuItem value='external_lab'>External Lab</MenuItem>
                              </Select>
                            )}
                          />
                          {errors?.lab_type && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.lab_type?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='lab_incharge_name'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Lab Incharge Name*'
                                name='lab_incharge_name'
                                error={Boolean(errors.lab_incharge_name)}
                                onChange={onChange}
                                placeholder=''
                              />
                            )}
                          />
                          {errors.lab_incharge_name && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.lab_incharge_name?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='lab_address'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Lab Address*'
                                name='lab_address'
                                error={Boolean(errors.lab_address)}
                                onChange={onChange}
                                placeholder=''
                              />
                            )}
                          />
                          {errors.lab_address && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.lab_address?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='lab_incharge_phone'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Lab Incharge Mobile Number'
                                onChange={onChange}
                                placeholder=''
                                error={Boolean(errors?.lab_incharge_phone)}
                                name='lab_incharge_phone'
                              />
                            )}
                          />
                          {errors?.phone && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.lab_incharge_phone?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6} sm={6}>
                        <Stack
                          direction='row'
                          sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', mt: 2 }}
                        >
                          <Typography>Mark as default Lab</Typography>
                          <Switch defaultChecked />
                        </Stack>
                      </Grid>

                      {/* test Data */}
                      <Grid item xs={12} md={6} sm={6}>
                        <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }} gap={2}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              bgcolor: '#20de67',
                              borderRadius: '8px',
                              p: 2,
                              width: '100%'
                            }}
                            onClick={() => handleOpen()}
                          >
                            <Typography
                              variant='h6'
                              sx={{ color: 'white', alignItems: 'center', display: 'flex', p: 1 }}
                            >
                              <Icon icon='ic:baseline-add' fontSize={25} />
                              Add Tests
                            </Typography>
                          </Box>
                          <Typography variant='h6' sx={{ mt: 2 }}>
                            No Data
                          </Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6} sm={6}>
                        <Card sx={{ p: 2 }}>
                          <Box
                            sx={{
                              bgcolor: '#20de67',
                              borderRadius: '8px',
                              p: 2,
                              mb: 2
                            }}
                            onClick={handleClick}
                          >
                            <Typography
                              variant='h6'
                              sx={{
                                p: 1,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              Set Current Location <Icon icon='ic:baseline-my-location' fontSize={25} />
                            </Typography>
                          </Box>
                          <FormControl fullWidth>
                            <Controller
                              name='longitude'
                              control={control}
                              rules={{ required: true }}
                              render={({ field: { value, onChange } }) => (
                                <TextField
                                  value={value || longitude.longitude}
                                  onChange={onChange}
                                  placeholder='Longitude'
                                  error={Boolean(errors?.longitude)}
                                  name='longitude'
                                />
                              )}
                            />
                            {errors?.longitude && (
                              <FormHelperText sx={{ color: 'error.main' }}>{errors?.longitude?.message}</FormHelperText>
                            )}
                          </FormControl>
                          <Box mt={2}>
                            <FormControl fullWidth>
                              <Controller
                                name='latitude'
                                control={control}
                                rules={{ required: true }}
                                render={({ field: { value, onChange } }) => (
                                  <TextField
                                    value={value || latitude.latitude}
                                    onChange={onChange}
                                    placeholder='Latitude'
                                    error={Boolean(errors?.latitude)}
                                    name='latitude'
                                  />
                                )}
                              />
                              {errors?.latitude && (
                                <FormHelperText sx={{ color: 'error.main' }}>
                                  {errors?.latitude?.message}
                                </FormHelperText>
                              )}
                            </FormControl>
                          </Box>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={12} sm={6}>
                        <LoadingButton onClick={handleSubmitData} type='submit' variant='contained'>
                          Submit
                        </LoadingButton>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      <Drawer
        anchor='right'
        open={open}
        // ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Typography variant='h6'>Add Tests</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>
        <Stack sx={{ p: 5 }} spacing={3}>
          {TestSample.map((sample, index) => (
            <>
              <Stack
                key={index}
                direction='row'
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Typography variant='h6'>{sample?.sample_name}</Typography>
                <Typography sx={{ alignItems: 'center', display: 'flex' }}>
                  Select All
                  <Switch defaultChecked />
                </Typography>
              </Stack>

              {sample.tests.map((parent, parentId) =>
                parent.child_tests.length > 0 ? (
                  <Card mt={2}>
                    <Accordion>
                      <AccordionSummary aria-controls='panel1a-content' id='panel1a-header'>
                        <Typography variant='h6'>{parent?.test_name}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack
                          direction='row'
                          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <Typography>Full Test</Typography>
                          <Switch defaultChecked />
                        </Stack>
                        {parent?.child_tests?.map((child, id) => (
                          <Stack
                            direction='row'
                            sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}
                          >
                            <Typography>{child.test_name}</Typography>
                            <Checkbox onClick={() => handleCheckBox(sample, parent, child)} />
                          </Stack>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  </Card>
                ) : (
                  <Card>
                    <Stack
                      direction='row'
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}
                    >
                      <Typography variant='h6' ml={4}>
                        {parent?.test_name}
                      </Typography>
                      <Checkbox onClick={() => handleCheckBox(sample, parent, parent)} />
                    </Stack>
                  </Card>
                )
              )}
            </>
          ))}
        </Stack>
      </Drawer>
    </>
  )
}

export default Lab
