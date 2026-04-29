import React, { useState, useEffect, useContext, useRef, useMemo, useCallback, memo, FC, ReactNode } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  FormControlLabel,
  Checkbox,
  Skeleton,
  useTheme,
  FormHelperText,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  Theme,
  SxProps
} from '@mui/material'
import { useForm, Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useRouter } from 'next/navigation'
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import NecropsyAnimalInfoCard from 'src/components/necropsy/NecropsyAnimalInfoCard'
import UserMultiSelect from 'src/components/necropsy/UserMultiSelect'
import NecropsyOrganSection from 'src/components/necropsy/NecropsyOrganSection'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import { Close as CloseIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'
import {
  addNecropsy,
  editNecropsy,
  deleteNecropsy,
  getNecropsySummary,
  getMortalitySummary,
  deleteNecropsyAttachment
} from 'src/lib/api/necropsy'
import { AuthContext } from 'src/context/AuthContext'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { useTranslation } from 'react-i18next'

// Use cached form options from Redux
import { useNecropsyFormOptions } from 'src/hooks/necropsy'

// Import types from necropsy types module
import type { SelectOption, WeightUnitOption, ApiResponse } from 'src/types/necropsy'

dayjs.extend(utc)
dayjs.extend(timezone)

// ==================== Interfaces ====================

/** Props for the NecropsyReportForm component */
interface NecropsyReportFormProps {
  mortalityId: number | string
  necropsyId?: number | string | null
  status?: string | null
}

/** Weight unit option with ID */
interface FormWeightUnitOption {
  id?: number
  label: string
  value: string | number
  key?: string
  unit_name?: string
  uom_abbr?: string
}

/** Select option for form dropdowns */
interface FormSelectOption {
  id?: number | string
  label: string
  value: string | number
  key?: string
}

/** User conducting necropsy */
interface ConductedByUser {
  user_id: number | string
  user_name: string
  user_profile_pic?: string
  role_name?: string
  id?: number | string
  name?: string
  full_name?: string
  first_name?: string
  last_name?: string
  profile_pic?: string
  avatar?: string
  role?: string
  designation?: string
}

/** Organ part data structure */
interface OrganPart {
  id: string | number
  body_part_id?: string | number
  organ_name?: string
  label?: string
  name?: string
  value?: string
  description?: string
}

/** Organ data structure */
interface Organ {
  id: string | number
  label: string
  name?: string
  organ_name?: string
  section_name?: string
  parts?: OrganPart[]
}

/** Attachment document structure */
interface AttachmentDocument {
  id?: number | string
  attachment_id?: number | string
  file?: string
  url?: string
  file_url?: string
  path?: string
  file_original_name?: string
  original_name?: string
  name?: string
  filename?: string
}

/** Mortality data from API */
interface MortalityData {
  mortality_id?: number
  animal_id?: number
  request_id?: string
  discovered_date?: string | number
  history_of_illness?: string
  place_of_death?: string
  qr_number?: string
  carcass_weight?: string | number
  carcass_weight_uom_id?: number
  carcass_weight_uom?: number
  uom_id?: number
  uom_abbr?: string
  carcass_weight_unit_name?: string
  approximate_weight?: number | string
  sex?: string
  birth_date?: string
  age?: string | number
  age_unit?: string
  approximate_dob?: number | string
  manner_of_death_id?: number
  manner_of_death?: string
  carcass_disposition_id?: number
  carcass_disposition?: string
  necropsy_code?: string
  [key: string]: unknown
}

/** Necropsy data from API */
interface NecropsyData {
  necropsy_id?: number
  request_id?: string
  necropsy_code?: string
  is_unsuitable?: string | number
  reason_for_unsuitable?: string
  caracass_submission_date?: string
  caracass_submission_time?: string
  death_date?: string
  death_time?: string
  place_of_death?: string
  qr_number?: string
  carcass_weight?: string | number
  carcass_weight_uom_id?: number
  carcass_weight_uom?: number
  uom_id?: number
  uom_abbr?: string
  carcass_weight_unit_name?: string
  approximate_weight?: number | string
  sex?: string
  age?: string | number
  age_unit?: string
  birth_date?: string
  dob?: string
  approximate_dob?: number | string
  history_of_illness?: string
  necropsy_date?: string
  necropsy_time?: string
  general_description?: string
  opinion?: string
  suspected_cause_of_death?: string
  suspected_cause_of_death_id?: number | string
  suspected_cause_of_death_string_id?: string
  confirmed_cause_of_death?: string
  confirmed_cause_of_death_id?: number | string
  disposition?: string
  disposition_id?: number | string
  disposal_method?: string
  disposal_method_id?: number | string
  carcass_disposition?: string
  carcass_disposition_id?: number | string
  biological_test?: string
  additional_notes?: string
  necropsy_conducted_by?: ConductedByUser[]
  necropsy_organs?: Organ[]
  attachments?:
    | {
        documents?: AttachmentDocument[]
      }
    | AttachmentDocument[]
  documents?: AttachmentDocument[]
  [key: string]: unknown
}

/** Form field values */
interface NecropsyFormValues {
  is_suitable: boolean
  reason_for_unsuitable: string
  caracass_submission_date: Dayjs | null
  caracass_submission_time: Dayjs | null
  death_date: Dayjs | null
  death_time: Dayjs | null
  place_of_death: string
  qr_number: string
  carcass_weight: string
  weight_unit: FormWeightUnitOption | null
  approximate_weight: boolean
  sex: string
  age: string
  age_unit: string
  approximate_dob: boolean
  history_of_illness: string
  necropsy_date: Dayjs | null
  necropsy_time: Dayjs | null
  general_description: string
  manner_of_death: FormSelectOption | null
  opinion: string
  confirmed_cause_of_death: FormSelectOption | null
  disposal_method: FormSelectOption | null
  biological_test: string
  additional_notes: string
  attachments: File[]
}

/** Age input fields */
interface AgeInputs {
  years: string
  months: string
  days: string
}

/** Draft validation errors */
interface DraftErrors {
  reason_for_unsuitable?: { message: string }
  weight_unit?: { message: string }
  confirmed_cause_of_death?: { message: string }
  conducted_by?: { message: string }
  [key: string]: { message: string } | undefined
}

/** Form tab definition */
interface FormTab {
  key: string
  label: string
}

/** Auth context user details */
interface AuthUserDetails {
  user_id: number
  user_first_name?: string
  user_last_name?: string
  profile_pic?: string
}

/** Auth context data structure */
interface AuthContextData {
  userData?: {
    user?: AuthUserDetails
    roles?: {
      role_name?: string
    }
  }
}

/** Props for skeleton components */
interface FormFieldSkeletonProps {
  label?: boolean
  height?: number
}

interface SectionSkeletonProps {
  fields?: number
  hasLabel?: boolean
}

// ==================== Helper Functions ====================

/**
 * Extract error message from various error formats
 */
const getErrorMessage = (message: unknown, fallback: string = 'An error occurred'): string => {
  // Note: fallback default is only used when called without explicit fallback; callers pass t() values
  if (!message) return fallback
  if (typeof message === 'string') return message

  if (typeof message === 'object') {
    const errorValues = Object.values(message as Record<string, unknown>)
    if (errorValues.length > 0) {
      return String(errorValues[0])
    }
  }

  return fallback
}

// ==================== Constants ====================

const sexOptions: string[] = ['male', 'female', 'indeterminate', 'undetermined']
const ageUnitOptions: string[] = ['day', 'month', 'year']

// ==================== Validation Schema ====================

const submitSchema = yup.object().shape({
  is_suitable: yup.boolean(),
  reason_for_unsuitable: yup.string().when('is_suitable', {
    is: false,
    then: schema => schema.test('not-empty', 'reason_unsuitable_required', value => (value?.trim()?.length ?? 0) > 0),
    otherwise: schema => schema.notRequired()
  }),
  confirmed_cause_of_death: yup
    .mixed()
    .nullable()
    .when('is_suitable', {
      is: true,
      then: schema => schema.test('required', 'confirmed_cod_required', value => value != null),
      otherwise: schema => schema.nullable()
    }),
  disposal_method: yup
    .mixed()
    .nullable()
    .when('is_suitable', {
      is: true,
      then: schema => schema.test('required', 'disposal_method_required', value => value != null),
      otherwise: schema => schema.nullable()
    }),
  weight_unit: yup
    .mixed()
    .nullable()
    .when(['is_suitable', 'carcass_weight'], {
      // Only require weight unit if a meaningful weight value is entered (not 0, empty, or "0.00")
      is: (suitable: boolean, weight: string) => {
        if (suitable !== true) return false
        const weightValue = parseFloat(weight)

        return !isNaN(weightValue) && weightValue > 0
      },
      then: schema => schema.test('required', 'select_weight_unit', value => value != null),
      otherwise: schema => schema.nullable()
    })
})

// ==================== Skeleton Components ====================

const FormFieldSkeleton: FC<FormFieldSkeletonProps> = ({ label = true, height = 56 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {label && <Skeleton variant='text' width={120} height={24} />}
    <Skeleton variant='rectangular' height={height} sx={{ borderRadius: 1 }} />
  </Box>
)

const SectionSkeleton: FC<SectionSkeletonProps> = ({ fields = 2, hasLabel = true }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {hasLabel && <Skeleton variant='text' width={150} height={28} />}
    <Grid container spacing={3}>
      {Array.from({ length: fields }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: fields > 1 ? 6 : 12 }}>
          <FormFieldSkeleton label={false} />
        </Grid>
      ))}
    </Grid>
  </Box>
)

