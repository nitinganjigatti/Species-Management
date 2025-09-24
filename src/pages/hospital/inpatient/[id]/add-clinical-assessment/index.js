import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Grid, Typography } from '@mui/material'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import { useTheme } from '@mui/material/styles'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
import ClinicalAssessmentList from 'src/components/hospital/ClinicalAssessment/ClinicalAssessmentList'
import SelectedClinicalAssessment from 'src/components/hospital/ClinicalAssessment/SelectedClinicalAssessment'
import AddClinicalAsmntDrawer from 'src/components/hospital/drawer/AddClinicalAsmntDrawer'
import debounce from 'lodash/debounce'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import { addClinicalAssessment, getDiagnosisList, getDiagnosysType } from 'src/lib/api/hospital/clinicalAssessment'
import Toaster from 'src/components/Toaster'
import { useRouter } from 'next/router'

const PAGE_SIZE = 10

export default function AddClinicalAssessmentPage() {
  const theme = useTheme()
  const router = useRouter()
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

  const { id, animalId, medicalRecordId } = router.query
  
  // API states
  const [allAssessments, setAllAssessments] = useState([])
  const [tabOptions, setTabOptions] = useState([])
  const [currentTab, setCurrentTab] = useState('')
  const [currentTabId, setCurrentTabId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

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
        include_all:1,
        type:"diagnosis"
      }
      const res = await getDiagnosisList(params) // This gets categories
      if (res.success) {
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
  }, [])

  // Fetch diagnosis list with infinite scroll
  const fetchDiagnosisItems = useCallback(async (pageNum = 1, search = '', categoryId = '') => {
    setIsLoading(true)
    try {
      const params = {
        page: pageNum,
        q: search,
        category_id: categoryId,
        type: 'diagnosis'
      }

      const res = await getDiagnosysType(params)

      if (res.success) {
        const newItems = res.data?.result || []
        const totalCount = res.data?.totalRecords || 0

        setTotalCount(totalCount)
        setAllAssessments(prev => (pageNum === 1 ? newItems : [...prev, ...newItems]))
        setHasMore(newItems.length === PAGE_SIZE)
      } else {
        throw new Error(res.message || 'Failed to fetch diagnosis list')
      }
    } catch (error) {
      console.error('Error fetching diagnosis items:', error)
      setAllAssessments([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchDiagnosisItems(nextPage, searchTerm, currentTabId)
    }
  }, [isLoading, hasMore, page, searchTerm, currentTabId, fetchDiagnosisItems])

  // Initialize infinite scroll
  const loaderRef = useInfiniteScroll(loadMore, isLoading, hasMore)

  // Fetch data on component mount
  useEffect(() => {
    fetchDiagnosisTypes()
  }, [fetchDiagnosisTypes])

  // Fetch diagnosis items when tab or search changes
  useEffect(() => {
    if (currentTabId) {
      fetchDiagnosisItems(1, searchTerm, currentTabId)
    }
  }, [currentTabId, searchTerm, fetchDiagnosisItems])

  const handleTabChange = (tabValue, tabId) => {
    setCurrentTab(tabValue)
    setCurrentTabId(tabId)
    setPage(1)
  }

  const handleSymptomSelect = symptom => {
    setTemporarilySelected(symptom)
    setClinicalDrawerOpen(true)
  }

  const addSymptomDetails = details => {
    setSelectedSymptoms(prev => [...prev, { ...temporarilySelected, ...details }])
    setTemporarilySelected(null)
    setClinicalDrawerOpen(false)

    // Reset form fields
    setClinicalAsmnt('')
    setPrognosisValue('')
    setChronicVal('No')
    setNotes('')
    setStatus('')
  }

  const cancelSymptomSelection = () => {
    setTemporarilySelected(null)
    setClinicalDrawerOpen(false)

    // Reset form fields
    setClinicalAsmnt('')
    setPrognosisValue('')
    setChronicVal('No')
    setNotes('')
    setStatus('')
  }

  const removeSymptom = symptom => {
    setSelectedSymptoms(prev => prev.filter(s => s.id !== symptom?.id))
  }

  const availableSymptoms = allAssessments.filter(symptom => 
    !selectedSymptoms.some(s => s.id === symptom.id)
  )

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
        status: symptom?.status?.toLowerCase() || '',
        clinical_assessment: symptom.clinicalAsmnt.toLowerCase(),
        note: symptom?.notes || '',
        isChronic: symptom?.chronicVal === 'Yes',
        prognosis: symptom?.prognosisVal?.toLowerCase() || ''
      }
    }))

    const payload = {
      medical_record_id: medicalRecordId,
      animal_id: JSON.stringify([animalId]),
      diagnosis: JSON.stringify(diagnosis)
    }

    try {
      const response = await addClinicalAssessment(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Assessment created successfully' })
        router.push({
          pathname: `/hospital/inpatient/${id}`,
          query: { animal_id: animalId, medical_record_id: medicalRecordId, tab: 'clinical-assessment' }
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
      query: { animal_id: animalId, medical_record_id: medicalRecordId, tab: 'clinical-assessment' }
    })
  }

  return (
    <Box sx={{ p: 3 }}>
      <AnimalDetails
        image='/leopard.jpg'
        name='Leopard'
        scientificName='Panthera pardus'
        aid='123456'
        admittedDays='6 Days'
        location='Cage 1, Patient Wing 2'
        vet='Dr. Nitin A Ganjigatti'
        ageGender='2y 5m . male'
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
            loaderRef={loaderRef}
            totalCount={totalCount}
            isTabsLoading={isTabsLoading}
            isListLoading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <SelectedClinicalAssessment
            selected={selectedSymptoms}
            onRemove={removeSymptom}
            clinicalAsmnt={clinicalAsmnt}
          />
        </Grid>
      </Grid>

      <ActionButtons
        isSubmitLoading={isSubmitLoading}
        cancelLabel='CANCEL'
        addLabel='ADD'
        onCancel={handleAssessmentCancel}
        onAdd={handleAddAssessment}
        width={200}
        height={50}
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
          isSubmitLoading={isSubmitLoading}
        />
      )}
    </Box>
  )
}
