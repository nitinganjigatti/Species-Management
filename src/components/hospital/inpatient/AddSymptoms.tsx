'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Grid, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useParams, useSearchParams } from 'next/navigation'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { getSymptomsListForAdding, addSymptoms } from 'src/lib/api/hospital/symptoms'
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import SymptomsList from 'src/components/hospital/Symptoms/SymptomsList'
import SelectedSymptoms from 'src/components/hospital/Symptoms/SelectedSymptoms'
import AddSymptomDrawer from 'src/components/hospital/drawer/AddSymptomDrawer'
import AddComplaintDrawer from 'src/components/hospital/drawer/AddComplaintDrawer'
import Toaster from 'src/components/Toaster'
import { useDispatch, useSelector } from 'react-redux'
import { updateState } from 'src/store/slices/hospital/hospitalSlice'
import { checkAnimalStatusByType, getDiagnosisList } from 'src/lib/api/hospital/clinicalAssessment'
import AnimalInfoCard from 'src/views/pages/hospital/inpatient/AnimalInfoCard'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import SelectionTemplatePanel, { SaveMedicalTemplateSection } from './SelectionTemplatePanel'

const STORAGE_KEY = 'medical_record_data'

const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: any[]) => {
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
  const theme: any = useTheme()
  const router: any = useSafeRouter()
  const routerParams: any = useParams()
  const dispatch = useDispatch()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const id = routerParams?.id || router.query?.id
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}
  const [selectedSymptoms, setSelectedSymptoms] = useState<any[]>([])
  const [temporarilySelected, setTemporarilySelected] = useState<any>(null)
  const [symptomDrawerOpen, setSymptomDrawerOpen] = useState<boolean>(false)
  const [complaintDrawerOpen, setComplaintDrawerOpen] = useState<boolean>(false)
  const [severity, setSeverity] = useState<string>('Mild')
  const [durationValue, setDurationValue] = useState<number>(0)
  const [durationUnit, setDurationUnit] = useState<string>('Days')
  const [notes, setNotes] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [symptomsList, setSymptomsList] = useState<any[]>([])
  const [symptomsCount, setSymptomCount] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [pickerSearchQuery, setPickerSearchQuery] = useState<string>('')
  const [pickerList, setPickerList] = useState<any[]>([])
  const [pickerPage, setPickerPage] = useState<number>(1)
  const [pickerHasMore, setPickerHasMore] = useState<boolean>(true)
  const [pickerLoading, setPickerLoading] = useState<boolean>(false)
  const [pickerSearching, setPickerSearching] = useState<boolean>(false)
  const [searching, setSearching] = useState<boolean>(false)
  const [resetPagination, setResetPagination] = useState<boolean>(false)
  const [addLoading, setAddLoading] = useState<boolean>(false)
  const [patientData, setPatientData] = useState<any>(null)
  const [patientLoading, setPatientLoading] = useState<boolean>(false)
  const [isTabsLoading, setIsTabsLoading] = useState<boolean>(false)
  const [tabOptions, setTabOptions] = useState<any[]>([])
  const [currentTab, setCurrentTab] = useState<string>('')
  const [currentTabId, setCurrentTabId] = useState<string>('')
  const [isDuplicatesErrorModelOpen, setDuplicatesErrorModelOpen] = useState<boolean>(false)
  const [duplicateSymptoms, setDuplicateSymptoms] = useState<any[]>([])
  const [alreadySelectedIds, setAlreadySelectedIds] = useState<any[]>([])
  const [templateRefreshToken, setTemplateRefreshToken] = useState<number>(0)
  const medicalRecordId = medicalRecordData?.medical_record_id

  const initialLoadRef = useRef<boolean>(false)

  const loadedItemsRef = useRef<any>({})

  const isFetchingRef = useRef<boolean>(false)
  const isPickerFetchingRef = useRef<boolean>(false)

  const handleSymptomSelect = (symptom: any) => {
    setTemporarilySelected({ id: symptom.id, name: symptom.name })
    setSymptomDrawerOpen(true)
    setDurationValue(0)
    setNotes('')
    setDurationUnit('Days')
    setSeverity('Mild')
  }

  const addSymptomDetails = (details: any) => {
    setSelectedSymptoms((prev: any[]) => [...prev, { id: temporarilySelected.id, name: temporarilySelected.name, ...details }])
    setTemporarilySelected(null)
    setSymptomDrawerOpen(false)
    setDurationValue(0)
    setNotes('')
    setDurationUnit('Days')
    setSeverity('Mild')
  }

  const cancelSymptomSelection = () => {
    setTemporarilySelected(null)
    setSymptomDrawerOpen(false)
  }

  const removeSymptom = (symptomId: any) => {
    setSelectedSymptoms((prev: any[]) => prev.filter((s: any) => s.id !== symptomId))
  }

  const availableSymptoms = symptomsList.filter(
    (symptom: any) => !selectedSymptoms.some((s: any) => s.id === symptom.id) && temporarilySelected?.id !== symptom.id
  )

  const fetchSymptoms = useCallback(
    async (query: string = '', pageNo: number = 1, append: boolean = false, categoryId: string = '') => {
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
          animal_id: patientData?.animal_detail?.animal_id || '',
          limit: 20
        }

        const response: any = await getSymptomsListForAdding(params)

        if (response.success) {
          const newResults = response?.data?.result || []
          const totalRecords = response?.data?.totalRecords || 0
          const currentPage = response?.data?.currentPage || pageNo
          const totalPages = response?.data?.totalPages || Math.ceil(totalRecords / 20)

          const key = `${categoryId || 'all'}_${query || 'noquery'}`
          const currentLoadedCount = (loadedItemsRef.current[key] || 0) + newResults.length
          loadedItemsRef.current[key] = currentLoadedCount

          setSymptomsList((prev: any[]) => {
            if (!append) return newResults

            const combined = [...prev, ...newResults]

            const unique = combined.reduce((acc: any[], current: any) => {
              const x = acc.find((item: any) => item.id === current.id)
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

          if (pageNo === 1 && response?.data?.selected_ids) {
            setAlreadySelectedIds(response.data.selected_ids)
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

  const fetchPickerSymptoms = useCallback(
    async (query: string = '', pageNo: number = 1, append: boolean = false, categoryId: string = '') => {
      if (isPickerFetchingRef.current) return

      try {
        isPickerFetchingRef.current = true

        if (pageNo === 1) {
          setPickerSearching(true)
        } else {
          setPickerLoading(true)
        }

        const params = {
          page_no: pageNo,
          type: 'complaints',
          q: query,
          category_id: categoryId || '',
          request_from: 'hospital_module',
          animal_id: patientData?.animal_detail?.animal_id || '',
          limit: 20
        }

        const response: any = await getSymptomsListForAdding(params)

        if (response.success) {
          const newResults = response?.data?.result || []
          const totalRecords = response?.data?.totalRecords || 0
          const currentPage = response?.data?.currentPage || pageNo
          const totalPages = response?.data?.totalPages || Math.ceil(totalRecords / 20)

          setPickerList((prev: any[]) => {
            if (!append) return newResults

            const combined = [...prev, ...newResults]

            return combined.reduce((acc: any[], current: any) => {
              const exists = acc.find((item: any) => item.id === current.id)
              if (!exists) return acc.concat([current])

              return acc
            }, [])
          })

          setPickerHasMore(currentPage < totalPages && newResults.length > 0)

          if (newResults.length > 0) {
            setPickerPage(currentPage)
          }
        }
      } catch (error) {
        setPickerHasMore(false)
      } finally {
        setPickerLoading(false)
        setPickerSearching(false)
        isPickerFetchingRef.current = false
      }
    },
    [patientData?.animal_detail?.animal_id]
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

      const res: any = await getDiagnosisList(params)
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
          fetchPickerSymptoms('', 1, false, firstCategory?.id || '')
        }
      }
    } catch (error) {
      setTabOptions([])
    } finally {
      setIsTabsLoading(false)
    }
  }, [patientData?.medical_record_id, currentTabId, fetchSymptoms, fetchPickerSymptoms])

  const debouncedSearch = useDebounce((query: string, categoryId: string) => {
    setResetPagination(true)
    setPage(1)
    setSearchQuery(query)

    const key = `${categoryId || 'all'}_${query || 'noquery'}`
    loadedItemsRef.current[key] = 0
    fetchSymptoms(query, 1, false, categoryId || currentTabId)
  }, 500)

  const debouncedPickerSearch = useDebounce((query: string, categoryId: string) => {
    setPickerPage(1)
    setPickerSearchQuery(query)
    fetchPickerSymptoms(query, 1, false, categoryId || currentTabId)
  }, 500)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (resetPagination || loading || !hasMore || isFetchingRef.current) return

    const target = e.target as HTMLElement
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100

    if (bottom) {
      const nextPage = page + 1
      fetchSymptoms(searchQuery, nextPage, true, currentTabId)
    }
  }

  const handleTemplatePickerSearchChange = (value: string) => {
    setPickerSearchQuery(value)
    debouncedPickerSearch(value, currentTabId)
  }

  const handleTemplatePickerLoadMore = useCallback(() => {
    if (pickerLoading || !pickerHasMore || isPickerFetchingRef.current) return

    const nextPage = pickerPage + 1
    fetchPickerSymptoms(pickerSearchQuery, nextPage, true, currentTabId)
  }, [currentTabId, fetchPickerSymptoms, pickerHasMore, pickerLoading, pickerPage, pickerSearchQuery])

  useEffect(() => {
    const getPatientInfo = async () => {
      if (!id || initialLoadRef.current) return

      setPatientLoading(true)
      try {
        const res: any = await getPatientDetails(id)
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

  const handleTabChange = (tabValue: string, tabId: string) => {
    setCurrentTab(tabValue)
    setCurrentTabId(tabId)
    setPage(1)
    setSymptomsList([])
    setPickerList([])
    setHasMore(true)
    setPickerHasMore(true)

    const key = `${tabId || 'all'}_${searchQuery || 'noquery'}`
    loadedItemsRef.current[key] = 0

    fetchSymptoms(searchQuery, 1, false, tabId)
    fetchPickerSymptoms(pickerSearchQuery, 1, false, tabId)
  }

  const checkDuplicateSymptoms = async (symptomItems: any[]) => {
    try {
      const payload = {
        type: 'complaint',
        animal_ids: JSON.stringify([Number(patientData?.animal_detail?.animal_id)]),
        master_ids: JSON.stringify((symptomItems || []).map((s: any) => s.id))
      }
      const response: any = await checkAnimalStatusByType(payload)

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
    const submittableSymptoms = selectedSymptoms.filter((symptom: any) => !alreadySelectedIds.includes(symptom?.id))

    try {
      if (selectedSymptoms.length === 0) {
        Toaster({ type: 'error', message: 'Please select at least one Symptom' })

        return
      }

      if (submittableSymptoms.length === 0) {
        Toaster({ type: 'error', message: 'All selected symptoms are already prescribed' })

        return
      }

      const duplicatesData: any = await checkDuplicateSymptoms(submittableSymptoms)

      if (duplicatesData?.length > 0) {
        setDuplicatesErrorModelOpen(true)

        return
      }

      const complaints = submittableSymptoms.map((symptom: any) => ({
        id: symptom.id,
        name: symptom.name,
        additional_info: {
          severity: symptom.severity || 'Mild',
          notes: symptom.notes || '',
          active_at: '',
          duration: symptom.durationValue == 0 ? '' : String(symptom.durationValue || ''),
          duration_unit: symptom.durationUnit || 'Days',
          status: 'active',
          comment_list: [],
          recorded_date_time: symptom.recordedDateTime || new Date().toISOString()
        }
      }))

      const formData = new FormData()
      formData.append('medical_record_id', patientData?.medical_record_id)
      formData.append('animal_id', JSON.stringify([Number(patientData?.animal_detail?.animal_id)]))
      formData.append('complaints', JSON.stringify(complaints))
      formData.append('hospital_case_id', id)

      const response: any = await addSymptoms(formData)

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

  const handleComplaintAdded = (symptom: any) => {
    handleSymptomSelect(symptom)

    fetchDiagnosisTypes()

    const key = `${currentTabId || 'all'}_${searchQuery || 'noquery'}`
    loadedItemsRef.current[key] = 0
    fetchSymptoms(searchQuery, 1, false, currentTabId)
  }

  const handleRouterNavigation = () => {
    router.back()
  }

  const handleAIDDisplay = () => {
    if (patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value) {
      return patientData?.animal_detail?.local_identifier_value
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
          {
            label:
              patientData?.animal_detail?.local_identifier_name && patientData?.animal_detail?.local_identifier_value
                ? patientData?.animal_detail?.local_identifier_name
                : 'AID',
            value: handleAIDDisplay()
          },
          { label: 'Health Status', value: patientData?.health_status || 'stable', isStatusCard: true },
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
            selectedSymptoms={selectedSymptoms.map((s: any) => s.id)}
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
            alreadySelectedIds={alreadySelectedIds}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <SelectionTemplatePanel
              templateType='complaints'
              selectedItems={selectedSymptoms}
              availableItems={pickerList.filter(
                (symptom: any) => !selectedSymptoms.some((s: any) => s.id === symptom.id) && temporarilySelected?.id !== symptom.id
              )}
              onApplyTemplate={setSelectedSymptoms}
              templateLabel='symptom template'
              mapTemplateItem={(item: any) => ({
                id: item?.id,
                name: item?.name,
                severity: 'Mild',
                durationValue: 0,
                durationUnit: 'Days',
                notes: '',
                status: 'active'
              })}
              pickerSearchValue={pickerSearchQuery}
              onPickerSearchChange={handleTemplatePickerSearchChange}
              onPickerLoadMore={handleTemplatePickerLoadMore}
              pickerLoading={pickerLoading || pickerSearching}
              pickerHasMore={pickerHasMore}
              refreshToken={templateRefreshToken}
              onTemplatesChanged={() => setTemplateRefreshToken((prev: number) => prev + 1)}
            />
            <SelectedSymptoms
              selected={selectedSymptoms}
              onRemove={removeSymptom}
              severity={severity}
              {...({
                alreadySelectedIds: alreadySelectedIds,
                footer: (
                  <SaveMedicalTemplateSection
                    templateType='complaints'
                    selectedItems={selectedSymptoms}
                    templateLabel='symptom template'
                    itemLabel='symptoms'
                    refreshToken={templateRefreshToken}
                    onTemplateSaved={() => setTemplateRefreshToken((prev: number) => prev + 1)}
                  />
                )
              } as any)}
            />
          </Box>
        </Grid>
      </Grid>

      <BottomActionBar
        {...({
          onCancel: handleRouterNavigation,
          onSubmit: handleAddClick,
          loading: addLoading,
          disabled: addLoading,
          submitLabel: 'ADD',
          cancelLabel: 'CANCEL',
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
          }
        } as any)}
      >{undefined}</BottomActionBar>
      <ConfirmationDialog
        dialogBoxStatus={isDuplicatesErrorModelOpen}
        title={`Symptoms${duplicateSymptoms?.length > 1 ? 's' : ''} already exists`}
        description={`Duplicate Symptoms: ${duplicateSymptoms?.map((item: any) => item?.diagnosis)?.join(', ')}`}
        additionalDescription={`To proceed choose a different Symptoms`}
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
          {...({
            admittedDate: patientData?.admitted_at,
            dischargedDate: patientData?.discharge_at,
            isDischarged: patientData?.status === 'discharge'
          } as any)}
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
