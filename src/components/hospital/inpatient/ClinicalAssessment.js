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
import { getClinicalAssessments, updateClinicalAssessment } from 'src/lib/api/hospital/clinicalAssessment'
import EditClinicalAsmntDrawer from '../drawer/EditClinicalAsmntDrawer'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import ConfirmationDialog from 'src/components/confirmation-dialog'

const PAGE_SIZE = 10

const ClinicalAssessment = () => {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState('Active')
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [currentRecordOnly, setCurrentRecordOnly] = useState(false)
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

  const [clinicalAsmnt, setClinicalAsmnt] = useState('')
  const [prognosisVal, setPrognosisValue] = useState('')
  const [chronicVal, setChronicVal] = useState(false)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('active')
  const [temporarilySelected, setTemporarilySelected] = useState(null)

  const { id, animal_id, medical_record_id } = router.query

  const theme = useTheme()

  const tabs = ['Active', 'Resolved', 'All']

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
          q: search,
          medical_record_id: currentRecordOnly && medical_record_id ? medical_record_id : ''
        })

        if (res.success) {
          const newItems = res.data?.result || []
          const totalCount = parseInt(res.data?.totalMedicalRecordCount || 0)

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
    [currentRecordOnly, id]
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
    fetchClinicalAssessments(1, searchQuery, getStatusFilter())
  }, [searchQuery, currentTab, currentRecordOnly, fetchClinicalAssessments, getStatusFilter])

  const handleTabChange = newValue => {
    setCurrentTab(newValue)
    setPage(1)
    setRecords([])
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

  const handleAssessmentClick = assessment => {
    setSelectedAssessment(assessment)
    setTemporarilySelected(assessment)
    setClinicalAsmnt(assessment?.additional_info?.clinical_assessment || 'primary')
    setPrognosisValue(
      assessment?.additional_info?.prognosis
        ? Utility.capitalizeFirstLetter(assessment.additional_info.prognosis)
        : 'Good'
    )
    setChronicVal(assessment?.additional_info?.isChronic ? 'Yes' : 'No')
    setNotes(assessment?.additional_info?.note || '')
    setStatus(
      assessment?.additional_info?.status ? Utility.capitalizeFirstLetter(assessment.additional_info.status) : 'Active'
    )
    setIsDrawerOpen(true)
  }

  const updateAssessment = async () => {
    const payload = {
      main_id: selectedAssessment?.id || '',
      med_id: medical_record_id || '',
      type: clinicalAsmnt?.toUpperCase() || '',
      is_system_generated: false,
      animal_id: animal_id || '',
      note: notes || '',
      clinical_assessment: clinicalAsmnt?.toLowerCase() || '',
      prognosis: prognosisVal.toLowerCase() || 'good',
      isChronic: chronicVal === 'Yes',
      status: status?.toLowerCase() || ''
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
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' }) // TODO: Replace with actual error message
      }
    } catch (error) {
      console.error('Submit Error:', error)
      Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' }) // TODO: Replace with actual error message
    } finally {
      setIsSubmitLoading(false)
    }
  }

  return (
    <Box>
      {/* Header with Tabs and Controls */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 6,
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
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() =>
                router.push(
                  `/hospital/inpatient/${id}/add-clinical-assessment?animalId=${animal_id}&medicalRecordId=${medical_record_id}`
                )
              }
            >
              ADD NEW
            </Button>
          </Box>
        </Box>

        <MUISwitch
          label='Current Medical Record Only'
          checked={currentRecordOnly}
          onChange={e => setCurrentRecordOnly(e.target.checked)}
          size='small'
          sx={{ ml: 2.6 }}
        />
      </Box>

      {/* Records List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filteredRecords.map((record, index) => (
          <ClinicalAssessmentCard
            key={record.id || index}
            record={record}
            isDifferential={record.clinical_assessment === 'differential'}
            isResolved={record.additional_info?.status === 'closed'}
            handleClick={() => handleAssessmentClick(record)}
          />
        ))}

        {/* Loading State */}
        {isLoading && filteredRecords.length === 0 && (
          <Box display='flex' justifyContent='center' py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Infinite Scroll Loader */}
        {(isLoading || hasMore) && filteredRecords.length > 0 && (
          <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && filteredRecords.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 4, color: theme.palette.text.secondary }}>
            No clinical assessments found
          </Typography>
        )}

        {/* End of List */}
        {!hasMore && filteredRecords.length > 0 && (
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
