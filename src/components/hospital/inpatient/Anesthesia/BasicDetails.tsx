'use client'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import { useTranslation } from 'react-i18next'
import NoDataFound from 'src/views/utility/NoDataFound'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useTheme, alpha } from '@mui/material/styles'
import { useFormContext, Controller, useFieldArray } from 'react-hook-form'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import dayjs from 'dayjs'
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import utc from 'dayjs/plugin/utc'
import Search from 'src/views/utility/Search'
import { debounce, filter } from 'lodash'
import ControlledDateTimePicker from 'src/views/forms/form-fields/ControlledDateTimePicker'
import Utility from 'src/utility'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useParams } from 'next/navigation'

dayjs.extend(utc)

interface BasicDetailsProps {
  vetOptions?: any[]
  anesthetistOptions?: any[]
  purposeOptions?: any[]
  anesthesiaId?: any
  addLoader?: boolean
  selectedHospital?: any
  loadMoreDoctors?: () => void
  loadingDoctors?: boolean
  loadingVet?: boolean
  loadingAnesthetist?: boolean
  handleVetSearch?: (val: string, current: any[]) => void
  handleAnesthetistSearch?: (val: string, current: any[]) => void
  handleVetSelect?: (item: any) => void
  handleAnesthetistSelect?: (item: any) => void
  patientData?: any
  drawerOpen?: boolean
}

