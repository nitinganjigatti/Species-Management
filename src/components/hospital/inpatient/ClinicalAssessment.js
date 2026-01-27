import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import Search from 'src/views/utility/Search'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import ClinicalAssessmentCard from '../../../views/pages/hospital/inpatient/ClinicalAssessmentCard'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import debounce from 'lodash/debounce'
import {
  deleteNote,
  getClinicalAssessments,
  getNotes,
  updateClinicalAssessment,
  updateNotes
} from 'src/lib/api/hospital/clinicalAssessment'
import EditClinicalAsmntDrawer from '../drawer/EditClinicalAsmntDrawer'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ClinicalAssessmentShimmer from 'src/views/pages/hospital/inpatient/shimmer/ClinicalAssessmentShimmer'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import NoMedicalData from 'src/views/utility/NoMedicalData'

const PAGE_SIZE = 10
const STORAGE_KEY = 'medical_record_data'

const ClinicalAssessment = ({ overviewData, patientData, category }) => {
  const router = useRouter()
  const { data } = useDynamicStateContext()
  const { id, isCurrentMedicalRecordOnly } = router.query
  const medicalRecordData = data[STORAGE_KEY] || {}
  const [currentTab, setCurrentTab] = useState('Active')
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [currentRecordOnly, setCurrentRecordOnly] = useState(isCurrentMedicalRecordOnly === 'true')
  const [records, setRecords] = useState([])
  const [tabCounts, setTabCounts] = useState({ Active: 0, Resolved: 0, All: 0 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [activityListData, setActivityListData] = useState()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [noteRecord, setNoteRecord] = useState(null)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [activityLoader, setActivityLoader] = useState(false)

  const [clinicalAsmnt, setClinicalAsmnt] = useState('')
  const [prognosisVal, setPrognosisValue] = useState('')
  const [chronicVal, setChronicVal] = useState(false)
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [temporarilySelected, setTemporarilySelected] = useState(null)

  const animal_id = medicalRecordData?.animal_id
  const medical_record_id = medicalRecordData?.medical_record_id
  const isDischared = overviewData?.status === 'discharge'

  const theme = useTheme()

  const tabs = ['Active', 'Resolved', 'All']

  const handleUpdateNotes = async newNotes => {
    if (!selectedAssessment) return
    setIsUpdating(true)

    try {
      const payload = {
        main_id: selectedAssessment?.main_diagnosis_id,
        med_id: selectedAssessment?.medical_record_id,
        type: 'DIAGNOSIS',
        note: notes || '',
        note_id: noteRecord?.note_id || '',
        hospital_case_id: id || ''
      }
      const response = await updateNotes(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Notes updated successfully.' })
        setNotes('')
        setIsNotesOpen(false)
        setNoteRecord(null)
        setIsDrawerOpen(false)

        fetchClinicalAssessments(1, searchQuery, getStatusFilter())

        // Optionally refresh activity list
        // const notesResponse = await getNotes({
        //   entity: 'diagnosis',
        //   medical_id: selectedAssessment?.medical_record_id,
        //   record_id: selectedAssessment?.main_diagnosis_id
        // })
        // if (notesResponse?.success) {
        //   setActivityListData(notesResponse?.data || [])
        // }
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to update notes.' })
      }
    } catch (error) {
      console.error('Error updating notes:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteNotes = async () => {
    if (!selectedAssessment) return
    setIsDeleting(true)

    try {
      const payload = {
        entity: 'diagnosis',
        medical_id: selectedAssessment?.medical_record_id,
        record_id: selectedAssessment?.main_diagnosis_id
      }
      const response = await deleteNote(noteRecord?.note_id, payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Notes deleted successfully.' })
        setNotes('')
        setIsNotesOpen(false)
        setNoteRecord(null)
        setIsDrawerOpen(false)

        fetchClinicalAssessments(1, searchQuery, getStatusFilter())

        // Optionally refresh activity list
        // const notesResponse = await getNotes({
        //   entity: 'diagnosis',
        //   medical_id: selectedAssessment?.medical_record_id,
        //   record_id: selectedAssessment?.main_diagnosis_id
        // })
        // if (notesResponse?.success) {
        //   setActivityListData(notesResponse?.data || [])
        // }
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete notes.' })
      }
    } catch (error) {
      console.error('Error deleting notes:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditNoteClick = item => {
    setNoteRecord(item)
    setNotes(item?.note || '')
  }

  // Debounced search
  const debouncedSearch = useRef(
    debounce(searchValue => {
      setSearchQuery(searchValue)
      setPage(1)
    }, 500)
  ).current

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  // Function to get status filter based on current tab
  const getStatusFilter = useCallback(() => {
    switch (currentTab) {
      case 'Active':
        return 'active'
      case 'Resolved':
        return 'closed'
      case 'All':
        return 'all'
      default:
        return ''
    }
  }, [currentTab])

  // Fetch clinical assessments data
  const fetchClinicalAssessments = useCallback(
    async (pageNum = 1, search = '', status = '') => {
      setIsLoading(true)
      try {
        const res = await getClinicalAssessments({
          type: status,
          medical_type: 'diagnosis',
          page_no: pageNum,
          limit: PAGE_SIZE,
          animal_id: animal_id || '',
          hospital_case_id: id || '',
          q: search,
          medical_record_id: currentRecordOnly && medical_record_id ? medical_record_id : ''
        })

        if (res.success) {
          const newItems = res.data?.result || []
          const totalCount = parseInt(res.data?.total_count || 0)

          setTotal(totalCount)
          setTabCounts({
            Active: parseInt(res.data?.active || '0'),
            Resolved: parseInt(res.data?.closed || '0'),
            All: parseInt(res.data?.all || '0')
          })
          setRecords(prev => (pageNum === 1 ? newItems : [...prev, ...newItems]))
          setHasMore(newItems.length === PAGE_SIZE)
        } else {
          throw new Error(res.message || 'Failed to fetch clinical assessments')
        }
      } catch (error) {
        console.error('Error fetching clinical assessments:', error)
        setRecords([])
        setTotal(0)
        setHasMore(false)
      } finally {
        setIsLoading(false)
      }
    },
    [currentRecordOnly, id, animal_id]
  )

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchClinicalAssessments(nextPage, searchQuery, getStatusFilter())
    }
  }, [isLoading, hasMore, page, searchQuery, getStatusFilter, fetchClinicalAssessments])

  // Initialize infinite scroll
  const loaderRef = useInfiniteScroll(loadMore, isLoading, hasMore)

  // Fetch data when tab, search, or currentRecordOnly changes
  useEffect(() => {
    if (animal_id) fetchClinicalAssessments(1, searchQuery, getStatusFilter())
  }, [searchQuery, currentTab, currentRecordOnly, fetchClinicalAssessments, getStatusFilter, animal_id])

  const handleTabChange = newValue => {
    setCurrentTab(newValue)
    setPage(1)
    //setRecords([])
  }

  const filteredRecords = records

  // Get count based on current tab
  const getTabCount = currentTab => {
    switch (currentTab) {
      case 'Active':
        return tabCounts.Active
      case 'Resolved':
        return tabCounts.Resolved
      case 'All':
        return tabCounts.All
      default:
        tabCounts.All
    }
  }

  const handleAssessmentClick = async assessment => {
    setSelectedAssessment({
      ...assessment,
      additional_info: { ...assessment.additional_info, isChronic: assessment.additional_info.isChronic ? 'Yes' : 'No' }
    })
    setTemporarilySelected(assessment)
    setClinicalAsmnt(assessment?.additional_info?.clinical_assessment || 'primary')
    setPrognosisValue(
      assessment?.additional_info?.prognosis
        ? Utility.capitalizeFirstLetter(assessment.additional_info.prognosis)
        : 'Favourable'
    )
    setChronicVal(assessment?.additional_info?.isChronic ? 'Yes' : 'No')
    setNotes(assessment?.additional_info?.note || '')
    setStatus(
      assessment?.additional_info?.status ? Utility.capitalizeFirstLetter(assessment.additional_info.status) : 'Active'
    )
    setIsDrawerOpen(true)
    try {
      setActivityLoader(true)

      const params = {
        entity: 'diagnosis',
        medical_id: assessment?.medical_record_id || '',
        record_id: assessment?.main_diagnosis_id || ''
      }

      const response = await getNotes(params)

      if (response?.success) {
        setActivityListData(response?.data || [])
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to fetch notes.' })
      }
    } catch (error) {
      console.error('Error fetching notes for symptom:', error)
      Toaster({ type: 'error', message: 'An error occurred while fetching notes.' })
    } finally {
      setActivityLoader(false)
    }
  }

  const updateAssessment = async () => {
    // Check if any values have been modified
    const isClinicalAsmntChanged =
      clinicalAsmnt?.toLowerCase() !== selectedAssessment?.clinical_assessment?.toLowerCase()

    const isPrognosisChanged =
      clinicalAsmnt?.toLowerCase() === 'diagnosis'
        ? prognosisVal?.toLowerCase() !== selectedAssessment?.additional_info?.prognosis?.toLowerCase()
        : false

    const isChronicChanged = chronicVal !== selectedAssessment?.additional_info?.isChronic

    const isStatusChanged = status?.toLowerCase() !== selectedAssessment?.additional_info?.status?.toLowerCase()

    // Set is_system_generated to true if any value has changed
    const isSystemGenerated = isClinicalAsmntChanged || isPrognosisChanged || isChronicChanged || isStatusChanged

    // Base payload with required fields
    const payload = {
      main_id: selectedAssessment?.main_diagnosis_id || '',
      med_id: selectedAssessment?.medical_record_id || '',
      type: 'DIAGNOSIS',
      is_system_generated: isSystemGenerated,
      animal_id: animal_id || '',
      hospital_case_id: id || ''
    }

    // Only add clinical_assessment if changed
    if (isClinicalAsmntChanged) {
      payload.clinical_assessment = clinicalAsmnt?.toLowerCase() || ''
    }

    // Only add prognosis if changed and clinical assessment is diagnosis
    if (isPrognosisChanged && clinicalAsmnt?.toLowerCase() === 'diagnosis') {
      payload.prognosis = prognosisVal.toLowerCase()
    }

    // Only add chronic if changed and clinical assessment is diagnosis
    if (isChronicChanged && clinicalAsmnt?.toLowerCase() === 'diagnosis') {
      payload.chronic = chronicVal === 'Yes' ? 1 : 0
    }

    // Only add status if changed
    if (isStatusChanged) {
      payload.status = status?.toLowerCase() === 'inactive' ? 'resolved' : 'active'
    }

    // Only add note if changed
    if (notes) {
      payload.note = notes || ''
    }

    setIsSubmitLoading(true)

    try {
      const response = await updateClinicalAssessment(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Assessment updated successfully' })
        fetchClinicalAssessments(1, searchQuery, getStatusFilter())
        setIsDrawerOpen(false)
        setIsSaveDialogOpen(false)
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

  const handleRouterNavigation = () => {
    if (category === 'Outpatients') {
      router.push({
        pathname: `/hospital/outpatient/${id}/add-clinical-assessment`
      })
    } else {
      router.push({
        pathname: `/hospital/inpatient/${id}/add-clinical-assessment`
      })
    }
  }

  const handleRecordOnlyChange = e => {
    setRecords([])
    setPage(1)
    setCurrentRecordOnly(e.target.checked)

    // Update URL query parameter
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, isCurrentMedicalRecordOnly: e.target.checked }
      },
      undefined,
      { shallow: true } // Prevents full page refresh
    )
  }

  return (
    <Box sx={{ mt: 6 }}>
      {/* Header with Tabs and Controls */}
      {tabCounts?.All !== 0 || searchQuery.trim().length > 0 ? (
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              rowGap: 4
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  flex: '1 1 auto',
                  minWidth: 0,
                  overflowX: 'auto',
                  scrollbarColor: 'transparent transparent',
                  columnGap: 4
                }}
              >
                <Box sx={{ display: 'inline-flex', gap: 3, pr: 1, alignItems: 'center' }}>
                  {tabs.map(tab => (
                    <Box
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      sx={{
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        px: '16px',
                        py: '8px',
                        borderRadius: '8px',
                        backgroundColor:
                          currentTab === tab ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                        cursor: 'pointer'
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            currentTab === tab
                              ? theme.palette.primary.contrastText
                              : theme.palette.customColors.neutralPrimary,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {`${tab} ${
                          tab === 'Active'
                            ? ` - ${getTabCount('Active')}`
                            : tab === 'Resolved'
                            ? ` - ${getTabCount('Resolved')}`
                            : tab === 'All'
                            ? ` - ${getTabCount('All')}`
                            : ''
                        }`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Search
                value={localSearch}
                onChange={e => {
                  const value = e.target.value
                  setLocalSearch(value)
                  debouncedSearch(value)
                }}
                onClear={() => {
                  setLocalSearch('')
                  debouncedSearch('')
                }}
              />
              {!isDischared && (
                <Button variant='contained' startIcon={<AddIcon />} onClick={handleRouterNavigation}>
                  ADD NEW
                </Button>
              )}
            </Box>
          </Box>
          <Box>
            <MUISwitch
              label='Current Medical Record Only'
              checked={currentRecordOnly}
              onChange={handleRecordOnlyChange}
              size='small'
              sx={{ ml: 2.6 }}
            />
          </Box>
        </Box>
      ) : !isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <MUISwitch
            label='Current Medical Record Only'
            checked={currentRecordOnly}
            onChange={handleRecordOnlyChange}
            size='small'
            sx={{ ml: 2.6 }}
          />
        </Box>
      ) : null}

      {/* Records List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Loading State */}
        {isLoading && (filteredRecords?.length === 0 || !hasMore) && <ClinicalAssessmentShimmer count={5} />}
        {filteredRecords?.map((record, index) => (
          <ClinicalAssessmentCard
            key={record.id || index}
            record={record}
            patientData={patientData}
            isDifferential={record.clinical_assessment === 'tentative'}
            isResolved={record.additional_info?.status === 'closed'}
            isDischared={isDischared}
            handleClick={() => (isDischared ? null : handleAssessmentClick(record))}
          />
        ))}

        {/* Infinite Scroll Loader */}
        {(isLoading || hasMore) && filteredRecords.length > 0 && (
          <Box ref={loaderRef}>
            <ClinicalAssessmentShimmer count={1} />
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && filteredRecords.length === 0 && (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <NoMedicalData
              btnText={'ADD NEW CLINICAL ASSESSMENT'}
              text={'All Added Clinical Assessments Will Appear here'}
              isDischarged={isDischared}
              btnAction={handleRouterNavigation}
            />
          </Box>
        )}

        {/* End of List */}
        {!hasMore && filteredRecords.length > 10 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            No more assessments to load
          </Typography>
        )}
      </Box>
      {isDrawerOpen && (
        <EditClinicalAsmntDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
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
          onSave={() => setIsSaveDialogOpen(true)}
          activityListData={activityListData}
          activityLoader={activityLoader}
          isDeleting={isDeleting}
          isUpdating={isUpdating}
          handleUpdateNotes={handleUpdateNotes}
          handleDeleteNotes={handleDeleteNotes}
          handleEditNoteClick={handleEditNoteClick}
          isNotesOpen={isNotesOpen}
          setIsNotesOpen={setIsNotesOpen}
        />
      )}

      {isSaveDialogOpen && (
        <ConfirmationDialog
          dialogBoxStatus={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          title={'Are you sure you want to save the changes?'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.primary.main, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.mdAntzNeutral, p: 4 }}
          confirmAction={updateAssessment} // Run actual add logic here
          loading={isSubmitLoading}
          ConfirmationText={'YES'}
          description={''}
        />
      )}
    </Box>
  )
}

export default ClinicalAssessment
