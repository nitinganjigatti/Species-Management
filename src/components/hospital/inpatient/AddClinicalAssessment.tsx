'use client'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Box, Breadcrumbs, Grid, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import ClinicalAssessmentList from 'src/components/hospital/ClinicalAssessment/ClinicalAssessmentList'
import SelectedClinicalAssessment from 'src/components/hospital/ClinicalAssessment/SelectedClinicalAssessment'
import AddClinicalAsmntDrawer from 'src/components/hospital/drawer/AddClinicalAsmntDrawer'
import AddDiagnosisDrawer from 'src/components/hospital/drawer/AddDiagnosisDrawer'
import debounce from 'lodash/debounce'
import {
  addClinicalAssessment,
  checkAnimalStatusByType,
  getDiagnosisList,
  getDiagnosysType
} from 'src/lib/api/hospital/clinicalAssessment'
import Toaster from 'src/components/Toaster'
import { useParams, useSearchParams } from 'next/navigation'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import { useDispatch, useSelector } from 'react-redux'
import { updateState } from 'src/store/slices/hospital/hospitalSlice'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import SelectionTemplatePanel, { SaveMedicalTemplateSection } from './SelectionTemplatePanel'
import { CheckAnimalStatusByTypePayload, CheckAnimalStatusByTypeResponse, GetSymptomClinicalTabPayload, GetSymptomClinicalTabResponse } from 'src/types/hospital/api/Inpatient/symptomClinical'
import { GetClinicalAssessmentListParams, GetClinicalAssessmentListResponse } from 'src/types/hospital/api/Inpatient/clinicalAsmnt'
import { Id } from 'src/types/hospital'
import type { ClinicalAssessmentList as ClinicalAssessmentListItem } from 'src/types/hospital/models/clinicalAssessment'
import type { CheckAnimalStatusByType, GetSymptomClinicalTabList, SymptomsListForAdding } from 'src/types/hospital/models/symptoms'

const PAGE_SIZE = 10
const STORAGE_KEY = 'medical_record_data'

export interface ClinicalAssessmentFormData {
  clinicalAsmnt?: string
  prognosisVal?: string
  chronicVal?: string
  notes?: string
  status?: string
  recordedDateTime?: string
}

export interface ClinicalAssessmentSelection extends SymptomsListForAdding, ClinicalAssessmentFormData {}

interface AddClinicalAssessmentProps {
  from?: string
}

