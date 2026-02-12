import React, { useState, useEffect, useMemo, useCallback, useRef} from 'react'
import {
  Box,
  TextField,
  Typography,
  Grid,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Autocomplete,
  Chip,
  CircularProgress,
  Collapse,
  Skeleton
} from '@mui/material'
import NoDataFound from 'src/views/utility/NoDataFound'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useTheme, alpha } from '@mui/material/styles'
import { Router, useRouter } from 'next/router'
import { useFormContext, Controller, useFieldArray } from 'react-hook-form'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import dayjs from 'dayjs'
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import utc from 'dayjs/plugin/utc'
import Search from 'src/views/utility/Search'
import { debounce, filter } from 'lodash'

dayjs.extend(utc)

export default function BasicDetails({
  vetOptions = [],
  anesthetistOptions = [],
  purposeOptions = [],
  addLoader = false,
  selectedHospital,
  loadMoreDoctors = () => {},
  loadingDoctors = false,
  patientData = []
}) {
  const {
    control,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext()
  const router = useRouter()
  const theme = useTheme()
  const [newPurpose, setNewPurpose] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const [fullHeight, setFullHeight] = useState(0 || '') //fullheight - current scroll height for view more placement
  const [searchQuery, setSearchQuery] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [newPurposeError, setNewPurposeError] = useState('')
  const contentRef = useRef(null)
  const { id, anaesthesia_id } = router.query
  const timeUnits = [
    { label: 'hr', value: 'hr' },
    { label: 'min', value: 'min' }
  ]
  const data = watch()
  const anaesthesiaDateTimeValue = watch('basicDetails.anaesthesia_datetime')

  useEffect(() => {
    if (!anaesthesiaDateTimeValue) {
      setValue('basicDetails.anaesthesia_datetime', dayjs().format('YYYY-MM-DD HH:mm:ss'), {
        shouldValidate: true
      })
    }
    if (!anaesthesia_id) {
      setValue('basicDetails.location', selectedHospital?.name)
    }
  }, [anaesthesiaDateTimeValue, setValue])

  const commonTextFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px',
      color: theme.palette.customColors.OnSurfaceVariant
    },
    '& .MuiInputBase-input': {
      color: theme.palette.customColors.OnSurfaceVariant,
      '&::placeholder': {
        color: theme.palette.text.disabled,
        opacity: 1
      }
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.customColors.Outline
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme.palette.customColors.Outline
    }
  }

  // Reusable slotProps for both Autocomplete components
  const autocompleteSlotProps = useMemo(
    () => ({
      tags: options => ({
        getTagProps: ({ index }) => ({
          key: options[index]?.id,
          label: options[index]?.name,
          size: 'small'
        })
      }),
      listbox: {
        onScroll: event => {
          const listboxNode = event.currentTarget
          if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 5) {
            loadMoreDoctors()
          }
        },
        sx: {
          position: 'relative',
          '&::after': loadingDoctors
            ? {
                content: '"Loading more..."',
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                zIndex: 1
              }
            : {}
        }
      }
    }),
    [loadingDoctors, theme, loadMoreDoctors]
  )

  const selectedPurpose = watch('basicDetails.selected') || []
  const selectedOtherPurpose = watch('basicDetails.custom') || []

  useEffect(() => {
    if (!selectedOtherPurpose.length || !purposeOptions.length) return

    const selected = new Set(selectedPurpose)
    let updatedCustom = [...selectedOtherPurpose]
    let updatedSelected = [...selectedPurpose]

    selectedOtherPurpose.forEach(customValue => {
      const normalizedCustom = normalizePurpose(customValue)

      const matchedOption = purposeOptions.find(opt => normalizePurpose(opt.name || '') === normalizedCustom)

      if (matchedOption) {
        const idAsString = String(matchedOption.id)
        if (!selected.has(idAsString)) {
          updatedSelected.push(idAsString)
        }
        updatedCustom = updatedCustom.filter(v => v !== customValue)
      }
    })

    if (updatedCustom.length !== selectedOtherPurpose.length || updatedSelected.length !== selectedPurpose.length) {
      setValue('basicDetails.custom', updatedCustom, { shouldValidate: true })
      setValue('basicDetails.selected', updatedSelected, { shouldValidate: true })
    }
  }, [selectedOtherPurpose, purposeOptions])

  const normalizePurpose = value => value.toLowerCase().replace(/\s+/g, '').trim()

  const filteredPurposeOptions = purposeOptions.filter(purpose =>
    purpose.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  const debouncedMainSearch = useCallback(
    debounce(val => {
      setSearchValue(val)
      setLoading(false)
    }, 500),
    [searchValue]
  )

  const handleSearch = e => {
    const val = e.target.value
    setSearchQuery(val)
    setLoading(true)
    debouncedMainSearch(val)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    setSearchValue('')
    debouncedMainSearch('')
    setLoading(false)
  }

  /*view more button appearance based on height */
  useEffect(() => {
  if (loading) return          
  if (filteredPurposeOptions.length === 0) return 
  if (!contentRef.current) return

  const height = contentRef.current.scrollHeight
  setFullHeight(height)
  setShowToggle(height > 170)
}, [filteredPurposeOptions])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
  }, 800)

    return () => clearTimeout(timer)
  }, [filteredPurposeOptions, loading])

  let skeletonCount = 0

  if (filteredPurposeOptions.length === 1) {
    skeletonCount = 3
  } else if (filteredPurposeOptions.length > 1) {
    skeletonCount = Math.ceil(filteredPurposeOptions.length / 4) * 4
  } else if (searchValue) {
    skeletonCount = 9
  }

  return addLoader ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress />
    </Box>
  ) : (
    <Box sx={{ width: '100%', p: 0 }}>
      <Grid container spacing={5} columns={12}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.location'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Location*'
                error={!!errors.basicDetails?.location}
                helperText={errors.basicDetails?.location?.message}
                sx={commonTextFieldSx}
                slotProps={{ input: { 'data-field': 'location' } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.anaesthesia_datetime'
            control={control}
            render={({ field }) => {
              const value = field.value ? dayjs(field.value) : null

              const handleDateChange = newValue => {
                if (!newValue) {
                  field.onChange('')

                  return
                }
                const formatted = dayjs(newValue).format('YYYY-MM-DD HH:mm:ss')
                field.onChange(formatted)
              }

              return (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    label='Date & Time of Anesthesia*'
                    value={value}
                    onChange={handleDateChange}
                    format='DD MMM YYYY · hh:mm A'
                    minDateTime={dayjs.utc(patientData?.admitted_at).local()}
                    maxDateTime={dayjs()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.basicDetails?.anaesthesia_datetime,
                        helperText: errors.basicDetails?.anaesthesia_datetime?.message,
                        sx: {
                          ...commonTextFieldSx,
                          '& .MuiInputLabel-root': {
                            color: errors.basicDetails?.anaesthesia_datetime
                              ? theme.palette.error.main
                              : theme.palette.customColors.Outline
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: errors.basicDetails?.anaesthesia_datetime
                              ? theme.palette.error.main
                              : theme.palette.customColors.Outline
                          },
                          '& input::placeholder': {
                            color: errors.basicDetails?.anaesthesia_datetime
                              ? theme.palette.error.main
                              : theme.palette.text.disabled,
                            opacity: 1
                          }
                        },
                        inputProps: { 'data-field': 'anaesthesia_datetime' }
                      }
                    }}
                  />
                </LocalizationProvider>
              )
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ControlledSelectWithTextField
            textFieldName='basicDetails.estimated_time_required'
            selectFieldName='basicDetails.estimated_time_unit'
            control={control}
            errors={errors}
            options={timeUnits}
            label='Estimated Time*'
            placeholder='Enter'
            type='number'
            getOptionLabel={option => option.label}
            getOptionValue={option => option.value}
            showEmptyMenuItem={false}
            showEmptyMenuItemLabel={false}
            selectWidth={80}
            sx={commonTextFieldSx}
          />
        </Grid>
        {/* Veterinarian Field */}

        <Grid item size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.veterinarian_id'
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                openOnFocus
                options={vetOptions}
                getOptionLabel={option => option?.name || ''}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                loading={loadingDoctors}
                value={
                  Array.isArray(field.value)
                    ? field.value.map(id => vetOptions.find(opt => opt.id === id)).filter(Boolean)
                    : []
                }
                onChange={(_, newValue) => {
                  const selectedIds = newValue.map(item => item.id)
                  field.onChange(selectedIds)
                }}
                slotProps={{
                  tags: autocompleteSlotProps.tags(vetOptions),
                  listbox: autocompleteSlotProps.listbox
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Veterinarian*'
                    fullWidth
                    error={!!errors?.basicDetails?.veterinarian_id}
                    helperText={errors?.basicDetails?.veterinarian_id?.message}
                    sx={commonTextFieldSx}
                  />
                )}
              />
            )}
          />
        </Grid>

        {/* Anesthetist Field */}
        <Grid item size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.anesthetist_id'
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                openOnFocus
                options={anesthetistOptions}
                getOptionLabel={option => option?.name || ''}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                loading={loadingDoctors}
                value={
                  Array.isArray(field.value)
                    ? field.value.map(id => anesthetistOptions.find(opt => opt.id === id)).filter(Boolean)
                    : []
                }
                onChange={(_, newValue) => {
                  const selectedIds = newValue.map(item => item.id)
                  field.onChange(selectedIds)
                }}
                slotProps={{
                  tags: autocompleteSlotProps.tags(anesthetistOptions),
                  listbox: autocompleteSlotProps.listbox
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Anesthetist*'
                    fullWidth
                    error={!!errors?.basicDetails?.anesthetist_id}
                    helperText={errors?.basicDetails?.anesthetist_id?.message}
                    sx={commonTextFieldSx}
                  />
                )}
              />
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ mt: 8 }} />

      <Box mt={5}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 3, md: 0 }
          }}
        >
          <Box>
            <Typography
              fontWeight={600}
              // mb={3}
              sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
            >
              Purpose of Anesthesia*{' '}
              <Box sx={{ display: 'inline-flex', pl: { sm: 4 } }}>
                <Typography
                  sx={{
                    justifyContent: 'flex-start',
                    fontWeight: 400,
                    fontSize: '16px',
                    color: theme.palette.customColors.secondaryBg
                  }}
                >
                  Select all that apply
                </Typography>
              </Box>
            </Typography>
          </Box>
          <Box>
            <Search
              value={searchQuery}
              onChange={handleSearch}
              onClear={handleSearchClear}
              width={{ sm: 230, md: 300 }}
            />
          </Box>
        </Box>

        <Controller
          name='basicDetails.selected'
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <>
              <Collapse in={!expanded || loading ||  showToggle} collapsedSize={showToggle ? 170 : 'auto'}>
                {loading ? (
                  <Grid
                    container
                    spacing={3}
                    ref={contentRef}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      maxHeight: !expanded ? 170 : fullHeight,
                      display: 'flex',
                      flexWrap: 'wrap',
                      overflow: 'hidden',
                      mt: 3
                    }}
                  >
                    {[...Array(skeletonCount)].map((_, i) => (
                      <Grid item key={i}>
                        <Skeleton
                          variant='rectangular'
                          animation='wave'
                          height={46}
                          sx={{
                            width: { sm: 200, lg: 240 },
                            borderRadius: '8px',
                            
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box
                    ref={contentRef}
                    sx={{
                      maxHeight: !expanded? 170: searchValue? 200: fullHeight || 170,
                      transition: 'max-height 0.3s ease',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      overflow: 'hidden'
                    }}
                  >
                    {filteredPurposeOptions.length > 0 ? (
                      <ToggleButtonGroup
                        value={field.value || []}
                        onChange={(_, newValues) => field.onChange(newValues)}
                        aria-label='Purpose of anesthesia'
                        sx={{
                          flexWrap: 'wrap',
                          gap: 3,
                          mt: 3,
                          display: 'flex',
                          borderRadius: '8px',
                          p: errors.basicDetails?.purpose ? 1 : 0,
                          '& .MuiToggleButton-root': {
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontSize: '14px',
                            px: 4,
                            py: 2.5,
                            background: theme.palette.customColors.neutral05,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            border: 'none'
                          },
                          '& .MuiToggleButton-root.Mui-selected': {
                            bgcolor: theme.palette.customColors.OnPrimaryContainer,
                            color: theme.palette.primary.contrastText
                          },
                          '& .MuiToggleButton-root.Mui-selected:hover': {
                            bgcolor: theme.palette.primary.dark
                          }
                        }}
                      >
                        {filteredPurposeOptions.map(option => (
                          <ToggleButton key={option.id ?? option.name} value={String(option.id)}>
                            {option?.name}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    ) : searchValue ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: 200
                       }}
                      >
                        <NoDataFound height = {200} width = {200}/>
                      </Box>
                    ) : null}
                  </Box>
                )}
              </Collapse>
              {loading
                ? null
                : filteredPurposeOptions.length > 0 &&
                  showToggle && (
                    <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Typography
                        onClick={() => setExpanded(prev => !prev)}
                        sx={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          mt: 3,
                          color:theme.palette.primary.main 
                        }}
                      >
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        {expanded ? 'View Less' : 'View More'}
                      </Typography>
                    </Grid>
                  )}
              {errors.basicDetails?.selected && (
                <Typography variant='caption' color={theme.palette.customColors.Error} sx={{ mt: 1, display: 'block' }}>
                  {String(errors.basicDetails?.selected?.message || 'Required')}
                </Typography>
              )}

              {selectedOtherPurpose.length > 0 && (
                <Box mt={5}>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      mb: 2,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontWeight: 600
                    }}
                  >
                    Other Purposes Added
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {selectedOtherPurpose.map(p => (
                      <Box
                        key={p}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 2.9,
                          py: 3.2,
                          borderRadius: '8px',
                          backgroundColor: alpha(theme.palette.customColors.PrimaryContainer, 0.2),
                          color: theme.palette.getContrastText(theme.palette.success.main),
                          fontSize: '14px',
                          border: `1px solid ${theme.palette.primary.main}`
                        }}
                      >
                        <span style={{ whiteSpace: 'nowrap' }}>{p}</span>
                        <Button
                          onClick={() => {
                            const updated = selectedOtherPurpose.filter(item => item !== p)
                            setValue('basicDetails.custom', updated, { shouldValidate: true })
                          }}
                          aria-label={`Remove ${p}`}
                          sx={{
                            minWidth: 0,
                            ml: 1.5,
                            p: 0,
                            lineHeight: 1,
                            borderRadius: '50%',
                            fontSize: 20,
                            color: theme.palette.customColors.Outline
                          }}
                        >
                          ×
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <Box
                mt={5}
                sx={{
                  background: theme.palette.customColors.mdAntzNeutral,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  maxWidth: '640px'
                }}
              >
                <Typography
                  fontWeight={600}
                  mb={2}
                  sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Add New Other Purpose
                </Typography>

                <Box display='flex' flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                  <TextField
                    fullWidth
                    placeholder='Enter new purpose'
                    value={newPurpose}
                    onChange={e => {
                      setNewPurpose(e.target.value)
                      if (newPurposeError) setNewPurposeError('')
                    }}
                    sx={{ ...commonTextFieldSx, background: theme.palette.common.white }}
                  />
                  <Button
                    variant='contained'
                    color='secondary'
                    disabled={!newPurpose.trim()}
                    onClick={() => {
                      const v = newPurpose.trim()
                      if (!v) return
                      const normalizedNew = normalizePurpose(v)
                      const selected = watch('basicDetails.selected') || []
                      const custom = watch('basicDetails.custom') || []

                      const matchedOption = purposeOptions.find(
                        option => normalizePurpose(option?.name || '') === normalizedNew
                      )
                      if (matchedOption) {
                        const idAsString = String(matchedOption.id)

                        if (selected.includes(idAsString)) {
                          setNewPurposeError('Purpose already exists and selected ')
                        } else {
                          setNewPurposeError('Purpose already exists, please select')
                        }

                        return
                      }
                      const existsInCustom = custom.some(item => normalizePurpose(item) === normalizedNew)
                      if (existsInCustom) {
                        setNewPurposeError('Purpose already exists')

                        return
                      }
                      setValue('basicDetails.custom', [...custom, v], { shouldValidate: true })
                      setNewPurpose('')
                      setNewPurposeError('')
                    }}
                    sx={{
                      minWidth: 120,
                      background: theme.palette.primary.main,
                      boxShadow: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    ADD
                  </Button>
                </Box>
                {newPurposeError && (
                  <Typography
                    variant='caption'
                    sx={{
                      mt: 1,
                      display: 'block',
                      color: theme.palette.error.main
                    }}
                  >
                    {newPurposeError}
                  </Typography>
                )}
              </Box>
            </>
          )}
        />
      </Box>

      <Box mt={5}>
        <Typography fontWeight={600} mb={3}>
          Notes
        </Typography>
        <ControlledTextArea
          control={control}
          errors={errors}
          name='basicDetails.notes'
          placeholder='Enter Notes'
          fullWidth
          rows={2}
          sx={{
            '& .MuiInputLabel-root': {
              color: theme.palette.customColors.OnSurfaceVariant
            }
          }}
          inputBackgroundColor={alpha(theme.palette.customColors.antzNotes, 0.6)}
        />
      </Box>
    </Box>
  )
}
