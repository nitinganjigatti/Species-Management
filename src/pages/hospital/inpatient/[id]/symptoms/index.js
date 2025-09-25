import React, { useState, useEffect, useCallback } from 'react'
import { Box, Grid, Typography, Button, CircularProgress } from '@mui/material'
import AnimalDetails from 'src/views/pages/hospital/symptoms/AnimalDetails'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { getSymptomsListForAdding, addSymptoms } from 'src/lib/api/hospital/symptoms'
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import SymptomsList from 'src/components/hospital/Symptoms/SymptomsList'
import SelectedSymptoms from 'src/components/hospital/Symptoms/SelectedSymptoms'
import ActionButtons from 'src/components/hospital/FooterActionbuttons'
import AddSymptomDrawer from 'src/components/hospital/drawer/AddSymptomDrawer'
import Toaster from 'src/components/Toaster'

export default function AddSymptomsPage() {
  const theme = useTheme()
  const router = useRouter()
  const { id, animal_id, medical_record_id } = router.query
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [temporarilySelected, setTemporarilySelected] = useState(null)
  const [symptomDrawerOpen, setSymptomDrawerOpen] = useState(false)
  const [severity, setSeverity] = useState('Low')
  const [durationValue, setDurationValue] = useState(1)
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

  const debounce = (func, delay) => {
    let timer
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => func(...args), delay)
    }
  }

  const handleSymptomSelect = symptom => {
    setTemporarilySelected({ id: symptom.id, name: symptom.name })
    setSymptomDrawerOpen(true)
    setDurationValue(1)
    setNotes('')
    setDurationUnit('Days')
    setSeverity('Low')
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

  const fetchSymptoms = useCallback(async (query = '', pageNo = 1, append = false) => {
    try {
      if (pageNo === 1) {
        setSearching(true)
      } else {
        setLoading(true)
      }

      const params = {
        page_no: pageNo,
        type: 'complaints',
        q: query
      }

      const response = await getSymptomsListForAdding(params)

      if (response.success) {
        const newResults = response?.data?.result || []
        const totalRecords = response?.data?.totalRecords || 0

        setSymptomsList(prev => (append ? [...prev, ...newResults] : newResults))
        setSymptomCount(totalRecords)
        setHasMore(pageNo * 20 < totalRecords)
      }
    } catch (error) {
      console.error('Error fetching symptoms:', error)
    } finally {
      setLoading(false)
      setSearching(false)
      setResetPagination(false)
    }
  }, [])

  const debouncedSearch = useCallback(
    debounce(query => {
      setResetPagination(true)
      setPage(1)
      fetchSymptoms(query, 1, false)
    }, 500),
    []
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setPage(1)
    fetchSymptoms('', 1, false)
  }

  const handleScroll = e => {
    if (resetPagination || loading || !hasMore) return
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50

    if (bottom) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchSymptoms(searchQuery, nextPage, true)
    }
  }

  useEffect(() => {
    fetchSymptoms('', 1, false)
  }, [fetchSymptoms])

  useEffect(() => {
    const getPatientInfo = async () => {
      //setPatientLoading(true)
      try {
        await getPatientDetails(id).then(res => {
          if (res?.success === true) {
            setPatientData(res?.data)
            // setPatientLoading(false)
          } else {
            setPatientData(null)
            // setPatientLoading(false)
          }
        })
      } catch (error) {
        console.error('Cannot Fetch Patient Details', error)
        setPatientLoading(false)
      }
    }

    getPatientInfo()
  }, [id])

  const handleAddClick = async () => {
    try {
      if (selectedSymptoms.length === 0) {
        Toaster({ type: 'error', message: 'Please select at least one Symptom' })
        return
      }
      setAddLoading(true)

      const complaints = selectedSymptoms.map(symptom => ({
        id: symptom.id,
        name: symptom.name,
        additional_info: {
          severity: symptom.severity || 'Low',
          notes: symptom.notes || '',
          active_at: '',
          duration: String(symptom.durationValue || 0),
          duration_unit: symptom.durationUnit || 'Days',
          status: 'active',
          comment_list: []
        }
      }))

      const formData = new FormData()
      formData.append('medical_record_id', medical_record_id)
      formData.append('animal_id', JSON.stringify([Number(animal_id)]))
      formData.append('complaints', JSON.stringify(complaints))

      const response = await addSymptoms(formData)

      if (response.success) {
        Toaster({ type: 'success', message: response?.message })
        setSelectedSymptoms([])

        router.push(`/hospital/inpatient/${id}/?animal_id=${animal_id}&tab=symptoms`)
        setAddLoading(false)
      } else {
        Toaster({ type: 'error', message: response?.message })
        setAddLoading(false)
      }
    } catch (error) {
      console.error('Error while adding symptoms:', error)
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <AnimalDetails
        image={patientData?.animal_detail?.default_icon}
        name={patientData?.animal_detail?.common_name}
        scientificName={patientData?.animal_detail?.complete_name}
        identifierValue={patientData?.animal_detail?.local_identifier_value}
        identifierName={patientData?.animal_detail?.local_identifier_name}
        admittedDays={patientData?.admitted_for_day}
        location={patientData?.bed_name}
        vet=''
        ageGender={`${patientData?.animal_detail?.age || 'N/A'}${
          patientData?.animal_detail?.sex ? ` . ${patientData?.animal_detail?.sex}` : ''
        }`}
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
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <SelectedSymptoms selected={selectedSymptoms} onRemove={removeSymptom} severity={severity} />
        </Grid>
      </Grid>

      <ActionButtons
        cancelLabel='CANCEL'
        addLabel={
          <Box display='flex' alignItems='center' gap={1}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              ADD
              {addLoading && <CircularProgress size={20} sx={{ color: '#ccc' }} />}
            </span>
          </Box>
        }
        onCancel={() => router.push(`/hospital/inpatient/${id}/?animal_id=${animal_id}&tab=symptoms`)}
        onAdd={handleAddClick}
        width={200}
        height={50}
        isSubmitLoading={addLoading}
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
    </Box>
  )
}
