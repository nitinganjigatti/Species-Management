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
  Typography
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Router, { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { usePariveshContext } from 'src/context/PariveshContext'
import { addSpeciesToOrganization, getListAllSpeciesSearch, getSpeciesListByOrg } from 'src/lib/api/parivesh/addSpecies'
import moment from 'moment'
import Toaster from 'src/components/Toaster'

const schema = yup.object().shape({
  specie: yup
    .object()
    .shape({
      name: yup.string().required('Specie is Required')
    })
    .required('Specie is Required'),
  totalCount: yup.string().required('Total Count is Required'),
  gender: yup.string().required('Gender is Required'),
  age: yup.string().required('Age is Required'),
  ro_date: yup.date().required('Date is Required'),
  reason: yup.string().required('Reason is Required'),
  registrationNumber: yup.string().when('reason', {
    is: value => value === 'death',
    then: schema => schema.required('Registration Number is Required for Death Reason')
  }),
  reasonForDeath: yup.string().when('reason', {
    is: value => value === 'death',
    then: schema => schema.required('Reason for Death is Required')
  }),
  whereAndHowDisposed: yup.string().when('reason', {
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
  const [editParams, setEditParams] = useState()
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const [species, setSpecies] = useState([])
  const [organizations, setOrganizations] = useState([])

  const defaultValues = {
    specie: null,
    gender: '',
    age: '',
    totalCount: '',
    reason: '',
    ro_date: null
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
      ro_date,
      specie,
      reason,
      organizationName,
      age,
      registrationNumber,
      reasonForDeath,
      whereAndHowDisposed,
      totalCount
    } = { ...data }

    let payload
    if (reason === 'death') {
      payload = {
        org_id: selectedParivesh.id === 'all' ? organizationName?.id : selectedParivesh.id,
        tsn_id: specie?.id,
        tsn_relation: specie?.tsn_relation,
        possession_type: reason,
        gender: gender,
        animal_count: totalCount,
        transaction_date: moment(ro_date).format('YYYY-MM-DD'),
        age: age,
        alloted_register_no: registrationNumber,
        reason_for_death: reasonForDeath,
        where_disposed: whereAndHowDisposed
      }
    } else {
      payload = {
        org_id: selectedParivesh.id === 'all' ? organizationName?.id : selectedParivesh.id,
        tsn_id: specie?.id,
        tsn_relation: specie?.tsn_relation,
        possession_type: reason,
        gender: gender,
        animal_count: totalCount,
        transaction_date: moment(ro_date).format('YYYY-MM-DD'),
        age: age
      }
    }

    try {
      setBtnLoader(true)
      await addSpeciesToOrganization(payload).then(res => {
        if (res?.success) {
          router.back()
          setBtnLoader(false)
          Toaster({ type: 'success', message: res?.data })
        } else {
          setBtnLoader(false)
          Toaster({ type: 'error', message: res?.message })
        }
      })
    } catch (error) {
      console.log('error', error)
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

  const fetchSpeciesData = useCallback(async () => {
    try {
      const params = {}

      await getListAllSpeciesSearch({ params: params }).then(res => {
        console.log('response123', res?.data?.result)
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
              New Entries
            </Typography>
            <Typography color='text.primary'>New Report</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ mt: 5, background: '#FFFFFF', borderRadius: '10px' }}>
          <CardContent>
            <Typography sx={{ mb: '20px' }} variant='h6'>
              New Report
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
                          renderInput={params => <TextField {...params} label='Select the Specie' />}
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
                      name='reason'
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
                          error={Boolean(errors.reason)}
                        >
                          <MenuItem value='birth'>Birth</MenuItem>
                          <MenuItem value='death'>Death</MenuItem>
                          <MenuItem value='transfer'>Transfer </MenuItem>
                          <MenuItem value='acquisition'>Acquisition </MenuItem>
                        </TextField>
                      )}
                    />
                    {errors.reason && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.reason?.message}</FormHelperText>
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
                        name='registrationNumber'
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            label='Registration Number*'
                            value={value}
                            onChange={onChange}
                            placeholder='Allotted registration certificate number for Animal species'
                            error={Boolean(errors.registrationNumber)}
                            name='registrationNumber'
                          />
                        )}
                      />
                      {errors.registrationNumber && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.registrationNumber?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 6 }}>
                      <Controller
                        name='reasonForDeath'
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            label='Reason for Death*'
                            value={value}
                            onChange={onChange}
                            placeholder='Enter Reason for Death'
                            error={Boolean(errors.reasonForDeath)}
                            name='reasonForDeath'
                          />
                        )}
                      />
                      {errors.reasonForDeath && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.reasonForDeath?.message}</FormHelperText>
                      )}
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 6 }}>
                      <Controller
                        name='whereAndHowDisposed'
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            label='Where and How Disposed*'
                            value={value}
                            onChange={onChange}
                            placeholder='Enter Where and How Disposed'
                            error={Boolean(errors.whereAndHowDisposed)}
                            name='whereAndHowDisposed'
                          />
                        )}
                      />
                      {errors.whereAndHowDisposed && (
                        <FormHelperText sx={{ color: 'error.main' }}>
                          {errors.whereAndHowDisposed?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </>
                )}
              </Grid>

              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
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
                </Grid>
              </Grid>
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='totalCount'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          label='Total Count*'
                          value={value}
                          type='number'
                          onChange={onChange}
                          placeholder='Enter Total Count'
                          error={Boolean(errors.totalCount)}
                          name='totalCount'
                        />
                      )}
                    />
                    {errors.totalCount && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.totalCount?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='ro_date'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <SingleDatePicker
                          fullWidth
                          date={value}
                          width={'100%'}
                          onChangeHandler={onChange}
                          customInput={<CustomInput label='Date*' error={Boolean(errors.ro_date)} />}
                        />
                      )}
                    />
                    {errors.ro_date && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        {errors.ro_date?.message}
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
