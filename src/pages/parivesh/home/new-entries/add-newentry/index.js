import React, { forwardRef, useCallback, useEffect, useState } from 'react'
import { Box } from '@mui/system'
import { Controller, useForm } from 'react-hook-form'
import {
  Autocomplete,
  Breadcrumbs,
  Button,
  CardContent,
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
  updateSpeciesToOrganization
} from 'src/lib/api/parivesh/addSpecies'
import moment from 'moment'
import Toaster from 'src/components/Toaster'
import { getEntryListById } from 'src/lib/api/parivesh/entryList'

const schema = yup.object().shape({
  specie: yup
    .object()
    .shape({
      name: yup.string().required('Species is Required')
    })
    .required('Species is Required'),
  animal_count: yup
    .number()
    .typeError('Total Count must be a number')
    .positive('Total Count must be greater than zero')
    .integer('Total Count must be a whole number')
    .min(1, 'Total Count must be at least 1')
    .required('Total Count is Required'),
  gender: yup.string().required('Gender is Required'),
  // age: yup.string().required('Age is Required'),
  transaction_date: yup.date().required('Date is Required'),
  possession_type: yup.string().required('Reason is Required')
})

const AddNewEntry = () => {
  const router = useRouter()
  const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()
  const [btnLoader, setBtnLoader] = useState(false)
  const [editParams, setEditParams] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [species, setSpecies] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [searchValue, setSearchValue] = useState('')

  const defaultValues = {
    specie: null,
    gender: '',
    // age: '',
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
    const {
      gender,
      transaction_date,
      specie,
      possession_type,

      animal_count
    } = { ...data }

    const payload = {
      org_id: selectedParivesh.id,
      tsn_id: specie?.id,
      tsn_relation: specie?.tsn_relation,
      possession_type: possession_type,
      gender: gender,
      animal_count: animal_count,
      transaction_date: moment.utc(transaction_date).format('YYYY-MM-DD HH:mm:ss')
    }

    console.log(payload, 'payload')

    try {
      setBtnLoader(true)
      const response = isEditMode
        ? await updateSpeciesToOrganization(payload, editParams?.id)
        : await addSpeciesToOrganization(payload)

      if (response?.success) {
        router.back()
        Toaster({ type: 'success', message: response?.message })
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

  useEffect(() => {
    const { id } = router.query

    if (id !== undefined) {
      const selectedOrgId = selectedParivesh.id

      const params = {
        id: id,
        org_id: selectedOrgId
      }

      // console.log('Id >', id, selectedOrgId)

      const fetchDataById = async () => {
        const response = await getEntryListById(params)

        if (response?.success) {
          console.log(response.data, 'response >>')
          setEditParams(response.data)
          setIsEditMode(Object.keys(response.data).length > 0)

          const specieObject = {
            id: response.data.tsn_id,
            common_name: response.data.common_name,
            name: response.data.scientific_name,
            tsn_relation: response.data.tsn_relation
          }
          // Set the specie object
          setValue('specie', specieObject)

          for (const key of Object.keys(response.data)) {
            console.log(response.data[key], 'key')
            if (key === 'transaction_date') {
              const formattedDate = new Date(response.data[key])
              setValue(key, formattedDate)
            } else if (key === 'animal_count') {
              setValue(key, Number(response.data[key]))
            } else if (key === 'possession_type' && response.data[key] === 'death') {
              setValue(key, response.data[key])
            } else if (
              key !== 'scientific_name' &&
              key !== 'tsn_id' &&
              key !== 'common_name' &&
              key !== 'tsn_relation'
            ) {
              // Skip fields already set in specieObject
              setValue(key, response.data[key])
            }
          }
        } else {
          console.log('response error >>', response?.error)
        }
      }

      fetchDataById()
    }
  }, [setValue])

  console.log(editParams, 'editParams')

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
  }, [fetchSpeciesData])

  useEffect(() => {
    if (selectedParivesh?.id) {
      const selected = organizationList.find(el => el.id === selectedParivesh.id)
      setOrganizations(selected ? [selected] : [])
    } else {
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
              {isEditMode ? 'New Entries' : 'New Entries'}
            </Typography>
            <Typography color='text.primary'>{isEditMode ? 'Edit New Entry' : 'Add New Entry'}</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ mt: 5, background: '#FFFFFF', borderRadius: '10px' }}>
          <CardContent>
            <Typography sx={{ mb: '20px' }} variant='h6'>
              {isEditMode ? 'Edit New Entry' : 'Add New Entry'}
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
                          // getOptionLabel={option => `${option.common_name} (${option.name})` || ''}
                          isOptionEqualToValue={(option, value) => option.id === value?.id} // This line is changed
                          onChange={(event, newValue) => {
                            onChange(newValue)
                          }}
                          onInputChange={(event, newInputValue) => {
                            // Extract the common name part before calling searchTableData
                            // const searchTerm = newInputValue.split(' (')[0]
                            // searchTableData(searchTerm)
                            searchTableData(newInputValue)
                          }}
                          filterOptions={(options, { inputValue }) => {
                            return options.filter(option =>
                              option.common_name.toLowerCase().includes(inputValue.toLowerCase())
                            )
                          }}
                          renderInput={params => <TextField {...params} label='Search & Select…' />}
                        />
                      )}
                    />
                    {errors.specie && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.specie?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>

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
              <Grid></Grid>

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
                          dateFormat='dd/MM/yyyy'
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