function AddClinicalAssessment({from = 'Inpatient'}: AddClinicalAssessmentProps) {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const router: any = useSafeRouter()
  const routerParams: any = useParams()
  const dispatch = useDispatch()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomsListForAdding[]>([])
  const [temporarilySelected, setTemporarilySelected] = useState<SymptomsListForAdding | null>(null)
  const [clinicalDrawerOpen, setClinicalDrawerOpen] = useState<boolean>(false)
  const [addDiagnosisDrawerOpen, setAddDiagnosisDrawerOpen] = useState<boolean>(false)
  const [clinicalAsmnt, setClinicalAsmnt] = useState<string>('')
  const [prognosisVal, setPrognosisValue] = useState<string>('')
  const [chronicVal, setChronicVal] = useState<string>('No')
  const [notes, setNotes] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [pickerSearch, setPickerSearch] = useState<string>('')
  const [pickerSearchTerm, setPickerSearchTerm] = useState<string>('')
  const [isTabsLoading, setIsTabsLoading] = useState<boolean>(false)
  const [patientData, setPatientData] = useState<any>(null)
  const [patientLoading, setPatientLoading] = useState<boolean>(false)

  // Get id from dynamic route params (App Router) or from router.query fallback
  const id = routerParams?.id || router.query?.id
  const animalId = medicalRecordData?.animal_id
  const medicalRecordId = medicalRecordData?.medical_record_id

  // API states
  const [allAssessments, setAllAssessments] = useState<ClinicalAssessmentListItem[]>([])
  const [tabOptions, setTabOptions] = useState<GetSymptomClinicalTabList[]>([])
  const [currentTab, setCurrentTab] = useState<string>('')
  const [currentTabId, setCurrentTabId] = useState<Id>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [pickerItems, setPickerItems] = useState<SymptomsListForAdding[]>([])
  const [pickerIsLoading, setPickerIsLoading] = useState<boolean>(false)
  const [pickerHasMore, setPickerHasMore] = useState<boolean>(false)
  const [pickerPage, setPickerPage] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false)
  const [isDuplicatesErrorModelOpen, setDuplicatesErrorModelOpen] = useState<boolean>(false)
  const [duplicateAssessments, setDuplicateAssessments] = useState<CheckAnimalStatusByType[]>([])
  const [alreadySelectedIds, setAlreadySelectedIds] = useState<Id[]>([])
  const [templateRefreshToken, setTemplateRefreshToken] = useState<number>(0)

  // Refs for intersection observer
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)

  // Debounced search
  const debouncedSearch = useRef(
    debounce((searchValue: string) => {
      setSearchTerm(searchValue)
      setPage(1)
    }, 500)
  ).current

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  const debouncedPickerSearch = useRef(
    debounce((searchValue: string) => {
      setPickerSearchTerm(searchValue)
      setPickerPage(1)
    }, 500)
  ).current

  useEffect(() => {
    return () => debouncedPickerSearch.cancel()
  }, [debouncedPickerSearch])

  // Fetch diagnosis types (categories)
  const fetchDiagnosisTypes = useCallback(async () => {
    try {
      setIsTabsLoading(true)

      const params: GetSymptomClinicalTabPayload = {
        include_all: 1,
        type: 'diagnosis',
        request_from: 'web_hospital',
        medical_record_id: medicalRecordId || ''
      }
      const res: GetSymptomClinicalTabResponse = await getDiagnosisList(params)
      if (res?.success) {
        const categories = res.data?.result || []
        setTabOptions(categories)
        if (categories.length > 0) {
          setCurrentTab(categories[0]?.category || '')
          setCurrentTabId(categories[0]?.id || '')
        }
      }
    } catch (error) {
      console.error('Error fetching diagnosis types:', error)
      setTabOptions([])
    } finally {
      setIsTabsLoading(false)
    }
  }, [medicalRecordId])

  // Separate loading states for initial load and pagination
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false)

  // Fetch diagnosis list
  const fetchDiagnosisItems = useCallback(async (pageNum: number = 1, search: string = '', categoryId: Id = '') => {
    // Only show full shimmer on initial load (page 1)
    if (pageNum === 1) {
      setIsInitialLoading(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params: GetClinicalAssessmentListParams = {
        page_no: pageNum,
        limit: PAGE_SIZE,
        q: search,
        category_id: categoryId,
        type: 'diagnosis',
        animal_id: animalId
      }

      const res: GetClinicalAssessmentListResponse = await getDiagnosysType(params)

      if (res.success) {
        const newItems = res.data?.result || []
        const total = res.data?.totalRecords || 0

        setTotalCount(total)

        setAllAssessments((prev: ClinicalAssessmentListItem[]) => {
          const updatedList = pageNum === 1 ? newItems : [...prev, ...newItems]
          const canLoadMore = updatedList.length < total
          setHasMore(canLoadMore)

          return updatedList
        })

        if (pageNum === 1 && res.data?.selected_ids) {
          setAlreadySelectedIds(res.data.selected_ids)
        }
      } else {
        throw new Error(res.message || 'Failed to fetch diagnosis list')
      }
    } catch (error) {
      console.error('Error fetching diagnosis items:', error)
      if (pageNum === 1) {
        setAllAssessments([])
      }
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setIsInitialLoading(false)
    }
  }, [])

  const fetchPickerDiagnosisItems = useCallback(async (pageNum: number = 1, search: string = '', categoryId: Id = '') => {
    setPickerIsLoading(true)

    try {
      const params: GetClinicalAssessmentListParams = {
        page_no: pageNum,
        limit: PAGE_SIZE,
        q: search,
        category_id: categoryId,
        type: 'diagnosis',
        animal_id: animalId
      }

      const res: GetClinicalAssessmentListResponse = await getDiagnosysType(params)

      if (res.success) {
        const newItems: SymptomsListForAdding[] = res.data?.result || []
        const total = res.data?.totalRecords || 0

        setPickerItems((prev: SymptomsListForAdding[]) => {
          const merged = pageNum === 1 ? newItems : [...prev, ...newItems]
          const unique = merged.filter(
            (item: SymptomsListForAdding, index: number, arr: SymptomsListForAdding[]) =>
              arr.findIndex((candidate: SymptomsListForAdding) => candidate.id === item.id) === index
          )
          setPickerHasMore(unique.length < total)

          return unique
        })
      } else {
        throw new Error(res.message || 'Failed to fetch diagnosis list')
      }
    } catch (error) {
      console.error('Error fetching picker diagnosis items:', error)
      if (pageNum === 1) {
        setPickerItems([])
      }
      setPickerHasMore(false)
    } finally {
      setPickerIsLoading(false)
    }
  }, [animalId])

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new observer
    const observer = new IntersectionObserver(
      entries => {
        const firstEntry = entries[0]

        // Load more when the trigger element is visible and we're not already loading
        if (firstEntry.isIntersecting && !isLoading && hasMore) {
          setPage((prevPage: number) => {
            const nextPage = prevPage + 1
            fetchDiagnosisItems(nextPage, searchTerm, currentTabId)

            return nextPage
          })
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before reaching the bottom
        threshold: 0.1
      }
    )

    observerRef.current = observer

    // Observe the trigger element
    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current)
    }

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isLoading, hasMore, searchTerm, currentTabId, fetchDiagnosisItems])

  // Fetch data on component mount
  useEffect(() => {
    if (medicalRecordId) fetchDiagnosisTypes()
  }, [fetchDiagnosisTypes, medicalRecordId])

  // Fetch diagnosis items when tab or search changes
  useEffect(() => {
    if (currentTabId) {
      setAllAssessments([])
      setPage(1)
      fetchDiagnosisItems(1, searchTerm, currentTabId)
    }
  }, [currentTabId, searchTerm])

  useEffect(() => {
    if (currentTabId) {
      setPickerItems([])
      setPickerPage(1)
      fetchPickerDiagnosisItems(1, pickerSearchTerm, currentTabId)
    }
  }, [currentTabId, pickerSearchTerm, fetchPickerDiagnosisItems])

  const handleTabChange = (tabValue: string, tabId: string) => {
    setCurrentTab(tabValue)
    setCurrentTabId(tabId)
    setPage(1)
    setIsInitialLoading(true)
    setAllAssessments([])
    setHasMore(false)
  }

  const handleSymptomSelect = (symptom: SymptomsListForAdding) => {
    setTemporarilySelected(symptom)
    setClinicalDrawerOpen(true)
  }

  const addSymptomDetails = (details: ClinicalAssessmentSelection) => {
    if (temporarilySelected?.id && selectedSymptoms.some((s: SymptomsListForAdding) => s.id === temporarilySelected.id)) {
      setSelectedSymptoms((prev: SymptomsListForAdding[]) =>
        prev.map((symptom: SymptomsListForAdding) =>
          symptom.id === temporarilySelected.id
            ? {
                ...symptom,
                ...details,
                chronicVal: details.clinicalAsmnt === 'Tentative' ? 'No' : details.chronicVal,
                prognosisVal: details.clinicalAsmnt === 'Tentative' ? '' : details.prognosisVal,
                recordedDateTime: details.recordedDateTime
              }
            : { ...symptom, recordedDateTime: details.recordedDateTime }
        )
      )
    } else {
      setSelectedSymptoms((prev: SymptomsListForAdding[]) => [...prev, { ...temporarilySelected, ...details }])
    }

    setTemporarilySelected(null)
    setClinicalDrawerOpen(false)

    setClinicalAsmnt('')
    setPrognosisValue('')
    setChronicVal('No')
    setNotes('')
    setStatus('')
  }

  const cancelSymptomSelection = () => {
    setTemporarilySelected(null)
    setClinicalDrawerOpen(false)

    setClinicalAsmnt('')
    setPrognosisValue('')
    setChronicVal('No')
    setNotes('')
    setStatus('')
  }

  const removeSymptom = (symptom: SymptomsListForAdding) => {
    setSelectedSymptoms((prev: SymptomsListForAdding[]) => prev.filter((s: SymptomsListForAdding) => s.id !== symptom?.id))
  }

  const availableSymptoms = allAssessments?.filter(
    (symptom: ClinicalAssessmentListItem) => !selectedSymptoms.some((s: SymptomsListForAdding) => s.id === symptom.id) && temporarilySelected?.id !== symptom.id
  )

  const handleTemplatePickerSearchChange = (value: string) => {
    setPickerSearch(value)
    debouncedPickerSearch(value)
  }

  const handleTemplatePickerLoadMore = useCallback(() => {
    if (pickerIsLoading || !pickerHasMore) return

    const nextPage = pickerPage + 1
    setPickerPage(nextPage)
    fetchPickerDiagnosisItems(nextPage, pickerSearchTerm, currentTabId)
  }, [currentTabId, fetchPickerDiagnosisItems, pickerHasMore, pickerIsLoading, pickerPage, pickerSearchTerm])

  const checkDuplicateAssessments = async () => {
    try {
      const payload: CheckAnimalStatusByTypePayload = {
        type: 'diagnosis',
        animal_ids: JSON.stringify([Number(patientData?.animal_detail?.animal_id)]),
        master_ids: JSON.stringify(selectedSymptoms.map((s: any) => s.id))
      }
      const response: any = await checkAnimalStatusByType(payload)

      if (response?.success) {
        setDuplicateAssessments(response?.data)

        return response?.data || []
      } else {
        return []
      }
    } catch (error) {
      console.error('Error checking animal status:', error)
    }
  }

  const handleAddAssessment = async () => {
    setIsSubmitLoading(true)
    const submittableSymptoms = selectedSymptoms.filter((symptom: SymptomsListForAdding) => !alreadySelectedIds.includes(symptom?.id ?? ''))

    if (selectedSymptoms.length === 0) {
      Toaster({ type: 'error', message: t('hospital_module.select_at_least_one_assessment') })
      setIsSubmitLoading(false)

      return
    }

    if (submittableSymptoms.length === 0) {
      Toaster({ type: 'error', message: t('hospital_module.all_assessments_already_prescribed') })
      setIsSubmitLoading(false)

      return
    }

    const duplicatesData: CheckAnimalStatusByTypeResponse = await checkAnimalStatusByType({
      type: 'diagnosis',
      animal_ids: JSON.stringify([Number(patientData?.animal_detail?.animal_id)]),
      master_ids: JSON.stringify(submittableSymptoms.map((s: SymptomsListForAdding) => s.id))
    })

    if (duplicatesData?.success && (duplicatesData?.data?.length ?? 0) > 0) {
      setDuplicatesErrorModelOpen(true)
      setDuplicateAssessments(duplicatesData?.data || [])
      setIsSubmitLoading(false)

      return
    }

    const diagnosis = submittableSymptoms.map((symptom: ClinicalAssessmentSelection) => ({
      id: symptom?.id,
      name: symptom?.name,
      additional_info: {
        status: symptom?.status?.toLowerCase() || 'active',
        clinical_assessment: symptom.clinicalAsmnt?.toLowerCase() || '',
        note: symptom?.notes || '',
        isChronic: symptom?.chronicVal === 'Yes',
        prognosis: symptom?.prognosisVal?.toLowerCase() || '',
        notes: symptom?.notes || '',
        recorded_date_time: symptom?.recordedDateTime,
        active_at: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .replace('T', ' ')
          .substring(0, 19),
        closed_at: null
      }
    }))

    const payload = {
      medical_record_id: medicalRecordId,
      diagnosis: JSON.stringify(diagnosis),
      hospital_case_id: id,
      animal_id: animalId
    }

    try {
      const response = await addClinicalAssessment(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('hospital_module.assessment_created_successfully') })
        router.back()
      } else {
        Toaster({ type: 'error', message: response?.message || t('hospital_module.something_went_wrong') })
      }
    } catch (error) {
      console.error('Submit Error:', error)
      Toaster({ type: 'error', message: (error as Error)?.message || t('hospital_module.an_unexpected_error_occurred') })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleAssessmentCancel = () => {
    router.back()
  }

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const breadcrumbs = useMemo(
    () => (
      <DynamicBreadcrumbs
        pageItems={[
            { title: t('navigation.hospital') },
            { title: t('hospital_module.patients') },
            { title: from },
            { title: t('hospital_module.details'),onClick: handleBack},
            { title: t('hospital_module.add_clinical_assessment')}
          ]}
      />
    ),
    [handleBack, t]
  )

  const getPatientInfo = async () => {
    setPatientLoading(true)
    try {
      await getPatientDetails(id).then((res: any) => {
        if (res?.success === true) {
          dispatch(updateState({
            key: STORAGE_KEY,
            value: {
              ...medicalRecordData,
              animal_id: res.data?.animal_detail?.animal_id,
              medical_record_id: res.data?.medical_record_id,
              animal_admitted_date: res.data?.admitted_at
            }
          }))
          setPatientData(res?.data)
          setPatientLoading(false)
        } else {
          setPatientData(null)
          setPatientLoading(false)
        }
      })
    } catch (error) {
      console.error('Cannot Fetch Patient Details', error)
      setPatientLoading(false)
    }
  }

  const handleAssessmentEdit = (symptom: ClinicalAssessmentSelection) => {
    setClinicalAsmnt(symptom?.clinicalAsmnt || '')
    setPrognosisValue(symptom?.prognosisVal || '')
    setChronicVal(symptom?.chronicVal || 'No')
    setNotes(symptom?.notes || '')
    setStatus(symptom?.status || '')

    setTemporarilySelected(symptom)
    setClinicalDrawerOpen(true)
  }

  const handleAddNewClick = () => {
    setAddDiagnosisDrawerOpen(true)
  }

  const handleDiagnosisAdded = async (assessment: SymptomsListForAdding) => {
    handleSymptomSelect(assessment)

    // Refetch categories and diagnosis items
    await fetchDiagnosisTypes()
    if (currentTabId) {
      setAllAssessments([])
      setPage(1)
      await fetchDiagnosisItems(1, searchTerm, currentTabId)
    }
  }

  useEffect(() => {
    if (id) {
      getPatientInfo()
    }
  }, [id])

  const handleAIDDisplay = () => {
    if (patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value) {
      return patientData?.animal_detail?.local_identifier_value
    } else {
      return patientData?.animal_detail?.animal_id
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {breadcrumbs}
      <AnimalInfoCard
        image={patientData?.animal_detail?.default_icon}
        name={patientData?.animal_detail?.common_name}
        scientificName={patientData?.animal_detail?.complete_name}
        age={`${patientData?.animal_detail?.age}`}
        gender={`${patientData?.animal_detail?.sex}`}
        additionalFields={[
          {
            label:
              patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value
                ? patientData?.animal_detail?.local_identifier_name
                : t('hospital_module.aid'),
            value: handleAIDDisplay()
          },
          { label: t('hospital_module.health_status'), value: patientData?.health_status || 'stable', isStatusCard: true },

          // { label: 'Admitted days', value: patientData?.admitted_for_day },
          { label: t('hospital_module.holding_location'), value: `${patientData?.bed_name}, ${patientData?.room_name}` },
          { label: t('hospital_module.chief_veterinarian'), value: patientData?.attend_by_full_name }
        ]}
        isLoading={patientLoading}
        backgroundColor={theme.palette.customColors.OnPrimary}
      />

      <Grid
        container
        spacing={5}
        sx={{ mt: 5, mb: 8, background: theme.palette.common.white, px: 6, py: 4, borderRadius: '8px' }}
      >
        <Grid size={{ xs: 12 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t('hospital_module.add_clinical_assessment')}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <ClinicalAssessmentList
            symptoms={availableSymptoms}
            temporarilySelected={temporarilySelected}
            selectedSymptoms={selectedSymptoms}
            onSelect={handleSymptomSelect}
            handleTabChange={handleTabChange}
            currentTab={currentTab}
            tabOptions={tabOptions}
            searchTerm={localSearch}
            setSearchTerm={(value: string) => {
              setLocalSearch(value)
              debouncedSearch(value)
            }}
            isLoading={isLoading}
            hasMore={hasMore}
            loadMoreTriggerRef={loadMoreTriggerRef}
            totalCount={totalCount}
            isTabsLoading={isTabsLoading}
            isListLoading={isLoading}
            isInitialLoading={isInitialLoading}
            handleAddNewClick={handleAddNewClick}
            {...({ alreadySelectedIds: alreadySelectedIds } as any)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <SelectionTemplatePanel
              templateType='diagnosis'
              selectedItems={selectedSymptoms}
              availableItems={pickerItems}
              onApplyTemplate={setSelectedSymptoms}
              templateLabel={(t('hospital_module.clinical_assessment_template') as string)}
              mapTemplateItem={(item: SymptomsListForAdding) => ({
                id: item?.id,
                name: item?.name,
                clinicalAsmnt: 'Tentative',
                prognosisVal: '',
                chronicVal: 'No',
                notes: '',
                status: 'active'
              })}
              pickerSearchValue={pickerSearch}
              onPickerSearchChange={handleTemplatePickerSearchChange}
              onPickerLoadMore={handleTemplatePickerLoadMore}
              pickerLoading={pickerIsLoading}
              pickerHasMore={pickerHasMore}
              refreshToken={templateRefreshToken}
              onTemplatesChanged={() => setTemplateRefreshToken((prev: number) => prev + 1)}
            />
            <SelectedClinicalAssessment
              selected={selectedSymptoms}
              onEdit={handleAssessmentEdit}
              onRemove={removeSymptom}
              clinicalAsmnt={clinicalAsmnt}
              {...({
                alreadySelectedIds: alreadySelectedIds,
                footer: (
                  <SaveMedicalTemplateSection
                    templateType='diagnosis'
                    selectedItems={selectedSymptoms}
                    templateLabel={(t('hospital_module.clinical_assessment_template') as string)}
                    itemLabel={(t('hospital_module.clinical_assessments') as string)}
                    refreshToken={templateRefreshToken}
                    onTemplateSaved={() => setTemplateRefreshToken((prev: number) => prev + 1)}
                  />
                )
              } as any)}
            />
          </Box>
        </Grid>
      </Grid>
      <Box>
        <BottomActionBar
          {...({
            submitLabel: t('add'),
            cancelLabel: t('cancel'),
            onSubmit: handleAddAssessment,
            loading: isSubmitLoading,
            disabled: isSubmitLoading,
            cancelBtnStyle: {
              borderColor: theme.palette.customColors.OnSurfaceVariant,
              color: theme.palette.customColors.OnSurfaceVariant,
              borderRadius: 0.5,
              minHeight: '50px',
              minWidth: '200px'
            },
            submitBtnStyle: {
              backgroundColor: theme.palette.primary.main,
              borderRadius: 0.5,
              minWidth: '200px',
              minHeight: '50px'
            },
            onCancel: handleAssessmentCancel
          } as any)}
        >{undefined}</BottomActionBar>
      </Box>

      <ConfirmationDialog
        dialogBoxStatus={isDuplicatesErrorModelOpen}
        title={`${t('hospital_module.clinical_assessment')}${duplicateAssessments?.length > 1 ? 's' : ''} ${t('hospital_module.already_exists')}`}
        description={`${t('hospital_module.duplicate_clinical_assessment')}: ${duplicateAssessments?.map((item: CheckAnimalStatusByType) => item?.diagnosis)?.join(', ')}`}
        additionalDescription={t('hospital_module.choose_different_assessment')}
        confirmBtnStyle={{ background: theme.palette.customColors.primary, py: 3 }}
        image={'/images/warning-icon.svg'}
        imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
        confirmAction={() => {
          setDuplicatesErrorModelOpen(false)
          setIsSubmitLoading(false)
        }}
        ConfirmationText={t('ok')}
        allowCancel={false}
      />

      {temporarilySelected && (
        <AddClinicalAsmntDrawer
          open={clinicalDrawerOpen}
          onClose={cancelSymptomSelection}
          selectedSymptom={temporarilySelected}
          clinicalAsmnt={clinicalAsmnt}
          setClinicalAsmnt={setClinicalAsmnt}
          setPrognosisValue={setPrognosisValue}
          prognosisVal={prognosisVal}
          setChronicVal={setChronicVal}
          chronicVal={chronicVal}
          notes={notes}
          status={status}
          setStatus={setStatus}
          setNotes={setNotes}
          onSave={addSymptomDetails}
          {...({
            isSubmitLoading: isSubmitLoading,
            admittedDate: patientData?.admitted_at,
            dischargedDate: patientData?.discharge_at,
            isDischarged: patientData?.status === 'discharge'
          } as any)}
        />
      )}

      {addDiagnosisDrawerOpen && (
        <AddDiagnosisDrawer
          open={addDiagnosisDrawerOpen}
          onClose={() => setAddDiagnosisDrawerOpen(false)}
          onSuccess={handleDiagnosisAdded}
          categoryOptions={tabOptions}
          medicalRecordId={medicalRecordId}
        />
      )}
    </Box>
  )
}

export default AddClinicalAssessment
