import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Grid, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { getSymptomsListForAdding, addSymptoms } from 'src/lib/api/hospital/symptoms'
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import SymptomsList from 'src/components/hospital/Symptoms/SymptomsList'
import SelectedSymptoms from 'src/components/hospital/Symptoms/SelectedSymptoms'
import AddSymptomDrawer from 'src/components/hospital/drawer/AddSymptomDrawer'
import AddComplaintDrawer from 'src/components/hospital/drawer/AddComplaintDrawer'
import Toaster from 'src/components/Toaster'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import { checkAnimalStatusByType, getDiagnosisList } from 'src/lib/api/hospital/clinicalAssessment'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import ConfirmationDialog from 'src/components/confirmation-dialog'

const STORAGE_KEY = 'medical_record_data'

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

function AddSymptoms() {
  const theme = useTheme()
  const router = useRouter()
  const { data, updateState } = useDynamicStateContext()
  const { id } = router.query
  const medicalRecordData = data[STORAGE_KEY] || {}
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [temporarilySelected, setTemporarilySelected] = useState(null)
  const [symptomDrawerOpen, setSymptomDrawerOpen] = useState(false)
  const [complaintDrawerOpen, setComplaintDrawerOpen] = useState(false)
  const [severity, setSeverity] = useState('Mild')
  const [durationValue, setDurationValue] = useState(0)
  const [durationUnit, setDurationUnit] = useState('Days')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [symptomsList, setSymptomsList] = useState([])
  const [symptomsCount, setSymptomCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [resetPagination, setResetPagination] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [patientData, setPatientData] = useState(null)
  const [patientLoading, setPatientLoading] = useState(false)
  const [isTabsLoading, setIsTabsLoading] = useState(false)
  const [tabOptions, setTabOptions] = useState([])
  const [currentTab, setCurrentTab] = useState('')
  const [currentTabId, setCurrentTabId] = useState('')
  const [isDuplicatesErrorModelOpen, setDuplicatesErrorModelOpen] = useState(false)
  const [duplicateSymptoms, setDuplicateSymptoms] = useState([])
  const medicalRecordId = medicalRecordData?.medical_record_id

  const initialLoadRef = useRef(false)

  const loadedItemsRef = useRef({})

  const isFetchingRef = useRef(false)

  const handleSymptomSelect = symptom => {
    setTemporarilySelected({ id: symptom.id, name: symptom.name })
    setSymptomDrawerOpen(true)
    setDurationValue(0)
    setNotes('')
    setDurationUnit('Days')
    setSeverity('Mild')
  }

  const addSymptomDetails = details => {
    setSelectedSymptoms(prev => [...prev, { id: temporarilySelected.id, name: temporarilySelected.name, ...details }])
    setTemporarilySelected(null)
    setSymptomDrawerOpen(false)
  }

  const cancelSymptomSelection = () => {
    setTemporarilySelected(null)
    setSymptomDrawerOpen(false)
  }

  const removeSymptom = symptomId => {
    setSelectedSymptoms(prev => prev.filter(s => s.id !== symptomId))
  }

  const availableSymptoms = symptomsList.filter(symptom => !selectedSymptoms.some(s => s.id === symptom.id))

  const fetchSymptoms = useCallback(
    async (query = '', pageNo = 1, append = false, categoryId = '') => {
      if (isFetchingRef.current) return

      try {
        isFetchingRef.current = true

        if (pageNo === 1) {
          setSearching(true)
        } else {
          setLoading(true)
        }

        const params = {
          page_no: pageNo,
          type: 'complaints',
          q: query,
          category_id: categoryId || '',
          request_from: 'hospital_module',
          medical_record_id: patientData?.medical_record_id || '',
          limit: 20
        }

        const response = await getSymptomsListForAdding(params)

        if (response.success) {
          const newResults = response?.data?.result || []
          const totalRecords = response?.data?.totalRecords || 0
          const currentPage = response?.data?.currentPage || pageNo
          const totalPages = response?.data?.totalPages || Math.ceil(totalRecords / 20)

          const key = `${categoryId || 'all'}_${query || 'noquery'}`
          const currentLoadedCount = (loadedItemsRef.current[key] || 0) + newResults.length
          loadedItemsRef.current[key] = currentLoadedCount

          setSymptomsList(prev => {
            if (!append) return newResults

            const combined = [...prev, ...newResults]

            const unique = combined.reduce((acc, current) => {
              const x = acc.find(item => item.id === current.id)
              if (!x) {
                return acc.concat([current])
              }

              return acc
            }, [])

            return unique
          })

          setSymptomCount(totalRecords)

          const hasMoreData = currentPage < totalPages && newResults.length > 0
          setHasMore(hasMoreData)

          if (newResults.length > 0) {
            setPage(currentPage)
          }
        }
      } catch (error) {
        setHasMore(false)
      } finally {
        setLoading(false)
        setSearching(false)
        setResetPagination(false)
        isFetchingRef.current = false
      }
    },
    [patientData?.medical_record_id]
  )

  const fetchDiagnosisTypes = useCallback(async () => {
    try {
      setIsTabsLoading(true)

      const params = {
        include_all: 1,
        type: 'complaints',
        request_from: 'web_hospital',
        medical_record_id: patientData?.medical_record_id || ''
      }

      const res = await getDiagnosisList(params)
      if (res?.success) {
        const categories = res.data?.result || []
        setTabOptions(categories)

        if (categories.length > 0 && !currentTabId) {
          const firstCategory = categories[0]
          setCurrentTab(firstCategory?.category || '')
          setCurrentTabId(firstCategory?.id || '')

          const key = `${firstCategory?.id || 'all'}_noquery`
          loadedItemsRef.current[key] = 0

          fetchSymptoms('', 1, false, firstCategory?.id || '')
        }
      }
    } catch (error) {
      setTabOptions([])
    } finally {
      setIsTabsLoading(false)
    }
  }, [patientData?.medical_record_id, currentTabId, fetchSymptoms])

  const debouncedSearch = useDebounce((query, categoryId) => {
    setResetPagination(true)
    setPage(1)
    setSearchQuery(query)

    const key = `${categoryId || 'all'}_${query || 'noquery'}`
    loadedItemsRef.current[key] = 0
    fetchSymptoms(query, 1, false, categoryId || currentTabId)
  }, 500)

  const handleSearchChange = e => {
    const value = e.target.value

    setSearchQuery(value)

    debouncedSearch(value, currentTabId)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setPage(1)

    const key = `${currentTabId || 'all'}_noquery`
    loadedItemsRef.current[key] = 0
    fetchSymptoms('', 1, false, currentTabId)
  }

  const handleScroll = e => {
    if (resetPagination || loading || !hasMore || isFetchingRef.current) return

    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100

    if (bottom) {
      const nextPage = page + 1
      fetchSymptoms(searchQuery, nextPage, true, currentTabId)
    }
  }

  useEffect(() => {
    const getPatientInfo = async () => {
      if (!id || initialLoadRef.current) return

      setPatientLoading(true)
      try {
        const res = await getPatientDetails(id)
        if (res?.success === true) {
          updateState(STORAGE_KEY, {
            ...medicalRecordData,
            animal_id: res.data?.animal_detail?.animal_id,
            medical_record_id: res.data?.medical_record_id,
            animal_admitted_date: res.data?.admitted_at
          })
          setPatientData(res?.data)
        } else {
          setPatientData(null)
        }
      } catch (error) {
        console.error('Cannot Fetch Patient Details', error)
      } finally {
        setPatientLoading(false)
      }
    }

    getPatientInfo()
  }, [id])

  useEffect(() => {
    if (!patientData?.medical_record_id || initialLoadRef.current) return

    fetchDiagnosisTypes()
    initialLoadRef.current = true
  }, [patientData?.medical_record_id, fetchDiagnosisTypes])

  const handleTabChange = (tabValue, tabId) => {
    setCurrentTab(tabValue)
    setCurrentTabId(tabId)
    setPage(1)
    setSymptomsList([])
    setHasMore(true)

    const key = `${tabId || 'all'}_${searchQuery || 'noquery'}`
    loadedItemsRef.current[key] = 0

    fetchSymptoms(searchQuery, 1, false, tabId)
  }

  const checkDuplicateSymptoms = async () => {
    try {
      const payload = {
        type: 'complaint',
        animal_ids: JSON.stringify([Number(patientData?.animal_detail?.animal_id)]),
        master_ids: JSON.stringify(selectedSymptoms.map(s => s.id))
      }
      const response = await checkAnimalStatusByType(payload)

      if (response?.success) {
        setDuplicateSymptoms(response?.data)

        return response?.data || []
      } else {
        return []
      }
    } catch (error) {
      console.error('Error checking animal status:', error)
    }
  }

  const handleAddClick = async () => {
    setAddLoading(true)
    const duplicatesData = await checkDuplicateSymptoms()

    try {
      if (selectedSymptoms.length === 0) {
        Toaster({ type: 'error', message: 'Please select at least one Symptom' })

        return
      }

      if (duplicatesData?.length > 0) {
        setDuplicatesErrorModelOpen(true)

        return
      }

      const complaints = selectedSymptoms.map(symptom => ({
        id: symptom.id,
        name: symptom.name,
        additional_info: {
          severity: symptom.severity || 'Mild',
          notes: symptom.notes || '',
          active_at: '',
          duration: String(symptom.durationValue || 0),
          duration_unit: symptom.durationUnit || 'Days',
          status: 'active',
          comment_list: []
        }
      }))

      const formData = new FormData()
      formData.append('medical_record_id', patientData?.medical_record_id)
      formData.append('animal_id', JSON.stringify([Number(patientData?.animal_detail?.animal_id)]))
      formData.append('complaints', JSON.stringify(complaints))
      formData.append('hospital_case_id', id)

      const response = await addSymptoms(formData)

      if (response.success) {
        Toaster({ type: 'success', message: response?.message })
        setSelectedSymptoms([])
        handleRouterNavigation()
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setAddLoading(false)
    }
  }

  const handleAddNewClick = () => {
    setComplaintDrawerOpen(true)
  }

  const handleComplaintAdded = symptom => {
    handleSymptomSelect(symptom)

    // Refetch categories and symptoms
    fetchDiagnosisTypes()

    // Refetch symptoms for current tab
    const key = `${currentTabId || 'all'}_${searchQuery || 'noquery'}`
    loadedItemsRef.current[key] = 0
    fetchSymptoms(searchQuery, 1, false, currentTabId)
  }

  const handleRouterNavigation = () => {
    router.back()
  }

  const handleAIDDisplay = () => {
    if (patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value) {
      return `${patientData?.animal_detail?.local_identifier_name}: ${patientData?.animal_detail?.local_identifier_value}`
    } else {
      return patientData?.animal_detail?.animal_id
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <AnimalInfoCard
        image={patientData?.animal_detail?.default_icon}
        name={patientData?.animal_detail?.common_name}
        scientificName={patientData?.animal_detail?.complete_name}
        age={`${patientData?.animal_detail?.age}`}
        gender={`${patientData?.animal_detail?.sex}`}
        additionalFields={[
          { label: 'AID', value: handleAIDDisplay() },
          { label: 'Health Status', value: patientData?.health_status || 'stable', isStatusCard: true },
          // { label: 'Admitted days', value: patientData?.admitted_for_day },
          { label: 'Location', value: `${patientData?.bed_name}, ${patientData?.room_name}` },
          { label: 'Consulting Veterinarian', value: patientData?.attend_by_full_name }
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
            Add Symptoms
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <SymptomsList
            symptoms={availableSymptoms}
            temporarilySelected={temporarilySelected}
            selectedSymptoms={selectedSymptoms.map(s => s.id)}
            onSelect={handleSymptomSelect}
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            handleClearSearch={handleClearSearch}
            handleScroll={handleScroll}
            loading={loading}
            searching={searching}
            isTabsLoading={isTabsLoading}
            tabOptions={tabOptions}
            currentTab={currentTab}
            handleTabChange={handleTabChange}
            symptomsCount={symptomsCount}
            hasMore={hasMore}
            handleAddNewClick={handleAddNewClick}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <SelectedSymptoms selected={selectedSymptoms} onRemove={removeSymptom} severity={severity} />
        </Grid>
      </Grid>

      <BottomActionBar
        onCancel={handleRouterNavigation}
        onSubmit={handleAddClick}
        loading={addLoading}
        disabled={addLoading}
        submitLabel='ADD'
        cancelLabel='CANCEL'
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
      />
      <ConfirmationDialog
        dialogBoxStatus={isDuplicatesErrorModelOpen}
        title={`Clinical assessment${duplicateSymptoms?.length > 1 ? 's' : ''} already exists`}
        description={`Duplicate assessments: ${duplicateSymptoms?.map(item => item?.diagnosis)?.join(', ')}`}
        additionalDescription={`To proceed choose a different Clinical Assessment or remove the animal accessed`}
        confirmBtnStyle={{ background: theme.palette.customColors.primary, py: 3 }}
        image={'/images/warning-icon.svg'}
        imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
        confirmAction={() => {
          setDuplicatesErrorModelOpen(false)
          setAddLoading(false)
        }}
        ConfirmationText={'OK'}
        allowCancel={false}
      />
      {temporarilySelected && (
        <AddSymptomDrawer
          open={symptomDrawerOpen}
          onClose={cancelSymptomSelection}
          selectedSymptom={temporarilySelected}
          severity={severity}
          setSeverity={setSeverity}
          durationValue={durationValue}
          setDurationValue={setDurationValue}
          durationUnit={durationUnit}
          setDurationUnit={setDurationUnit}
          notes={notes}
          status={status}
          setStatus={setStatus}
          setNotes={setNotes}
          onSave={addSymptomDetails}
        />
      )}
      {complaintDrawerOpen && (
        <AddComplaintDrawer
          open={complaintDrawerOpen}
          setOpen={setComplaintDrawerOpen}
          onComplaintAdded={handleComplaintAdded}
        />
      )}
    </Box>
  )
}

export default AddSymptoms
