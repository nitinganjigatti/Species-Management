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
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'

import { getLabSampleList, getLabTestDetailsById } from 'src/lib/api/lab/master'
import type { AddTestProps } from 'src/types/lab'

interface SampleOption {
  id: number | string
  label?: string
  name?: string
}

interface TestFormValues {
  test_name: string
  sample_ids: SampleOption[]
  sub_tests: string
}

const schema = yup.object().shape({
  test_name: yup.string().trim().required('Test name is required'),
  sample_ids: yup.array().min(1, 'At least one sample type is required')
})

const defaultValues: TestFormValues = {
  test_name: '',
  sample_ids: [],
  sub_tests: ''
}

const AddTest = (props: AddTestProps) => {
  const theme = useTheme()
  const { addEventSidebarOpen, setOpenDrawer, handleSubmitData, resetForm, submitLoader, editParams } = props
  const [subTests, setSubTests] = useState<string[]>([])
  const [sampleTypes, setSampleTypes] = useState<SampleOption[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [existingSubTests, setExistingSubTests] = useState<Record<string, string>[]>([])
  const [newSubTests, setNewSubTests] = useState<string[]>([])
  const [deletedSubTests, setDeletedSubTests] = useState<Record<string, string>[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<TestFormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const selectedSampleIds = watch('sample_ids')

  const getLabTestById = useCallback(
    async (id: number | string) => {
      const params = { id }
      const response = await getLabTestDetailsById(params)

      if (response?.success) {
        const responseData = response?.data as {
          sample_types?: { id: number | string; name?: string }[]
          child_tests?: { id: number | string; name?: string }[]
          label?: string
        }

        const testData = (responseData?.child_tests ?? []).map(test => ({
          [String(test.id)]: test.name ?? ''
        }))

        setSubTests(testData.map(test => Object.values(test)[0]))
        setExistingSubTests(testData)
        setDeletedSubTests([])
        setNewSubTests([])

        const data = {
          ...(response.data as object),
          test_name: responseData?.label ?? '',
          sample_ids: responseData?.sample_types ?? []
        }

        reset(data as TestFormValues)
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      getLabTestById(editParams?.id as number)
    }
  }, [resetForm, editParams, reset, getLabTestById])

  const onSubmit = async (params: TestFormValues) => {
    const sampleIdsOnly = params.sample_ids.map(sample => sample.id)

    if (editParams?.id !== null) {
      const formData = new FormData()
      formData.append('label', params.test_name)

      sampleIdsOnly.forEach(id => formData.append('sample_ids[]', String(id)))

      newSubTests.forEach(test => formData.append('sub_tests[]', test))

      Object.entries(existingSubTests).forEach(([_, obj]) => {
        Object.entries(obj).forEach(([testId, name]) => {
          formData.append(`existing_sub_tests[${testId}]`, name)
        })
      })

      deletedIds.forEach(id => formData.append('delete_sub_task[]', id))

      await handleSubmitData(formData)
    } else {
      const payload = {
        label: params?.test_name,
        sample_ids: sampleIdsOnly,
        sub_tests: newSubTests
      }

      await handleSubmitData(payload)
    }
  }

  const addSubTest = (value: string) => {
    if (value && value.trim() !== '') {
      const trimmedValue = value.trim()

      if (!subTests.includes(trimmedValue)) {
        setSubTests(prev => [...prev, trimmedValue])
        setNewSubTests(prev => [...prev, trimmedValue])
        setValue('sub_tests', '')
      }
    }
  }

  const handleRemoveSubTest = (testName: string) => {
    const existingTest = existingSubTests.find(t => Object.values(t)[0] === testName)
    const isNewTest = newSubTests.includes(testName)
    const isDeletedTest = deletedSubTests.find(t => Object.values(t)[0] === testName)

    if (existingTest) {
      setExistingSubTests(prev => prev.filter(t => Object.values(t)[0] !== testName))
      setDeletedSubTests(prev => [...prev, existingTest])
    } else if (isNewTest) {
      setNewSubTests(prev => prev.filter(t => t !== testName))
    } else if (isDeletedTest) {
      restoreDeletedTest(testName)
    }

    setSubTests(prev => prev.filter(t => t !== testName))
  }

  useEffect(() => {
    setDeletedIds(deletedSubTests.map(test => Object.keys(test)[0]))
  }, [deletedSubTests])

  const restoreDeletedTest = (testName: string) => {
    setDeletedSubTests(prevDeletedTests => {
      const testToRestore = prevDeletedTests.find(t => Object.values(t)[0] === testName)

      if (testToRestore) {
        setExistingSubTests(prev => [...prev, testToRestore])
        setSubTests(prev => [...prev, testName])

        return prevDeletedTests.filter(t => Object.values(t)[0] !== testName)
      }

      return prevDeletedTests
    })
  }

  const handleRemoveSampleType = (sampleToRemove: SampleOption) => {
    setValue(
      'sample_ids',
      selectedSampleIds?.filter(sample => sample?.id !== sampleToRemove?.id)
    )
  }

  const searchSampleData = useCallback(
    debounce(async (q: string) => {
      setSearchValue(q)
      try {
        await fetchSampleTypesData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = (value: string) => {
    setSearchValue(value)
    searchSampleData(value)
  }

  const fetchSampleTypesData = useCallback(async (q?: string) => {
    try {
      const params = { q }
      await getLabSampleList({ params }).then(res => {
        setSampleTypes((res?.data?.result ?? []) as SampleOption[])
      })
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchSampleTypesData()
  }, [fetchSampleTypesData, searchValue])

  const inputRef = useRef<HTMLInputElement>(null)

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
              p: (theme: { spacing: (...args: number[]) => string }) => theme.spacing(3, 3.255, 3, 5.255),
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
                maxHeight: '79vh',
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
                    <Box key={String(sample.id)}>
                      {editParams?.id ? (
                        <Chip
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
                      getOptionLabel={(option: SampleOption) => option.label || option.name || ''}
                      value={selectedSampleIds}
                      renderInput={params => (
                        <TextField
                          {...params}
                          variant='outlined'
                          placeholder='Search Add Sample Type'
                          error={Boolean(errors.sample_ids)}
                          slotProps={{
                            input: {
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <Icon icon='mdi:magnify' sx={{ color: 'action.active', mr: 1 }} />
                                  {params.InputProps.startAdornment}
                                </>
                              )
                            }
                          }}
                        />
                      )}
                      onChange={(_, data) => {
                        const uniqueSamples = Array.from(new Map((data as SampleOption[]).map(sample => [sample.id, sample])).values())
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
                      slotProps={{
                        input: {
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
                        }
                      }}
                    />
                  )}
                />
              </FormControl>

              {deletedSubTests.length > 0 && (
                <Box>
                  <label>Deleted Tests</label>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                    {deletedSubTests.map((test, index) => {
                      const testId = Object.keys(test)[0]
                      const testName = test[testId]

                      return (
                        <Chip
                          key={index}
                          label={`${testName} (ID: ${testId})`}
                          onDelete={() => restoreDeletedTest(testName)}
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
