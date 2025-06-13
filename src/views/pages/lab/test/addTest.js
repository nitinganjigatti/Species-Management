import { useCallback, useEffect, useRef, useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  TextField,
  Typography,
  Autocomplete,
  Button,
  InputAdornment,
  Chip,
  debounce
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'

import { getLabSampleList, getLabTestDetailsById } from 'src/lib/api/lab/master'

const schema = yup.object().shape({
  test_name: yup.string().trim().required('Test name is required'),
  sample_ids: yup.array().min(1, 'At least one sample type is required')
})

const defaultValues = {
  test_name: '',
  sample_ids: [],
  sub_tests: []
}

const AddTest = props => {
  const theme = useTheme()
  const { addEventSidebarOpen, setOpenDrawer, handleSubmitData, resetForm, submitLoader, editParams } = props
  const [subTests, setSubTests] = useState([])

  console.log('subTests', subTests)
  const [sampleTypes, setSampleTypes] = useState([])
  const [searchValue, setSearchValue] = useState('')

  const [existingSubTests, setExistingSubTests] = useState([])
  console.log('existingSubTests', existingSubTests)

  console.log('existingSubTests', existingSubTests)
  const [newSubTests, setNewSubTests] = useState([])

  console.log('newSubTests', newSubTests)
  const [deletedSubTests, setDeletedSubTests] = useState([])
  console.log('deletedSubTests', deletedSubTests)
  const [deletedIds, setDeletedIds] = useState([])
  console.log('deletedIds', deletedIds)

  console.log('deletedSubTests', deletedSubTests)

  // console.log('editParams', editParams)

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const selectedSampleIds = watch('sample_ids')

  const getLabTestById = useCallback(
    async id => {
      const params = {
        id
      }
      const response = await getLabTestDetailsById(params)

      if (response?.success) {
        const sampleIdsName = response?.data?.sample_types.map(sample => sample.name)

        // console.log('response?.data?.child_tests', response?.data?.child_tests)

        // const testIdsName = response?.data?.child_tests.map(test => test.name)

        const testData = response?.data?.child_tests.map(test => ({
          [test.id]: test.name // Dynamic key-value pair
        }))

        setSubTests(testData.map(test => Object.values(test)[0])) // Store only names for display
        setExistingSubTests(testData) // Store full object (id & name)
        setDeletedSubTests([]) // Reset deleted tests
        setNewSubTests([])

        const data = {
          ...response.data,
          test_name: response?.data?.label,
          sample_ids: response?.data?.sample_types || [] // Ensure it's an array
        }

        reset(data)
      } else {
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      getLabTestById(editParams?.id)
    }
  }, [resetForm, editParams, reset, getLabTestById])

  const onSubmit = async params => {
    console.log(params, 'log')
    const sampleIdsOnly = params.sample_ids.map(sample => sample.id)

    if (editParams?.id !== null) {
      const sampleIdsOnly = params.sample_ids.map(sample => sample.id)

      const formData = new FormData()
      formData.append('label', params.test_name)

      sampleIdsOnly.forEach(id => formData.append('sample_ids[]', id))

      // new sub-tests
      newSubTests.forEach(test => formData.append('sub_tests[]', test))

      // existing sub-tests
      Object.entries(existingSubTests).forEach(([_, obj]) => {
        Object.entries(obj).forEach(([testId, name]) => {
          formData.append(`existing_sub_tests[${testId}]`, name)
        })
      })

      deletedIds.forEach(id => formData.append('delete_sub_task[]', id))

      // for (const pair of formData.entries()) {
      //   console.log('Form', pair[0], pair[1])
      // }

      await handleSubmitData(formData)
    } else {
      const payload = {
        label: params?.test_name,
        sample_ids: sampleIdsOnly,
        sub_tests: newSubTests
      }
      console.log(payload, 'Submission Data')

      await handleSubmitData(payload)
    }
  }

  // Add a new sub-test
  const addSubTest = value => {
    if (value && value.trim() !== '') {
      const trimmedValue = value.trim()

      if (!subTests.includes(trimmedValue)) {
        setSubTests(prev => [...prev, trimmedValue]) // Update displayed tests
        setNewSubTests(prev => [...prev, trimmedValue]) // Track new additions
        setValue('sub_tests', '')
      }
    }
  }

  // Remove a sub-test
  const handleRemoveSubTest = testName => {
    const existingTest = existingSubTests.find(t => Object.values(t)[0] === testName)
    const isNewTest = newSubTests.includes(testName)
    const isDeletedTest = deletedSubTests.find(t => Object.values(t)[0] === testName)

    if (existingTest) {
      // Move to deletedSubTests with ID
      setExistingSubTests(prev => prev.filter(t => Object.values(t)[0] !== testName))
      setDeletedSubTests(prev => [...prev, existingTest])
    } else if (isNewTest) {
      // Remove directly from newSubTests
      setNewSubTests(prev => prev.filter(t => t !== testName))
    } else if (isDeletedTest) {
      restoreDeletedTest(testName)
    }

    // Remove from displayed subTests list
    setSubTests(prev => prev.filter(t => t !== testName))
  }

  // Restore a deleted test back to existingSubTests
  useEffect(() => {
    setDeletedIds(deletedSubTests.map(test => Object.keys(test)[0])) // Extracting test ID
  }, [deletedSubTests])

  const restoreDeletedTest = testName => {
    setDeletedSubTests(prevDeletedTests => {
      const testToRestore = prevDeletedTests.find(t => Object.values(t)[0] === testName)

      if (testToRestore) {
        setExistingSubTests(prev => [...prev, testToRestore]) // Restore test
        setSubTests(prev => [...prev, testName]) // Re-add to displayed list

        return prevDeletedTests.filter(t => Object.values(t)[0] !== testName) // Update state
      }

      return prevDeletedTests
    })
  }

  // const handleRemoveSubTest = params => {
  //   console.log('type', type)
  //   console.log('params', params)

  //   // setSubTests(subTests.filter((_, i) => i !== index))
  // }

  const handleRemoveSampleType = sampleToRemove => {
    setValue(
      'sample_ids',
      selectedSampleIds?.filter(sample => sample?.id !== sampleToRemove?.id)
    )
  }

  const searchSampleData = useCallback(
    debounce(async q => {
      setSearchValue(q)
      try {
        await fetchSampleTypesData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchSampleData(value)
  }

  const fetchSampleTypesData = useCallback(async q => {
    try {
      const params = { q }
      await getLabSampleList({ params: params }).then(res => {
        // console.log('response123', res?.data?.result)
        setSampleTypes(res?.data?.result)
      })
    } catch (e) {
      console.log(e)
    }
  }, [])

  useEffect(() => {
    fetchSampleTypesData()
  }, [fetchSampleTypesData, searchValue])

  const inputRef = useRef()

  useEffect(() => {
    if (inputRef.current && control._formValues.test_name) {
      inputRef.current.focus()
    }
  }, [control._formValues.test_name])

  return (
    <>
      <Drawer
        anchor='right'
        open={addEventSidebarOpen}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '500px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%'
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '24px',

              backgroundColor: 'background.default'
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Typography variant='h6'>
                {editParams?.id !== null ? `Edit Lab Test Details` : `Add New Lab Test`}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDrawer(false)} />
              </IconButton>
            </Box>
          </Box>

          {/* drower */}

          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                m: 5,
                px: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                backgroundColor: '#fff',
                borderRadius: '8px',

                // boxShadow: '2px',
                // boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                maxHeight: '79vh',

                // overflow: 'scroll'
                overflowY: 'auto'
              }}
            >
              <FormControl fullWidth sx={{ mt: 6 }}>
                <Controller
                  name='test_name'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Test Name*'
                      inputRef={inputRef}
                      value={value}
                      onChange={onChange}
                      placeholder='Test Name'
                      error={Boolean(errors.test_name)}
                      name='test_name'
                    />
                  )}
                />
                {errors.test_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.test_name.message}</FormHelperText>
                )}
              </FormControl>

              <Box>
                <Typography variant='body1' sx={{ mb: 2 }}>
                  Sample Types
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedSampleIds?.map(sample => (
                    <Box key={sample.id}>
                      {editParams?.id ? (
                        <Chip
                          key={sample.id}
                          label={sample.label || sample.name}
                          sx={{
                            backgroundColor: '#e8f5e9',
                            '& .MuiChip-deleteIcon': {
                              color: '#4caf50'
                            },
                            borderRadius: '6px'
                          }}
                        />
                      ) : (
                        <Chip
                          key={sample.id}
                          label={sample.label || sample.name}
                          onDelete={() => handleRemoveSampleType(sample)}
                          sx={{
                            backgroundColor: '#e8f5e9',
                            '& .MuiChip-deleteIcon': {
                              color: '#4caf50'
                            },
                            borderRadius: '6px'
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
              <FormControl fullWidth>
                <Controller
                  name='sample_ids'
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      multiple
                      id='sample-types'
                      options={sampleTypes}
                      getOptionLabel={option => option.label || option.name || ''}
                      value={selectedSampleIds}
                      renderInput={params => (
                        <TextField
                          {...params}
                          variant='outlined'
                          placeholder='Search Add Sample Type'
                          error={Boolean(errors.sample_ids)}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <Icon icon='mdi:magnify' sx={{ color: 'action.active', mr: 1 }} />
                                {params.InputProps.startAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      onChange={(_, data) => {
                        const uniqueSamples = Array.from(new Map(data.map(sample => [sample.id, sample])).values())
                        field.onChange(uniqueSamples)
                      }}
                      onInputChange={(_, newInputValue) => handleSearch(newInputValue)}
                    />
                  )}
                />
                {errors.sample_ids && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.sample_ids.message}</FormHelperText>
                )}
              </FormControl>

              {/* Display the sub-tests list */}
              <Box>
                <label>Sub Tests</label>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  {subTests.map((test, index) => (
                    <>
                      <Chip
                        key={index}
                        label={test}
                        onDelete={() => handleRemoveSubTest(test)}
                        sx={{
                          backgroundColor: '#e8f5e9',
                          '& .MuiChip-deleteIcon': {
                            color: '#FA6140'
                          },
                          borderRadius: '6px'
                        }}
                      />
                    </>
                  ))}
                </Box>
              </Box>

              <FormControl fullWidth>
                <Controller
                  name='sub_tests'
                  control={control}
                  defaultValue=''
                  render={({ field }) => (
                    <TextField
                      {...field}
                      variant='outlined'
                      placeholder='Enter Sub Test Type'
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              onClick={() => addSubTest(field.value)}
                              edge='end'
                              disabled={submitLoader}
                              sx={{
                                backgroundColor: '#4CAF50',
                                borderRadius: '0 8px 8px 0',
                                '&:hover': { backgroundColor: '#45a049' },
                                height: '52px',
                                width: '52px'
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white'
                                }}
                              >
                                <Icon icon='formkit:submit' />
                              </Box>
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: '8px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e0e0e0'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e0e0e0'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e0e0e0'
                          }
                        }
                      }}
                    />
                  )}
                />
              </FormControl>

              {/* Deleted sub-tests list */}
              {deletedSubTests.length > 0 && (
                <Box>
                  <label>Deleted Tests</label>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                    {deletedSubTests.map((test, index) => {
                      const testId = Object.keys(test)[0] // Extract the test ID
                      const testName = test[testId] // Extract the test name

                      return (
                        <Chip
                          key={index}
                          label={`${testName} (ID: ${testId})`} // Show name and ID
                          onDelete={() => restoreDeletedTest(testName)} // Restore using name
                          sx={{
                            backgroundColor: '#ffebe5',
                            color: '#FA6140',
                            '& .MuiChip-deleteIcon': { color: '#FA6140' },
                            borderRadius: '6px'
                          }}
                        />
                      )
                    })}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {editParams?.zoo_id != '0' && (
                  <Box
                    sx={{
                      position: 'relative',
                      right: 0,
                      height: '6rem',
                      width: '100%',
                      maxWidth: '500px',
                      position: 'fixed',
                      bottom: 0,
                      px: 4,
                      bgcolor: 'white',
                      alignItems: 'center',
                      justifyContent: 'center',
                      display: 'flex',
                      zIndex: 1234,
                      gap: 2
                    }}
                  >
                    <Button
                      fullWidth
                      onClick={() => setOpenDrawer(false)}
                      size='large'
                      type='reset'
                      color='error'
                      disabled={submitLoader}
                      variant='outlined'
                    >
                      Cancel
                    </Button>
                    <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={submitLoader}>
                      {editParams?.id !== null ? `Update` : `Submit`}
                    </LoadingButton>
                  </Box>
                )}
              </Box>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default AddTest
