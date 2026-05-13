'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Box, Button, Typography, CircularProgress, Skeleton } from '@mui/material'
import { debounce } from 'lodash'
import { Add as AddIcon } from '@mui/icons-material'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Search from 'src/views/utility/Search'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import { useTheme } from '@mui/material/styles'
import { getSymptomsList } from 'src/lib/api/hospital/symptoms'
import SymptomsCard from 'src/views/pages/hospital/inpatient/SymptomsCard'
import ClinicalAssessmentShimmer from 'src/views/pages/hospital/inpatient/shimmer/ClinicalAssessmentShimmer'
import { useSelector } from 'react-redux'
import NoMedicalData from 'src/views/utility/NoMedicalData'
import { GetSymptomRecordResponse, GetSymptomsCardParams, GetSymptomsCardResponse } from 'src/types/hospital/api/Inpatient/symptoms'
import { Id, SymptomList, SymptomStatus } from 'src/types/hospital/models'

const STORAGE_KEY = 'medical_record_data'

interface SymptomsProps {
  selectedTab?: string
  patientData?: any
  overviewData?: any
  category?: string
}

export type StatusKey = 'Active' | 'Resolved' | 'All' 
export type Params = {
  id: string
  medical_record_id: string
}

const Symptoms = ({ selectedTab, patientData, overviewData, category }: SymptomsProps = {}) => {
  const { t } = useTranslation()
  const router: any = useRouter()
  const params = useParams() as Params
  const searchParams: any = useSearchParams()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const id = params?.id
  const isCurrentMedicalRecordOnly = searchParams?.get('isCurrentMedicalRecordOnly')

  const isDischared = overviewData?.status === 'discharge'
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}
  const [currentTab, setCurrentTab] = useState<StatusKey>('Active')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentRecordOnly, setCurrentRecordOnly] = useState<boolean>(isCurrentMedicalRecordOnly === 'true')
  const [records, setRecords] = useState<any[]>([])
  const [recordTypeCount, setRecordTypeCount] = useState<any>({})
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false)
  const [totalRecordsCount, setTotalRecordsCount] = useState<number>(0)
  const [isSwitchToggle, setIsSwitchToggle] = useState<boolean>(false)

  const animalId = medicalRecordData?.animal_id
  const medicalRecordId = medicalRecordData?.medical_record_id
  const theme: any = useTheme()
  const observerRef = useRef<IntersectionObserver | null>(null)

  const tabs: StatusKey[] = ['Active', 'Resolved', 'All']

  const tabTypeMap: Record<StatusKey, SymptomStatus> = {
    Active: 'active',
    Resolved: 'closed',
    All: 'all'
  }

  const getCurrentTabCount = () => {
    return recordTypeCount?.[tabTypeMap[currentTab]] || 0
  }

  const fetchSymptoms = async (query: string = '', newPage: number = 1, append: boolean = false) => {
    try {
      if (animalId !== undefined) {
        if (newPage === 1) setLoading(true)
        else setIsFetchingMore(true)

        const params: GetSymptomsCardParams = {
          type: tabTypeMap[currentTab],
          page_no: newPage,
          limit: 20,
          medical_type: 'complaint',
          q: query,
          hospital_case_id: id
        }

        if (currentRecordOnly && medicalRecordId) {
          params.medical_record_id = medicalRecordId
        }

        const response: GetSymptomsCardResponse = await getSymptomsList(animalId, params)

        if (response.success === true) {
          if (newPage > 1 && response?.data?.result?.length === 0) {
            return
          }
          setRecords((prevRecords: GetSymptomsCardResponse[]) =>
            append ? [...prevRecords, ...response?.data?.result] : response?.data?.result || []
          )
          setTotalRecordsCount(response?.data?.all || 0)
          setRecordTypeCount(response?.data)
          setTotalCount(response?.data?.total_count || 0)
        }
      }
    } catch (error) {
      console.error('Error fetching symptoms:', error)
    } finally {
      setLoading(false)
      setIsFetchingMore(false)
    }
  }

  const debouncedFetchSymptoms = useCallback(
    debounce((query: string) => {
      setPage(1)
      fetchSymptoms(query, 1, false)
    }, 500),
    [currentTab, patientData, animalId, currentRecordOnly]
  )

  const handleTabChange = (newValue: StatusKey) => {
    setCurrentTab(newValue)
    setPage(1)
    setRecords([])
    setRecordTypeCount({})
  }

  useEffect(() => {
    if (selectedTab === 'symptoms') {
      setPage(1)
      if (searchQuery.trim()) {
        debouncedFetchSymptoms(searchQuery.trim())
      } else {
        debouncedFetchSymptoms.cancel()
        fetchSymptoms('', 1, false)
      }
    }
  }, [selectedTab, currentTab, searchQuery, currentRecordOnly, patientData, animalId])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    const observer = new IntersectionObserver(entries => {
      const firstEntry = entries[0]
      const currentTabCount = getCurrentTabCount()
      if (
        firstEntry.isIntersecting &&
        !isFetchingMore &&
        !loading &&
        records.length > 0 &&
        records?.length < currentTabCount
      ) {
        const nextPage = page + 1
        setPage(nextPage)
        fetchSymptoms(searchQuery.trim(), nextPage, true)
      }
    })

    const scrollTrigger = document.getElementById('infinite-scroll-trigger')
    if (scrollTrigger) observer.observe(scrollTrigger)

    observerRef.current = observer

    return () => observer.disconnect()
  }, [page, loading, searchQuery, records, isFetchingMore, currentTab, recordTypeCount])

  const handleSearchClear = () => {
    setSearchQuery('')
  }

  const handleRouterNavigation = () => {
    if (category === 'Outpatients') {
      router.push(`/hospital/outpatient/${id}/add-symptoms`)
    } else if (category === 'Discharged') {
      router.push(`/hospital/discharged/${id}/add-symptoms`)
    } else if (category === 'Mortality') {
      router.push(`/hospital/mortality/${id}/add-symptoms`)
    } else if (category === 'Follow Up') {
      router.push(`/hospital/followup/${id}/add-symptoms`)
    } else {
      router.push(`/hospital/inpatient/${id}/add-symptoms`)
    }
  }

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1)
    setRecords([])
    setIsSwitchToggle(true);
    setCurrentRecordOnly(e.target.checked)

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('isCurrentMedicalRecordOnly', String(e.target.checked))
    router.push(`/hospital/inpatient/${id}?${newSearchParams.toString()}`)
  }

  return (
    <Box>
      {isSwitchToggle && currentRecordOnly && loading ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 6, mt: 6 }}>
            <Skeleton width={250} height={30} variant='rounded' />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', m: 0 }}>
            <ClinicalAssessmentShimmer count={3} />
          </Box>
        </>
      ) : totalRecordsCount > 0 || searchQuery.trim().length > 0 ? (
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
                  {tabs.map((tab) => {
                    const countKey = tabTypeMap[tab]
                    const tabCount = recordTypeCount?.[countKey] || 0

                    return (
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
                            currentTab === tab
                              ? theme.palette.secondary.dark
                              : theme.palette.customColors.mdAntzNeutral,
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
                          {t(`hospital_module.status_${tab.toLowerCase()}`)} - {tabCount}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Box>

            {/* {!isDischared && ( */}
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <Search
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  onClear={handleSearchClear}
                />
                <Button variant='contained' startIcon={<AddIcon />} onClick={handleRouterNavigation}>
                  {t('hospital_module.add_new')}
                </Button>
              </Box>
            {/* )} */}
          </Box>
          <Box>
            <MUISwitch
              label={(t('hospital_module.current_medical_record_only') as string)}
              checked={currentRecordOnly}
              onChange={handleSwitchChange}
              size='small'
              sx={{ ml: 2.6 }}
            />
          </Box>
        </Box>
      ) : (
        !loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              my: 6
            }}
          >
            <MUISwitch
              label={(t('hospital_module.current_medical_record_only') as string)}
              checked={currentRecordOnly}
              onChange={handleSwitchChange}
              size='small'
              sx={{ ml: 2.6 }}
            />
          </Box>
        )
      )}

      {/* Empty State */}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', py: 2 }}>
            <ClinicalAssessmentShimmer count={5} />
          </Box>
        ) : !loading && records?.length === 0 ? (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <NoMedicalData
              btnText={t('hospital_module.add_symptom')}
              text={t('hospital_module.symptoms_appear_here')}
              // isDischarged={isDischared}
              btnAction={handleRouterNavigation}
            />
          </Box>
        ) : (
          records.map((record: SymptomList, index: number) => (
            <SymptomsCard
              key={index}
              record={record}
              setPage={setPage}
              {...({ isDifferential: record.type === 'Tentative' } as any)}
              isResolved={record.status === 'closed'}
              fetchSymptoms={fetchSymptoms}
              patientData={patientData}
              isDischared={isDischared}
            />
          ))
        )}

        <Box
          id='infinite-scroll-trigger'
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 1
          }}
        >
          {isFetchingMore && <CircularProgress size={24} />}
        </Box>

        {!loading && !isFetchingMore && records?.length > 10 && (
          <Typography sx={{ textAlign: 'center', color: theme.palette.text.disabled }}>
            {t('hospital_module.no_more_symptoms_to_load')}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default Symptoms
