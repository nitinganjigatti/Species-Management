import React, { useState, useEffect, useContext, useRef, useMemo, useCallback, memo } from 'react'
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
  useTheme
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
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
import { Close as CloseIcon } from '@mui/icons-material'
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

// Use cached form options from Redux
import { useNecropsyFormOptions } from 'src/hooks/necropsy'

dayjs.extend(utc)
dayjs.extend(timezone)

const getErrorMessage = (message, fallback = 'An error occurred') => {
  if (!message) return fallback
  if (typeof message === 'string') return message

  if (typeof message === 'object') {
    const errorValues = Object.values(message)
    if (errorValues.length > 0) {
      return String(errorValues[0])
    }
  }

  return fallback
}

const sexOptions = ['male', 'female', 'indeterminate', 'undetermined']
const ageUnitOptions = ['day', 'month', 'year']

const submitSchema = yup.object().shape({
  is_suitable: yup.boolean(),
  reason_for_unsuitable: yup.string().when('is_suitable', {
    is: false,
    then: schema => schema.test('not-empty', 'Reason for unsuitable is required', value => value?.trim()?.length > 0),
    otherwise: schema => schema.notRequired()
  }),
  confirmed_cause_of_death: yup
    .mixed()
    .nullable()
    .when('is_suitable', {
      is: true,
      then: schema => schema.test('required', 'Confirmed cause of death is required', value => value != null),
      otherwise: schema => schema.nullable()
    }),
  disposal_method: yup
    .mixed()
    .nullable()
    .when('is_suitable', {
      is: true,
      then: schema => schema.test('required', 'Disposal method is required', value => value != null),
      otherwise: schema => schema.nullable()
    }),
  weight_unit: yup
    .mixed()
    .nullable()
    .when(['is_suitable', 'carcass_weight'], {
      is: (suitable, weight) => suitable === true && weight != null && String(weight).trim().length > 0,
      then: schema => schema.test('required', 'Please select the weight unit', value => value != null),
      otherwise: schema => schema.nullable()
    })
})

