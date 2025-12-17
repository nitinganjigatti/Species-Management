import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Box, Breadcrumbs, Grid, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
import ClinicalAssessmentList from 'src/components/hospital/ClinicalAssessment/ClinicalAssessmentList'
import SelectedClinicalAssessment from 'src/components/hospital/ClinicalAssessment/SelectedClinicalAssessment'
import AddClinicalAsmntDrawer from 'src/components/hospital/drawer/AddClinicalAsmntDrawer'
import debounce from 'lodash/debounce'
import { addClinicalAssessment, getDiagnosisList, getDiagnosysType } from 'src/lib/api/hospital/clinicalAssessment'
import Toaster from 'src/components/Toaster'
import { useRouter } from 'next/router'
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import BottomActionBar from 'src/views/utility/BottomActionBar'

const PAGE_SIZE = 10
const STORAGE_KEY = 'medical_record_data'

function AddClinicalAssessmentPage() {
  const theme = useTheme()
  const router = useRouter()
  const { data, updateState } = useDynamicStateContext()
  const medicalRecordData = data[STORAGE_KEY] || {}
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [temporarilySelected, setTemporarilySelected] = useState(null)
  const [clinicalDrawerOpen, setClinicalDrawerOpen] = useState(false)
  const [clinicalAsmnt, setClinicalAsmnt] = useState('')
  const [prognosisVal, setPrognosisValue] = useState('')
  const [chronicVal, setChronicVal] = useState('No')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isTabsLoading, setIsTabsLoading] = useState(false)
  const [patientData, setPatientData] = useState(null)
  const [patientLoading, setPatientLoading] = useState(false)

  const { id } = router.query
  const animalId = medicalRecordData?.animal_id
  const medicalRecordId = medicalRecordData?.medical_record_id

  // API states
  const [allAssessments, setAllAssessments] = useState([])
  const [tabOptions, setTabOptions] = useState([])
  const [currentTab, setCurrentTab] = useState('')
  const [currentTabId, setCurrentTabId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  // Refs for intersection observer
  const observerRef = useRef(null)
  const loadMoreTriggerRef = useRef(null)

  // Debounced search
  const debouncedSearch = useRef(
    debounce(searchValue => {
      setSearchTerm(searchValue)
      setPage(1)
    }, 500)
  ).current

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  // Fetch diagnosis types (categories)
  const fetchDiagnosisTypes = useCallback(async () => {
    try {
      setIsTabsLoading(true)

      const params = {
        include_all: 1,
        type: 'diagnosis',
        request_from: 'web_hospital',
        medical_record_id: medicalRecordId || ''
      }
      const res = await getDiagnosisList(params)
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
  const [isInitialLoading, setIsInitialLoading] = useState(false)

  // Fetch diagnosis list
  const fetchDiagnosisItems = useCallback(async (pageNum = 1, search = '', categoryId = '') => {
    // Only show full shimmer on initial load (page 1)
    if (pageNum === 1) {
      setIsInitialLoading(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params = {
        page_no: pageNum,
        limit: PAGE_SIZE,
        q: search,
        category_id: categoryId,
        type: 'diagnosis'
      }

      const res = await getDiagnosysType(params)

      if (res.success) {
        const newItems = res.data?.result || []
        const total = res.data?.totalRecords || 0

        setTotalCount(total)

        setAllAssessments(prev => {
          const updatedList = pageNum === 1 ? newItems : [...prev, ...newItems]
          const canLoadMore = updatedList.length < total
          setHasMore(canLoadMore)

          return updatedList
        })
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
          setPage(prevPage => {
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

  const handleTabChange = (tabValue, tabId) => {
    setCurrentTab(tabValue)
    setCurrentTabId(tabId)
    setPage(1)
    setIsInitialLoading(true)
    setAllAssessments([])
    setHasMore(false)
  }

  const handleSymptomSelect = symptom => {
    setTemporarilySelected(symptom)
    setClinicalDrawerOpen(true)
  }

  const addSymptomDetails = details => {
    if (temporarilySelected?.id && selectedSymptoms.some(s => s.id === temporarilySelected.id)) {
      setSelectedSymptoms(prev =>
        prev.map(symptom =>
          symptom.id === temporarilySelected.id
            ? {
                ...symptom,
                ...details,
                chronicVal: details.clinicalAsmnt === 'Tentative' ? 'No' : details.chronicVal,
                prognosisVal: details.clinicalAsmnt === 'Tentative' ? '' : details.prognosisVal
              }
            : symptom
        )
      )
    } else {
      setSelectedSymptoms(prev => [...prev, { ...temporarilySelected, ...details }])
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

  const removeSymptom = symptom => {
    setSelectedSymptoms(prev => prev.filter(s => s.id !== symptom?.id))
  }

  const availableSymptoms = allAssessments?.filter(symptom => !selectedSymptoms.some(s => s.id === symptom.id))

  const handleAddAssessment = async () => {
    if (selectedSymptoms.length === 0) {
      Toaster({ type: 'error', message: 'Please select at least one Assessment' })

      return
    }
    setIsSubmitLoading(true)

    const diagnosis = selectedSymptoms.map(symptom => ({
      id: symptom?.id,
      name: symptom?.name,
      additional_info: {
        status: symptom?.status?.toLowerCase() || 'active',
        clinical_assessment: symptom.clinicalAsmnt.toLowerCase(),
        note: symptom?.notes || '',
        isChronic: symptom?.chronicVal === 'Yes',
        prognosis: symptom?.prognosisVal?.toLowerCase() || '',
        notes: symptom?.notes || '',
        active_at: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .replace('T', ' ')
          .substring(0, 19),
        closed_at: null
      }
    }))

    const payload = {
      medical_record_id: medicalRecordId,
      diagnosis: JSON.stringify(diagnosis)
    }

    try {
      const response = await addClinicalAssessment(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Assessment created successfully' })
        router.push({
          pathname: `/hospital/inpatient/${id}`,
          query: { tab: 'clinicalAssessment' }
        })
      } else {
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
      }
    } catch (error) {
      console.error('Submit Error:', error)
      Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleAssessmentCancel = () => {
    router.push({
      pathname: `/hospital/inpatient/${id}`,
      query: { tab: 'clinicalAssessment' }
    })
  }

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const breadcrumbs = useMemo(
    () => (
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ color: 'inherit' }}>Hospital</Typography>
        <Typography sx={{ color: 'inherit' }}>Patients</Typography>
        <Typography sx={{ color: 'inherit' }}>Inpatient</Typography>
        <Typography sx={{ color: 'text.primary', cursor: 'pointer' }} onClick={handleBack}>
          Details
        </Typography>
        <Typography sx={{ color: 'text.primary' }}>Add Clinical Assessment</Typography>
      </Breadcrumbs>
    ),
    [handleBack]
  )

  const getPatientInfo = async () => {
    setPatientLoading(true)
    try {
      await getPatientDetails(id).then(res => {
        if (res?.success === true) {
          updateState(STORAGE_KEY, {
            ...medicalRecordData,
            animal_id: res.data?.animal_detail?.animal_id,
            medical_record_id: res.data?.medical_record_id,
            animal_admitted_date: res.data?.admitted_at
          })
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

  const handleAssessmentEdit = symptom => {
    console.log('Selected Symptom:', symptom)
    setClinicalAsmnt(symptom?.clinicalAsmnt || '')
    setPrognosisValue(symptom?.prognosisVal || '')
    setChronicVal(symptom?.chronicVal || 'No')
    setNotes(symptom?.notes || '')
    setStatus(symptom?.status || '')

    setTemporarilySelected(symptom)
    setClinicalDrawerOpen(true)
  }

  useEffect(() => {
    if (id) {
      getPatientInfo()
    }
  }, [id])

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
          { label: 'AID', value: patientData?.animal_detail?.animal_id },
          { label: 'Admitted days', value: patientData?.admitted_for_day },
          { label: 'Holding Location', value: `${patientData?.bed_name}, ${patientData?.room_name}` },
          { label: 'Chief Veterinarian', value: patientData?.attend_by_full_name }
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
            Add Clinical assessment
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
            setSearchTerm={value => {
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
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <SelectedClinicalAssessment
            selected={selectedSymptoms}
            onEdit={handleAssessmentEdit}
            onRemove={removeSymptom}
            clinicalAsmnt={clinicalAsmnt}
          />
        </Grid>
      </Grid>
      <Box>
        {/* <ActionButtons
          isSubmitLoading={isSubmitLoading}
          cancelLabel='CANCEL'
          addLabel='ADD'
          onCancel={handleAssessmentCancel}
          onAdd={handleAddAssessment}
          width={200}
          height={50}
        /> */}
        <BottomActionBar
          submitLabel='ADD'
          cancelLabel='CANCEL'
          onSubmit={handleAddAssessment}
          loading={isSubmitLoading}
          disabled={isSubmitLoading}
          cancelBtnStyle={{
            borderColor: theme.palette.customColors.OnSurfaceVariant,
            color: theme.palette.customColors.OnSurfaceVariant,
            borderRadius: 0.5,
            minHeight: '50px',
            minWidth: '200px'
          }}
          submitBtnStyle={{
            backgroundColor: theme.palette.primary.main,
            borderRadius: 0.5,
            minWidth: '200px',
            minHeight: '50px'
          }}
          onCancel={handleAssessmentCancel}
        />
      </Box>

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
          isSubmitLoading={isSubmitLoading}
        />
      )}
    </Box>
  )
}

export default enforceModuleAccess(AddClinicalAssessmentPage, 'add_hospital')