export default function BasicDetails({
  vetOptions = [],
  anesthetistOptions = [],
  purposeOptions = [],
  anesthesiaId = '',
  addLoader = false,
  selectedHospital,
  loadMoreDoctors = () => {},
  loadingDoctors = false,
  loadingVet = false,
  loadingAnesthetist = false,
  handleVetSearch = () => {},
  handleAnesthetistSearch = () => {},
  handleVetSelect = () => {},
  handleAnesthetistSelect = () => {},
  patientData,
  drawerOpen = true
}: BasicDetailsProps) {
  const {
    control,
    watch,
    setValue,
    clearErrors,
    trigger,
    formState: { errors }
  } = useFormContext()
  const { t } = useTranslation()
  const router: any = useSafeRouter()
  const theme: any = useTheme()
  const [newPurpose, setNewPurpose] = useState<string>('')

  const timeUnits = [
    { label: t('hospital_module.hr'), value: 'hr' },
    { label: t('hospital_module.min'), value: 'min' }
  ]
  const [expanded, setExpanded] = useState<boolean>(false)
  const [showToggle, setShowToggle] = useState<boolean>(false)
  const [fullHeight, setFullHeight] = useState<any>(0 || '')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchValue, setSearchValue] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [newPurposeError, setNewPurposeError] = useState<string>('')
  const contentRef = useRef<HTMLDivElement | null>(null)
  const routerParams: any = useParams()
  const id = routerParams?.id
  const { anaesthesia_id } = router.query
  const effectiveAnesthesiaId = anesthesiaId || anaesthesia_id
  const data = watch()
  const anaesthesiaDateTimeValue = watch('basicDetails.anaesthesia_datetime')

  const isDefaultDateSetRef = useRef<boolean>(false)

  // Clear search states when drawer closes and reset date ref when drawer opens
  useEffect(() => {
    if (!drawerOpen) {
      setSearchQuery('')
      setSearchValue('')
    } else {
      // Reset the ref when drawer opens so date/time gets prefilled again
      isDefaultDateSetRef.current = false
    }
  }, [drawerOpen])

  useEffect(() => {
    // For new records, await patientData to set proper fallback
    if (!effectiveAnesthesiaId && patientData && !isDefaultDateSetRef.current) {
      const defaultDateTime = patientData?.discharge_at
        ? dayjs.utc(patientData.discharge_at).local().format('YYYY-MM-DD HH:mm:ss')
        : dayjs().format('YYYY-MM-DD HH:mm:ss')
      setValue('basicDetails.anaesthesia_datetime', defaultDateTime, {
        shouldValidate: true
      })
      isDefaultDateSetRef.current = true
    } else if (!anaesthesiaDateTimeValue && !isDefaultDateSetRef.current && !effectiveAnesthesiaId) {
      setValue('basicDetails.anaesthesia_datetime', dayjs().format('YYYY-MM-DD HH:mm:ss'), {
        shouldValidate: true
      })
    } else if (!anaesthesiaDateTimeValue && effectiveAnesthesiaId) {
       setValue('basicDetails.anaesthesia_datetime', dayjs().format('YYYY-MM-DD HH:mm:ss'), {
        shouldValidate: true
      })
    }

    if (!effectiveAnesthesiaId && selectedHospital?.name && !watch('basicDetails.location')) {
      setValue('basicDetails.location', selectedHospital.name)
    }
  }, [anaesthesiaDateTimeValue, setValue, patientData, effectiveAnesthesiaId, selectedHospital, drawerOpen])

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

  const autocompleteSlotProps: any = useMemo(
    () => ({
      tags: (options: any[]) => ({
        getTagProps: ({ index }: any) => ({
          key: options[index]?.id,
          label: options[index]?.name,
          size: 'small'
        })
      }),
      listbox: {
        onScroll: (event: any) => {
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

  const selectedPurpose: any[] = (watch('basicDetails.selected') as any) || []
  const selectedOtherPurpose: any[] = (watch('basicDetails.custom') as any) || []

  useEffect(() => {
    if (!selectedOtherPurpose.length || !purposeOptions.length) return

    const selected = new Set(selectedPurpose)
    let updatedCustom = [...selectedOtherPurpose]
    let updatedSelected = [...selectedPurpose]

    selectedOtherPurpose.forEach((customValue: any) => {
      const normalizedCustom = normalizePurpose(customValue)

      const matchedOption = purposeOptions.find((opt: any) => normalizePurpose(opt.name || '') === normalizedCustom)

      if (matchedOption) {
        const idAsString = String(matchedOption.id)
        if (!selected.has(idAsString)) {
          updatedSelected.push(idAsString)
        }
        updatedCustom = updatedCustom.filter((v: any) => v !== customValue)
      }
    })

    if (updatedCustom.length !== selectedOtherPurpose.length || updatedSelected.length !== selectedPurpose.length) {
      setValue('basicDetails.custom', updatedCustom, { shouldValidate: true })
      setValue('basicDetails.selected', updatedSelected, { shouldValidate: true })
    }
  }, [selectedOtherPurpose, purposeOptions])

  const normalizePurpose = (value: string) => value.toLowerCase().replace(/\s+/g, '').trim()

  const filteredPurposeOptions = purposeOptions.filter((purpose: any) =>
    purpose.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  const debouncedMainSearch = useCallback(
    debounce((val: string) => {
      setSearchValue(val)
      setLoading(false)
    }, 500),
    [searchValue]
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    }, 1200)

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

  const handleAddPurpose = () => {
    const v = newPurpose.trim()
    if (!v) return
    const normalizedNew = normalizePurpose(v)
    const selected: any[] = (watch('basicDetails.selected') as any) || []
    const custom: any[] = (watch('basicDetails.custom') as any) || []

    const matchedOption = purposeOptions.find((option: any) => normalizePurpose(option?.name || '') === normalizedNew)
    if (matchedOption) {
      const idAsString = String(matchedOption.id)

      if (selected.includes(idAsString)) {
        setNewPurposeError('Purpose already exists and selected ')
      } else {
        setNewPurposeError('Purpose already exists, please select')
      }

      return
    }
    const existsInCustom = custom.some((item: any) => normalizePurpose(item) === normalizedNew)
    if (existsInCustom) {
      setNewPurposeError('Purpose already exists')

      return
    }
    setValue('basicDetails.custom', [...custom, v], { shouldValidate: true })
    setNewPurpose('')
    setValue('basicDetails.newPurpose', '')
    setNewPurposeError('')
  }

  return addLoader ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress />
    </Box>
  ) : (
    <Box sx={{ width: '100%', p: 0 }}>
      <Grid container spacing={5} columns={12}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ControlledTextField
            name='basicDetails.location'
            label={`${t('hospital_module.location')}*`}
            control={control}
            errors={errors}
            sx={commonTextFieldSx}
            onChangeOverride={() => clearErrors?.('basicDetails.location')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ControlledDateTimePicker
            name='basicDetails.anaesthesia_datetime'
            control={control}
            errors={errors}
            label={`${t('hospital_module.date_and_time_of_anesthesia')}*`}
            ampm
            {...({
              minDateTime: dayjs((Utility as any).convertUTCToLocal(patientData?.admitted_at)),
              maxDateTime: patientData?.discharge_at ? dayjs((Utility as any).convertUTCToLocal(patientData?.discharge_at)) : dayjs()
            } as any)}
            helperText={(errors as any).basicDetails?.anaesthesia_datetime?.message}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ControlledSelectWithTextField
            textFieldName='basicDetails.estimated_time_required'
            selectFieldName='basicDetails.estimated_time_unit'
            control={control}
            errors={errors}
            {...({ options: timeUnits } as any)}
            label={`${t('hospital_module.estimated_time')}*`}
            placeholder={(t('add') as string)}
            type='number'
            getOptionLabel={(option: any) => option.label}
            getOptionValue={(option: any) => option.value}
            showEmptyMenuItem={false}
            showEmptyMenuItemLabel={false}
            selectWidth={80}
            sx={commonTextFieldSx}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.veterinarian_id'
            control={control}
            render={({ field }: any) => {
              return (
                <Autocomplete
                  multiple
                  openOnFocus
                  disableCloseOnSelect={true}
                  options={vetOptions}
                  getOptionLabel={(option: any) => option?.name || ''}
                  isOptionEqualToValue={(option: any, value: any) => String(option.id) === String(value.id)}
                  loading={loadingVet}
                  value={field.value || []}
                  filterOptions={(x: any) => x}
                  onInputChange={(event: any, newInputValue: any) => {
                    handleVetSearch(newInputValue, field.value || [])
                  }}
                  onChange={(_: any, newValue: any) => {
                    const previousValue = field.value || []
                    if (newValue.length > previousValue.length) {
                      const newItem = newValue.find(
                        (item: any) => !previousValue.some((prev: any) => String(prev.id) === String(item.id))
                      )
                      if (newItem) handleVetSelect(newItem)
                    }
                    field.onChange(newValue)
                  }}
                  slotProps={{
                    tags: autocompleteSlotProps.tags(vetOptions),
                    listbox: autocompleteSlotProps.listbox
                  } as any}
                  renderOption={(props: any, option: any) => (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                  )}
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      label={`${t('hospital_module.veterinarian')}*`}
                      placeholder={'Search & Select'}
                      fullWidth
                      error={!!(errors as any)?.basicDetails?.veterinarian_id}
                      helperText={(errors as any)?.basicDetails?.veterinarian_id?.message}
                      sx={commonTextFieldSx}
                    />
                  )}
                />
              )
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name='basicDetails.anesthetist_id'
            control={control}
            render={({ field }: any) => (
              <Autocomplete
                multiple
                openOnFocus
                disableCloseOnSelect={true}
                options={anesthetistOptions}
                getOptionLabel={(option: any) => option?.name || ''}
                isOptionEqualToValue={(option: any, value: any) => String(option.id) === String(value.id)}
                loading={loadingAnesthetist}
                value={field.value || []}
                filterOptions={(x: any) => x}
                onInputChange={(event: any, newInputValue: any) => {
                  handleAnesthetistSearch(newInputValue, field.value || [])
                }}
                onChange={(_: any, newValue: any) => {
                  const previousValue = field.value || []
                  if (newValue.length > previousValue.length) {
                    const newItem = newValue.find(
                      (item: any) => !previousValue.some((prev: any) => String(prev.id) === String(item.id))
                    )
                    if (newItem) handleAnesthetistSelect(newItem)
                  }
                  field.onChange(newValue)
                }}
                slotProps={{
                  tags: autocompleteSlotProps.tags(anesthetistOptions),
                  listbox: autocompleteSlotProps.listbox
                } as any}
                renderOption={(props: any, option: any) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    label={`${t('hospital_module.anesthetist')}*`}
                    fullWidth
                    placeholder={'Search & Select'}
                    error={!!(errors as any)?.basicDetails?.anesthetist_id}
                    helperText={(errors as any)?.basicDetails?.anesthetist_id?.message}
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
              component="div"
              fontWeight={600}
              sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}
            >
              {`${t('hospital_module.purpose_of_anesthesia')}*`}{' '}
              <Box sx={{ display: 'inline-flex', pl: { sm: 4 } }}>
                <Typography
                  component="span"
                  sx={{
                    justifyContent: 'flex-start',
                    fontWeight: 400,
                    fontSize: '16px',
                    color: theme.palette.customColors.secondaryBg
                  }}
                >
                  {t('hospital_module.select_all_that_apply')}
                </Typography>
              </Box>
            </Typography>
          </Box>
          <Box>
            <Search
              value={searchQuery}
              onChange={handleSearch}
              onClear={handleSearchClear}
              {...({ width: { sm: 230, md: 300 } } as any)}
            />
          </Box>
        </Box>

        <Controller
          name='basicDetails.selected'
          control={control}
          defaultValue={[]}
          render={({ field }: any) => (
            <>
              <Collapse in={!expanded || loading || showToggle} collapsedSize={showToggle ? 170 : 'auto'}>
                {loading ? (
                  <Grid
                    container
                    spacing={3}
                    ref={contentRef}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      maxHeight: !expanded ? 170 : fullHeight,
                      overflow: 'hidden',
                      mt: 3
                    }}
                  >
                    {[...Array(skeletonCount)].map((_, i: number) => (
                      <Grid key={i}>
                        <Skeleton
                          variant='rectangular'
                          animation='wave'
                          height={46}
                          sx={{
                            width: { xs: 200, lg: 240 },
                            borderRadius: '8px'
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box
                    ref={contentRef}
                    sx={{
                      maxHeight: expanded ? fullHeight : 170,
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
                        onChange={(_: any, newValues: any) => field.onChange(newValues)}
                        aria-label='Purpose of anesthesia'
                        sx={{
                          flexWrap: 'wrap',
                          gap: 3,
                          mt: 3,
                          display: 'flex',
                          borderRadius: '8px',
                          p: (errors as any).basicDetails?.purpose ? 1 : 0,
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
                        {filteredPurposeOptions.map((option: any) => (
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
                        <NoDataFound height={200} width={200} />
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
                        onClick={() => setExpanded((prev: boolean) => !prev)}
                        sx={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          mt: 3,
                          color: theme.palette.primary.main
                        }}
                      >
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        {expanded ? t('hospital_module.view_less') : t('hospital_module.view_more')}
                      </Typography>
                    </Grid>
                  )}
              {(errors as any).basicDetails?.selected && (
                <Typography variant='caption' color={theme.palette.customColors.Error} sx={{ mt: 1, display: 'block' }}>
                  {String((errors as any).basicDetails?.selected?.message || 'Required')}
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
                    {t('hospital_module.other_purposes_added')}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {selectedOtherPurpose.map((p: any) => (
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
                            const updated = selectedOtherPurpose.filter((item: any) => item !== p)
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
                  {t('hospital_module.add_new_other_purpose')}
                </Typography>

                <Box display='flex' flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                  <TextField
                    fullWidth
                    placeholder={(t('hospital_module.enter_new_purpose') as string)}
                    value={newPurpose}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value
                      setNewPurpose(val)
                      setValue('basicDetails.newPurpose', val)
                      if (newPurposeError) setNewPurposeError('')
                      trigger('basicDetails.selected')
                    }}
                    sx={{ ...commonTextFieldSx, background: theme.palette.common.white }}
                  />
                  <Button
                    variant='contained'
                    color='secondary'
                    disabled={!newPurpose.trim()}
                    onClick={handleAddPurpose}
                    sx={{
                      minWidth: 120,
                      background: theme.palette.primary.main,
                      boxShadow: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    {t('add')}
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
          {t('notes')}
        </Typography>
        <ControlledTextArea
          control={control}
          errors={errors}
          name='basicDetails.notes'
          placeholder={(t('hospital_module.enter_notes') as string)}
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
