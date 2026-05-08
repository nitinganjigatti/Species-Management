import React, { useCallback, useEffect, useState } from 'react'
import {
  Autocomplete,
  Avatar,
  Box,
  Card,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
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
import { useAuth } from 'src/hooks/useAuth'
import {
  createAnimal,
  createGroupAnimal,
  getAccessionType,
  getAnimalGetconfigs,
  getAnimalOwnershipTerms,
  getMastersOrganization,
  getTaxonomyList
} from 'src/lib/api/egg/egg/createAnimal'
import SelectEnclosurePickerDrawer, { SelectedEnclosure } from './SelectEnclosurePickerDrawer'

type EntryType = 'single' | 'batch' | 'group'
type AgeUnit = 'days' | 'weeks' | 'months' | 'years'

interface AddAnimalDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const AddAnimalDrawer: React.FC<AddAnimalDrawerProps> = ({ open, onClose, onSuccess }) => {
  const theme = useTheme()
  const auth = useAuth() as any
  const zooId: number | undefined = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const [entryType, setEntryType] = useState<EntryType>('single')
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('days')
  const [loader, setLoader] = useState(false)

  // Controlled open state so the date pickers also open when the user clicks the
  // text input (default MUI X behavior is calendar-icon-only).
  const [accessionDateOpen, setAccessionDateOpen] = useState(false)
  const [birthDateOpen, setBirthDateOpen] = useState(false)

  // Enclosure picker drawer state — opens a bottom sheet with section→enclosure→subenclosure cascade.
  const [enclosurePickerOpen, setEnclosurePickerOpen] = useState(false)
  const [selectedEnclosure, setSelectedEnclosure] = useState<SelectedEnclosure | null>(null)

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
    totalCount: yup
      .number()
      .typeError('Total count must be a number')
      .required('Total count is required')
      .min(2, 'Group requires at least 2 animals'),
    accessionType: yup.string().required('Accession type is required'),
    accessionDate: yup.mixed().required('Accession date is required'),
    species: yup.string().required('Species / Taxonomy is required'),
    enclosure: yup.string().required('Enclosure is required'),
    sexType: yup.string().required('Sex type is required'),
    collectionType: yup.string().required('Collection type is required')
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
    localId: '',
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
    setValue,
    getValues,
    watch,
    trigger,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(getSchema()) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Show "Local ID" only after the user has chosen a "Local Identifier Type".
  const watchedLocalIdentifierType = watch('localIdentifierType')

  // ===== Birth Date ↔ Age + Unit bidirectional sync =====
  // Birth date is the source of truth. Age+unit is derived from it.

  const computeAgeFromBirthDate = (birthDate: any, unit: AgeUnit): string => {
    if (!birthDate) return ''
    const diff = dayjs().diff(dayjs(birthDate), unit)
    return diff > 0 ? String(diff) : '0'
  }

  const computeBirthDateFromAge = (ageStr: string, unit: AgeUnit): any => {
    const num = parseInt(ageStr, 10)
    if (isNaN(num) || num < 0) return null
    return dayjs().subtract(num, unit)
  }

  const handleBirthDateChange = (newDate: any, fieldOnChange: (v: any) => void) => {
    fieldOnChange(newDate)
    setValue('age', computeAgeFromBirthDate(newDate, ageUnit))
  }

  const handleAgeChange = (rawValue: string, fieldOnChange: (v: string) => void) => {
    fieldOnChange(rawValue)
    const newDate = computeBirthDateFromAge(rawValue, ageUnit)
    if (newDate) setValue('birthDate', newDate)
  }

  const handleAgeUnitChange = (newUnit: AgeUnit | null) => {
    if (!newUnit) return
    setAgeUnit(newUnit)
    // Re-express the existing birth date in the newly-selected unit so the displayed age
    // stays consistent with the picked date instead of jumping to a different point in time.
    const currentBirthDate = getValues('birthDate')
    if (currentBirthDate) {
      setValue('age', computeAgeFromBirthDate(currentBirthDate, newUnit))
    }
  }

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

      // Group entry uses a different endpoint (`groupAnimal/create`) and a leaner payload —
      // no section_id/site_id, no local identifiers, no parents, no form_type. `totalCount`
      // is camelCase (backend contract). Branch early so single/batch path stays clean.
      if (entryType === 'group') {
        const groupPayload: any = {
          accession_type: values.accessionType,
          accession_date: moment(values.accessionDate?.$d || values.accessionDate).format('YYYY-MM-DD'),
          taxonomy_id: values.species,
          enclosure_id: selectedEnclosure?.enclosure_id ? String(selectedEnclosure.enclosure_id) : '',
          organization_id: values.organisation,
          from_institution: null,
          ownership_term: values.ownershipTerm,
          totalCount: String(values.totalCount),
          sex: values.sexType,
          collection_type: values.collectionType,
          place_of_rescue: '',
          rescue_type: null,
          description: null,
          zoo_id: zooId,
          breed_id: null,
          morph_id: null,
          locality_id: null
        }
        const groupRes = await createGroupAnimal(groupPayload)
        if (groupRes?.success) {
          Toaster({ type: 'success', message: groupRes.message })
          handleClose()
          onSuccess?.()
        } else {
          Toaster({ type: 'error', message: groupRes?.message || 'Failed to create group of animals' })
        }
        return
      }

      // Single + Batch share the `animal/create` endpoint and shape.
      // Optional fields (`local_id_type`, `local_id`) collapse to `null` when empty —
      // sending `""` for these triggers backend validation errors in some entry types.
      const payload: any = {
        accession_type: values.accessionType,
        accession_date: moment(values.accessionDate?.$d || values.accessionDate).format('YYYY-MM-DD'),
        taxonomy_id: values.species,
        enclosure_id: selectedEnclosure?.enclosure_id ? String(selectedEnclosure.enclosure_id) : '',
        organization_id: values.organisation,
        from_institution: null,
        ownership_term: values.ownershipTerm,
        section_id: selectedEnclosure?.section_id ? String(selectedEnclosure.section_id) : '',
        site_id: selectedEnclosure?.site_id ? String(selectedEnclosure.site_id) : '',
        collection_type: values.collectionType,
        place_of_rescue: '',
        rescue_type: null,
        local_id_type: values.localIdentifierType || null,
        local_id: values.localId || null,
        breed_id: null,
        morph_id: null,
        locality_id: null,
        description: null,
        form_type: entryType,
        zoo_id: zooId,
        parent_female: '',
        parent_male: ''
      }

      // Birth date + age apply to both single and batch.
      if (values.birthDate) {
        payload.birth_date = moment(values.birthDate?.$d || values.birthDate).format('YYYY-MM-DD')
      }
      // Age is sent as a single concatenated string e.g. "2days" / "5months" — NOT separate age + age_unit.
      if (values.age) payload.age = `${values.age}${ageUnit}`

      if (entryType === 'single') {
        payload.sex = values.sexType
      }

      if (entryType === 'batch') {
        // Counts are sent as strings (e.g. "1") to match the backend contract.
        payload.male = String(values.maleCount || 0)
        payload.female = String(values.femaleCount || 0)
        payload.undetermined = String(values.undeterminedCount || 0)
        payload.indeterminate = String(values.indeterminateCount || 0)
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
    setSelectedEnclosure(null)
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
      // Only close via the X button — ignore backdrop clicks and Escape so the user
      // doesn't lose half-filled form data by tapping outside.
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return
        handleClose()
      }}
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
            <Card
              variant='outlined'
              sx={{
                p: 4,
                mb: 5,
                borderRadius: '10px',
                borderColor: theme.palette.customColors.SurfaceVariant,
                backgroundColor: theme.palette.background.paper
              }}
            >
              <RadioGroup
                row
                name='entry-type'
                value={entryType}
                onChange={(_, val) => handleEntryTypeChange(val as EntryType)}
                sx={{ display: 'flex', gap: 2, width: '100%', flexWrap: 'nowrap' }}
              >
                {(['single', 'batch', 'group'] as EntryType[]).map(type => {
                  const selected = entryType === type

                  return (
                    <FormControlLabel
                      key={type}
                      value={type}
                      labelPlacement='start'
                      control={
                        <Radio
                          disableRipple
                          sx={{
                            p: 0,
                            color: theme.palette.customColors.OutlineVariant,
                            '&.Mui-checked': { color: theme.palette.primary.main }
                          }}
                        />
                      }
                      label={
                        <Typography
                          variant='subtitle1'
                          sx={{
                            fontWeight: 600,
                            color: selected
                              ? theme.palette.primary.main
                              : theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Typography>
                      }
                      sx={{
                        flex: 1,
                        m: 0,
                        py: 3,
                        px: 3,
                        minHeight: 60,
                        border: `1.5px solid ${
                          selected ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant
                        }`,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        cursor: 'pointer',
                        backgroundColor: selected ? theme.palette.customColors.Surface : 'transparent',
                        transition: 'all 0.2s',
                        '& .MuiFormControlLabel-label': { display: 'flex' }
                      }}
                    />
                  )
                })}
              </RadioGroup>
            </Card>

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
                    render={({ field: { value, onChange, onBlur, ref } }) => (
                      <TextField
                        ref={ref}
                        value={value}
                        onBlur={onBlur}
                        // Validate on every keystroke so the "Group requires at least 2 animals"
                        // message appears immediately — not only after blur/submit.
                        onChange={e => {
                          onChange(e)
                          trigger('totalCount')
                        }}
                        label='Total Count of animals'
                        type='number'
                        error={Boolean(errors.totalCount)}
                        inputProps={{ min: 2 }}
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
                        open={accessionDateOpen}
                        onOpen={() => setAccessionDateOpen(true)}
                        onClose={() => setAccessionDateOpen(false)}
                        // MUI X v8 ships an "accessible field" by default (segmented spans).
                        // Disable it to get back the legacy single-<input> structure that respects onClick.
                        enableAccessibleFieldDOMStructure={false}
                        slotProps={{
                          textField: {
                            onClick: () => setAccessionDateOpen(true),
                            sx: { cursor: 'pointer', '& .MuiInputBase-root': { cursor: 'pointer' } },
                            inputProps: {
                              readOnly: true,
                              style: { cursor: 'pointer' }
                            }
                          }
                        }}
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

              {/* Select Enclosure — opens a bottom-sheet picker with section→enclosure→subenclosure cascade.
                  Two states: empty placeholder field that opens the picker, OR a selected-card with Encl/Sec/Site
                  + a circular X to clear the selection (matches the mobile-design "selected enclosure" card). */}
              <FormControl fullWidth sx={{ mb: 4 }}>
                <Typography
                  variant='subtitle2'
                  sx={{ fontWeight: 600, mb: 2, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Enclosure
                </Typography>
                {!selectedEnclosure ? (
                  <Controller
                    name='enclosure'
                    control={control}
                    render={() => (
                      <TextField
                        placeholder='Select Enclosure'
                        onClick={() => setEnclosurePickerOpen(true)}
                        error={Boolean(errors.enclosure)}
                        slotProps={{
                          input: {
                            readOnly: true,
                            endAdornment: <Icon icon='mdi:chevron-down' />
                          }
                        }}
                        sx={{ cursor: 'pointer', '& .MuiInputBase-root': { cursor: 'pointer' } }}
                      />
                    )}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      pr: 1.5,
                      borderRadius: '8px',
                      backgroundColor: theme.palette.customColors.Surface
                    }}
                  >
                    <Avatar
                      src={selectedEnclosure.enclosure_image || undefined}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: theme.palette.customColors.SurfaceVariant
                      }}
                    >
                      <Icon icon='mdi:home-outline' />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ fontWeight: 700, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        Encl: {selectedEnclosure.enclosure_name}
                      </Typography>
                      {selectedEnclosure.section_name && (
                        <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                          Sec: {selectedEnclosure.section_name}
                        </Typography>
                      )}
                      {selectedEnclosure.site_name && (
                        <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                          Site: {selectedEnclosure.site_name}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      onClick={() => {
                        setSelectedEnclosure(null)
                        setValue('enclosure', '')
                      }}
                      sx={{
                        border: `2px solid ${theme.palette.customColors.Tertiary}`,
                        color: theme.palette.customColors.Tertiary,
                        width: 32,
                        height: 32,
                        flexShrink: 0
                      }}
                      size='small'
                    >
                      <Icon icon='mdi:close' fontSize={18} />
                    </IconButton>
                  </Box>
                )}
                {errors.enclosure && !selectedEnclosure && (
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
                            onChange={newDate => handleBirthDateChange(newDate, onChange)}
                            label='Birth Date'
                            maxDate={dayjs()}
                            sx={{ width: '100%' }}
                            open={birthDateOpen}
                            onOpen={() => setBirthDateOpen(true)}
                            onClose={() => setBirthDateOpen(false)}
                            // MUI X v8 ships an "accessible field" by default (segmented spans).
                            // Disable it to get back the legacy single-<input> structure that respects onClick.
                            enableAccessibleFieldDOMStructure={false}
                            slotProps={{
                              textField: {
                                onClick: () => setBirthDateOpen(true),
                                sx: { cursor: 'pointer', '& .MuiInputBase-root': { cursor: 'pointer' } },
                                inputProps: {
                                  readOnly: true,
                                  style: { cursor: 'pointer' }
                                }
                              }
                            }}
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
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          onChange={e => handleAgeChange(e.target.value, onChange)}
                          label='Age'
                          type='number'
                          sx={{ width: 100, flexShrink: 0 }}
                          slotProps={{ htmlInput: { min: 0 } }}
                        />
                      )}
                    />
                    <ToggleButtonGroup
                      fullWidth
                      value={ageUnit}
                      exclusive
                      onChange={(_, val) => handleAgeUnitChange(val)}
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
                      <ToggleButton value='years'>Years</ToggleButton>
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

              {/* Local ID (free-text value paired with Local Identifier Type).
                  Only renders once the user has chosen a Local Identifier Type — pairing the two
                  inputs visually so it's clear the ID belongs to the chosen type. */}
              {(entryType === 'single' || entryType === 'batch') && Boolean(watchedLocalIdentifierType) && (
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <Controller
                    name='localId'
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label='Local Identifier' placeholder='Enter Local Identifier' />
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

      {/* Bottom-sheet enclosure picker — section → enclosure → sub-enclosure cascade */}
      <SelectEnclosurePickerDrawer
        open={enclosurePickerOpen}
        onClose={() => setEnclosurePickerOpen(false)}
        onSelect={enc => {
          setSelectedEnclosure(enc)
          setValue('enclosure', String(enc.enclosure_id))
          setEnclosurePickerOpen(false)
        }}
      />
    </Drawer>
  )
}

export default AddAnimalDrawer
