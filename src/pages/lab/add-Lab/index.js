/* eslint-disable lines-around-comment */
/* eslint-disable react/jsx-key */
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
  AccordionDetails,
  FormControlLabel,
  Button
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import { getAllLabSample, getLabDeatilsById, updateLabById } from 'src/lib/api/lab/addLab'
import { LoadingButton } from '@mui/lab'
import Router from 'next/router'
import { useRouter } from 'next/router'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import FileUploaderSingle from 'src/views/forms/form-elements/file-uploader/FileUploaderSingle'
import UserSnackbar from 'src/components/utility/snackbar'

// ** Source code imports

import FallbackSpinner from 'src/@core/components/spinner/index'
import { addLab } from 'src/lib/api/lab/addLab'

const AddLab = () => {
  const [loader, setLoader] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [longitude, setLongitude] = useState('')
  const [latitude, setLatitude] = useState('')
  const [open, setOpen] = useState(false)
  const [labType, setLabType] = useState('')
  console.log('labType', labType)
  // const [markDefault, setMarkDefault] = useState(false)
  const [TestData, setTestData] = useState([])
  const [prevTests, setPrevTests] = useState([])

  const [dataToUpdate, setDataToUpdate] = useState([])

  const [showLabTests, setShowLabTests] = useState()

  const [labTestsEmpty, setLabTestsEmpty] = React.useState(false)
  //image upload
  const [uploadedImage, setUploadedImage] = useState()

  const [files, setFiles] = useState([])

  // for handle reset form

  const shouldClearFieldsRef = useRef(false)

  const [openSnackbar, setOpenSnackbar] = useState(false)
  // id for edit
  const router = useRouter()
  const { id, action } = router.query

  // edit call
  const setAlertDefaults = ({ message, severity, status }) => {
    setOpenSnackbar(status)
    setSnackbarMessage(message)
    setSeverity(severity)
  }
  const updateTestData = () => {
    const setEditLabs = TestData?.map(testDataSample => {
      const matchingPrevLab = prevTests.find(prevLab => prevLab.sample_id === testDataSample.sample_id)

      if (matchingPrevLab) {
        const fullTestTrue = matchingPrevLab.tests.some(test => test.full_test)

        return {
          ...testDataSample,
          value: fullTestTrue,
          tests: testDataSample.tests.map(test => {
            const matchingPrevTest = matchingPrevLab.tests.find(
              prevTest => prevTest.test_id.toString() === test.test_id.toString()
            )

            if (matchingPrevTest) {
              // Update child_tests values based on matchingPrevTest
              const updatedChildTests = test.child_tests.map(childTest => {
                const matchingPrevChildTest = matchingPrevTest.child_tests.find(
                  prevChildTest => prevChildTest.test_id.toString() === childTest.test_id.toString()
                )
                return matchingPrevChildTest ? { ...childTest, value: matchingPrevChildTest.value } : childTest
              })

              return {
                ...test,
                full_test: matchingPrevTest.full_test,
                child_tests: updatedChildTests
              }
            }

            return test
          })
        }
      }

      return testDataSample // return unmodified if no matchingPrevLab found
    })

    setTestData(setEditLabs)
  }

  const labDeatilsById = async id => {
    try {
      const res = await getLabDeatilsById(id)
      if (res) {
        // setUploadedImage(res?.data?.image ? res?.data?.image : '/images/tablet.png')
        setUploadedImage(res?.data[0]?.image || '/images/tablet.png')
        setValue('lab_name', res?.data[0]?.lab_name)

        setValue('type', res?.data[0]?.type)
        setValue('incharge_name', res?.data[0]?.incharge_name)
        setValue('address', res?.data[0]?.address)
        setValue('lab_contact_number', res?.data[0]?.lab_contact_number)

        setValue('is_default', res?.data[0]?.is_default === '0' ? false : true)
        setValue('latitude', res?.data[0]?.latitudes)
        setValue('longitude', res?.data[0]?.longitudes)
        setPrevTests(res?.data[0]?.lab_details)
        setShowLabTests(res?.data[0]?.lab_details)
        setDataToUpdate(res?.data[0]?.lab_details)
      }
    } catch (error) {}
  }

  useEffect(() => {
    if (id != undefined && action === 'edit') {
      labDeatilsById(id)
    }
  }, [id, action])

  // edit tests

  // ------------------------

  const getAllLabsLists = async () => {
    setLoader(true)
    const response = await getAllLabSample()
    if (response?.length > 0) {
      // setUseEffect(false)
      // let listWithId = response.map((el, i) => {
      //   return { ...el, uid: i + 1 }
      // })

      setTestData(response)

      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  useEffect(() => {
    getAllLabsLists()
  }, [])

  // const [openSnackbar, setOpenSnackbar] = useState({
  //   open: false,
  //   severity: '',
  //   message: ''
  // })

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
          setValue('latitude', latitude)
          setValue('longitude', longitude)
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

  const onImageUpload = async imageData => {
    setFiles(imageData)
  }

  // Form Part

  const defaultValues = {
    lab_name: '',
    type: '',
    incharge_name: '',
    address: '',
    lab_contact_number: '',
    latitude: latitude,
    longitude: longitude,
    image: '',
    is_default: false
  }

  const schema = yup.object().shape({
    lab_name: yup.string().required('Lab name is required'),
    type: yup.string().required('Lab Type is required'),
    incharge_name: yup.string().required('Lab Incharge name  is required'),
    lab_contact_number: yup
      .string()
      .required('Lab Incharge  No is required')

      // .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Mobile number')

      .max(10, 'Maximum of 10 digits'),
    is_default: yup.boolean()

    // latitude: yup.string(),
    // longitude: yup.string()
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
      const isLabTestsEmpty = dataToUpdate.every(sample => sample.tests.length === 0)

      if (errors || isLabTestsEmpty) {
        handleSubmit(onSubmit)
        if (isLabTestsEmpty) {
          setLabTestsEmpty(true)
          // console.error('Lab tests are required')
        } else {
          setLabTestsEmpty(false)
        }
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

    const { lab_name, type, incharge_name, address, lab_contact_number, tests, is_default } = {
      ...params
    }
    const { latitude, longitude } = getValues()

    const payload = {
      lab_name,
      type,
      incharge_name,
      address,
      lab_contact_number,
      latitudes: latitude,
      longitudes: longitude,
      lab: JSON.stringify(dataToUpdate),
      is_default
      // user_id: '58'
    }

    if (files.length > 0) {
      payload.image = files[0]
    } else {
    }
    // console.log('payload', payload)

    if (id !== undefined && action === 'edit') {
      // console.log(payload)

      const response = await updateLabById(payload, id)
      setSubmitLoader(false)
      // setAlertDefaults({ status: true, message: response?.message, severity: 'success' })

      // reset(defaultValues)
      Router.push('/lab/lab-list')
    } else {
      console.log(payload)

      const res = await addLabToList(payload).then(res => {
        setSubmitLoader(false)
        reset(defaultValues)
        // setDataToUpdate([])
        Router.push('/lab/lab-list')
      })
    }
  }

  const handleOpen = () => {
    if (id != undefined && action === 'edit') {
      updateTestData()
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setShowLabTests([])
  }
  const handleCloseSnackBar = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }

    setOpenSnackbar(false)
  }

  // Add Test

  const handleCheckBox = (sample, parent, child, isChecked) => {
    console.log('sample', sample)
    setTestData(prevData => {
      const sampleIndex = prevData.findIndex(data => data.sample_id === sample.sample_id)

      if (sampleIndex === -1) {
        // If the sample is not in TestData, add it with the parent and child
        return [
          ...prevData,
          {
            sample_id: sample.sample_id,
            sample_name: sample.sample_name,
            value: false,
            tests: [
              {
                test_id: parent.test_id,
                test_name: parent.test_name,
                full_test: false,
                child_tests: [
                  {
                    test_id: child.test_id,
                    test_name: child.test_name,
                    value: isChecked,
                    input_type: child.input_type
                  }
                ]
              }
            ]
          }
        ]
      } else {
        // If the sample is in TestData, update the child_tests array
        return prevData.map(data =>
          data.sample_id === sample.sample_id
            ? {
                ...data,
                tests: data.tests.map(test =>
                  test.test_id === parent.test_id
                    ? {
                        ...test,
                        child_tests: test.child_tests.map(ct =>
                          ct.test_id === child.test_id
                            ? {
                                ...ct,
                                value: isChecked
                              }
                            : ct
                        )
                      }
                    : test
                )
              }
            : data
        )
      }
    })
  }

  // Select All
  const handleParentSwitch = (sample, parent, isChecked) => {
    setTestData(prevData => {
      const sampleIndex = prevData.findIndex(data => data.sample_id === sample.sample_id)

      if (sampleIndex === -1) {
        // If the sample is not in TestData, add it with the parent and child
        if (isChecked) {
          return [
            ...prevData,
            {
              sample_id: sample.sample_id,
              sample_name: sample.sample_name,
              tests: [
                {
                  test_id: parent.test_id,
                  test_name: parent.test_name,
                  full_test: isChecked,
                  child_tests: parent.child_tests.map(childTest => ({
                    ...childTest,
                    value: isChecked
                  }))
                }
              ]
            }
          ]
        }

        // Handle the case when the sample is not found and isChecked is false
        return prevData
      }

      return prevData.map(data =>
        data.sample_id === sample.sample_id
          ? {
              ...data,
              tests: data.tests.map(test =>
                test.test_id === parent.test_id
                  ? {
                      ...test,
                      full_test: isChecked,
                      child_tests: isChecked
                        ? test.child_tests.map(childTest => ({
                            ...childTest,
                            value: isChecked
                          }))
                        : test.child_tests.map(childTest => ({
                            ...childTest,
                            value: false
                          }))
                    }
                  : test
              )
            }
          : data
      )
    })
  }

  const handleTestFullTestSwitch = (sample, parent, isChecked) => {
    setTestData(prevData => {
      const sampleIndex = prevData.findIndex(data => data.sample_id === sample.sample_id)

      if (sampleIndex === -1) {
        // If the sample is not in TestData, add it with the parent and child
        if (isChecked) {
          return [
            ...prevData,
            {
              sample_id: sample.sample_id,
              sample_name: sample.sample_name,
              tests: [
                {
                  test_id: parent.test_id,
                  test_name: parent.test_name,
                  full_test: isChecked,
                  child_tests: parent.child_tests
                }
              ]
            }
          ]
        }

        // Handle the case when the sample is not found and isChecked is false
        return prevData
      }

      return prevData.map(data =>
        data.sample_id === sample.sample_id
          ? {
              ...data,
              tests: data.tests.map(test =>
                test.test_id === parent.test_id
                  ? {
                      ...test,
                      full_test: isChecked,
                      child_tests: parent.child_tests
                    }
                  : test
              )
            }
          : data
      )
    })
  }

  const handleSelectAllSwitch = (sampleId, isChecked) => {
    setTestData(prevData => {
      return prevData.map(data =>
        data.sample_id === sampleId
          ? {
              ...data,
              value: isChecked,
              tests: data.tests.map(test => ({
                ...test,
                full_test: isChecked,
                child_tests: test.child_tests.map(childTest => ({
                  ...childTest,
                  value: isChecked
                }))
              }))
            }
          : data
      )
    })
  }

  //   const handleSwitchToggle = () => {
  //     setMarkDefault(!markDefault)
  //   }

  // api call
  const addLabToList = async payload => {
    try {
      const response = await addLab(payload)
      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })

        reset(defaultValues)
      } else {
        setSubmitLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: false, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  // New state to keep track of data to be added or removed
  useEffect(() => {
    // Logic to update data based on the value of testData
    const updatedData = TestData.reduce((acc, sample) => {
      const updatedSample = {
        ...sample,
        tests: sample.tests.reduce((accTests, parent) => {
          const updatedParent = {
            ...parent,
            child_tests: parent.child_tests.filter(child => {
              if (child.value === true) {
                return true // Keep the child when the value is true
              } else {
                // Remove the child when the value is false
                return false
              }
            })
          }

          // Only add parents with non-empty child_tests array
          if (updatedParent.child_tests.length > 0 || updatedParent.full_test) {
            accTests.push(updatedParent)
          }

          return accTests
        }, [])
      }

      // Only add samples with non-empty tests array
      if (updatedSample.tests.length > 0) {
        acc.push(updatedSample)
      }

      return acc
    }, [])

    setDataToUpdate(updatedData)
    setLabTestsEmpty(false)
  }, [TestData])

  // deleing the data from ui
  const handleCloseTest = (sampleId, parentId) => {
    setDataToUpdate(prevData => {
      const newData = [...prevData]
      const sampleTests = newData[sampleId]?.tests

      if (sampleTests && sampleTests[parentId]) {
        // Remove the parent.test object
        sampleTests.splice(parentId, 1)

        // Check if tests array is empty, delete the current sample object
        if (sampleTests.length === 0) {
          newData.splice(sampleId, 1)
        }
      }

      return newData
    })
  }

  // showing test on click add lab button
  const hanldeAddLabTests = () => {
    setOpen(false)
    setShowLabTests(dataToUpdate)
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
                      <Grid item xs={12} md={6} sm={6}>
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
                          <InputLabel error={Boolean(errors?.type)} id='type'>
                            Lab Type*
                          </InputLabel>
                          <Controller
                            name='type'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <Select
                                name='type'
                                value={value}
                                label='Lab Type*'
                                onChange={e => {
                                  onChange(e.target.value)
                                  setLabType(e.target.value)
                                }}
                                error={Boolean(errors?.type)}
                                labelId='type'
                              >
                                <MenuItem value='internal'>Internal Lab</MenuItem>
                                <MenuItem value='external'>External Lab</MenuItem>
                              </Select>
                            )}
                          />
                          {errors?.type && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.type?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='incharge_name'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Lab Incharge Name*'
                                name='incharge_name'
                                error={Boolean(errors.incharge_name)}
                                onChange={onChange}
                                placeholder=''
                              />
                            )}
                          />
                          {errors.incharge_name && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.incharge_name?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='address'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Lab Address*'
                                name='address'
                                error={Boolean(errors.address)}
                                onChange={onChange}
                                placeholder=''
                              />
                            )}
                          />
                          {errors.address && (
                            <FormHelperText sx={{ color: 'error.main' }}>{errors?.address?.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6} sm={6}>
                        <FormControl fullWidth>
                          <Controller
                            name='lab_contact_number'
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                value={value}
                                label='Lab Incharge Mobile Number'
                                onChange={onChange}
                                placeholder=''
                                error={Boolean(errors?.lab_contact_number)}
                                name='lab_contact_number'
                              />
                            )}
                          />
                          {errors?.phone && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.lab_contact_number?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6} sm={6}>
                        <Controller
                          name='is_default'
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <Stack
                              direction='row'
                              sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', mt: 2 }}
                            >
                              <Typography>Mark as default Lab</Typography>
                              <FormControlLabel
                                control={<Switch checked={value} onChange={onChange} />}
                                disabled={labType === 'external'}
                              />
                            </Stack>
                          )}
                        />
                      </Grid>

                      {/* test Data */}
                      <Grid item xs={12} md={12} sm={12}>
                        <Card sx={{ p: 2, display: 'flex', flexDirection: 'column' }} gap={2}>
                          <div>
                            <Box
                              sx={{
                                cursor: 'pointer',
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
                                Add Lab Tests
                              </Typography>
                            </Box>

                            {showLabTests?.map((sample, sampleId) => (
                              <Box sx={{ p: 1, mt: 4 }}>
                                <Box>
                                  {sample?.tests?.length > 0 ? (
                                    <Typography sx={{ mb: 2 }}>{sample?.sample_name}</Typography>
                                  ) : null}

                                  {sample?.tests?.map((parent, parentId) => (
                                    <Card sx={{ p: 2, mb: 2 }}>
                                      {/* {parent.full_test === true ? ( */}
                                      <Stack
                                        gap={1}
                                        direction='row'
                                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                      >
                                        <>
                                          <Typography variant='subtitle1'>{parent.test_name}</Typography>
                                          <IconButton onClick={() => handleCloseTest(sampleId, parentId)}>
                                            <Icon icon='zondicons:close-outline' fontSize={20} color='red' />
                                          </IconButton>
                                        </>
                                      </Stack>
                                      {/* ) : null} */}
                                      <Stack>
                                        {parent.child_tests?.map((child, childId) =>
                                          child.value === true ? (
                                            <Stack
                                              direction='row'
                                              gap={2}
                                              sx={{ display: 'flex', alignItems: 'center', p: 1 }}
                                            >
                                              <Icon icon='ic:baseline-check' fontSize={20} color='#20de67' />
                                              <Typography sx>{child.test_name}</Typography>
                                            </Stack>
                                          ) : null
                                        )}
                                      </Stack>
                                    </Card>
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </div>
                          {labTestsEmpty ? (
                            <Typography variant='subtitle1' sx={{ color: 'red', m: 2 }}>
                              Lab test is required
                            </Typography>
                          ) : null}
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
                                justifyContent: 'space-between',
                                cursor: 'pointer'
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
                                  value={value}
                                  onChange={onChange}
                                  placeholder='Longitude'
                                  error={Boolean(errors?.longitude)}
                                  name='longitude'
                                  disabled
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
                                    value={value}
                                    onChange={onChange}
                                    placeholder='Latitude'
                                    error={Boolean(errors?.latitude)}
                                    name='latitude'
                                    disabled
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
                      <Grid item xs={12} md={12} sm={12}>
                        <Card>
                          <CardHeader title='Upload LAB Picture' />
                          <CardContent>
                            <FileUploaderSingle onImageUpload={onImageUpload} image={uploadedImage} />
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={12} sm={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <LoadingButton
                            loading={submitLoader}
                            onClick={handleSubmitData}
                            type='submit'
                            variant='outlined'
                          >
                            Submit
                          </LoadingButton>
                        </Box>

                        {/* <UserSnackbar
                          status={openSnackbar}
                          message={snackbarMessage}
                          severity={severity}
                          handleClose={handleCloseSnackBar}
                        /> */}
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      <Drawer anchor='right' open={open} sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}>
        <div>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: 'background.default',
              p: theme => theme.spacing(3, 3.255, 3, 5.255)
            }}
          >
            <Typography variant='h6'>Add Labs</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            </Box>
          </Box>

          {/* drower */}
          <Stack sx={{ p: 5 }} spacing={3}>
            {TestData?.map((sample, index) => (
              <>
                <Stack
                  key={index}
                  direction='row'
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant='h6'>{sample?.sample_name}</Typography>
                  <Typography sx={{ alignItems: 'center', display: 'flex' }}>
                    Select All
                    <Switch
                      checked={sample?.value}
                      onChange={e => handleSelectAllSwitch(sample?.sample_id, e.target.checked)}
                    />
                  </Typography>
                </Stack>

                {sample?.tests?.map((parent, index) =>
                  parent?.child_tests?.length > 0 ? (
                    <>
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
                              <Switch
                                checked={parent?.full_test}
                                onChange={(e, v) => {
                                  handleParentSwitch(sample, parent, v)
                                }}
                              />
                            </Stack>
                            {parent?.child_tests?.map((child, id) => {
                              return (
                                <Stack
                                  direction='row'
                                  key={child?.test_id}
                                  sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}
                                >
                                  <Typography>{child?.test_name}</Typography>
                                  <Checkbox
                                    checked={child?.value}
                                    onClick={(e, v) => {
                                      handleCheckBox(sample, parent, child, e.target.checked)
                                    }}
                                  />
                                </Stack>
                              )
                            })}
                          </AccordionDetails>
                        </Accordion>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <Stack
                        direction='row'
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}
                      >
                        <Typography variant='h6' ml={4}>
                          {parent?.test_name}
                        </Typography>
                        <Checkbox
                          checked={parent?.full_test}
                          onClick={(e, v) => handleTestFullTestSwitch(sample, parent, e.target.checked)}
                        />
                      </Stack>
                    </Card>
                  )
                )}
              </>
            ))}
          </Stack>
        </div>
        <Box
          sx={{
            position: 'sticky',
            bottom: 10,
            // right: ,
            // left: '85%',
            transform: 'translateX(6%)',
            display: 'flex',
            justifyContent: 'center',
            textAlign: 'center',
            width: 345
          }}
        >
          <Button variant='contained' color='primary' onClick={hanldeAddLabTests} fullWidth sx={{ p: 3 }}>
            Add Lab Tests
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default AddLab