// ==================== Main Component ====================

const NecropsyReportForm: FC<NecropsyReportFormProps> = ({ mortalityId, necropsyId, status }) => {
  const theme = useTheme<Theme>()
  const router = useRouter()
  const { t } = useTranslation()
  const authData = useContext(AuthContext) as unknown as AuthContextData | null

  // Use cached form options from Redux (auto-fetches if not loaded)
  const {
    mannerOfDeathOptions,
    disposalOptions,
    weightUnitOptions,
    loading: optionsLoading,
    isLoaded: optionsLoaded,
    findMannerOfDeathOption,
    findDisposalOption,
    findWeightUnitOption
  } = useNecropsyFormOptions(true)

  const [mortalityData, setMortalityData] = useState<MortalityData | null>(null)
  const [necropsyData, setNecropsyData] = useState<NecropsyData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitLoading, setSubmitLoading] = useState<boolean>(false)
  const [draftLoading, setDraftLoading] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [unsuitableDialogOpen, setUnsuitableDialogOpen] = useState<boolean>(false)
  const [ageDialogOpen, setAgeDialogOpen] = useState<boolean>(false)
  const [animalDOB, setAnimalDOB] = useState<Dayjs | null>(null)
  const [ageInputs, setAgeInputs] = useState<AgeInputs>({ years: '', months: '', days: '' })
  const [dialogApproxAge, setDialogApproxAge] = useState<boolean>(false)

  const [weightUomId, setWeightUomId] = useState<number | null>(null)

  const [conductedByUsers, setConductedByUsers] = useState<ConductedByUser[]>([])
  const [draftErrors, setDraftErrors] = useState<DraftErrors>({})
  const [organs, setOrgans] = useState<Organ[]>([])
  const [existingAttachments, setExistingAttachments] = useState<AttachmentDocument[]>([])
  const [activeTab, setActiveTab] = useState<string | false>('carcass_details')

  const isEditing: boolean = !!necropsyId
  const isDraftEdit: boolean = isEditing && status?.toUpperCase() === 'DRAFT'
  const isCompletedEdit: boolean =
    isEditing && (status?.toUpperCase() === 'COMPLETED' || status?.toUpperCase() === 'UNSUITABLE')

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<NecropsyFormValues>({
    defaultValues: {
      is_suitable: true,
      reason_for_unsuitable: '',
      caracass_submission_date: null,
      caracass_submission_time: null,
      death_date: null,
      death_time: null,
      place_of_death: '',
      qr_number: '',
      carcass_weight: '',
      weight_unit: null,
      approximate_weight: false,
      sex: '',
      age: '',
      age_unit: 'year',
      approximate_dob: false,
      history_of_illness: '',
      necropsy_date: dayjs(),
      necropsy_time: dayjs(),
      general_description: '',
      manner_of_death: null,
      opinion: '',
      confirmed_cause_of_death: null,
      disposal_method: null,
      biological_test: '',
      additional_notes: '',
      attachments: []
    },
    resolver: yupResolver(submitSchema) as any,
    mode: 'onChange'
  })

  const isSuitable = watch('is_suitable')

  // Merge form errors with draft validation errors
  const mergedErrors = useMemo(
    () => ({ ...errors, ...draftErrors } as FieldErrors<NecropsyFormValues> & DraftErrors),
    [errors, draftErrors]
  )

  useEffect(() => {
    if (!necropsyId && authData?.userData?.user && conductedByUsers.length === 0) {
      const userDetails = authData.userData.user

      const userToAdd: ConductedByUser = {
        user_id: userDetails.user_id,
        user_name: `${userDetails.user_first_name || ''} ${userDetails.user_last_name || ''}`.trim(),
        user_profile_pic: userDetails.profile_pic || '',
        role_name: authData.userData.roles?.role_name || ''
      }
      if (userToAdd.user_id) {
        setConductedByUsers([userToAdd])
      }
    }
  }, [necropsyId, authData?.userData?.user])

  // Clear draft errors when relevant field values change
  const reasonForUnsuitable = watch('reason_for_unsuitable')
  const weightUnit = watch('weight_unit')
  const confirmedCauseOfDeath = watch('confirmed_cause_of_death')

  useEffect(() => {
    if (draftErrors.reason_for_unsuitable && reasonForUnsuitable?.trim()) {
      setDraftErrors(prev => {
        const { reason_for_unsuitable, ...rest } = prev

        return rest
      })
    }
  }, [reasonForUnsuitable, draftErrors.reason_for_unsuitable])

  useEffect(() => {
    if (draftErrors.weight_unit && weightUnit) {
      setDraftErrors(prev => {
        const { weight_unit, ...rest } = prev

        return rest
      })
    }
  }, [weightUnit, draftErrors.weight_unit])

  useEffect(() => {
    if (draftErrors.confirmed_cause_of_death && confirmedCauseOfDeath) {
      setDraftErrors(prev => {
        const { confirmed_cause_of_death, ...rest } = prev

        return rest
      })
    }
  }, [confirmedCauseOfDeath, draftErrors.confirmed_cause_of_death])

  useEffect(() => {
    if (draftErrors.conducted_by && conductedByUsers.length > 0) {
      setDraftErrors(prev => {
        const { conducted_by, ...rest } = prev

        return rest
      })
    }
  }, [conductedByUsers, draftErrors.conducted_by])

  // Fetch initial data when options are loaded
  useEffect(() => {
    if (optionsLoaded) {
      fetchInitialData()
    }
  }, [mortalityId, necropsyId, optionsLoaded])

  const fetchInitialData = async (): Promise<void> => {
    try {
      setLoading(true)

      // Only fetch mortality data - dropdown options come from Redux cache
      const mortalityRes = await getMortalitySummary({ mortality_id: mortalityId })

      if (mortalityRes?.success && mortalityRes.data) {
        setMortalityData(mortalityRes.data as unknown as MortalityData)
        const mortData = mortalityRes.data as unknown as MortalityData

        if (!necropsyId) {
          setValue('history_of_illness', mortData?.history_of_illness || '')
          setValue('place_of_death', mortData?.place_of_death || '')

          if (mortData?.qr_number) {
            setValue('qr_number', mortData.qr_number)
          }

          // Only set weight if it's a meaningful value (not 0 or empty)
          const mortWeightVal = parseFloat(String(mortData?.carcass_weight))
          if (!isNaN(mortWeightVal) && mortWeightVal > 0) {
            setValue('carcass_weight', String(mortData.carcass_weight))

            const uomId = mortData.carcass_weight_uom_id || mortData.carcass_weight_uom || mortData.uom_id
            if (uomId && !isNaN(Number(uomId))) {
              setWeightUomId(Number(uomId))

              // Use helper from Redux hook to find weight unit
              const unitById = findWeightUnitOption(uomId)
              if (unitById) {
                setValue('weight_unit', unitById as FormWeightUnitOption)
              }
            }

            if (!watch('weight_unit')) {
              const uomAbbr = mortData.uom_abbr || mortData.carcass_weight_unit_name
              if (uomAbbr) {
                // Use helper from Redux hook to find weight unit
                const unit = findWeightUnitOption(uomAbbr)
                if (unit) {
                  setValue('weight_unit', unit as FormWeightUnitOption)
                  setWeightUomId(unit.id)
                }
              }
            }

            setValue('approximate_weight', mortData.approximate_weight === 1 || mortData.approximate_weight === '1')
          }

          if (mortData?.sex) {
            setValue('sex', mortData.sex)
          }

          if (mortData?.birth_date) {
            const birthDate = dayjs(mortData.birth_date)
            if (birthDate.isValid()) {
              setAnimalDOB(birthDate)
              setValue('approximate_dob', mortData.approximate_dob === 1 || mortData.approximate_dob === '1')
            }
          } else if (mortData?.age && mortData?.discovered_date) {
            const deathDateValue =
              typeof mortData.discovered_date === 'number'
                ? dayjs(mortData.discovered_date)
                : dayjs.utc(mortData.discovered_date).local()

            if (deathDateValue.isValid()) {
              const ageUnit = (mortData.age_unit || 'day') as dayjs.ManipulateType
              const calculatedDOB = deathDateValue.subtract(parseInt(String(mortData.age)), ageUnit)
              if (calculatedDOB.isValid()) {
                setAnimalDOB(calculatedDOB)
              }
            }
            setValue('age', String(mortData.age))
            setValue('age_unit', mortData.age_unit || 'day')
            setValue('approximate_dob', mortData.approximate_dob === 1 || mortData.approximate_dob === '1')
          }

          if (mortData?.discovered_date) {
            let discoveredDate: Dayjs

            if (typeof mortData.discovered_date === 'number') {
              discoveredDate = dayjs(mortData.discovered_date)
            } else {
              discoveredDate = dayjs.utc(mortData.discovered_date).local()
            }

            if (discoveredDate.isValid()) {
              setValue('death_date', discoveredDate)
              setValue('death_time', discoveredDate)
            }
          }

          setValue('caracass_submission_date', dayjs())
          setValue('caracass_submission_time', dayjs())

          setValue('necropsy_date', dayjs())
          setValue('necropsy_time', dayjs())

          // Use Redux cached options to find matching manner of death
          if (mortData?.manner_of_death_id) {
            const matchingOption = findMannerOfDeathOption(mortData.manner_of_death_id)
            if (matchingOption) {
              setValue('confirmed_cause_of_death', matchingOption as FormSelectOption)
            }
          }

          // Use Redux cached options to find matching disposal method
          if (mortData?.carcass_disposition_id) {
            const matchingOption = findDisposalOption(mortData.carcass_disposition_id)
            if (matchingOption) {
              setValue('disposal_method', matchingOption as FormSelectOption)
            }
          }
        }
      }

      if (necropsyId) {
        const necropsyRes = await getNecropsySummary(Number(necropsyId))
        if (necropsyRes?.success && necropsyRes.data) {
          setNecropsyData(necropsyRes.data as unknown as NecropsyData)
          populateFormFromNecropsy(necropsyRes.data as unknown as NecropsyData)
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const populateFormFromNecropsy = (data: NecropsyData): void => {
    setValue('is_suitable', data.is_unsuitable !== '1' && data.is_unsuitable !== 1)
    setValue('reason_for_unsuitable', data.reason_for_unsuitable || '')

    if (data.caracass_submission_date) setValue('caracass_submission_date', dayjs(data.caracass_submission_date))
    if (data.caracass_submission_time)
      setValue('caracass_submission_time', dayjs(`2000-01-01 ${data.caracass_submission_time}`))
    if (data.death_date) setValue('death_date', dayjs(data.death_date))
    if (data.death_time) setValue('death_time', dayjs(`2000-01-01 ${data.death_time}`))

    setValue('place_of_death', data.place_of_death || '')

    // Only set weight and UOM if weight is a meaningful value (not 0 or empty)
    const weightVal = parseFloat(String(data.carcass_weight))
    const hasMeaningfulWeight = !isNaN(weightVal) && weightVal > 0
    setValue('carcass_weight', hasMeaningfulWeight ? String(data.carcass_weight) : '')

    // Only set weight unit if weight is meaningful
    if (hasMeaningfulWeight) {
      // Use Redux helper to find weight unit
      const uomId = data.carcass_weight_uom_id || data.carcass_weight_uom || data.uom_id
      if (uomId && !isNaN(Number(uomId))) {
        setWeightUomId(Number(uomId))
        const unitById = findWeightUnitOption(uomId)
        if (unitById) {
          setValue('weight_unit', unitById as FormWeightUnitOption)
        }
      }

      if (!watch('weight_unit')) {
        const uomAbbr = data.uom_abbr || data.carcass_weight_unit_name
        if (uomAbbr) {
          const unit = findWeightUnitOption(uomAbbr)
          if (unit) {
            setValue('weight_unit', unit as FormWeightUnitOption)
            setWeightUomId(unit.id)
          } else if (uomAbbr) {
            setValue('weight_unit', { label: uomAbbr, value: uomAbbr })
          }
        }
      }
    }

    setValue('approximate_weight', data.approximate_weight === 1 || data.approximate_weight === '1')
    setValue('sex', data.sex || '')
    setValue('age', String(data.age || ''))
    setValue('age_unit', data.age_unit || 'year')
    setValue('approximate_dob', data.approximate_dob === 1 || data.approximate_dob === '1')

    if (data.birth_date || data.dob) {
      const birthDate = dayjs(data.birth_date || data.dob)
      if (birthDate.isValid()) {
        setAnimalDOB(birthDate)
      }
    } else if (data.age && data.death_date) {
      const deathDateValue = dayjs(data.death_date)
      if (deathDateValue.isValid()) {
        const ageUnit = (data.age_unit || 'day') as dayjs.ManipulateType
        const calculatedDOB = deathDateValue.subtract(parseInt(String(data.age)), ageUnit)
        if (calculatedDOB.isValid()) {
          setAnimalDOB(calculatedDOB)
        }
      }
    }

    setValue('history_of_illness', data.history_of_illness || '')

    if (data.necropsy_date) setValue('necropsy_date', dayjs(data.necropsy_date))
    if (data.necropsy_time) setValue('necropsy_time', dayjs(`2000-01-01 ${data.necropsy_time}`))

    setValue('general_description', data.general_description || '')
    setValue('opinion', data.opinion || '')
    setValue('qr_number', data.qr_number || '')
    setValue('biological_test', data.biological_test || '')
    setValue('additional_notes', data.additional_notes || '')

    // Use Redux helpers for finding manner of death and disposal options
    if (data.suspected_cause_of_death) {
      setValue('manner_of_death', {
        label: data.suspected_cause_of_death,
        value:
          data.suspected_cause_of_death_id || data.suspected_cause_of_death_string_id || data.suspected_cause_of_death
      })
    }

    if (data.confirmed_cause_of_death || data.confirmed_cause_of_death_id) {
      // Try to find matching option using Redux helper
      const matchingOption = findMannerOfDeathOption(data.confirmed_cause_of_death_id || data.confirmed_cause_of_death)

      if (matchingOption) {
        setValue('confirmed_cause_of_death', matchingOption as FormSelectOption)
      } else if (data.confirmed_cause_of_death) {
        setValue('confirmed_cause_of_death', {
          label: data.confirmed_cause_of_death,
          value: data.confirmed_cause_of_death_id || data.confirmed_cause_of_death,
          key: data.confirmed_cause_of_death
        })
      }
    }

    const disposalName = data.disposition || data.disposal_method || data.carcass_disposition
    const disposalId = data.disposition_id || data.disposal_method_id || data.carcass_disposition_id

    if (disposalName || disposalId) {
      // Try to find matching option using Redux helper
      const matchingOption = findDisposalOption(disposalId || disposalName)

      if (matchingOption) {
        setValue('disposal_method', matchingOption as FormSelectOption)
      } else if (disposalName) {
        setValue('disposal_method', {
          label: disposalName as string,
          value: disposalId || disposalName,
          key: disposalName as string
        })
      }
    }

    if (data.necropsy_conducted_by?.length && data.necropsy_conducted_by.length > 0) {
      setConductedByUsers(
        data.necropsy_conducted_by.map(u => ({
          user_id: u.user_id || u.id || 0,
          user_name: u.user_name || u.name || u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          user_profile_pic: u.user_profile_pic || u.profile_pic || u.avatar || '',
          role_name: u.role_name || u.role || u.designation || ''
        }))
      )
    }

    if (data.necropsy_organs?.length && data.necropsy_organs.length > 0) setOrgans(data.necropsy_organs)

    const attachmentDocs =
      (data.attachments as { documents?: AttachmentDocument[] })?.documents ||
      (data.attachments as AttachmentDocument[]) ||
      data.documents ||
      []
    if (Array.isArray(attachmentDocs) && attachmentDocs.length > 0) {
      setExistingAttachments(attachmentDocs)
    }
  }

  const buildFormData = (formValues: NecropsyFormValues, status: string): FormData => {
    const fd = new FormData()

    fd.append('mortality_id', String(mortalityId))
    fd.append('status', status)
    if (necropsyId) fd.append('necropsy_id', String(necropsyId))
    if (mortalityData?.animal_id) fd.append('animal_id', String(mortalityData.animal_id))

    const isUnsuitable = !formValues.is_suitable
    fd.append('is_unsuitable', isUnsuitable ? '1' : '0')
    fd.append('all_update_action', formValues.is_suitable ? '1' : '0')
    if (isUnsuitable && formValues.reason_for_unsuitable) {
      fd.append('reason_for_unsuitable', formValues.reason_for_unsuitable)
    }

    if (conductedByUsers.length > 0) {
      const userIds = conductedByUsers.map(u => Number(u.user_id || u.id)).filter(id => !isNaN(id) && id > 0)
      if (userIds.length > 0) {
        fd.append('necropsy_conducted_by', JSON.stringify(userIds))
      }
    }

    if (mortalityData?.discovered_date) {
      fd.append('discovered_date', dayjs(mortalityData.discovered_date).format('YYYY-MM-DD HH:mm:ss'))
    }

    if (formValues.caracass_submission_date)
      fd.append('caracass_submission_date', dayjs(formValues.caracass_submission_date).format('YYYY-MM-DD'))
    if (formValues.caracass_submission_time)
      fd.append('caracass_submission_time', dayjs(formValues.caracass_submission_time).format('HH:mm:ss'))
    if (formValues.death_date) fd.append('death_date', dayjs(formValues.death_date).format('YYYY-MM-DD'))
    if (formValues.death_time) fd.append('death_time', dayjs(formValues.death_time).format('HH:mm:ss'))
    if (formValues.place_of_death) fd.append('place_of_death', formValues.place_of_death)

    fd.append('carcass_weight', formValues.carcass_weight ? formValues.carcass_weight : '0')

    if (formValues.weight_unit?.id && !isNaN(Number(formValues.weight_unit.id))) {
      fd.append('carcass_weight_uom', String(formValues.weight_unit.id))
    } else if (weightUomId && !isNaN(Number(weightUomId))) {
      fd.append('carcass_weight_uom', String(weightUomId))
    } else {
      fd.append('carcass_weight_uom', '0')
    }
    fd.append('approximate_weight', formValues.approximate_weight ? '1' : '0')

    if (formValues.sex) fd.append('sex', formValues.sex)

    if (animalDOB && formValues.death_date) {
      const totalDays = dayjs(formValues.death_date).diff(dayjs(animalDOB), 'day')
      fd.append('age', String(totalDays))
      fd.append('age_unit', 'day')
      fd.append('dob', dayjs(animalDOB).format('YYYY-MM-DD'))
    } else if (formValues.age) {
      fd.append('age', formValues.age)
      if (formValues.age_unit) fd.append('age_unit', formValues.age_unit)
    }
    fd.append('approximate_dob', formValues.approximate_dob ? '1' : '0')

    if (formValues.history_of_illness) fd.append('history_of_illness', formValues.history_of_illness)

    if (formValues.necropsy_date) fd.append('necropsy_date', dayjs(formValues.necropsy_date).format('YYYY-MM-DD'))
    if (formValues.necropsy_time) fd.append('necropsy_time', dayjs(formValues.necropsy_time).format('HH:mm:ss'))
    if (formValues.general_description) fd.append('general_description', formValues.general_description)

    const bodyPartData: Array<{ body_part_id: string | number; value: string }> = []
    organs.forEach(organ => {
      if (organ.parts?.length && organ.parts.length > 0) {
        organ.parts.forEach(part => {
          bodyPartData.push({
            body_part_id: part.id || part.body_part_id || 0,
            value: part.value || part.description || ''
          })
        })
      }
    })
    fd.append('body_part_data', JSON.stringify(bodyPartData))

    if (mortalityData?.manner_of_death_id) {
      fd.append('suspected_cause_of_death', String(mortalityData.manner_of_death_id))
      fd.append('cause_for_death', String(mortalityData.manner_of_death_id))
    } else if (formValues.manner_of_death) {
      const suspectedId = formValues.manner_of_death.value || formValues.manner_of_death.id
      fd.append('suspected_cause_of_death', String(suspectedId))
      fd.append('cause_for_death', String(suspectedId))
    }

    if (formValues.opinion) fd.append('opinion', formValues.opinion)

    if (formValues.confirmed_cause_of_death) {
      const confirmedId = formValues.confirmed_cause_of_death.value || formValues.confirmed_cause_of_death.id
      fd.append('confirmed_cause_of_death', String(confirmedId))
    }

    if (formValues.disposal_method) {
      const disposalId = formValues.disposal_method.value || formValues.disposal_method.id
      fd.append('disposal_method', String(disposalId))
    } else if (status === 'draft') {
      // For drafts, send 0 value to satisfy backend validation
      fd.append('disposal_method', '0')
    }

    if (formValues.qr_number) fd.append('qr_number', formValues.qr_number)

    fd.append('special_feature', 'Ok')
    fd.append('biological_test', formValues.biological_test || '')
    fd.append('additional_notes', formValues.additional_notes || '')

    const newFiles = (formValues.attachments || []).filter(f => f instanceof File)
    newFiles.forEach(file => fd.append('necropsy_attachment[]', file))

    return fd
  }

  const handleSaveAsDraft = async (): Promise<void> => {
    const formValues = watch()

    // Clear previous draft errors
    setDraftErrors({})

    if (!formValues.is_suitable) {
      if (!formValues.reason_for_unsuitable?.trim()) {
        setDraftErrors({ reason_for_unsuitable: { message: t('necropsy_module.reason_unsuitable_required') } })
        Utility.scrollToField('reason_for_unsuitable')

        return
      }
      if (conductedByUsers.length === 0) {
        setDraftErrors({ conducted_by: { message: t('necropsy_module.at_least_one_user_required') } })
        Utility.scrollToField('conducted_by')

        return
      }
    } else {
      // Only require weight unit if a meaningful weight value is entered (not 0, empty, or "0.00")
      const weightValue = parseFloat(formValues.carcass_weight)
      if (!isNaN(weightValue) && weightValue > 0 && !formValues.weight_unit) {
        setDraftErrors({ weight_unit: { message: t('necropsy_module.weight_unit_required') } })
        Utility.scrollToField('weight_unit')

        return
      }
      if (!formValues.confirmed_cause_of_death) {
        setDraftErrors({ confirmed_cause_of_death: { message: t('necropsy_module.confirmed_cod_required') } })
        Utility.scrollToField('confirmed_cause_of_death')

        return
      }
      if (conductedByUsers.length === 0) {
        setDraftErrors({ conducted_by: { message: t('necropsy_module.at_least_one_user_required') } })
        Utility.scrollToField('conducted_by')

        return
      }
    }

    try {
      setDraftLoading(true)
      const fd = buildFormData(formValues, 'draft')
      const res = isEditing ? await editNecropsy(fd as any) : await addNecropsy(fd as any)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || t('necropsy_module.draft_saved_successfully') })
        router.replace('/necropsy/necropsy')
      } else {
        Toaster({ type: 'error', message: getErrorMessage(res?.message, t('necropsy_module.failed_to_save_draft')) })
      }
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setDraftLoading(false)
    }
  }

  const onSubmit = async (formValues: NecropsyFormValues): Promise<void> => {
    if (conductedByUsers.length === 0) {
      setDraftErrors({ conducted_by: { message: t('necropsy_module.at_least_one_user_required') } })
      Utility.scrollToField('conducted_by')

      return
    }

    try {
      setSubmitLoading(true)
      const submissionStatus = 'completed'
      const fd = buildFormData(formValues, submissionStatus)
      const res = isEditing ? await editNecropsy(fd as any) : await addNecropsy(fd as any)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || t('necropsy_module.necropsy_submitted_successfully') })
        router.replace('/necropsy/necropsy')
      } else {
        Toaster({
          type: 'error',
          message: getErrorMessage(res?.message, t('necropsy_module.failed_to_submit_necropsy'))
        })
      }
    } catch (error) {
      console.error('Error submitting necropsy:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteDraft = async (): Promise<void> => {
    if (!necropsyId) return

    try {
      setDeleteLoading(true)
      const payload = new FormData()
      payload.append('necropsy_id', String(necropsyId))
      const res = await deleteNecropsy(payload as any)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || t('necropsy_module.draft_deleted_successfully') })
        setDeleteDialogOpen(false)
        router.replace('/necropsy/necropsy')
      } else {
        Toaster({ type: 'error', message: getErrorMessage(res?.message, t('necropsy_module.failed_to_delete_draft')) })
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleRemoveExistingAttachment = async (attachmentId: number | string): Promise<void> => {
    try {
      const payload = new FormData()
      payload.append('type', 'necropsy')
      const res = await deleteNecropsyAttachment(Number(attachmentId), payload as any)

      if (res?.success) {
        setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId))
      } else {
        console.error('Failed to remove attachment')
      }
    } catch (error) {
      console.error('Error removing attachment:', error)
    }
  }

  const handleSuitableToggle = (newValue: boolean): void => {
    if (!newValue) {
      setUnsuitableDialogOpen(true)
    }
  }

  // Handle validation errors - scroll to first error field
  const onValidationError = (errors: FieldErrors<NecropsyFormValues>): void => {
    Utility.scrollToFirstError(errors)
  }

  const handleConfirmUnsuitable = (): void => {
    setUnsuitableDialogOpen(false)
  }

  const handleCancelUnsuitable = (): void => {
    setValue('is_suitable', true)
    setUnsuitableDialogOpen(false)
  }

  const deathDate = watch('death_date')

  const getAgeDisplay = (): string | null => {
    if (!animalDOB || !deathDate) return null

    const dob = dayjs(animalDOB)
    const death = dayjs(deathDate)

    if (!dob.isValid() || !death.isValid()) return null

    const years = death.diff(dob, 'year')
    let tempDate = dob.add(years, 'year')

    const months = death.diff(tempDate, 'month')
    tempDate = tempDate.add(months, 'month')

    const days = death.diff(tempDate, 'day')

    const parts: string[] = []
    if (years > 0) parts.push(`${years} Year${years > 1 ? 's' : ''}`)
    if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`)
    if (days > 0) parts.push(`${days} Day${days > 1 ? 's' : ''}`)

    return parts.length > 0 ? parts.join(' ') : '0 Days'
  }

  const calculateDOBFromInputs = (inputs: AgeInputs = ageInputs): Dayjs | null => {
    if (!deathDate) return null

    const { years, months, days } = inputs
    if (!years && !months && !days) return null

    let calculatedDOB = dayjs(deathDate)

    if (years) calculatedDOB = calculatedDOB.subtract(parseInt(years) || 0, 'year')
    if (months) calculatedDOB = calculatedDOB.subtract(parseInt(months) || 0, 'month')
    if (days) calculatedDOB = calculatedDOB.subtract(parseInt(days) || 0, 'day')

    return calculatedDOB
  }

  const getAgeInputsFromDOB = (dob: Dayjs | null): AgeInputs => {
    if (!dob || !deathDate) return { years: '', months: '', days: '' }

    const dobDate = dayjs(dob)
    const death = dayjs(deathDate)

    if (!dobDate.isValid() || !death.isValid()) return { years: '', months: '', days: '' }

    const years = death.diff(dobDate, 'year')
    let tempDate = dobDate.add(years, 'year')

    const months = death.diff(tempDate, 'month')
    tempDate = tempDate.add(months, 'month')

    const days = death.diff(tempDate, 'day')

    return {
      years: years > 0 ? String(years) : '',
      months: months > 0 ? String(months) : '',
      days: days > 0 ? String(days) : ''
    }
  }

  const handleOpenAgeDialog = (): void => {
    if (animalDOB) {
      setAgeInputs(getAgeInputsFromDOB(animalDOB))
    }
    setDialogApproxAge(watch('approximate_dob'))
    setAgeDialogOpen(true)
  }

  const handleApplyAge = (): void => {
    const calculatedDOB = calculateDOBFromInputs()
    if (calculatedDOB) {
      setAnimalDOB(calculatedDOB)

      const totalDays = dayjs(deathDate).diff(calculatedDOB, 'day')
      setValue('age', String(totalDays))
      setValue('age_unit', 'day')
      setValue('approximate_dob', dialogApproxAge)
    }
    setAgeDialogOpen(false)
  }

  const handleCancelAgeDialog = (): void => {
    setAgeDialogOpen(false)

    if (animalDOB) {
      setAgeInputs(getAgeInputsFromDOB(animalDOB))
    } else {
      setAgeInputs({ years: '', months: '', days: '' })
    }
    setDialogApproxAge(watch('approximate_dob'))
  }

  const handleAgeInputChange = (field: keyof AgeInputs, value: string): void => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setAgeInputs(prev => ({ ...prev, [field]: numericValue }))
  }

  const isAnyLoading: boolean = submitLoading || draftLoading

  const labelSx: SxProps<Theme> = {
    fontWeight: 500,
    fontSize: '16px',
    color: theme.palette.customColors?.OnSurfaceVariant
  }

  // Show skeleton while loading data or form options
  if (loading || optionsLoading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <NecropsyAnimalInfoCard loading={true} />
        </Box>

        {/* Accordion Skeletons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Carcass Details Accordion */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Skeleton variant='text' width={150} height={28} />
                <Skeleton variant='circular' width={24} height={24} />
              </Box>
            </CardContent>
          </Card>

          {/* Examination Findings Accordion */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Skeleton variant='text' width={180} height={28} />
                <Skeleton variant='circular' width={24} height={24} />
              </Box>
            </CardContent>
          </Card>

          {/* Conclusion Accordion */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Skeleton variant='text' width={120} height={28} />
                <Skeleton variant='circular' width={24} height={24} />
              </Box>
            </CardContent>
          </Card>

          {/* Additional Notes Card */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Skeleton variant='text' width={140} height={24} />
              <Skeleton variant='rectangular' height={100} sx={{ borderRadius: 1 }} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    )
  }

  const FORM_TABS: FormTab[] = [
    { key: 'carcass_details', label: t('necropsy_module.carcass_details') },
    { key: 'examination_findings', label: t('necropsy_module.examination_findings') },
    { key: 'conclusion', label: t('necropsy_module.conclusion') }
  ]

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setActiveTab(newValue)
  }

  const handleAccordionChange =
    (panel: string) =>
    (event: React.SyntheticEvent, isExpanded: boolean): void => {
      setActiveTab(isExpanded ? panel : false)
    }

  return (
    <Box>
      {mortalityData && (
        <Box sx={{ mb: 3 }}>
          <NecropsyAnimalInfoCard
            mortalityData={mortalityData as any}
            necropsyData={necropsyData as any}
            status={status || undefined}
            loading={false}
            onBack={() => router.back()}
            requestId={mortalityData?.request_id || necropsyData?.request_id || necropsyData?.necropsy_code}
            onDeleteClick={isDraftEdit ? () => setDeleteDialogOpen(true) : undefined}
          />
        </Box>
      )}

      <form>
        <Box sx={{ mt: 6, mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant='scrollable'
            scrollButtons='auto'
            sx={{
              minHeight: 'auto',
              '& .MuiTabs-flexContainer': {
                borderBottom: `1px solid ${theme.palette.divider}`,
                width: 'fit-content'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main
              }
            }}
          >
            {FORM_TABS.map(tab => (
              <Tab
                key={tab.key}
                value={tab.key}
                label={tab.label}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  minHeight: 'auto',
                  py: 1.5,
                  color: theme.palette.customColors?.neutralSecondary,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 600
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Accordion
            expanded={activeTab === 'carcass_details'}
            onChange={handleAccordionChange('carcass_details')}
            sx={{
              padding: 0,
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: 0 }
            }}
          >
            <AccordionSummary
              expandIcon={activeTab === 'carcass_details' ? <RemoveIcon /> : <AddIcon />}
              sx={{
                px: 4,
                py: 1
              }}
            >
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {t('necropsy_module.carcass_details')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 4, pb: 6, pt: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    p: 5,
                    borderRadius: 1,
                    backgroundColor: isSuitable
                      ? alpha(theme.palette.customColors?.PrimaryContainer || theme.palette.primary.light, 0.12)
                      : theme.palette.customColors?.avatarBackground || theme.palette.grey[100]
                  }}
                >
                  <ControlledSwitch
                    name='is_suitable'
                    label={t('necropsy_module.carcass_suitable_for_necropsy')}
                    control={control}
                    errors={mergedErrors}
                    labelPosition='start'
                    spaceBetween
                    onChangeOverride={handleSuitableToggle}
                  />
                  {!isSuitable && (
                    <ControlledTextArea
                      name='reason_for_unsuitable'
                      control={control}
                      errors={mergedErrors}
                      rows={3}
                      placeholder={t('necropsy_module.describe_unsuitable_placeholder')}
                    />
                  )}
                </Box>

                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, lg: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography sx={labelSx}>{t('necropsy_module.carcass_submission_date_time')}</Typography>
                      <Grid container spacing={3}>
                        <Grid size={6}>
                          <ControlledDatePicker
                            name='caracass_submission_date'
                            control={control}
                            label={t('necropsy_module.date_label')}
                            maxDate={dayjs()}
                          />
                        </Grid>
                        <Grid size={6}>
                          <ControlledTimePicker
                            name='caracass_submission_time'
                            control={control}
                            label={t('necropsy_module.time_label')}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography sx={labelSx}>{t('necropsy_module.date_time_of_death')}</Typography>
                      <Grid container spacing={3}>
                        <Grid size={6}>
                          <ControlledDatePicker
                            name='death_date'
                            control={control}
                            label={t('necropsy_module.date_label')}
                            maxDate={dayjs()}
                          />
                        </Grid>
                        <Grid size={6}>
                          <ControlledTimePicker
                            name='death_time'
                            control={control}
                            label={t('necropsy_module.time_label')}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>

                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={labelSx}>{t('necropsy_module.place_of_death')}</Typography>
                    <ControlledTextField
                      name='place_of_death'
                      control={control}
                      errors={mergedErrors}
                      label={t('necropsy_module.place_of_death')}
                      placeholder={t('necropsy_module.place_of_death_placeholder')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={labelSx}>{t('necropsy_module.qr_number')}</Typography>
                    <ControlledTextField
                      name='qr_number'
                      control={control}
                      errors={mergedErrors}
                      label={t('necropsy_module.qr_number')}
                      placeholder={t('necropsy_module.enter_qr_number')}
                      disabled={!!necropsyData?.qr_number || !!mortalityData?.qr_number}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={labelSx}>{t('necropsy_module.carcass_weight')}</Typography>
                    <Grid container spacing={3}>
                      <Grid size={6}>
                        <ControlledTextField
                          name='carcass_weight'
                          control={control}
                          errors={mergedErrors}
                          label={t('necropsy_module.weight')}
                          type='number'
                          placeholder='0.00'
                        />
                      </Grid>
                      <Grid size={6}>
                        <ControlledAutocomplete
                          name='weight_unit'
                          control={control}
                          errors={mergedErrors}
                          label={t('necropsy_module.unit')}
                          options={weightUnitOptions}
                        />
                      </Grid>
                    </Grid>
                    <ControlledSwitch
                      name='approximate_weight'
                      label={t('necropsy_module.approximate_weight')}
                      control={control}
                      errors={mergedErrors}
                      size='small'
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={labelSx}>{t('necropsy_module.age')}</Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 3,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
                          }}
                        >
                          {getAgeDisplay() || t('necropsy_module.not_set')}
                          {watch('approximate_dob') && getAgeDisplay() && (
                            <Typography
                              component='span'
                              sx={{
                                ml: 1,
                                fontSize: '0.875rem',
                                color: theme.palette.text.secondary
                              }}
                            >
                              {t('necropsy_module.approximate')}
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                      <Button
                        variant='text'
                        size='small'
                        onClick={handleOpenAgeDialog}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 500,
                          color: theme.palette.primary.main
                        }}
                      >
                        {t('necropsy_module.edit')}
                      </Button>
                    </Box>
                    {animalDOB && (
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurface,
                          ml: 1
                        }}
                      >
                        {t('necropsy_module.dob_label')} {dayjs(animalDOB).format('DD MMM YYYY')}
                      </Typography>
                    )}
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={labelSx}>{t('necropsy_module.confirmed_sex')}</Typography>
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <ControlledSelect
                        name='sex'
                        control={control}
                        errors={mergedErrors}
                        label={t('necropsy_module.sex_label')}
                        options={sexOptions.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                        getOptionLabel={(option: { value: string; label: string }) => option.label}
                        getOptionValue={(option: { value: string; label: string }) => option.value}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={labelSx}>{t('necropsy_module.clinical_history')}</Typography>
                  <ControlledTextArea
                    name='history_of_illness'
                    control={control}
                    errors={mergedErrors}
                    rows={3}
                    placeholder={t('necropsy_module.clinical_history_placeholder')}
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
          <Accordion
            expanded={activeTab === 'examination_findings'}
            onChange={handleAccordionChange('examination_findings')}
            sx={{
              padding: 0,
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: 0 }
            }}
          >
            <AccordionSummary
              expandIcon={activeTab === 'examination_findings' ? <RemoveIcon /> : <AddIcon />}
              sx={{
                px: 4,
                py: 1
              }}
            >
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: 500,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {t('necropsy_module.examination_findings')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 4, pb: 6, pt: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={labelSx}>{t('necropsy_module.general_description')}</Typography>
                  <ControlledTextArea
                    name='general_description'
                    control={control}
                    errors={mergedErrors}
                    rows={3}
                    placeholder={t('necropsy_module.general_description_placeholder')}
                  />
                </Box>

                <NecropsyOrganSection organs={organs} onChange={setOrgans} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={labelSx}>{t('necropsy_module.attachments')}</Typography>
                  {existingAttachments.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {existingAttachments.map((doc, index) => {
                        const fileUrl = doc.file || doc.url || doc.file_url || doc.path || ''

                        const fileName =
                          doc.file_original_name || doc.original_name || doc.name || doc.filename || 'File'

                        const docId = doc.id || doc.attachment_id || index

                        const isImage = ['jpeg', 'jpg', 'png', 'gif', 'webp'].some(
                          ext => fileUrl?.toLowerCase()?.endsWith(ext) || fileName?.toLowerCase()?.endsWith(ext)
                        )

                        return (
                          <Box
                            key={docId}
                            sx={{
                              position: 'relative',
                              width: 100,
                              height: 100,
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: `1px solid ${theme.palette.divider}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50]
                            }}
                          >
                            {isImage && fileUrl ? (
                              <img
                                src={fileUrl}
                                alt={fileName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Typography
                                variant='caption'
                                sx={{ p: 2, wordBreak: 'break-all', fontSize: '11px', textAlign: 'center' }}
                              >
                                {fileName}
                              </Typography>
                            )}
                            <IconButton
                              size='small'
                              onClick={() => handleRemoveExistingAttachment(doc.id || doc.attachment_id || '')}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 22,
                                height: 22,
                                bgcolor: 'rgba(0,0,0,0.55)',
                                color: '#fff',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' }
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        )
                      })}
                    </Box>
                  )}
                  <ControlledMultiFileUpload
                    name='attachments'
                    control={control}
                    label={t('necropsy_module.upload_attachments')}
                    maxFiles={10}
                    maxFileSize={10 * 1024 * 1024}
                    acceptedFileTypes='images,pdf,documents'
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
          <Accordion
            expanded={activeTab === 'conclusion'}
            onChange={handleAccordionChange('conclusion')}
            sx={{
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: 0 }
            }}
          >
            <AccordionSummary
              expandIcon={activeTab === 'conclusion' ? <RemoveIcon /> : <AddIcon />}
              sx={{
                px: 4,
                py: 1
              }}
            >
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {t('necropsy_module.conclusion')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 4, pb: 3, pt: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mortalityData?.manner_of_death && (
                  <Grid container sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Grid size={{ xs: 12 }}>
                      <Typography sx={labelSx}>{t('necropsy_module.suspected_cause_of_death_label')}</Typography>
                    </Grid>
                    <Grid
                      size={{ xs: 12, sm: 12, md: 6 }}
                      sx={{
                        backgroundColor: theme.palette.customColors.neutral05,
                        p: 3,
                        border: `1px solid ${theme.palette.customColors.Outlinevariant}`,
                        borderRadius: 0.4
                      }}
                    >
                      <Typography
                        sx={{
                          color: theme.palette.customColors.Outline,
                          fontSize: '16px',
                          fontWeight: 400
                        }}
                      >
                        {mortalityData.manner_of_death}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={labelSx}>{t('necropsy_module.opinion_cause_of_death_label')}</Typography>
                  <ControlledTextArea
                    name='opinion'
                    control={control}
                    errors={mergedErrors}
                    rows={2}
                    placeholder={t('necropsy_module.opinion_placeholder')}
                  />
                </Box>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>{t('necropsy_module.confirmed_cause_of_death_after_necropsy')}</Typography>
                    <ControlledAutocomplete
                      name='confirmed_cause_of_death'
                      control={control}
                      errors={mergedErrors}
                      label={t('necropsy_module.confirmed_cause_after_necropsy')}
                      options={mannerOfDeathOptions}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>{t('necropsy_module.disposal_method_label')}</Typography>
                    <ControlledAutocomplete
                      name='disposal_method'
                      control={control}
                      errors={mergedErrors}
                      label={t('necropsy_module.disposal_method_label')}
                      options={disposalOptions}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Typography
                    sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    {t('necropsy_module.additional_details')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>{t('necropsy_module.biological_tests_done')}</Typography>
                    <ControlledTextArea
                      name='biological_test'
                      control={control}
                      errors={mergedErrors}
                      rows={3}
                      placeholder={t('necropsy_module.biological_tests_placeholder')}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Typography
                    sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                  >
                    {t('necropsy_module.necropsy_details')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>{t('necropsy_module.necropsy_date_time')}</Typography>
                    <Grid container spacing={3}>
                      <Grid size={6}>
                        <ControlledDatePicker
                          name='necropsy_date'
                          control={control}
                          label={t('necropsy_module.date_label')}
                          maxDate={dayjs()}
                        />
                      </Grid>
                      <Grid size={6}>
                        <ControlledTimePicker
                          name='necropsy_time'
                          control={control}
                          label={t('necropsy_module.time_label')}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }} data-field='conducted_by'>
                    <Typography sx={labelSx}>{t('necropsy_module.necropsy_conducted_by')}</Typography>
                    <UserMultiSelect
                      selectedUsers={conductedByUsers}
                      onChange={setConductedByUsers}
                      label={t('necropsy_module.search_users_by_name')}
                      necropsyCentreId={mortalityData?.necropsy_center_id as number | undefined}
                      permission='enable_add_necropsy_report'
                    />
                    {mergedErrors.conducted_by && (
                      <FormHelperText sx={{ color: 'error.main', mt: -2 }}>
                        {mergedErrors.conducted_by.message}
                      </FormHelperText>
                    )}
                  </Box>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography
                sx={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                {t('necropsy_module.notes_optional')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <ControlledTextArea
                    name='additional_notes'
                    control={control}
                    errors={mergedErrors}
                    rows={2}
                    placeholder={t('necropsy_module.enter_placeholder')}
                    inputBackgroundColor={theme.palette.customColors.antzNotes}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </form>

      <BottomActionBar
        onCancel={() => router.push(status ? `/necropsy/necropsy?status=${status}` : '/necropsy/necropsy')}
        onSubmit={handleSubmit(onSubmit, onValidationError)}
        loading={submitLoading}
        disabled={isAnyLoading}
        cancelLabel={t('necropsy_module.cancel_label')}
        submitLabel={t('necropsy_module.submit')}
        showCancel={!isCompletedEdit}
        cancelBtnStyle={{
          color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.text.primary,
          borderColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.divider
        }}
        submitBtnStyle={{
          backgroundColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main
        }}
        layoutStyle={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}
      >
        {!isCompletedEdit && (
          <Button
            variant='outlined'
            onClick={handleSaveAsDraft}
            disabled={isAnyLoading}
            sx={{
              fontWeight: 600,
              minHeight: '56px',
              minWidth: '160px',
              borderRadius: 0.5,
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main
            }}
          >
            {draftLoading ? <CircularProgress size={22} /> : t('necropsy_module.save_as_draft')}
          </Button>
        )}
      </BottomActionBar>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '18px', pb: 1 }}>{t('necropsy_module.delete_draft')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>
            {t('necropsy_module.delete_draft_confirmation')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 5, pt: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading} sx={{ fontWeight: 600 }}>
            {t('necropsy_module.cancel_label')}
          </Button>
          <Button
            onClick={handleDeleteDraft}
            color='error'
            variant='contained'
            disabled={deleteLoading}
            sx={{ fontWeight: 600 }}
          >
            {deleteLoading ? <CircularProgress size={22} color='inherit' /> : t('necropsy_module.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        dialogBoxStatus={unsuitableDialogOpen}
        onClose={handleCancelUnsuitable}
        icon='mdi:alert-circle-outline'
        title={t('necropsy_module.mark_as_unsuitable')}
        description={t('necropsy_module.mark_unsuitable_confirmation')}
        cancelText={t('necropsy_module.no_label')}
        ConfirmationText={t('necropsy_module.yes_label')}
        confirmAction={handleConfirmUnsuitable}
      />

      <Dialog
        open={ageDialogOpen}
        onClose={handleCancelAgeDialog}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '18px' }}>{t('necropsy_module.update_age')}</Typography>
          <IconButton size='small' onClick={handleCancelAgeDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, overflow: 'visible' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={4}>
                <TextField
                  fullWidth
                  label={t('necropsy_module.years')}
                  type='number'
                  value={ageInputs.years}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAgeInputChange('years', e.target.value)}
                  inputProps={{ min: 0, max: 999 }}
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  fullWidth
                  label={t('necropsy_module.months')}
                  type='number'
                  value={ageInputs.months}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAgeInputChange('months', e.target.value)}
                  inputProps={{ min: 0, max: 11 }}
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  fullWidth
                  label={t('necropsy_module.days')}
                  type='number'
                  value={ageInputs.days}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAgeInputChange('days', e.target.value)}
                  inputProps={{ min: 0, max: 30 }}
                />
              </Grid>
            </Grid>

            {calculateDOBFromInputs() && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.customColors?.Surface || theme.palette.grey[50],
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                  {t('necropsy_module.dob_label')} {calculateDOBFromInputs()?.format('DD MMM YYYY')}
                </Typography>
              </Box>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={dialogApproxAge}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDialogApproxAge(e.target.checked)}
                  size='small'
                />
              }
              label={t('necropsy_module.mark_as_approximate')}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button variant='outlined' onClick={handleCancelAgeDialog} sx={{ fontWeight: 600 }}>
            {t('necropsy_module.cancel_label')}
          </Button>
          <Button
            variant='contained'
            onClick={handleApplyAge}
            sx={{ fontWeight: 600 }}
            disabled={!ageInputs.years && !ageInputs.months && !ageInputs.days}
          >
            {t('necropsy_module.apply')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default NecropsyReportForm