const NecropsyReportForm = ({ mortalityId, necropsyId, status }) => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)

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

  const [mortalityData, setMortalityData] = useState(null)
  const [necropsyData, setNecropsyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [unsuitableDialogOpen, setUnsuitableDialogOpen] = useState(false)
  const [ageDialogOpen, setAgeDialogOpen] = useState(false)
  const [animalDOB, setAnimalDOB] = useState(null)
  const [ageInputs, setAgeInputs] = useState({ years: '', months: '', days: '' })
  const [dialogApproxAge, setDialogApproxAge] = useState(false)

  const [weightUomId, setWeightUomId] = useState(null)

  const [conductedByUsers, setConductedByUsers] = useState([])
  const [organs, setOrgans] = useState([])
  const [existingAttachments, setExistingAttachments] = useState([])

  const isEditing = !!necropsyId
  const isDraftEdit = isEditing && status?.toUpperCase() === 'DRAFT'
  const isCompletedEdit = isEditing && (status?.toUpperCase() === 'COMPLETED' || status?.toUpperCase() === 'UNSUITABLE')

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
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
    resolver: yupResolver(submitSchema),
    mode: 'onChange'
  })

  const isSuitable = watch('is_suitable')

  useEffect(() => {
    if (!necropsyId && authData?.userData?.user && conductedByUsers.length === 0) {
      const userDetails = authData.userData.user

      const userToAdd = {
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

  // Fetch initial data when options are loaded
  useEffect(() => {
    if (optionsLoaded) {
      fetchInitialData()
    }
  }, [mortalityId, necropsyId, optionsLoaded])

  const fetchInitialData = async () => {
    try {
      setLoading(true)

      // Only fetch mortality data - dropdown options come from Redux cache
      const mortalityRes = await getMortalitySummary({ mortality_id: mortalityId })

      if (mortalityRes?.success) {
        setMortalityData(mortalityRes.data)
        const mortData = mortalityRes.data

        if (!necropsyId) {
          setValue('history_of_illness', mortData?.history_of_illness || '')
          setValue('place_of_death', mortData?.place_of_death || '')

          if (mortData?.qr_number) {
            setValue('qr_number', mortData.qr_number)
          }

          if (mortData?.carcass_weight) {
            setValue('carcass_weight', String(mortData.carcass_weight))

            const uomId = mortData.carcass_weight_uom_id || mortData.carcass_weight_uom || mortData.uom_id
            if (uomId && !isNaN(Number(uomId))) {
              setWeightUomId(Number(uomId))

              // Use helper from Redux hook to find weight unit
              const unitById = findWeightUnitOption(uomId)
              if (unitById) {
                setValue('weight_unit', unitById)
              }
            }

            if (!watch('weight_unit')) {
              const uomAbbr = mortData.uom_abbr || mortData.carcass_weight_unit_name
              if (uomAbbr) {
                // Use helper from Redux hook to find weight unit
                const unit = findWeightUnitOption(uomAbbr)
                if (unit) {
                  setValue('weight_unit', unit)
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
              const ageUnit = mortData.age_unit || 'day'
              const calculatedDOB = deathDateValue.subtract(parseInt(mortData.age), ageUnit)
              if (calculatedDOB.isValid()) {
                setAnimalDOB(calculatedDOB)
              }
            }
            setValue('age', String(mortData.age))
            setValue('age_unit', mortData.age_unit || 'day')
            setValue('approximate_dob', mortData.approximate_dob === 1 || mortData.approximate_dob === '1')
          }

          if (mortData?.discovered_date) {
            let discoveredDate

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
              setValue('confirmed_cause_of_death', matchingOption)
            }
          }

          // Use Redux cached options to find matching disposal method
          if (mortData?.carcass_disposition_id) {
            const matchingOption = findDisposalOption(mortData.carcass_disposition_id)
            if (matchingOption) {
              setValue('disposal_method', matchingOption)
            }
          }
        }
      }

      if (necropsyId) {
        const necropsyRes = await getNecropsySummary(necropsyId)
        if (necropsyRes?.success && necropsyRes.data) {
          setNecropsyData(necropsyRes.data)
          populateFormFromNecropsy(necropsyRes.data)
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      Toaster({ type: 'error', message: 'Failed to load form data' })
    } finally {
      setLoading(false)
    }
  }

  const populateFormFromNecropsy = data => {
    setValue('is_suitable', data.is_unsuitable !== '1' && data.is_unsuitable !== 1)
    setValue('reason_for_unsuitable', data.reason_for_unsuitable || '')

    if (data.caracass_submission_date) setValue('caracass_submission_date', dayjs(data.caracass_submission_date))
    if (data.caracass_submission_time)
      setValue('caracass_submission_time', dayjs(`2000-01-01 ${data.caracass_submission_time}`))
    if (data.death_date) setValue('death_date', dayjs(data.death_date))
    if (data.death_time) setValue('death_time', dayjs(`2000-01-01 ${data.death_time}`))

    setValue('place_of_death', data.place_of_death || '')
    setValue('carcass_weight', data.carcass_weight || '')

    // Use Redux helper to find weight unit
    const uomId = data.carcass_weight_uom_id || data.carcass_weight_uom || data.uom_id
    if (uomId && !isNaN(Number(uomId))) {
      setWeightUomId(Number(uomId))
      const unitById = findWeightUnitOption(uomId)
      if (unitById) {
        setValue('weight_unit', unitById)
      }
    }

    if (!watch('weight_unit')) {
      const uomAbbr = data.uom_abbr || data.carcass_weight_unit_name
      if (uomAbbr) {
        const unit = findWeightUnitOption(uomAbbr)
        if (unit) {
          setValue('weight_unit', unit)
          setWeightUomId(unit.id)
        } else if (uomAbbr) {
          setValue('weight_unit', { label: uomAbbr, value: uomAbbr })
        }
      }
    }

    setValue('approximate_weight', data.approximate_weight === 1 || data.approximate_weight === '1')
    setValue('sex', data.sex || '')
    setValue('age', data.age || '')
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
        const ageUnit = data.age_unit || 'day'
        const calculatedDOB = deathDateValue.subtract(parseInt(data.age), ageUnit)
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
      let matchingOption = findMannerOfDeathOption(data.confirmed_cause_of_death_id || data.confirmed_cause_of_death)

      if (matchingOption) {
        setValue('confirmed_cause_of_death', matchingOption)
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
      let matchingOption = findDisposalOption(disposalId || disposalName)

      if (matchingOption) {
        setValue('disposal_method', matchingOption)
      } else if (disposalName) {
        setValue('disposal_method', {
          label: disposalName,
          value: disposalId || disposalName,
          key: disposalName
        })
      }
    }

    if (data.necropsy_conducted_by?.length > 0) {
      setConductedByUsers(
        data.necropsy_conducted_by.map(u => ({
          user_id: u.user_id || u.id,
          user_name: u.user_name || u.name || u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          user_profile_pic: u.user_profile_pic || u.profile_pic || u.avatar || '',
          role_name: u.role_name || u.role || u.designation || ''
        }))
      )
    }

    if (data.necropsy_organs?.length > 0) setOrgans(data.necropsy_organs)

    const attachmentDocs = data.attachments?.documents || data.attachments || data.documents || []
    if (Array.isArray(attachmentDocs) && attachmentDocs.length > 0) {
      setExistingAttachments(attachmentDocs)
    }
  }

  const buildFormData = (formValues, status) => {
    const fd = new FormData()

    fd.append('mortality_id', mortalityId)
    fd.append('status', status)
    if (necropsyId) fd.append('necropsy_id', necropsyId)
    if (mortalityData?.animal_id) fd.append('animal_id', mortalityData.animal_id)

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

    fd.append('carcass_weight', formValues.carcass_weight ? formValues.carcass_weight : 0)

    if (formValues.weight_unit?.id && !isNaN(Number(formValues.weight_unit.id))) {
      fd.append('carcass_weight_uom', formValues.weight_unit.id)
    } else if (weightUomId && !isNaN(Number(weightUomId))) {
      fd.append('carcass_weight_uom', weightUomId)
    } else {
      fd.append('carcass_weight_uom', 0)
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

    const bodyPartData = []
    organs.forEach(organ => {
      if (organ.parts?.length > 0) {
        organ.parts.forEach(part => {
          bodyPartData.push({
            body_part_id: part.id || part.body_part_id,
            value: part.value || part.description || ''
          })
        })
      }
    })
    fd.append('body_part_data', JSON.stringify(bodyPartData))

    if (mortalityData?.manner_of_death_id) {
      fd.append('suspected_cause_of_death', mortalityData.manner_of_death_id)
      fd.append('cause_for_death', mortalityData.manner_of_death_id)
    } else if (formValues.manner_of_death) {
      const suspectedId = formValues.manner_of_death.value || formValues.manner_of_death.id
      fd.append('suspected_cause_of_death', suspectedId)
      fd.append('cause_for_death', suspectedId)
    }

    if (formValues.opinion) fd.append('opinion', formValues.opinion)

    if (formValues.confirmed_cause_of_death) {
      const confirmedId = formValues.confirmed_cause_of_death.value || formValues.confirmed_cause_of_death.id
      fd.append('confirmed_cause_of_death', confirmedId)
    }

    if (formValues.disposal_method) {
      const disposalId = formValues.disposal_method.value || formValues.disposal_method.id
      fd.append('disposal_method', disposalId)
    }

    if (formValues.qr_number) fd.append('qr_number', formValues.qr_number)

    fd.append('special_feature', 'Ok')
    fd.append('biological_test', formValues.biological_test || '')
    fd.append('additional_notes', formValues.additional_notes || '')

    const newFiles = (formValues.attachments || []).filter(f => f instanceof File)
    newFiles.forEach(file => fd.append('necropsy_attachment[]', file))

    return fd
  }

  const handleSaveAsDraft = async () => {
    const formValues = watch()

    if (!formValues.is_suitable) {
      if (!formValues.reason_for_unsuitable?.trim()) {
        Toaster({ type: 'error', message: 'Reason for unsuitable is required' })

        return
      }
      if (conductedByUsers.length === 0) {
        Toaster({ type: 'error', message: 'Conducted by field is required' })

        return
      }
    } else {
      if (formValues.carcass_weight && !formValues.weight_unit) {
        Toaster({ type: 'error', message: 'Please select the weight unit' })

        return
      }
      if (!formValues.confirmed_cause_of_death) {
        Toaster({ type: 'error', message: 'Confirmed cause of death is required' })

        return
      }
      if (conductedByUsers.length === 0) {
        Toaster({ type: 'error', message: 'Conducted by field is required' })

        return
      }
    }

    try {
      setDraftLoading(true)
      const fd = buildFormData(formValues, 'draft')
      const res = isEditing ? await editNecropsy(fd) : await addNecropsy(fd)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Draft saved successfully' })
        router.push('/necropsy')
      } else {
        Toaster({ type: 'error', message: getErrorMessage(res?.message, 'Failed to save draft') })
      }
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setDraftLoading(false)
    }
  }

  const onSubmit = async formValues => {
    if (conductedByUsers.length === 0) {
      Toaster({ type: 'error', message: 'Conducted by field is required' })

      return
    }

    try {
      setSubmitLoading(true)
      const submissionStatus = 'completed'
      const fd = buildFormData(formValues, submissionStatus)
      const res = isEditing ? await editNecropsy(fd) : await addNecropsy(fd)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Necropsy submitted successfully' })
        router.push('/necropsy')
      } else {
        Toaster({ type: 'error', message: getErrorMessage(res?.message, 'Failed to submit necropsy') })
      }
    } catch (error) {
      console.error('Error submitting necropsy:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteDraft = async () => {
    if (!necropsyId) return

    try {
      setDeleteLoading(true)
      const payload = new FormData()
      payload.append('necropsy_id', necropsyId)
      const res = await deleteNecropsy(payload)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Draft deleted successfully' })
        setDeleteDialogOpen(false)
        router.push('/necropsy')
      } else {
        Toaster({ type: 'error', message: getErrorMessage(res?.message, 'Failed to delete draft') })
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleRemoveExistingAttachment = async attachmentId => {
    try {
      const payload = new FormData()
      payload.append('type', 'necropsy')
      const res = await deleteNecropsyAttachment(attachmentId, payload)

      if (res?.success) {
        setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId))
        Toaster({ type: 'success', message: 'Attachment removed' })
      } else {
        Toaster({ type: 'error', message: 'Failed to remove attachment' })
      }
    } catch (error) {
      console.error('Error removing attachment:', error)
    }
  }

  const handleSuitableToggle = newValue => {
    if (!newValue) {
      setUnsuitableDialogOpen(true)
    }
  }

  const handleConfirmUnsuitable = () => {
    setUnsuitableDialogOpen(false)
  }

  const handleCancelUnsuitable = () => {
    setValue('is_suitable', true)
    setUnsuitableDialogOpen(false)
  }

  const deathDate = watch('death_date')

  const getAgeDisplay = () => {
    if (!animalDOB || !deathDate) return null

    const dob = dayjs(animalDOB)
    const death = dayjs(deathDate)

    if (!dob.isValid() || !death.isValid()) return null

    let years = death.diff(dob, 'year')
    let tempDate = dob.add(years, 'year')

    let months = death.diff(tempDate, 'month')
    tempDate = tempDate.add(months, 'month')

    let days = death.diff(tempDate, 'day')

    const parts = []
    if (years > 0) parts.push(`${years} Year${years > 1 ? 's' : ''}`)
    if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`)
    if (days > 0) parts.push(`${days} Day${days > 1 ? 's' : ''}`)

    return parts.length > 0 ? parts.join(' ') : '0 Days'
  }

  const calculateDOBFromInputs = (inputs = ageInputs) => {
    if (!deathDate) return null

    const { years, months, days } = inputs
    if (!years && !months && !days) return null

    let calculatedDOB = dayjs(deathDate)

    if (years) calculatedDOB = calculatedDOB.subtract(parseInt(years) || 0, 'year')
    if (months) calculatedDOB = calculatedDOB.subtract(parseInt(months) || 0, 'month')
    if (days) calculatedDOB = calculatedDOB.subtract(parseInt(days) || 0, 'day')

    return calculatedDOB
  }

  const getAgeInputsFromDOB = dob => {
    if (!dob || !deathDate) return { years: '', months: '', days: '' }

    const dobDate = dayjs(dob)
    const death = dayjs(deathDate)

    if (!dobDate.isValid() || !death.isValid()) return { years: '', months: '', days: '' }

    let years = death.diff(dobDate, 'year')
    let tempDate = dobDate.add(years, 'year')

    let months = death.diff(tempDate, 'month')
    tempDate = tempDate.add(months, 'month')

    let days = death.diff(tempDate, 'day')

    return {
      years: years > 0 ? String(years) : '',
      months: months > 0 ? String(months) : '',
      days: days > 0 ? String(days) : ''
    }
  }

  const handleOpenAgeDialog = () => {
    if (animalDOB) {
      setAgeInputs(getAgeInputsFromDOB(animalDOB))
    }
    setDialogApproxAge(watch('approximate_dob'))
    setAgeDialogOpen(true)
  }

  const handleApplyAge = () => {
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

  const handleCancelAgeDialog = () => {
    setAgeDialogOpen(false)

    if (animalDOB) {
      setAgeInputs(getAgeInputsFromDOB(animalDOB))
    } else {
      setAgeInputs({ years: '', months: '', days: '' })
    }
    setDialogApproxAge(watch('approximate_dob'))
  }

  const handleAgeInputChange = (field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setAgeInputs(prev => ({ ...prev, [field]: numericValue }))
  }

  const isAnyLoading = submitLoading || draftLoading

  const labelSx = {
    fontWeight: 500,
    fontSize: '16px',
    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.secondary
  }

  const FormFieldSkeleton = ({ label = true, height = 56 }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {label && <Skeleton variant='text' width={120} height={24} />}
      <Skeleton variant='rectangular' height={height} sx={{ borderRadius: 1 }} />
    </Box>
  )

  const SectionSkeleton = ({ fields = 2, hasLabel = true }) => (
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

  // Show skeleton while loading data or form options
  if (loading || optionsLoading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <NecropsyAnimalInfoCard loading={true} />
        </Box>

        <Card>
          <CardContent sx={{ p: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Skeleton variant='text' width={150} height={24} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton variant='text' width={250} height={24} />
                  <Skeleton variant='rectangular' width={50} height={30} sx={{ borderRadius: 3 }} />
                </Box>
              </Box>

              <Skeleton variant='rectangular' height={1} />

              <Skeleton variant='text' width={140} height={28} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Skeleton variant='text' width={200} height={24} />
                    <Grid container spacing={3}>
                      <Grid size={6}>
                        <FormFieldSkeleton label={false} />
                      </Grid>
                      <Grid size={6}>
                        <FormFieldSkeleton label={false} />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Skeleton variant='text' width={180} height={24} />
                    <Grid container spacing={3}>
                      <Grid size={6}>
                        <FormFieldSkeleton label={false} />
                      </Grid>
                      <Grid size={6}>
                        <FormFieldSkeleton label={false} />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>

              <SectionSkeleton fields={2} />

              <SectionSkeleton fields={2} />

              <SectionSkeleton fields={1} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Skeleton variant='text' width={50} height={24} />
                <Skeleton variant='rectangular' height={80} sx={{ borderRadius: 1 }} />
              </Box>

              <Skeleton variant='rectangular' height={1} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Skeleton variant='text' width={130} height={24} />
                <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 1 }} />
              </Box>

              <Skeleton variant='rectangular' height={1} />

              <Skeleton variant='text' width={140} height={28} />
              <SectionSkeleton fields={2} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Skeleton variant='text' width={180} height={24} />
                <Skeleton variant='rectangular' height={56} sx={{ borderRadius: 1 }} />
              </Box>

              <Skeleton variant='rectangular' height={1} />

              <Skeleton variant='text' width={180} height={28} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Skeleton variant='text' width={150} height={24} />
                <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 1 }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Skeleton variant='text' width={250} height={24} />
                <Skeleton variant='rectangular' height={100} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      {mortalityData && (
        <Box sx={{ mb: 3 }}>
          <NecropsyAnimalInfoCard
            mortalityData={mortalityData}
            loading={false}
            onBack={() => router.back()}
            requestId={mortalityData?.request_id || necropsyData?.request_id}
          />
        </Box>
      )}

      <form>
        <Card>
          <CardContent sx={{ p: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography sx={labelSx}>Carcass Suitability</Typography>
                <ControlledSwitch
                  name='is_suitable'
                  label='Carcass is suitable for necropsy'
                  control={control}
                  errors={errors}
                  labelPosition='start'
                  spaceBetween
                  onChangeOverride={handleSuitableToggle}
                />
                {!isSuitable && (
                  <ControlledTextArea
                    name='reason_for_unsuitable'
                    control={control}
                    errors={errors}
                    rows={3}
                    placeholder='Describe why the carcass is unsuitable for necropsy...'
                  />
                )}
              </Box>

              {!isSuitable && (
                <>
                  <Divider />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Necropsy Conducted By</Typography>
                    <UserMultiSelect
                      selectedUsers={conductedByUsers}
                      onChange={setConductedByUsers}
                      label='Search users by name'
                    />
                  </Box>
                </>
              )}

              {isSuitable && (
                <>
                  <Divider />

                  <Typography sx={{ ...labelSx, fontSize: '18px', fontWeight: 600 }}>Carcass Details</Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography sx={labelSx}>Carcass Submission Date & Time</Typography>
                        <Grid container spacing={3}>
                          <Grid size={6}>
                            <ControlledDatePicker
                              name='caracass_submission_date'
                              control={control}
                              label='Date'
                              maxDate={dayjs()}
                            />
                          </Grid>
                          <Grid size={6}>
                            <ControlledTimePicker name='caracass_submission_time' control={control} label='Time' />
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography sx={labelSx}>Date & Time of Death</Typography>
                        <Grid container spacing={3}>
                          <Grid size={6}>
                            <ControlledDatePicker name='death_date' control={control} label='Date' maxDate={dayjs()} />
                          </Grid>
                          <Grid size={6}>
                            <ControlledTimePicker name='death_time' control={control} label='Time' />
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Place of Death & QR Number</Typography>
                    <Grid container spacing={6}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ControlledTextField
                          name='place_of_death'
                          control={control}
                          errors={errors}
                          label='Place of Death'
                          placeholder='E.g. Enclosure A, Holding area...'
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ControlledTextField
                          name='qr_number'
                          control={control}
                          errors={errors}
                          label='QR Number'
                          placeholder='Enter QR number'
                          disabled={!!necropsyData?.qr_number}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Carcass Weight</Typography>
                    <Grid container spacing={3}>
                      <Grid size={6}>
                        <ControlledTextField
                          name='carcass_weight'
                          control={control}
                          errors={errors}
                          label='Weight'
                          type='number'
                          placeholder='0.00'
                        />
                      </Grid>
                      <Grid size={6}>
                        <ControlledAutocomplete
                          name='weight_unit'
                          control={control}
                          errors={errors}
                          label='Unit'
                          options={weightUnitOptions}
                        />
                      </Grid>
                    </Grid>
                    <ControlledSwitch
                      name='approximate_weight'
                      label='Approximate weight'
                      control={control}
                      errors={errors}
                      size='small'
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Confirmed Sex</Typography>
                    <Grid container spacing={6}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ControlledSelect
                          name='sex'
                          control={control}
                          errors={errors}
                          label='Sex'
                          options={sexOptions}
                          getOptionLabel={o => o.charAt(0).toUpperCase() + o.slice(1)}
                          getOptionValue={o => o}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Age</Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 3,
                        backgroundColor: theme.palette.customColors?.Surface || theme.palette.grey[50],
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
                          {getAgeDisplay() || 'Not set'}
                          {watch('approximate_dob') && getAgeDisplay() && (
                            <Typography
                              component='span'
                              sx={{
                                ml: 1,
                                fontSize: '0.875rem',
                                color: theme.palette.text.secondary
                              }}
                            >
                              (Approximate)
                            </Typography>
                          )}
                        </Typography>

                        {animalDOB && (
                          <Typography
                            sx={{
                              fontSize: '0.875rem',
                              color: theme.palette.text.secondary,
                              mt: 0.5
                            }}
                          >
                            DOB: {dayjs(animalDOB).format('DD MMM YYYY')}
                          </Typography>
                        )}
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
                        Edit
                      </Button>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Clinical History</Typography>
                    <ControlledTextArea
                      name='history_of_illness'
                      control={control}
                      errors={errors}
                      rows={5}
                      placeholder='Enter clinical history, symptoms, treatments, and relevant medical background...'
                    />
                  </Box>

                  <Divider />

                  <Typography sx={{ ...labelSx, fontSize: '18px', fontWeight: 600 }}>Necropsy Details</Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Necropsy Date & Time</Typography>
                    <Grid container spacing={3}>
                      <Grid size={6}>
                        <ControlledDatePicker name='necropsy_date' control={control} label='Date' maxDate={dayjs()} />
                      </Grid>
                      <Grid size={6}>
                        <ControlledTimePicker name='necropsy_time' control={control} label='Time' />
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Necropsy Conducted By</Typography>
                    <UserMultiSelect
                      selectedUsers={conductedByUsers}
                      onChange={setConductedByUsers}
                      label='Search users by name'
                    />
                  </Box>

                  <Divider />

                  <Typography sx={{ ...labelSx, fontSize: '18px', fontWeight: 600 }}>Examination Findings</Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>General Description</Typography>
                    <ControlledTextArea
                      name='general_description'
                      control={control}
                      errors={errors}
                      rows={5}
                      placeholder='Describe the general gross findings, external condition, body condition score...'
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Organ-wise Description of Lesions</Typography>
                    <NecropsyOrganSection organs={organs} onChange={setOrgans} />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography sx={labelSx}>Attachments</Typography>
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
                                onClick={() => handleRemoveExistingAttachment(doc.id || doc.attachment_id)}
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
                      label='Drop files here or click to upload'
                      maxFiles={10}
                      maxFileSize={10 * 1024 * 1024}
                      acceptedFileTypes='images,pdf,documents'
                    />
                  </Box>
                </>
              )}

              <Divider />

              <Typography sx={{ ...labelSx, fontSize: '18px', fontWeight: 600 }}>Cause of Death</Typography>

              {mortalityData?.manner_of_death && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography sx={labelSx}>Suspected Cause of Death</Typography>
                  <Typography
                    sx={{
                      p: 2,
                      bgcolor: theme.palette.customColors?.bodyBg || theme.palette.grey[100],
                      borderRadius: 1,
                      color: theme.palette.text.secondary
                    }}
                  >
                    {mortalityData.manner_of_death}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography sx={labelSx}>Opinion / Death Opinion</Typography>
                <ControlledTextArea
                  name='opinion'
                  control={control}
                  errors={errors}
                  rows={3}
                  placeholder='Enter your professional opinion on the cause of death...'
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography sx={labelSx}>Confirmed Cause & Disposal Method</Typography>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ControlledAutocomplete
                      name='confirmed_cause_of_death'
                      control={control}
                      errors={errors}
                      label='Confirmed Cause After Necropsy'
                      options={mannerOfDeathOptions}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ControlledAutocomplete
                      name='disposal_method'
                      control={control}
                      errors={errors}
                      label='Disposal Method'
                      options={disposalOptions}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Typography sx={{ ...labelSx, fontSize: '18px', fontWeight: 600 }}>Additional Information</Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography sx={labelSx}>Biological Tests Done (if any)</Typography>
                <ControlledTextArea
                  name='biological_test'
                  control={control}
                  errors={errors}
                  rows={3}
                  placeholder='Enter any biological tests performed...'
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography sx={labelSx}>Notes (Optional)</Typography>
                <ControlledTextArea
                  name='additional_notes'
                  control={control}
                  errors={errors}
                  rows={4}
                  placeholder='Enter any additional notes or observations...'
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </form>

      <BottomActionBar
        onCancel={() => router.push('/necropsy')}
        onSubmit={handleSubmit(onSubmit)}
        loading={submitLoading}
        disabled={isAnyLoading}
        cancelLabel='Cancel'
        submitLabel='Submit'
        showCancel={!isCompletedEdit}
        cancelBtnStyle={{
          color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.text.primary,
          borderColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.divider
        }}
        submitBtnStyle={{
          backgroundColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main
        }}
      >
        {isDraftEdit && (
          <Button
            variant='outlined'
            color='error'
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isAnyLoading}
            sx={{ fontWeight: 600, minHeight: '56px', minWidth: '160px', borderRadius: 0.5 }}
          >
            Delete Draft
          </Button>
        )}
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
            {draftLoading ? <CircularProgress size={22} /> : 'Save as Draft'}
          </Button>
        )}
      </BottomActionBar>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '18px', pb: 1 }}>Delete Draft</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>
            Are you sure you want to delete this draft? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 5, pt: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteDraft}
            color='error'
            variant='contained'
            disabled={deleteLoading}
            sx={{ fontWeight: 600 }}
          >
            {deleteLoading ? <CircularProgress size={22} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        dialogBoxStatus={unsuitableDialogOpen}
        onClose={handleCancelUnsuitable}
        icon='mdi:alert-circle-outline'
        title='Mark as Unsuitable?'
        description='Are you sure you want to mark this carcass as unsuitable for necropsy? You will need to provide a reason.'
        cancelText='No'
        ConfirmationText='Yes'
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
          <Typography sx={{ fontWeight: 600, fontSize: '18px' }}>Update Age</Typography>
          <IconButton size='small' onClick={handleCancelAgeDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
              <Grid size={4}>
                <TextField
                  fullWidth
                  label='Years'
                  type='number'
                  value={ageInputs.years}
                  onChange={e => handleAgeInputChange('years', e.target.value)}
                  inputProps={{ min: 0, max: 999 }}
                  size='small'
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  fullWidth
                  label='Months'
                  type='number'
                  value={ageInputs.months}
                  onChange={e => handleAgeInputChange('months', e.target.value)}
                  inputProps={{ min: 0, max: 11 }}
                  size='small'
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  fullWidth
                  label='Days'
                  type='number'
                  value={ageInputs.days}
                  onChange={e => handleAgeInputChange('days', e.target.value)}
                  inputProps={{ min: 0, max: 30 }}
                  size='small'
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
                  DOB: {calculateDOBFromInputs().format('DD MMM YYYY')}
                </Typography>
              </Box>
            )}

            <FormControlLabel
              control={
                <Checkbox checked={dialogApproxAge} onChange={e => setDialogApproxAge(e.target.checked)} size='small' />
              }
              label='Mark as approximate'
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
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleApplyAge}
            sx={{ fontWeight: 600 }}
            disabled={!ageInputs.years && !ageInputs.months && !ageInputs.days}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default NecropsyReportForm
