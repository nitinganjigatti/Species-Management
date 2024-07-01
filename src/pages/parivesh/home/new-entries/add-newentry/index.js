import React, { forwardRef, useCallback, useEffect, useState } from 'react'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import {
  Autocomplete,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Router, { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { usePariveshContext } from 'src/context/PariveshContext'
import {
  addSpeciesToOrganization,
  getListAllSpeciesSearch,
  getSpeciesListByOrg,
  updateSpeciesToOrganization
} from 'src/lib/api/parivesh/addSpecies'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import { getEntryListById } from 'src/lib/api/parivesh/entryList'

const schema = yup.object().shape({
  specie: yup
    .object()
    .shape({
      name: yup.string().required('Specie is Required')
    })
    .required('Specie is Required'),
  animal_count: yup.string().required('Total Count is Required'),
  gender: yup.string().required('Gender is Required'),
  age: yup.string().required('Age is Required'),
  transaction_date: yup.date().required('Date is Required'),
  possession_type: yup.string().required('Reason is Required'),
  alloted_register_no: yup.string().when('reason', {
    is: value => value === 'death',
    then: schema => schema.required('Registration Number is Required for Death Reason')
  }),
  reason_for_death: yup.string().when('reason', {
    is: value => value === 'death',
    then: schema => schema.required('Reason for Death is Required')
  }),
  where_disposed: yup.string().when('reason', {
    is: value => value === 'death',
    then: schema => schema.required('Where and How Disposed is Required for Death Reason')
  }),

  organizationName: yup.mixed().when('selectedParivesh.id', {
    is: 'all',
    then: yup.object().shape({
      organization_name: yup.string().required('Organization Name is Required')
    })
  })
})

const AddNewEntry = () => {
  const router = useRouter()
  const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()
  const [btnLoader, setBtnLoader] = useState(false)
  const [editParams, setEditParams] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const [species, setSpecies] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [searchValue, setSearchValue] = useState('')

  const defaultValues = {
    specie: null,
    gender: '',
    age: '',
    animal_count: '',
    possession_type: '',
    transaction_date: new Date()
  }

  const {
    reset,
    control,
    setValue,
    watch,
    getValues,
    clearErrors,
    handleSubmit,
    trigger,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
  })

  const onSubmit = async data => {
    // console.log('Form is invalid:', errors)
    console.log('Form submitted with data:', data)

    // console.log(getValues(), 'getValues')

    // //  Add logic to handle form submission, e.g., API calls
    // const isValid = await trigger()
    // console.log('isValid', isValid)

    // console.log(getValues(), 'getValues')

    // if (isValid) {
    //   handleSubmit(onSubmit)()
    // }

    const {
      gender,
      transaction_date,
      specie,
      possession_type,
      organizationName,
      age,
      alloted_register_no,
      reason_for_death,
      where_disposed,
      animal_count
    } = { ...data }

    const payload = {
      org_id: selectedParivesh.id === 'all' ? organizationName?.id : selectedParivesh.id,
      tsn_id: specie?.id,
      tsn_relation: specie?.tsn_relation,
      possession_type: possession_type,
      gender: gender,
      animal_count: animal_count,
      transaction_date: moment(transaction_date).format('YYYY-MM-DD'),
      // age: age,
      ...(possession_type === 'death' && {
        alloted_register_no: alloted_register_no,
        reason_for_death: reason_for_death,
        where_disposed: where_disposed
      })
    }

    try {
      setBtnLoader(true)
      const response = isEditMode
        ? await updateSpeciesToOrganization(payload, editParams?.id)
        : await addSpeciesToOrganization(payload)

      if (response?.success) {
        router.back()
        Toaster({ type: 'success', message: response?.data })
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      console.log('error', error)
    } finally {
      setBtnLoader(false)
    }
  }

  const RenderSidebarFooter = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'end', gap: 4 }}>
        <LoadingButton loading={btnLoader} size='large' variant='contained' type='submit'>
          {'Save'}
        </LoadingButton>
        <Button onClick={() => router.back()} size='large' type='reset' color='error' variant='outlined'>
          Cancel
        </Button>
      </Box>
    )
  }

  const searchTableData = useCallback(
    debounce(async q => {
      setSearchValue(q)
      try {
        await fetchSpeciesData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(value)
  }

  useEffect(() => {
    const { id } = router.query

    if (id !== undefined) {
      const selectedOrgId = selectedParivesh.id

      const params = {
        id: id,
        org_id: selectedOrgId
      }

      console.log('Id >', id, selectedOrgId)

      const fetchDataById = async () => {
        const response = await getEntryListById(params)

        if (response?.success) {
          console.log(response.data, 'response >>')
          setEditParams(response.data)
          setIsEditMode(Object.keys(response.data).length > 0)

          for (const key of Object.keys(response.data)) {
            console.log(response.data[key], 'key')
            if (key === 'transaction_date') {
              const formattedDate = new Date(response.data[key])
              setValue(key, formattedDate)
            } else if (key === 'scientific_name') {
              // Wait for searchTableData to complete
              await searchTableData(response.data[key])
            } else if (key === 'animal_count') {
              setValue(key, Number(response.data[key]))
            } else if (key === 'possession_type' && response.data[key] === 'death') {
              setShowAdditionalFields(true)
              setValue(key, response.data[key])
            } else {
              setValue(key, response.data[key])
            }
          }
        } else {
          console.log('response errror >>', response?.error)
        }
      }
      fetchDataById()
    }
  }, [setValue])

  // useEffect(() => {
  //   if (router.query) {
  //     setEditParams(router.query)
  //     setIsEditMode(Object.keys(router.query).length > 0)

  //     const fetchData = async () => {
  //       for (const key of Object.keys(router.query)) {
  //         if (key === 'transaction_date') {
  //           const formattedDate = new Date(router.query[key])
  //           setValue(key, formattedDate)
  //         } else if (key === 'scientific_name') {
  //           // Wait for searchTableData to complete
  //           await searchTableData(router.query[key])
  //         } else {
  //           setValue(key, router.query[key])
  //         }
  //       }
  //     }

  //     fetchData()
  //   }
  // }, [router.query, setValue, editParams])

  useEffect(() => {
    const specieObject = species.find(specie => specie.id === editParams?.tsn_id)

    if (specieObject) {
      setValue('specie', specieObject)
    }
  }, [editParams, species])

  // console.log(editParams, 'editParams')

  const fetchSpeciesData = useCallback(async q => {
    try {
      const params = { q }

      await getListAllSpeciesSearch({ params: params }).then(res => {
        // console.log('response123', res?.data?.result)
        const transformedSpecies = res?.data?.result.map(species => ({
          id: species?.tsn,
          common_name: species?.common_name,
          name: species?.scientific_name,
          tsn_relation: species?.tsn_relation,
          zoo_id: species.zoo_id
        }))
        setSpecies(transformedSpecies)
      })
    } catch (e) {
      console.log(e)
    }
  }, [])

  useEffect(() => {
    fetchSpeciesData()
  }, [fetchSpeciesData, searchValue])

  useEffect(() => {
    if (selectedParivesh?.id === 'all') {
      setOrganizations(organizationList.filter(el => el.id !== 'all'))
    } else {
      const selected = organizationList.find(el => el.id === selectedParivesh.id)
      setOrganizations(selected ? [selected] : [])
    }
  }, [selectedParivesh, organizationList])

  return (
    <>
      <Box>
        <Box>
          <Breadcrumbs aria-label='breadcrumb'>
            <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/parivesh/home')}>
              {selectedParivesh?.organization_name}
            </Typography>
            <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => router.back()}>
              {isEditMode ? 'Edit Entries' : 'New Entries'}
            </Typography>
            <Typography color='text.primary'>{isEditMode ? 'Edit Report' : 'New Report'}</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ mt: 5, background: '#FFFFFF', borderRadius: '10px' }}>
          <CardContent>
            <Typography sx={{ mb: '20px' }} variant='h6'>
              {isEditMode ? 'Edit Report' : 'New Report'}
            </Typography>

            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth error={Boolean(errors.specie)}>
                    <Controller
                      name='specie'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          sx={{ width: '100%' }}
                          options={species}
                          id='autocomplete-clearOnEscape'
                          value={value}
                          getOptionLabel={option => option.name || ''}
                          isOptionEqualToValue={(option, value) => option.id === value?.id} // This line is changed
                          onChange={(event, newValue) => {
                            onChange(newValue)
                          }}
                          onInputChange={(event, newInputValue) => {
                            handleSearch(newInputValue) // Fetch species based on user input
                          }}
                          renderInput={params => <TextField {...params} label='Select the Species' />}
                        />
                      )}
                    />
                    {errors.specie && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.specie?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
              {selectedParivesh?.id === 'all' && organizations && organizations.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 6 }}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={Boolean(errors.organizationName)}>
                      <Controller
                        name='organizationName'
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <Autocomplete
                            sx={{ width: '100%' }}
                            options={organizations}
                            id='autocomplete-clearOnEscape'
                            value={value}
                            getOptionLabel={option => option.organization_name || ''}
                            isOptionEqualToValue={(option, value) => option.org_id === value?.org_id}
                            onChange={(event, newValue) => {
                              onChange(newValue)
                            }}
                            renderInput={params => <TextField {...params} label='Select the Organization' />}
                          />
                        )}
                      />
                      {errors.organizationName && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.organizationName?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='possession_type'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          select
                          label='Reason*'
                          placeholder='Reason'
                          value={value}
                          onChange={e => {
                            onChange(e)
                            setShowAdditionalFields(e.target.value === 'death') // Show additional fields only when reason is 'death'
                          }}
                          error={Boolean(errors.possession_type)}
                        >
                          <MenuItem value='birth'>Birth</MenuItem>
                          <MenuItem value='death'>Death</MenuItem>
                          <MenuItem value='transfer'>Transfer </MenuItem>
                          <MenuItem value='acquisition'>Acquisition </MenuItem>
                        </TextField>
                      )}
                    />
                    {errors.possession_type && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.possession_type?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
              <Grid>
                {showAdditionalFields && (
                  <>
                    {/* Additional input fields */}
                    <FormControl fullWidth sx={{ mb: 6 }}>
                      <Controller
                        name='alloted_register_no'
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            label='Registration Number*'
                            value={value}
                            onChange={onChange}
                            placeholder='Allotted registration certificate number for Animal species'
                            error={Boolean(errors.alloted_register_no)}
                            name='alloted_register_no'
                          />
                        )}
                      />
                      {errors.alloted_register_no && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.alloted_register_no?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 6 }}>
                      <Controller
                        name='reason_for_death'
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            label='Reason for Death*'
                            value={value}
                            onChange={onChange}
                            placeholder='Enter Reason for Death'
                            error={Boolean(errors.reason_for_death)}
                            name='reason_for_death'
                          />
                        )}
                      />
                      {errors.reason_for_death && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.reason_for_death?.message}</FormHelperText>
                      )}
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 6 }}>
                      <Controller
                        name='where_disposed'
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            label='Where and How Disposed*'
                            value={value}
                            onChange={onChange}
                            placeholder='Enter Where and How Disposed'
                            error={Boolean(errors.where_disposed)}
                            name='where_disposed'
                          />
                        )}
                      />
                      {errors.where_disposed && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.where_disposed?.message}</FormHelperText>
                      )}
                    </FormControl>
                  </>
                )}
              </Grid>

              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={12}>
                  <FormControl fullWidth>
                    <Controller
                      name='gender'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          select
                          label='Gender*'
                          value={value}
                          onChange={onChange}
                          error={Boolean(errors.gender)}
                        >
                          <MenuItem value='male'>Male</MenuItem>
                          <MenuItem value='female'>Female</MenuItem>
                          <MenuItem value='other'>Other</MenuItem>
                        </TextField>
                      )}
                    />
                    {errors.gender && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.gender?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                {/* <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='age'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <TextField select label='Age*' value={value} onChange={onChange} error={Boolean(errors.age)}>
                          <MenuItem value='adult'>Adult</MenuItem>
                        </TextField>
                      )}
                    />

                    {errors.age && <FormHelperText sx={{ color: 'error.main' }}>{errors.age?.message}</FormHelperText>}
                  </FormControl>
                </Grid> */}
              </Grid>
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='animal_count'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          label='Total Count*'
                          value={value}
                          type='number'
                          onChange={onChange}
                          placeholder='Enter Total Count'
                          error={Boolean(errors.animal_count)}
                          name='animal_count'
                        />
                      )}
                    />

                    {errors.animal_count && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.animal_count?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='transaction_date'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <SingleDatePicker
                          fullWidth
                          date={value}
                          width={'100%'}
                          onChangeHandler={onChange}
                          maxDate={new Date()}
                          customInput={<CustomInput label='Date*' error={Boolean(errors.transaction_date)} />}
                        />
                      )}
                    />
                    {errors.transaction_date && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        {errors.transaction_date?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

              <RenderSidebarFooter />
            </form>
          </CardContent>
        </Box>
      </Box>
    </>
  )
}

export default AddNewEntry
