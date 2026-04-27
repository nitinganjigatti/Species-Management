'use client'

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Box, Button, Typography, CircularProgress, Skeleton } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import Search from 'src/views/utility/Search'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import { useTheme } from '@mui/material/styles'
import { useParams, useSearchParams } from 'next/navigation'
import useSafeRouter from 'src/hooks/useSafeRouter'
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
import { useSelector } from 'react-redux'
import NoMedicalData from 'src/views/utility/NoMedicalData'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const PAGE_SIZE = 10
const STORAGE_KEY = 'medical_record_data'

interface ClinicalAssessmentProps {
  overviewData?: any
  patientData?: any
  category?: string
}

const ClinicalAssessment = ({ overviewData, patientData, category }: ClinicalAssessmentProps) => {
  const { t } = useTranslation()
  const router: any = useSafeRouter()
  const routerParams: any = useParams()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const id = routerParams?.id
  const { isCurrentMedicalRecordOnly } = router.query
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}
  const [currentTab, setCurrentTab] = useState<string>('Active')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [currentRecordOnly, setCurrentRecordOnly] = useState<boolean>(isCurrentMedicalRecordOnly === 'true')
  const [records, setRecords] = useState<any[]>([])
  const [tabCounts, setTabCounts] = useState<any>({ Active: 0, Resolved: 0, All: 0 })
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false)
  const [activityListData, setActivityListData] = useState<any>()
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [noteRecord, setNoteRecord] = useState<any>(null)
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false)
  const [activityLoader, setActivityLoader] = useState<boolean>(false)
  const [recordedDateTime, setRecordedDateTime] = useState<any>(dayjs())
  const [isSwitchToggle, setIsSwitchToggle] = useState<boolean>(false)

  const [clinicalAsmnt, setClinicalAsmnt] = useState<string>('')
  const [prognosisVal, setPrognosisValue] = useState<string>('')
  const [chronicVal, setChronicVal] = useState<any>(false)
  const [status, setStatus] = useState<string>('active')
  const [notes, setNotes] = useState<string>('')
  const [temporarilySelected, setTemporarilySelected] = useState<any>(null)

  const animal_id = medicalRecordData?.animal_id
  const medical_record_id = medicalRecordData?.medical_record_id
  const isDischared = overviewData?.status === 'discharge'

  const theme: any = useTheme()

  const tabs = ['Active', 'Resolved', 'All']

  const handleUpdateNotes = async (newNotes?: any) => {
    if (!selectedAssessment) return
    setIsUpdating(true)

    try {
      const payload: any = {
        main_id: selectedAssessment?.main_diagnosis_id,
        med_id: selectedAssessment?.medical_record_id,
        type: 'DIAGNOSIS',
        note: notes || '',
        note_id: noteRecord?.note_id || '',
        hospital_case_id: id || ''
      }
      const response: any = await updateNotes(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Notes updated successfully.' })
        setNotes('')
        setIsNotesOpen(false)
        setNoteRecord(null)
        setIsDrawerOpen(false)

        fetchClinicalAssessments(1, searchQuery, getStatusFilter())
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
      const response: any = await deleteNote(noteRecord?.note_id, payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Notes deleted successfully.' })
        setNotes('')
        setIsNotesOpen(false)
        setNoteRecord(null)
        setIsDrawerOpen(false)

        fetchClinicalAssessments(1, searchQuery, getStatusFilter())
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to delete notes.' })
      }
    } catch (error) {
      console.error('Error deleting notes:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditNoteClick = (item: any) => {
    setNoteRecord(item)
    setNotes(item?.note || '')
  }

  const debouncedSearch = useRef(
    debounce((searchValue: string) => {
      setSearchQuery(searchValue)
      setPage(1)
    }, 500)
  ).current

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

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

  const fetchClinicalAssessments = useCallback(
    async (pageNum: number = 1, search: string = '', status: string = '') => {
      setIsLoading(true)
      try {
        const res: any = await getClinicalAssessments({
          medical_type: 'diagnosis',
          page_no: pageNum,
          limit: PAGE_SIZE,
          animal_id: animal_id || '',
          hospital_case_id: id || '',
          q: search,
          medical_record_id: currentRecordOnly && medical_record_id ? medical_record_id : '',
          ...({ type: status } as any)
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
          setRecords((prev: any[]) => (pageNum === 1 ? newItems : [...prev, ...newItems]))
          setHasMore(newItems.length === PAGE_SIZE)
        } else {
          console.error(res.message || 'Failed to fetch clinical assessments')
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

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchClinicalAssessments(nextPage, searchQuery, getStatusFilter())
    }
  }, [isLoading, hasMore, page, searchQuery, getStatusFilter, fetchClinicalAssessments])

  const loaderRef = useInfiniteScroll(loadMore, isLoading, hasMore)

  useEffect(() => {
    if (animal_id) fetchClinicalAssessments(1, searchQuery, getStatusFilter())
  }, [searchQuery, currentTab, currentRecordOnly, fetchClinicalAssessments, getStatusFilter, animal_id])

  const handleTabChange = (newValue: string) => {
    setCurrentTab(newValue)
    setPage(1)
  }

  const filteredRecords = records

  const assessmentChangeState = useMemo(() => {
    if (!selectedAssessment) {
      return {
        isClinicalAsmntChanged: false,
        isPrognosisChanged: false,
        isChronicChanged: false,
        isStatusChanged: false,
        isNotesChanged: false,
        hasChanges: false
      }
    }

    const isDiagnosis = clinicalAsmnt?.toLowerCase() === 'diagnosis'
    const initialRecordedDateTime =
      selectedAssessment?.additional_info?.recorded_date_time || selectedAssessment?.created_at || null

    const isClinicalAsmntChanged =
      clinicalAsmnt?.toLowerCase() !== selectedAssessment?.clinical_assessment?.toLowerCase()

    const isPrognosisChanged = isDiagnosis
      ? prognosisVal?.toLowerCase() !== selectedAssessment?.additional_info?.prognosis?.toLowerCase()
      : false

    const isChronicChanged = isDiagnosis ? chronicVal !== selectedAssessment?.additional_info?.isChronic : false

    const isStatusChanged = status?.toLowerCase() !== selectedAssessment?.additional_info?.status?.toLowerCase()

    const isNotesChanged = (notes || '').trim() !== (selectedAssessment?.additional_info?.note || '').trim()

    const hasChanges =
      isClinicalAsmntChanged ||
      isPrognosisChanged ||
      isChronicChanged ||
      isStatusChanged ||
      isNotesChanged

    return {
      isClinicalAsmntChanged,
      isPrognosisChanged,
      isChronicChanged,
      isStatusChanged,
      isNotesChanged,
      hasChanges
    }
  }, [selectedAssessment, clinicalAsmnt, prognosisVal, chronicVal, status, notes, recordedDateTime])

  const getTabCount = (currentTab: string): any => {
    switch (currentTab) {
      case 'Active':
        return tabCounts.Active
      case 'Resolved':
        return tabCounts.Resolved
      case 'All':
        return tabCounts.All
      default:
        return tabCounts.All
    }
  }

  const handleAssessmentClick = async (assessment: any) => {
    setSelectedAssessment({
      ...assessment,
      additional_info: { ...assessment.additional_info, isChronic: assessment.additional_info.isChronic ? 'Yes' : 'No' }
    })
    setTemporarilySelected(assessment)
    setClinicalAsmnt(assessment?.additional_info?.clinical_assessment || 'primary')
    setPrognosisValue(
      assessment?.additional_info?.prognosis
        ? (Utility as any).capitalizeFirstLetter(assessment.additional_info.prognosis)
        : 'Favourable'
    )
    setChronicVal(assessment?.additional_info?.isChronic ? 'Yes' : 'No')
    setNotes(assessment?.additional_info?.note || '')
    setStatus(
      assessment?.additional_info?.status ? (Utility as any).capitalizeFirstLetter(assessment.additional_info.status) : 'Active'
    )
    setIsDrawerOpen(true)
    try {
      setActivityLoader(true)

      const params = {
        entity: 'diagnosis',
        medical_id: assessment?.medical_record_id || '',
        record_id: assessment?.main_diagnosis_id || ''
      }

      const response: any = await getNotes(params)

      if (response?.success) {
        setActivityListData(response?.data || [])
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to fetch notes.' })
      }
    } catch (error) {
      console.error('Error fetching notes for symptom:', error)
      Toaster({ type: 'error', message: t('hospital_module.an_error_occurred_while_fetching_notes') })
    } finally {
      setActivityLoader(false)
    }
  }

  const updateAssessment = async () => {
    const {
      isClinicalAsmntChanged,
      isPrognosisChanged,
      isChronicChanged,
      isStatusChanged,
      isNotesChanged,
      hasChanges
    } = assessmentChangeState

    if (!hasChanges) return

    const isSystemGenerated = isClinicalAsmntChanged || isPrognosisChanged || isChronicChanged || isStatusChanged

    const payload: any = {
      main_id: selectedAssessment?.main_diagnosis_id || '',
      med_id: selectedAssessment?.medical_record_id || '',
      type: 'DIAGNOSIS',
      is_system_generated: isSystemGenerated,
      animal_id: animal_id || '',
      hospital_case_id: id || '',
      recorded_date_time: recordedDateTime.format('YYYY-MM-DD HH:mm:ss')
    }

    if (isClinicalAsmntChanged) {
      payload.clinical_assessment = clinicalAsmnt?.toLowerCase() || ''
    }

    if (isPrognosisChanged && clinicalAsmnt?.toLowerCase() === 'diagnosis') {
      payload.prognosis = prognosisVal.toLowerCase()
    }

    if (isChronicChanged && clinicalAsmnt?.toLowerCase() === 'diagnosis') {
      payload.chronic = chronicVal === 'Yes' ? 1 : 0
    }

    if (isStatusChanged) {
      payload.status = status?.toLowerCase() === 'inactive' ? 'resolved' : 'active'
    }

    if (isNotesChanged) {
      payload.note = notes || ''
    }

    setIsSubmitLoading(true)

    try {
      const response: any = await updateClinicalAssessment(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Assessment updated successfully' })
        fetchClinicalAssessments(1, searchQuery, getStatusFilter())
        setIsDrawerOpen(false)
        setIsSaveDialogOpen(false)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
      }
    } catch (error: any) {
      console.error('Submit Error:', error)
      Toaster({ type: 'error', message: error.message || t('hospital_module.an_unexpected_error_occurred') })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleRouterNavigation = () => {
    if (category === 'Outpatients') {
      router.push(`/hospital/outpatient/${id}/add-clinical-assessment`)
    }
    else if(category === 'Discharged') {
      router.push(`/hospital/discharged/${id}/add-clinical-assessment`)
    }
    else if(category === 'Mortality') {
      router.push(`/hospital/mortality/${id}/add-clinical-assessment`)
    }
    else if(category === 'Follow Up') {
      router.push(`/hospital/followup/${id}/add-clinical-assessment`)
    }
    else {
      router.push(`/hospital/inpatient/${id}/add-clinical-assessment`)
    }
  }
  const handleRecordOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecords([])
    setPage(1)
    setIsSwitchToggle(true);
    setCurrentRecordOnly(e.target.checked)

    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, isCurrentMedicalRecordOnly: e.target.checked }
      },
      undefined,
      { shallow: true }
    )
  }

  return (
    <Box sx={{ mt: 6 }}>
      {isSwitchToggle  && isLoading && currentRecordOnly  && !searchQuery.trim() ? (
        <>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 6 }}>
          <Skeleton width={250} height={30} variant='rounded' />
        </Box>
        <Box sx = {{display: 'flex', flexDirection: 'column', m: 0}}>
          <ClinicalAssessmentShimmer count = {3}/>
        </Box>
        </>
      ) : tabCounts?.All !== 0 || searchQuery.trim().length > 0 ? (
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
                  {tabs.map((tab: string) => (
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
                        {`${tab === 'Active' ? t('hospital_module.active') : tab === 'Resolved' ? t('hospital_module.resolved') : t('hospital_module.all')} ${
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value
                  setLocalSearch(value)
                  debouncedSearch(value)
                }}
                onClear={() => {
                  setLocalSearch('')
                  debouncedSearch('')
                }}
              />
                <Button variant='contained' startIcon={<AddIcon />} onClick={handleRouterNavigation}>
                  {t('hospital_module.add_new')}
                </Button>
            </Box>
          </Box>
          <Box>
            <MUISwitch
              label={(t('hospital_module.current_medical_record_only') as string)}
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
            label={(t('hospital_module.current_medical_record_only') as string)}
            checked={currentRecordOnly}
            onChange={handleRecordOnlyChange}
            size='small'
            sx={{ ml: 2.6 }}
          />
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {isLoading && (filteredRecords?.length === 0 || !hasMore) && <ClinicalAssessmentShimmer count={5} />}
        {filteredRecords?.map((record: any, index: number) => (
          <ClinicalAssessmentCard
            key={record.id || index}
            record={record}
            patientData={patientData}
            {...({ isDifferential: record.clinical_assessment === 'tentative' } as any)}
            isResolved={record.additional_info?.status === 'closed'}
            isDischared={isDischared}
            handleClick={() => (isDischared ? null : handleAssessmentClick(record))}
          />
        ))}

        {(isLoading || hasMore) && filteredRecords.length > 0 && (
          <Box ref={loaderRef}>
            <ClinicalAssessmentShimmer count={1} />
          </Box>
        )}

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
              btnText={t('hospital_module.add_new_clinical_assessment')}
              text={t('hospital_module.all_added_clinical_assessments_appear_here')}
              btnAction={handleRouterNavigation}
            />
          </Box>
        )}

        {!hasMore && filteredRecords.length > 10 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            {t('hospital_module.no_more_assessments_to_load')}
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
          {...({
            isSubmitLoading: isSubmitLoading,
            onSave: updateAssessment,
            activityListData: activityListData,
            activityLoader: activityLoader,
            isDeleting: isDeleting,
            isUpdating: isUpdating,
            handleUpdateNotes: handleUpdateNotes,
            handleDeleteNotes: handleDeleteNotes,
            handleEditNoteClick: handleEditNoteClick,
            isNotesOpen: isNotesOpen,
            setIsNotesOpen: setIsNotesOpen,
            recordedDateTime: recordedDateTime,
            setRecordedDateTime: setRecordedDateTime,
            isChanged: assessmentChangeState.hasChanges,
            admittedDate: patientData?.admitted_at,
            dischargedDate: patientData?.discharge_at,
            isDischarged: patientData?.status === 'discharge',
            medical_record_id: medical_record_id
          } as any)}
        />
      )}

      {isSaveDialogOpen && (
        <ConfirmationDialog
          dialogBoxStatus={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          title={(t('hospital_module.save_changes_confirm') as string)}
          cancelText={t('cancel')}
          confirmBtnStyle={{ background: theme.palette.primary.main, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.mdAntzNeutral, p: 4 }}
          confirmAction={updateAssessment}
          loading={isSubmitLoading}
          ConfirmationText={t('yes')}
          description={''}
        />
      )}
    </Box>
  )
}

export default ClinicalAssessment
