'use client'

import { Card, Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { Theme, useTheme } from '@mui/material/styles'
import { useEffect, useState, useCallback, useRef, Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { debounce } from 'lodash'
import { getHospitalStaff } from 'src/lib/api/hospital/staff'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import Utility from 'src/utility'

import BasicDetails from './Anesthesia/BasicDetails'
import { getAssesmentList, getAnesthesiaDetail } from 'src/lib/api/hospital/anesthesia'
import Toaster from 'src/components/Toaster'
import { addAnesthesia } from 'src/lib/api/hospital/anesthesia'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import { HospitalStaffListResponse } from 'src/types/hospital/api/doctorsAndStaffs'
import { PatientDetailsData } from 'src/types/hospital/models'
import { DoctorDetails } from 'src/types/hospital/models/anesthesia'
import { Id } from 'src/types/compliance'
import { AnesthesiaPersonRef, AnesthesiaRecordSelection } from '../shared/AddSurgeryRecord'

const FORM_ID = 'add-anesthesia-record-forsm'

const getSafeString = (value: any) => {
  if (value === undefined || value === null) return ''

  return String(value)
}

interface AnesthesiaBasicDetailsFormData {
  location: string
  anaesthesia_datetime: string
  anesthesia_datetime?: string
  estimated_time_required: string | number
  estimated_time_unit: string
  veterinarian_id: DoctorDetails[]
  anesthetist_id: DoctorDetails[]
  selected: string[]
  custom: string[]
  newPurpose: string
  notes: string
}

interface AnesthesiaFormData {
  basicDetails: AnesthesiaBasicDetailsFormData
}

export interface PurposeOption {
  id?: string | number
  name?: string
}

interface AnesthesiaEditDetail {
  veterinarians?: DoctorDetails[]
  anesthetists?: DoctorDetails[]
  purpose?: PurposeOption[]
  anaesthesia_datetime?: string
  anesthesia_datetime?: string
  location?: string
  estimated_time_required?: string | number
  estimated_time_unit?: string
  notes?: string
  anaesthesia_code?: string
  anesthesia_code?: string
  code?: string
}

const normalizePurposeName = (value: string) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

const mapDoctorFromDetail = (item: DoctorDetails): DoctorDetails | null => {
  const id = item?.id || item?.user_id || item?.doctor_id || item?.value
  const name = item?.full_name || item?.user_full_name || item?.name || item?.label

  if (!id || !name) return null

  return {
    user_id: item?.user_id ?? id,
    full_name: String(name),
    id: String(id),
    name: String(name),
    role_name: item?.role_name
  }
}

interface AddAnesthesiaRecordDrawerProps {
  openAddanesthesiaDrawer: boolean
  setOpenAddanesthesiaDrawer: (val: boolean) => void
  editRecordId?: string
  hospitalCaseId?: Id
  medicalRecordId?: Id
  vetOptions?: DoctorDetails[]
  anesthetistOptions?: DoctorDetails[]
  patientData?: PatientDetailsData | null
  animalInfoData?: PatientDetailsData | null
  onSuccess?: (record:  AnesthesiaRecordSelection) => void
  loadMoreDoctors?: () => void
  loadingDoctors?: boolean
  defaultLocation?: string
}

const AddanesthesiaRecordDrawer = ({
  openAddanesthesiaDrawer,
  setOpenAddanesthesiaDrawer,
  editRecordId = '',
  hospitalCaseId = '',
  medicalRecordId = '',
  vetOptions = [],
  anesthetistOptions = [],
  patientData = null,
  animalInfoData = null,
  onSuccess = () => {},
  loadMoreDoctors = () => {},
  loadingDoctors = false,
  defaultLocation = ''
}: AddAnesthesiaRecordDrawerProps) => {
  const { t } = useTranslation()
  const theme: Theme = useTheme()

  const [purposeOptions, setPurposeOptions] = useState<PurposeOption[]>([])
  const [vetDoctors, setVetDoctors] = useState<DoctorDetails[]>([])
  const [anesthetistDoctors, setAnesthetistDoctors] = useState<DoctorDetails[]>([])
  const [masterVetDoctors, setMasterVetDoctors] = useState<DoctorDetails[]>([])
  const [masterAnesthetistDoctors, setMasterAnesthetistDoctors] = useState<DoctorDetails[]>([])
  const [loadingVet, setLoadingVet] = useState<boolean>(false)
  const [loadingAnesthetist, setLoadingAnesthetist] = useState<boolean>(false)
  const [editRecordData, setEditRecordData] = useState<AnesthesiaEditDetail | null>(null)

  const vetSearchTimerRef = useRef<any>(null)
  const anesthetistSearchTimerRef = useRef<any>(null)
  const isEditMode = Boolean(editRecordId)

  const defaultValues: AnesthesiaFormData = {
    basicDetails: {
      location: '',
      anaesthesia_datetime: '',
      estimated_time_required: '',
      estimated_time_unit: 'hr',
      veterinarian_id: [],
      anesthetist_id: [],
      selected: [],
      custom: [],
      newPurpose: '',
      notes: ''
    }
  }

  const anesthesiaSchema = yup.object().shape({
    basicDetails: yup.object().shape({
      location: yup.string().trim().required(t('hospital_module.location_is_required')),
      anaesthesia_datetime: yup.string().required(t('hospital_module.anesthesia_datetime_required')),
      estimated_time_required: yup
        .string()
        .test('required', t('estimated_time_required_label'), (value: any) => Boolean(value?.toString().trim())),
      estimated_time_unit: yup.string().trim().required(t('time_unit_required')),
      veterinarian_id: yup.array().min(1, t('select_veterinarian')),
      anesthetist_id: yup.array().min(1, t('hospital_module.select_at_least_one_anesthetist')),
      selected: yup.array().of(yup.string()).default([]).test('purpose-required', t('hospital_module.select_at_least_one_purpose'), function (val: any) {
        const { custom, newPurpose } = this.parent
        const hasSelected = val && val.length > 0
        const hasCustom = custom && custom.some((v: any) => v && v.trim() !== '')
        const hasCurrentTyping = newPurpose && newPurpose.trim() !== ''

        return hasSelected || hasCustom || hasCurrentTyping
      }),
      custom: yup.array().of(yup.string()).default([])
    })
  })

  useEffect(() => {
    if (vetOptions?.length > 0) {
      setVetDoctors(vetOptions)
      setMasterVetDoctors(vetOptions)
    }
  }, [vetOptions])

  useEffect(() => {
    if (anesthetistOptions?.length > 0) {
      setAnesthetistDoctors(anesthetistOptions)
      setMasterAnesthetistDoctors(anesthetistOptions)
    }
  }, [anesthetistOptions])

  const handleVetSearch = useCallback(
    debounce(async (search: string, selectedItems: any[] = []) => {
      if (!hospitalCaseId) return
      if (vetSearchTimerRef.current) clearTimeout(vetSearchTimerRef.current)

      if (!search.trim()) {
        setVetDoctors(masterVetDoctors)

        return
      }

      try {
        setLoadingVet(true)
        const params = {
          hospital_id: patientData?.hospital_id,
          page_no: 1,
          limit: 10,
          q: search
        }
        const res: HospitalStaffListResponse = await getHospitalStaff({ params })
        const mapped: DoctorDetails[] = (res?.data?.records || []).map((item) => ({
          id: String(item.user_id),
          name: item.user_full_name || '',
          default_icon: item.user_profile_pic,
          role_name: item.role_name
        }))

        setVetDoctors(mapped)

        vetSearchTimerRef.current = setTimeout(() => {
          setMasterVetDoctors((prevMaster) => {
            const merged = [...prevMaster, ...mapped]
            const unique = Array.from(new Map(merged.map((item: DoctorDetails) => [String(item.id), item])).values())
            setVetDoctors(unique)

            return unique
          })
        }, 10000)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingVet(false)
      }
    }, 500),
    [hospitalCaseId, masterVetDoctors, patientData?.hospital_id]
  )

  const handleAnesthetistSearch = useCallback(
    debounce(async (search: string, selectedItems: any[] = []) => {
      if (!hospitalCaseId) return
      if (anesthetistSearchTimerRef.current) clearTimeout(anesthetistSearchTimerRef.current)

      if (!search.trim()) {
        setAnesthetistDoctors(masterAnesthetistDoctors)

        return
      }

      try {
        setLoadingAnesthetist(true)
        const params = {
          hospital_id: patientData?.hospital_id,
          page_no: 1,
          limit: 10,
          q: search
        }
        const res = await getHospitalStaff({ params })
        const mapped: DoctorDetails[] = (res?.data?.records || []).map((item) => ({
          id: String(item.user_id),
          name: item.user_full_name || '',
          default_icon: item.user_profile_pic,
          role_name: item.role_name
        }))

        setAnesthetistDoctors(mapped)

        anesthetistSearchTimerRef.current = setTimeout(() => {
          setMasterAnesthetistDoctors((prevMaster) => {
            const merged = [...prevMaster, ...mapped]
            const unique = Array.from(new Map(merged.map((item: DoctorDetails) => [String(item.id), item])).values())
            setAnesthetistDoctors(unique)

            return unique
          })
        }, 10000)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingAnesthetist(false)
      }
    }, 500),
    [hospitalCaseId, masterAnesthetistDoctors, patientData?.hospital_id]
  )

  const handleVetSelect = useCallback(
    (selectedItem: DoctorDetails) => {
      if (vetSearchTimerRef.current) clearTimeout(vetSearchTimerRef.current)
      setMasterVetDoctors((prevMaster: DoctorDetails[]) => {
        const merged = [...prevMaster, selectedItem]
        const unique = Array.from(new Map(merged.map((item: DoctorDetails) => [String(item.id), item])).values())
        setVetDoctors(unique)

        return unique
      })
    },
    [vetSearchTimerRef]
  )

  const handleAnesthetistSelect = useCallback(
    (selectedItem: DoctorDetails) => {
      if (anesthetistSearchTimerRef.current) clearTimeout(anesthetistSearchTimerRef.current)
      setMasterAnesthetistDoctors((prevMaster: DoctorDetails[]) => {
        const merged = [...prevMaster, selectedItem]
        const unique = Array.from(new Map(merged.map((item: DoctorDetails) => [String(item.id), item])).values())
        setAnesthetistDoctors(unique)

        return unique
      })
    },
    [anesthetistSearchTimerRef]
  )
  const holdingLocation = [patientData?.bed_name, patientData?.room_name].filter(Boolean).join(', ')
  const chiefVeterinarian = patientData?.admitted_by_full_name || patientData?.attend_by_full_name
  const animalImage = getSafeString(patientData?.animal_detail?.default_icon)
  const animalName = getSafeString(
    patientData?.animal_detail?.common_name || patientData?.animal_detail?.default_common_name
  )
  const animalScientificName = getSafeString(
    patientData?.animal_detail?.complete_name || patientData?.animal_detail?.scientific_name
  )
  const animalAge = getSafeString(patientData?.animal_detail?.age)
  const animalSex = getSafeString(patientData?.animal_detail?.sex)

  const methods = useForm<AnesthesiaFormData>({
    defaultValues,
    resolver: yupResolver(anesthesiaSchema) as any,
    mode: 'onChange'
  })

  const {
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting }
  } = methods

  const buildPurposeSelection = useCallback(
    (purposeList: PurposeOption[] | null | undefined) => {
      const optionById = new Map<string, string>()
      const optionByName = new Map<string, string>()

      ;(purposeOptions || []).forEach((item: PurposeOption) => {
        if (!item?.id || !item?.name) return
        optionById.set(String(item.id), String(item.id))
        optionByName.set(normalizePurposeName(item.name), String(item.id))
      })

      const selected: string[] = []
      const custom: string[] = []

      ;(Array.isArray(purposeList) ? purposeList : []).forEach((item: PurposeOption) => {
        const rawId = item?.id !== undefined && item?.id !== null ? String(item.id) : ''
        const rawName = String(item?.name || '').trim()

        if (rawId && optionById.has(rawId)) {
          selected.push(rawId)
          return
        }

        if (rawName && optionByName.has(normalizePurposeName(rawName))) {
          selected.push(optionByName.get(normalizePurposeName(rawName)) as string)
          return
        }

        if (rawName) {
          custom.push(rawName)
        }
      })

      return {
        selected: Array.from(new Set(selected)),
        custom: Array.from(new Set(custom))
      }
    },
    [purposeOptions]
  )

  const buildEditFormValues = useCallback(
    (detail: AnesthesiaEditDetail | null) => {
      const veterinarians = (detail?.veterinarians || [])
        .map(mapDoctorFromDetail)
        .filter((d): d is DoctorDetails => d !== null)
      const anesthetists = (detail?.anesthetists || [])
        .map(mapDoctorFromDetail)
        .filter((d): d is DoctorDetails => d !== null)
      const { selected, custom } = buildPurposeSelection(detail?.purpose)
      const detailDateTimeValue = detail?.anaesthesia_datetime || detail?.anesthesia_datetime || ''
      const anaesthesiaDateTimeValue = detailDateTimeValue ? Utility.convertUTCToLocal(detailDateTimeValue) : ''

      return {
        veterinarians,
        anesthetists,
        values: {
          basicDetails: {
            location: detail?.location || '',
            anaesthesia_datetime: anaesthesiaDateTimeValue,
            estimated_time_required: detail?.estimated_time_required || '',
            estimated_time_unit: detail?.estimated_time_unit || 'hr',
            veterinarian_id: veterinarians,
            anesthetist_id: anesthetists,
            selected,
            custom,
            newPurpose: '',
            notes: detail?.notes || ''
          }
        }
      }
    },
    [buildPurposeSelection]
  )

  const mergeDoctors = useCallback((setter: Dispatch<SetStateAction<DoctorDetails[]>>, entries: DoctorDetails[] = []) => {
    setter((prev: DoctorDetails[]) => {
      const merged = [...prev, ...entries].filter(Boolean)

      return Array.from(new Map(merged.map((item: DoctorDetails) => [String(item.id), item])).values())
    })
  }, [])

  useEffect(() => {
    if (!openAddanesthesiaDrawer || !isEditMode) return

    let isMounted = true

    const fetchAnesthesiaDetail = async () => {
      try {
        const response = await getAnesthesiaDetail(editRecordId)
        const detail = response?.data || response

        if (!isMounted) return

        setEditRecordData(detail || null)
      } catch (error) {
        const err = error as Error
        if (!isMounted) return
        console.error('Failed to fetch anesthesia detail:', error)
        Toaster({ type: 'error', message: err?.message || t('hospital_module.failed_to_load_anesthesia_record') })
      }
    }

    fetchAnesthesiaDetail()

    return () => {
      isMounted = false
    }
  }, [openAddanesthesiaDrawer, isEditMode, editRecordId])

  useEffect(() => {
    if (!openAddanesthesiaDrawer || !isEditMode || !editRecordData) return

    const { veterinarians, anesthetists, values } = buildEditFormValues(editRecordData)

    if (veterinarians.length) {
      mergeDoctors(setVetDoctors, veterinarians)
      mergeDoctors(setMasterVetDoctors, veterinarians)
    }

    if (anesthetists.length) {
      mergeDoctors(setAnesthetistDoctors, anesthetists)
      mergeDoctors(setMasterAnesthetistDoctors, anesthetists)
    }

    reset(values)
  }, [openAddanesthesiaDrawer, isEditMode, editRecordData, buildEditFormValues, mergeDoctors, reset])

  const handleResetForm = useCallback(() => {
    if (isEditMode && editRecordData) {
      reset(buildEditFormValues(editRecordData).values)

      return
    }

    reset({
      ...defaultValues,
      basicDetails: {
        ...defaultValues.basicDetails,
        location: defaultLocation || ''
      }
    })
  }, [isEditMode, editRecordData, buildEditFormValues, reset, defaultLocation])

  const onSubmit = async (data: AnesthesiaFormData) => {
    const formData = new FormData()
    const anaesthesiaDateTime = data.basicDetails.anaesthesia_datetime || data.basicDetails.anesthesia_datetime || ''
    const veterinarianIds = (data?.basicDetails?.veterinarian_id || []).map((v: DoctorDetails) => v.id)
    const anesthetistIds = (data?.basicDetails?.anesthetist_id || []).map((a: DoctorDetails) => a.id)

    formData.append('hospital_case_id', String(hospitalCaseId ?? ''))
    formData.append('medical_record_id', String(medicalRecordId ?? ''))
    if (isEditMode) {
      formData.append('anaesthesia_id', String(editRecordId ?? ''))
    }
    formData.append('location', data.basicDetails.location || '')
    formData.append('anaesthesia_datetime', anaesthesiaDateTime || '')
    formData.append('estimated_time_required', String(data.basicDetails.estimated_time_required ?? ''))
    formData.append('estimated_time_unit', data.basicDetails.estimated_time_unit || '')
    formData.append('veterinarian_id', JSON.stringify(veterinarianIds || []))
    formData.append('anesthetist_id', JSON.stringify(anesthetistIds || []))
    formData.append('notes', data.basicDetails.notes || '')

    const purposePayload = {
      selected: data.basicDetails.selected || [],
      custom: data.basicDetails.custom || []
    }
    formData.append('purpose', JSON.stringify(purposePayload))

    try {
      const response = await addAnesthesia(formData)

      if (response?.status === true || response?.success === true) {
        Toaster({
          type: 'success',
          message: response?.message || (isEditMode ? t('hospital_module.anesthesia_updated_success') : t('hospital_module.anesthesia_added_success'))
        })

        const createdId =
          response?.anaesthesia_id ||
          response?.anesthesia_id ||
          response?.data?.anaesthesia_id ||
          response?.data?.id ||
          editRecordId

        const createdCode =
          response?.anaesthesia_code ||
          response?.anesthesia_code ||
          response?.code ||
          response?.data?.anaesthesia_code ||
          response?.data?.code ||
          editRecordData?.anaesthesia_code ||
          editRecordData?.anesthesia_code ||
          editRecordData?.code

        const mapPeople = (ids: DoctorDetails[], options: DoctorDetails[]): AnesthesiaPersonRef[] => {
          if (!Array.isArray(ids)) return []
          const idSet = new Set(ids.map((val: DoctorDetails) => String(val.id || val)))

          return options
            .filter((opt: DoctorDetails) => idSet.has(String(opt.id)))
            .map((opt: DoctorDetails): AnesthesiaPersonRef => ({ full_name: opt.name || '', id: opt.id ?? '' }))
            .filter((person: AnesthesiaPersonRef) => person.full_name)
        }

        const purposeMap = new Map<string, string>()
        if (Array.isArray(purposeOptions)) {
          purposeOptions.forEach((item: PurposeOption) => {
            if (item?.id && item?.name) purposeMap.set(String(item.id), item.name)
          })
        }

        const selectedPurposes = Array.isArray(data.basicDetails.selected) ? data.basicDetails.selected : []
        const customPurposes = Array.isArray(data.basicDetails.custom) ? data.basicDetails.custom : []

        const purposeList = [
          ...selectedPurposes
            .map((id: string) => purposeMap.get(String(id)) || id)
            .filter(Boolean)
            .map((name: string) => ({ name })),
          ...customPurposes.filter(Boolean).map((name: string) => ({ name }))
        ]

        const newRecord = {
          anaesthesia_id: createdId,
          anesthesia_id: createdId,
          anaesthesia_code: createdCode,
          anesthesia_code: createdCode,
          code: createdCode,
          location: data.basicDetails.location || '',
          anaesthesia_datetime: anaesthesiaDateTime || '',
          anesthesia_datetime: anaesthesiaDateTime || '',
          estimated_time_required: data.basicDetails.estimated_time_required || '',
          estimated_time_unit: data.basicDetails.estimated_time_unit || '',
          veterinarians: mapPeople(data.basicDetails.veterinarian_id, masterVetDoctors),
          anesthetists: mapPeople(data.basicDetails.anesthetist_id, masterAnesthetistDoctors),
          purpose: purposeList,
          notes: data.basicDetails.notes || ''
        }

        onSuccess(newRecord)
        reset(defaultValues)
        setOpenAddanesthesiaDrawer(false)
      } else {
        Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_save_anesthesia') })
      }
    } catch (error: any) {
      console.error('Add anesthesia failed:', error)
      Toaster({ type: 'error', message: error?.message || t('hospital_module.something_went_wrong_please_try_again') })
    }
  }

  useEffect(() => {
    if (!openAddanesthesiaDrawer) {
      reset(defaultValues)
      setEditRecordData(null)
    }
  }, [openAddanesthesiaDrawer, reset])

  // Set default location for new records without resetting other fields
  useEffect(() => {
    if (openAddanesthesiaDrawer && !isEditMode && defaultLocation) {
      // Use a timeout to let other effects set date/time first
      const timer = setTimeout(() => {
        setValue('basicDetails.location', defaultLocation)
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [openAddanesthesiaDrawer, isEditMode, defaultLocation, setValue])

  useEffect(() => {
    const fetchPurposes = async () => {
      try {
        const response = await getAssesmentList({ type: 'purpose' })
        if (response?.success && Array.isArray(response?.data?.records)) {
          setPurposeOptions(
            response.data.records.map((item) => ({
              name: item?.name,
              id: item?.id
            }))
          )
        } else {
          setPurposeOptions([])
        }
      } catch (error) {
        console.error('Failed to load anesthesia purposes', error)
        Toaster({ type: 'error', message: t('hospital_module.failed_to_load_purpose_options') })
        setPurposeOptions([])
      }
    }

    if (openAddanesthesiaDrawer) {
      fetchPurposes()
    }
  }, [openAddanesthesiaDrawer])

  const handleAIDDisplay = () => {
    if (patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value) {
      return patientData?.animal_detail?.local_identifier_value
    } else {
      return patientData?.animal_detail?.animal_id
    }
  }

  return (
    <Drawer
      anchor='right'
      open={openAddanesthesiaDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { maxWidth: '920px', height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: (theme: any) => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', maxHight: '80px' }}>
          <Box component = 'img' src = '/icons/activity_icon.png' sx = {{ width: '30px', height: '30px'}} alt = {t('hospital_module.filter_icon')}/>
          <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {isEditMode ? t('hospital_module.edit_anesthesia') : t('hospital_module.add_anesthesia')}
          </Typography>
        </Box>
        <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setOpenAddanesthesiaDrawer(false)}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <FormProvider {...methods}>
        <Box
          component='form'
          id={FORM_ID}
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
        >
          <Box
            sx={{
              p: '24px',
              backgroundColor: 'background.default',
              flex: 1,
              overflowY: 'auto',
              pb: '125px'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {patientData ? (
                <AnimalInfoCard
                  image={animalImage}
                  name={animalName}
                  scientificName={animalScientificName}
                  age={animalAge}
                  gender={animalSex}
                  additionalFields={[
                    {
                      label:
                        patientData?.animal_detail?.local_identifier_name &&
                        patientData?.animal_detail?.local_identifier_value
                          ? patientData?.animal_detail?.local_identifier_name
                          : t('hospital_module.aid'),
                      value: handleAIDDisplay()
                    },
                    { label: t('hospital_module.health_status'), value: patientData?.health_status || 'stable', isStatusCard: true },
                    { label: t('hospital_module.holding_location'), value: holdingLocation },
                    { label: t('hospital_module.chief_veterinarian'), value: getSafeString(chiefVeterinarian) }
                  ]}
                  backgroundColor={theme.palette.customColors.OnPrimary}
                  isLoading={!patientData}
                />
              ) : (
                <Card
                  sx={{
                    p: '24px',
                    borderRadius: '8px',
                    backgroundColor: theme.palette.primary.contrastText,
                    boxShadow: 'none',
                    mb: 3
                  }}
                >
                  <Box>
                    <Box sx={{ maxWidth: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '8px',
                          backgroundColor: theme.palette.customColors.mdAntzNeutral
                        }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: 1 }}>
                        <Box sx={{ width: '70%', height: '20px', borderRadius: '4px', backgroundColor: '#E0E0E0' }} />
                        <Box sx={{ width: '60%', height: '18px', borderRadius: '4px', backgroundColor: '#E6E6E6' }} />
                        <Box sx={{ width: '50%', height: '18px', borderRadius: '4px', backgroundColor: '#E6E6E6' }} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                      {[1, 2, 3, 4].map((idx: number) => (
                        <Box key={`animal-skeleton-${idx}`} sx={{ minWidth: '120px' }}>
                          <Box
                            sx={{
                              width: '60%',
                              height: '16px',
                              borderRadius: '4px',
                              backgroundColor: '#E6E6E6',
                              mb: 1
                            }}
                          />
                          <Box
                            sx={{
                              width: '80%',
                              height: '18px',
                              borderRadius: '4px',
                              backgroundColor: '#E0E0E0'
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Card>
              )}

              <Card
                sx={{
                  backgroundColor: theme.palette.primary.contrastText,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'none',
                  gap: '24px'
                }}
              >
                <BasicDetails
                  anesthesiaId={editRecordId}
                  vetOptions={vetDoctors}
                  anesthetistOptions={anesthetistDoctors}
                  purposeOptions={purposeOptions}
                  loadMoreDoctors={loadMoreDoctors}
                  loadingDoctors={loadingDoctors}
                  loadingVet={loadingVet}
                  loadingAnesthetist={loadingAnesthetist}
                  handleVetSearch={handleVetSearch}
                  handleAnesthetistSearch={handleAnesthetistSearch}
                  handleVetSelect={handleVetSelect}
                  handleAnesthetistSelect={handleAnesthetistSelect}
                  patientData={patientData}
                  drawerOpen={openAddanesthesiaDrawer}
                />
              </Card>
            </Box>
          </Box>
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 'auto',
              right: 0,
              zIndex: 5,
              backgroundColor: theme.palette.primary.contrastText,
              boxShadow: `0px -8px 12px 0px ${theme.palette.customColors.shadowColor}`,
              height: '108px',
              px: '24px',
              py: '16px',
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              width: ['100%', '920px'],
              maxWidth: '100vw',
              marginLeft: 'auto'
            }}
          >
            <LoadingButton
              onClick={handleResetForm}
              variant='outlined'
              disabled={isSubmitting}
              sx={{
                height: '56px',
                width: '50%',
                borderColor: theme.palette.customColors.Outline,
                borderWidth: '1.5px',
                color: theme.palette.customColors.OnSurfaceVariant,
                fontWeight: 600,
                letterSpacing: 0,
                px: '24px'
              }}
            >
              {t('hospital_module.reset')}
            </LoadingButton>
            <LoadingButton
              type='submit'
              variant='contained'
              loading={isSubmitting}
              sx={{
                height: '56px',
                width: '50%',
                fontWeight: 600,
                letterSpacing: 0,
                px: '24px'
              }}
            >
              {isEditMode ? t('update_upper') : t('save_upper')}
            </LoadingButton>
          </Box>
        </Box>
      </FormProvider>
    </Drawer>
  )
}

export default AddanesthesiaRecordDrawer
