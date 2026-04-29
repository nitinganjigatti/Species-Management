import React, { useCallback, useEffect, useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Drawer,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import moment from 'moment'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import {
  createAnimal,
  getAccessionType,
  getAnimalGetconfigs,
  getAnimalOwnershipTerms,
  getMastersOrganization,
  getTaxonomyList
} from 'src/lib/api/egg/egg/createAnimal'

type EntryType = 'single' | 'batch' | 'group'
type AgeUnit = 'days' | 'weeks' | 'months'

interface AddAnimalDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const AddAnimalDrawer: React.FC<AddAnimalDrawerProps> = ({ open, onClose, onSuccess }) => {
  const theme = useTheme()

  const [entryType, setEntryType] = useState<EntryType>('single')
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('days')
  const [loader, setLoader] = useState(false)

  // Master data
  const [taxonomyList, setTaxonomyList] = useState<any[]>([])
  const [defaultSpecies, setDefaultSpecies] = useState<any>(null)
  const [accessionTypeList, setAccessionTypeList] = useState<any[]>([])
  const [ownershipTermsList, setOwnershipTermsList] = useState<any[]>([])
  const [organizationList, setOrganizationList] = useState<any[]>([])
  const [localIdentifierTypeList, setLocalIdentifierTypeList] = useState<any[]>([])
  const [collectionTypeList, setCollectionTypeList] = useState<any[]>([])

  // Schemas per entry type
  const singleSchema = yup.object().shape({
    species: yup.string().required('Species / Taxonomy is required'),
    accessionType: yup.string().required('Accession type is required'),
    accessionDate: yup.mixed().required('Accession date is required'),
    enclosure: yup.string().required('Enclosure is required'),
    sexType: yup.string().required('Sex type is required'),
    collectionType: yup.string().required('Collection type is required')
  })

  const batchSchema = yup.object().shape({
    species: yup.string().required('Species / Taxonomy is required'),
    accessionType: yup.string().required('Accession type is required'),
    accessionDate: yup.mixed().required('Accession date is required'),
    enclosure: yup.string().required('Enclosure is required'),
    collectionType: yup.string().required('Collection type is required')
  })

  const groupSchema = yup.object().shape({
    totalCount: yup.number().required('Total count is required').min(1, 'Must be at least 1'),
    accessionType: yup.string().required('Accession type is required'),
    accessionDate: yup.mixed().required('Accession date is required'),
    species: yup.string().required('Species / Taxonomy is required'),
    enclosure: yup.string().required('Enclosure is required')
  })

  const getSchema = () => {
    if (entryType === 'batch') return batchSchema
    if (entryType === 'group') return groupSchema

    return singleSchema
  }

  const defaultValues = {
    species: '',
    accessionType: '',
    ownershipTerm: '',
    accessionDate: dayjs(),
    enclosure: '',
    sexType: '',
    collectionType: '',
    organisation: '',
    birthDate: null as any,
    age: '',
    localIdentifierType: '',
    // Batch fields
    maleCount: '',
    femaleCount: '',
    undeterminedCount: '',
    indeterminateCount: '',
    // Group fields
    totalCount: ''
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(getSchema()) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Fetch master data
  useEffect(() => {
    if (!open) return

    getAccessionType().then(res => {
      if (res?.is_success) setAccessionTypeList(res?.data || [])
    })
    getAnimalOwnershipTerms().then(res => {
      if (res?.success) setOwnershipTermsList(res?.data || [])
    })
    getMastersOrganization().then(res => {
      if (Array.isArray(res)) setOrganizationList(res)
    })
    getAnimalGetconfigs().then(res => {
      if (res?.success) {
        setLocalIdentifierTypeList(res?.data?.animal_indetifier || [])
        setCollectionTypeList(res?.data?.collection_type || [])
      }
    })
    getTaxonomyList().then(res => {
      if (res?.success) setTaxonomyList(res?.data || [])
    })
  }, [open])

  const searchSpecies = useCallback(
    debounce(async (search: string) => {
      const res = await getTaxonomyList({ search })
      if (res?.success) setTaxonomyList(res?.data || [])
    }, 500),
    []
  )

  const onSubmit = async (values: any) => {
    try {
      setLoader(true)
      const payload: any = {
        form_type: entryType,
        accession_type: values.accessionType,
        accession_date: moment(values.accessionDate?.$d || values.accessionDate).format('YYYY-MM-DD'),
        taxonomy_id: values.species,
        ownership_term: values.ownershipTerm,
        organization_id: values.organisation,
        collection_type: values.collectionType,
        local_id_type: values.localIdentifierType
      }

      if (entryType === 'single') {
        payload.sex = values.sexType
        if (values.birthDate) {
          payload.birth_date = moment(values.birthDate?.$d || values.birthDate).format('YYYY-MM-DD')
        }
        if (values.age) {
          payload.age = values.age
          payload.age_unit = ageUnit
        }
      }

      if (entryType === 'batch') {
        payload.male = values.maleCount || 0
        payload.female = values.femaleCount || 0
        payload.undetermined = values.undeterminedCount || 0
        payload.indeterminate = values.indeterminateCount || 0
      }

      if (entryType === 'group') {
        payload.total_count = values.totalCount
      }

      const res = await createAnimal(payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res.message })
        handleClose()
        onSuccess?.()
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to create animal' })
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'An error occurred while creating animal' })
    } finally {
      setLoader(false)
    }
  }

  const handleClose = () => {
    reset(defaultValues)
    setEntryType('single')
    setDefaultSpecies(null)
    setAgeUnit('days')
    onClose()
  }

  const handleEntryTypeChange = (type: EntryType) => {
    setEntryType(type)
    reset(defaultValues)
    setDefaultSpecies(null)
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: { width: { xs: '100%', sm: 560 }, backgroundColor: theme.palette.customColors.Background }
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 4,
            px: 5,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon icon='mdi:paw-outline' fontSize={28} />
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Add Animal
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        {/* Scrollable content */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 5 }}>
          <form id='add-animal-form' onSubmit={handleSubmit(onSubmit)}>
            {/* Entry Type Selection */}
            <Typography
              variant='subtitle2'
              sx={{ fontWeight: 600, mb: 3, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              Choose Animal Entry Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 5 }}>
              {(['single', 'batch', 'group'] as EntryType[]).map(type => (
                <Box
                  key={type}
                  onClick={() => handleEntryTypeChange(type)}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    px: 2,
                    border: `1.5px solid ${
                      entryType === type ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant
                    }`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    backgroundColor: entryType === type ? theme.palette.customColors.Surface : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color:
                        entryType === type ? theme.palette.primary.main : theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Typography>
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `2px solid ${
                        entryType === type ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {entryType === type && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: theme.palette.primary.main
                        }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Batch Count Section */}
            {entryType === 'batch' && (
              <>
                <Typography
                  variant='subtitle2'
                  sx={{ fontWeight: 600, mb: 3, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Batch Count
                </Typography>
                <Card sx={{ p: 4, mb: 5 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name='maleCount'
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label='# Male'
                            type='number'
                            size='small'
                            inputProps={{ min: 0 }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name='femaleCount'
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label='# Female'
                            type='number'
                            size='small'
                            inputProps={{ min: 0 }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name='undeterminedCount'
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label='# Undetermined'
                            type='number'
                            size='small'
                            inputProps={{ min: 0 }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name='indeterminateCount'
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label='# Indeterminate'
                            type='number'
                            size='small'
                            inputProps={{ min: 0 }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Card>
              </>
            )}

            {/* Add Information Section */}
            <Typography
              variant='subtitle2'
              sx={{ fontWeight: 600, mb: 3, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              Add Information
            </Typography>
            <Card sx={{ p: 4, mb: 5 }}>
              {/* Group: Total Count */}
              {entryType === 'group' && (
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <Controller
                    name='totalCount'
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label='Total Count of animals'
                        type='number'
                        error={Boolean(errors.totalCount)}
                        inputProps={{ min: 1 }}
                      />
                    )}
                  />
                  {errors.totalCount && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.totalCount.message}</FormHelperText>
                  )}
                </FormControl>
              )}

              {/* Species / Taxonomy */}
              {entryType !== 'group' && (
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <Controller
                    name='species'
                    control={control}
                    render={({ field: { onChange } }) => (
                      <Autocomplete
                        value={defaultSpecies}
                        options={taxonomyList}
                        getOptionLabel={(option: any) => `${option.common_name} (${option.scientific_name})`}
                        isOptionEqualToValue={(option: any, value: any) => option?.tsn === value?.tsn}
                        onChange={(_, val) => {
                          setDefaultSpecies(val)
                          onChange(val?.tsn || '')
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Species / Taxonomy'
                            placeholder='Enter minimum 3 characters'
                            error={Boolean(errors.species)}
                            onChange={e => searchSpecies(e.target.value)}
                          />
                        )}
                      />
                    )}
                  />
                  {errors.species && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.species.message}</FormHelperText>
                  )}
                </FormControl>
              )}

              {/* Accession Type */}
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Accession Type</InputLabel>
                <Controller
                  name='accessionType'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label='Accession Type' error={Boolean(errors.accessionType)}>
                      {accessionTypeList.map((item: any) => (
                        <MenuItem key={item.accession_id} value={item.accession_id}>
                          {item.accession_type}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.accessionType && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.accessionType.message}</FormHelperText>
                )}
              </FormControl>

              {/* Ownership Term */}
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Ownership Term</InputLabel>
                <Controller
                  name='ownershipTerm'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label='Ownership Term'>
                      {ownershipTermsList.map((item: any) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>

              {/* Accession Date */}
              <FormControl fullWidth sx={{ mb: 4 }}>
                <Controller
                  name='accessionDate'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={value}
                        onChange={onChange}
                        label='Accession Date'
                        maxDate={dayjs()}
                        sx={{ width: '100%' }}
                      />
                    </LocalizationProvider>
                  )}
                />
                {errors.accessionDate && (
                  <FormHelperText sx={{ color: 'error.main' }}>{(errors.accessionDate as any).message}</FormHelperText>
                )}
              </FormControl>

              {/* Species/Taxonomy for Group (placed after accession date per design) */}
              {entryType === 'group' && (
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <Controller
                    name='species'
                    control={control}
                    render={({ field: { onChange } }) => (
                      <Autocomplete
                        value={defaultSpecies}
                        options={taxonomyList}
                        getOptionLabel={(option: any) => `${option.common_name} (${option.scientific_name})`}
                        isOptionEqualToValue={(option: any, value: any) => option?.tsn === value?.tsn}
                        onChange={(_, val) => {
                          setDefaultSpecies(val)
                          onChange(val?.tsn || '')
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Species / Taxonomy'
                            error={Boolean(errors.species)}
                            onChange={e => searchSpecies(e.target.value)}
                          />
                        )}
                      />
                    )}
                  />
                  {errors.species && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.species.message}</FormHelperText>
                  )}
                </FormControl>
              )}

              {/* Select Enclosure */}
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Select Enclosure</InputLabel>
                <Controller
                  name='enclosure'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label='Select Enclosure' error={Boolean(errors.enclosure)}>
                      {/* TODO: Populate with enclosure API data */}
                      <MenuItem value=''>Select Enclosure</MenuItem>
                    </Select>
                  )}
                />
                {errors.enclosure && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.enclosure.message}</FormHelperText>
                )}
              </FormControl>

              {/* Sex Type (Single and Group) */}
              {(entryType === 'single' || entryType === 'group') && (
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <InputLabel>Sex Type</InputLabel>
                  <Controller
                    name='sexType'
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label='Sex Type' error={Boolean(errors.sexType)}>
                        <MenuItem value='male'>Male</MenuItem>
                        <MenuItem value='female'>Female</MenuItem>
                        <MenuItem value='undetermined'>Undetermined</MenuItem>
                        <MenuItem value='indeterminate'>Indeterminate</MenuItem>
                      </Select>
                    )}
                  />
                  {errors.sexType && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.sexType.message}</FormHelperText>
                  )}
                </FormControl>
              )}

              {/* Collection Type */}
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Collection Type</InputLabel>
                <Controller
                  name='collectionType'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label='Collection Type' error={Boolean(errors.collectionType)}>
                      {collectionTypeList.map((item: any) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.collectionType && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.collectionType.message}</FormHelperText>
                )}
              </FormControl>

              {/* Organisation */}
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Organisation</InputLabel>
                <Controller
                  name='organisation'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label='Organisation'>
                      {organizationList.map((item: any) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.organization_name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>

              {/* Birth Date (Single and Batch) */}
              {(entryType === 'single' || entryType === 'batch') && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <Controller
                      name='birthDate'
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            value={value}
                            onChange={onChange}
                            label='Birth Date'
                            maxDate={dayjs()}
                            sx={{ width: '100%' }}
                          />
                        </LocalizationProvider>
                      )}
                    />
                  </FormControl>

                  <Typography
                    sx={{
                      textAlign: 'center',
                      fontSize: '1rem',
                      fontWeight: 500,
                      my: 3,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Or
                  </Typography>

                  {/* Age + Unit */}
                  <Box sx={{ display: 'flex', gap: 4, mb: 4, alignItems: 'stretch', width: '100%' }}>
                    <Controller
                      name='age'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label='Age'
                          type='number'
                          sx={{ width: 100, flexShrink: 0 }}
                          slotProps={{ htmlInput: { min: 1 } }}
                        />
                      )}
                    />
                    <ToggleButtonGroup
                      fullWidth
                      value={ageUnit}
                      exclusive
                      onChange={(_, val) => val && setAgeUnit(val)}
                      sx={{
                        '& .MuiToggleButton-root': {
                          textTransform: 'capitalize',
                          px: 2.5,
                          borderColor: theme.palette.customColors.OutlineVariant
                        },
                        '& .Mui-selected': {
                          backgroundColor: `${theme.palette.customColors.OnPrimaryContainer} !important`,
                          color: `${theme.palette.common.white} !important`
                        }
                      }}
                    >
                      <ToggleButton value='days'>Days</ToggleButton>
                      <ToggleButton value='weeks'>Weeks</ToggleButton>
                      <ToggleButton value='months'>Months</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </>
              )}

              {/* Local Identifier Type (Single and Batch) */}
              {(entryType === 'single' || entryType === 'batch') && (
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <InputLabel>Local Identifier Type</InputLabel>
                  <Controller
                    name='localIdentifierType'
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label='Local Identifier Type'>
                        {localIdentifierTypeList.map((item: any) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              )}
            </Card>
          </form>
        </Box>

        {/* Submit Button */}
        <Box sx={{ p: 5, flexShrink: 0 }}>
          <LoadingButton
            fullWidth
            variant='contained'
            size='large'
            loading={loader}
            type='submit'
            form='add-animal-form'
            sx={{ borderRadius: '8px', textTransform: 'uppercase' }}
          >
            Submit
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddAnimalDrawer
