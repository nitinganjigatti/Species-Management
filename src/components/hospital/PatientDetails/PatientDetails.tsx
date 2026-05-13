'use client'

import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography, Box, Tooltip } from '@mui/material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useState, Suspense, lazy, useMemo, useCallback, useEffect, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import PatientCard from 'src/views/pages/hospital/utility/PatientCard'
import CircularProgress from '@mui/material/CircularProgress'

import MenuIcon from '@mui/icons-material/Menu'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import { getPatientDetails } from 'src/lib/api/hospital/incomingPatient'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { updateState, resetState } from 'src/store/slices/hospital/hospitalSlice'
import { useHospital } from 'src/context/HospitalContext'
import { getAnimalTotalHospitalVisits } from 'src/lib/api/hospital/inpatient'
import { getHospitalListing } from 'src/lib/api/hospital/hospitalAnalytics'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { write } from 'src/lib/windows/utils'
import { AuthContext } from 'src/context/AuthContext'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import { PatientDetailFilters } from 'src/types/hospital/api/Inpatient/inpatient'
import { TotalVisitsResponse } from 'src/types/hospital/api/Inpatient/visitHistory'
import type { PatientDetailsResponse } from 'src/types/hospital/api'

const STORAGE_KEY = 'medical_record_data'

const useDrawerState = () => {
  const router = useSafeRouter()

  const [drawerType, setDrawerType] = useState<any>(null)
  const [drawerData, setDrawerData] = useState<any>(null)

  const openDrawer = useCallback((type: any, data: any = null) => {
    setDrawerType(type)
    setDrawerData(data)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerType(null)
    setDrawerData(null)
  }, [])

  return {
    drawerType,
    drawerData,
    openDrawer,
    closeDrawer,
    setDrawerType,
    setDrawerData
  }
}
const lazyAny: any = lazy
const InpatientOverview = lazyAny(() => import('src/views/pages/hospital/inpatient/InpatientOverview'), { ssr: false })
const InpatientMedicalSummary = lazyAny(() => import('src/components/hospital/inpatient/InpatientMedicalSummary'), { ssr: false })
const TreatmentLayout = lazyAny(() => import('src/components/hospital/TreatmentMonitoring/TreatmentLayout'), { ssr: false })
const Symptoms = lazyAny(() => import('src/components/hospital/inpatient/Symptoms'), { ssr: false })
const ClinicalAssessment = lazyAny(() => import('src/components/hospital/inpatient/ClinicalAssessment'), { ssr: false })
const ClinicalNotes = lazyAny(() => import('src/components/hospital/inpatient/ClinicalNotes'), { ssr: false })
const OtherTreatments = lazyAny(() => import('src/components/hospital/inpatient/OtherTreatments/index'), { ssr: false })
const PrescriptionLayout = lazyAny(() => import('src/components/hospital/prescriptionMonitoring/PrescriptionLayout'), { ssr: false })
const Anesthesia = lazyAny(() => import('src/components/hospital/inpatient/Anesthesia'), { ssr: false })
const InpatientSurgery = lazyAny(() => import('src/views/pages/hospital/inpatient/InpatientSurgery'), { ssr: false })
const PatientMedia = lazyAny(() => import('src/components/hospital/inpatient/PatientMedia'), { ssr: false })
const InpatientDischarge = lazyAny(() => import('src/components/hospital/discharge'), { ssr: false })

interface PatientDetailsProps {
  category?: any
  params?: any
}

export type TabItem = {
  label: string
  value: string
  component: React.ComponentType
}

const PatientDetails = ({ category, params }: PatientDetailsProps) => {
  const router: any = useSafeRouter()
  const theme: any = useTheme()
  const authData: any = useContext(AuthContext)
  const { t } = useTranslation()

  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { selectedHospital, updateSelectedHospital, updateHospitalStatus } = useHospital() as any
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData = hospitalData[STORAGE_KEY] || {}
  const medical_record_id = medicalRecordData?.medical_record_id
  const animal_id = medicalRecordData?.animal_id

  // Support both app router (params prop) and pages router (router.query)
  const { id: idFromParams } = (params as any) || {}
  const { id: idFromQuery, tab: urlTab } = router.query as any
  const id = idFromParams || idFromQuery

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<string>('checking')
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)

  const openMenu = Boolean(anchorEl)

  const [filters, setFilters] = useState<PatientDetailFilters>({
    page: 1,
    limit: 10
  })

  useEffect(() => {
    const { page = '1', limit = '10' } = router.query as PatientDetailFilters

    setFilters({
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })
  }, [router.query])

  const {
    data: patientResponseRaw,
    isLoading: patientLoading,
    refetch: refetchPatient,
    isError,
    error
  } = useQuery({
    queryKey: ['patientDetails', id],
    queryFn: () => getPatientDetails(id),
    enabled: !!id // only run when id exists and has hospital permission
  })

  const patientResponse = patientResponseRaw as PatientDetailsResponse | undefined

  // Initialize medical record data when patient details are loaded
  useEffect(() => {
    if (patientResponse?.data) {
      dispatch(updateState({
        key: STORAGE_KEY,
        value: {
          ...medicalRecordData,
          animal_id: patientResponse.data?.animal_detail?.animal_id,
          medical_record_id: patientResponse.data?.medical_record_id,
          animal_admitted_date: patientResponse.data?.admitted_at,
          purpose_of_visit: patientResponse.data?.purpose_of_visit,
          discharge_at: patientResponse.data?.discharge_at,
          site_id: patientResponse?.data?.animal_detail?.site_id,
          hospital_case_id: patientResponse?.data?.hospital_case_id,
          status: patientResponse?.data?.status
        }
      }))
    }
  }, [patientResponse?.data, dispatch])

  const patientData = patientResponse?.data
  const animalData = patientResponse?.data?.animal_detail || {}
  const hospitalCaseId = id || ''
  const animalIdParam = animal_id || ''
  const medicalRecordIdParam = medical_record_id || ''

  const isPatientDischarged = patientData?.status === 'discharge'

  const overviewData = patientResponse
    ? {
        active_complaints_count: patientResponse.data?.active_complaints_count,
        active_diagnosis_count: patientResponse.data?.active_diagnosis_count,
        active_prescriptions_count: patientResponse.data?.active_prescriptions_count,
        treatment_monitoring: patientResponse.data?.treatment_monitoring,
        purpose_of_visit: patientResponse.data?.purpose_of_visit,
        created_by_full_name: patientResponse.data?.created_by_full_name,
        created_at: patientResponse.data?.created_at,
        created_by_profile_pic: patientResponse.data?.created_by_profile_pic,
        reason_for_admission: patientResponse.data?.reason_for_admission,
        status: patientResponse.data?.status,
        category: category,
        transfer_by_full_name: patientResponse?.data?.transfer_by_full_name,
        transfer_by_profile_pic: patientResponse?.data?.transfer_by_profile_pic,
        transfer_created_at: patientResponse?.data?.transfer_created_at
      }
    : {}

  useEffect(() => {
    if (!patientData) return

    const patientHospitalId = patientData?.hospital_id

    if (!selectedHospital?.id && patientHospitalId) {
      updateSelectedHospital({ id: patientHospitalId })
      // setPermissionStatus('allowed')
      return
    }

    if (selectedHospital?.id && patientHospitalId) {
      if (String(patientHospitalId) === String(selectedHospital.id)) {
        setPermissionStatus('allowed')
      } else {
        setPermissionStatus('denied')
        setShowConfirmation(true)
      }
    }
  }, [patientData, selectedHospital?.id])

  const handleAccessRestrictedConfirmation = () => {
    setShowConfirmation(false)
    updateSelectedHospital(null)
    write('selectedHospital', null)

    // updateHospitalStatus(null)

    // Invalidate ALL queries that start with 'hospitals-inpatient'
    ;(queryClient.invalidateQueries as any)(
      {
        queryKey: ['hospitals-listing-inpatient']
      },
      {
        type: 'all' // This will invalidate all queries with this prefix
      }
    )
    router.back()
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const resolvedAnimalId = patientResponse?.data?.animal_detail?.animal_id

  const { data: hospitalVisit, isFetching: patientVisitFetching } = useQuery<TotalVisitsResponse>({
    queryKey: ['animal-total-hospital-visit', resolvedAnimalId, selectedHospital?.id, id, filters],
    queryFn: () =>
      getAnimalTotalHospitalVisits({
        page_no: filters.page,
        limit: filters.limit,
        animal_id: resolvedAnimalId ?? '',
        hospital_id: selectedHospital?.id,
        hospital_case_id: id
      }),

    enabled: permissionStatus === 'allowed' && Boolean(resolvedAnimalId && selectedHospital?.id && id),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
  } as any)

  const totalVisitCount = (hospitalVisit as any)?.data?.total_records || 0

  // Lazy load all components

  const TabContentLoader = () => (
    <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px' flexDirection='column' gap={2}>
      <CircularProgress size={40} />
    </Box>
  )

  const tabConfig = useMemo<TabItem[]>(
    () => [
      { label: t('hospital_module.overview'), value: 'overview', component: InpatientOverview },
      { label: t('hospital_module.symptoms'), value: 'symptoms', component: Symptoms },
      { label: t('hospital_module.clinical_assessment'), value: 'clinicalAssessment', component: ClinicalAssessment },
      { label: t('hospital_module.prescription'), value: 'prescriptionMonitoring', component: PrescriptionLayout },
      { label: t('hospital_module.clinical_notes'), value: 'clinicalNotes', component: ClinicalNotes },
      { label: t('hospital_module.other_treatments'), value: 'otherTreatments', component: OtherTreatments },
      { label: t('hospital_module.monitoring'), value: 'treatmentMonitoring', component: TreatmentLayout },
      { label: t('hospital_module.medical_summary'), value: 'medicalSummary', component: InpatientMedicalSummary },
      { label: t('hospital_module.anesthesia'), value: 'anesthesia', component: Anesthesia },
      { label: t('hospital_module.surgery'), value: 'surgery', component: InpatientSurgery },
      { label: t('hospital_module.media'), value: 'media', component: PatientMedia },
      { label: t('hospital_module.discharge'), value: 'discharge', component: InpatientDischarge }
    ],
    [t]
  )

  const [selectedTab, setSelectedTab] = useState<string>(tabConfig[0].value)

  // Effect to handle URL tab parameter - set initial tab from URL
  useEffect(() => {
    if (urlTab) {
      // Find if the URL tab exists in our tabConfig
      const matchingTab = tabConfig.find((tab: TabItem) => tab.value === urlTab)
      if (matchingTab) {
        setSelectedTab(matchingTab.value)
      } else {
        console.warn(`Tab "${urlTab}" not found in available tabs. Using default tab.`)
        setSelectedTab(tabConfig[0].value)
      }
    } else {
      // If no tab in URL, set default tab
      setSelectedTab(tabConfig[0].value)
    }
  }, [urlTab, tabConfig])

  const drawerState = useDrawerState()

  // Memoize handlers to prevent child re-renders
  const handleTabChange: (event: React.SyntheticEvent, value: string) => void =
  useCallback((_, newValue)  => {
      setSelectedTab(newValue)

      const { discharge_tab, ...query } = router.query

      // Entering Discharge Tab
      if (newValue === 'discharge') {
        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...query,
              tab: 'discharge',
              discharge_tab: discharge_tab || 'TransferEnclosure' // default
            }
          },
          undefined,
          { shallow: true }
        )

        return
      }

      // Leaving Discharge Tab  remove discharge_tab and  Update URL with the selected tab parameter
      if (urlTab === 'discharge' && newValue !== 'discharge') {
        // Clear discharge-related context data, but preserve enclosure_medicines if going to schedule-prescription
        const isSchedulePrescription = newValue === 'schedule-prescription'

        dispatch(resetState('transfer_medicines'))
        dispatch(resetState('transfer_temp_medicines'))

        // Only clear enclosure medicines if NOT going to schedule-prescription
        if (!isSchedulePrescription) {
          dispatch(resetState('enclosure_medicines'))
          dispatch(resetState('enclosure_temp_medicines'))
        }

        sessionStorage.removeItem('transfer_enclosure_form')

        const updated = { ...router.query }
        delete updated.discharge_tab

        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...updated,
              tab: newValue
            }
          },
          undefined,
          { shallow: true }
        )

        return
      }

      // Update URL with the selected tab parameter
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            tab: newValue,
            ...(router.query.hasOwnProperty('isCurrentMedicalRecordOnly') && {
              isCurrentMedicalRecordOnly: 'false'
            })
          }
        },
        undefined,
        { shallow: true }
      )
    },
    [router, urlTab]
  )

  // Handle menu item tab selection
  const handleMenuTabChange = useCallback(
    (newValue: any) => {
      setSelectedTab(newValue)
      handleMenuClose()

      const { discharge_tab, ...query } = router.query

      // Entering Discharge Tab
      if (newValue === 'discharge') {
        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...query,
              tab: 'discharge',
              discharge_tab: discharge_tab || 'TransferEnclosure' // default
            }
          },
          undefined,
          { shallow: true }
        )

        return
      }

      // Leaving Discharge Tab  remove discharge_tab and  Update URL with the selected tab parameter
      if (urlTab === 'discharge' && newValue !== 'discharge') {
        // Clear discharge-related context data, but preserve enclosure_medicines if going to schedule-prescription
        const isSchedulePrescription = newValue === 'schedule-prescription'

        dispatch(resetState('transfer_medicines'))
        dispatch(resetState('transfer_temp_medicines'))

        // Only clear enclosure medicines if NOT going to schedule-prescription
        if (!isSchedulePrescription) {
          dispatch(resetState('enclosure_medicines'))
          dispatch(resetState('enclosure_temp_medicines'))
        }

        sessionStorage.removeItem('transfer_enclosure_form')

        const updated = { ...router.query }
        delete updated.discharge_tab

        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...updated,
              tab: newValue
            }
          },
          undefined,
          { shallow: true }
        )

        return
      }

      // Update URL with the selected tab parameter
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            tab: newValue,
            id: router.query.id
          }
        },
        undefined,
        { shallow: true }
      )
    },
    [router, urlTab]
  )

  const handleBack = useCallback(() => {
    // router.back()
    // if (typeof window !== 'undefined' && window.history.length > 1) {
    //   console.log('window.history.length', window.history.length)
    //   router.back()
    // } else {
    // // Fallback to category-based navigation if no history
    //   if (category === 'Inpatient') {
    //     router.replace('/hospital/inpatient')
    //   } else {
    //     router.replace('/hospital/outpatient')
    //   }
    // }
    if (category === 'Inpatient') {
      router.push('/hospital/inpatient')
    }
    else if (category === 'Outpatients') {
      router.push('/hospital/outpatient')
    }
    else if (category === 'Discharged') {
      router.push('/hospital/discharged')
    }
    else if (category === 'Mortality') {
      router.push('/hospital/mortality')
    }
    else if (category === 'Follow Up'){
      router.push('/hospital/followup')
    }
  }, [router])

  // Memoize selected component to avoid recalculation
  const { SelectedComponent, selectedLabel } = useMemo(() => {
    const selected: any = tabConfig.find((tab: any) => tab.value === selectedTab)

    return {
      SelectedComponent: selected?.component || (() => <Box>No component found</Box>),
      selectedLabel: selected?.label || 'Unknown'
    }
  }, [tabConfig, selectedTab])

  // Memoize breadcrumbs to prevent unnecessary re-renders
  const breadcrumbs = useMemo(
    () => (
      <DynamicBreadcrumbs
            pageItems={[{
              title: t('hospital_module.hospital')
            },
            {
              title: t('hospital_module.patients')
            },
            {
              title: category, onClick: handleBack
            },
            {
              title: t('hospital_module.details') 
            }]}/>
    ),
    [handleBack, category, t]
  )

  const tabElements = useMemo(
    () => tabConfig.map((tab: any) => <Tab key={tab.value} label={tab.label} value={tab.value} />),
    [tabConfig]
  )

  // Memoize component props to prevent unnecessary re-renders
  const componentProps = useMemo(
    () => ({
      selectedTab,
      setSelectedTab,
      ...drawerState,
      patientId: hospitalCaseId,
      hospitalCaseId,
      animalId: animalIdParam,
      medicalRecordId: medicalRecordIdParam,
      overviewData: overviewData,
      patientData: patientData,
      loading: patientLoading,
      category: category,
      patientDischarged: isPatientDischarged,
      refetchPatient: refetchPatient,
      hospitalVisit: hospitalVisit,
      patientVisitFetching: patientVisitFetching,
      visitFilters: filters,
      setVisitFilters: setFilters
    }),
    [
      selectedTab,
      drawerState,
      hospitalCaseId,
      animalIdParam,
      medicalRecordIdParam,
      overviewData,
      patientData,
      patientLoading,
      isPatientDischarged,
      category
    ]
  )

  return (
    <>
      {permissionStatus === 'allowed' ? (
        <Box>
          {breadcrumbs}
          <PatientCard
            animalData={animalData}
            patientData={patientData}
            loading={patientLoading}
            refetch={refetchPatient}
            category={category}
            totalVisitCount={totalVisitCount}
          />
          <Card sx={{ mt: 6, p: { xs: 3, md: 6 }, mb: selectedTab === 'discharge' ? 4 : 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size='large' edge='start' color='inherit' aria-label='menu' onClick={handleMenuOpen}>
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={openMenu}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{
                    paper: {
                      sx: {
                        maxHeight: '60vh',
                        overflowY: 'auto',
                        maxWidth: { xs: '60vw', sm: '30vw', md: '30vw', lg: '15vw' },
                        width: { xs: '60vw', sm: '30vw', md: '30vw', lg: '15vw' }
                      }
                    }
                  }}
                >
                  {isSmallScreen && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        p: 1,
                        borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'background.paper',
                        zIndex: 1
                      }}
                    >
                      <IconButton onClick={handleMenuClose}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  )}
                  {tabConfig.map((tab) => (
                    <MenuItem
                      key={tab.value}
                      onClick={() => handleMenuTabChange(tab.value)}
                      selected={selectedTab === tab.value}
                    >
                      <Tooltip title={tab.label} arrow placement='top'>
                        <Typography
                          sx={{
                            color:
                              selectedTab === tab.value
                                ? theme.palette.primary.main
                                : theme.palette.customColors.OnSurfaceVarient,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            fontWeight: selectedTab === tab.value ? 'bold' : 'normal'
                          }}
                        >
                          {tab.label}
                        </Typography>
                      </Tooltip>
                    </MenuItem>
                  ))}
                </Menu>

                <Tabs
                  value={selectedTab}
                  onChange={handleTabChange}
                  variant='scrollable'
                  scrollButtons='auto'
                  aria-label={`Inpatient details tabs`}
                >
                  {tabElements}
                </Tabs>
              </Box>
            </Box>
            <Box role='tabpanel' aria-label={`${selectedLabel} content`}>
              <Suspense fallback={<TabContentLoader />}>
                <SelectedComponent {...componentProps} />
              </Suspense>
            </Box>
          </Card>
        </Box>
      ) : permissionStatus === 'checking' ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            width: '100%',
            gap: 3
          }}
        >
          <CircularProgress
            size={60}
            sx={{
              color: theme.palette.primary.main
            }}
          />
          {/* <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Checking access permissions...
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: theme.palette.customColors.OnSurfaceVariant,
              textAlign: 'center',
              maxWidth: '500px'
            }}
          >
            Please wait while we verify your access to view this patient's details.
          </Typography> */}
        </Box>
      ) : null}

      {showConfirmation && (
        <ConfirmationDialog
          dialogBoxStatus={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          title={(t('hospital_module.access_restricted') as string)}
          // cancelText={'G'}
          cancelBtnStyle={{
            borderColor: theme.palette.grey[500],
            color: theme.palette.grey[700]
          }}
          confirmBtnStyle={{
            background: theme.palette.primary.main,
            py: 2
          }}
          image={'/images/warning-icon.svg'}
          imgStyle={{
            background: theme.palette.grey[200],
            p: 4
          }}
          confirmAction={handleAccessRestrictedConfirmation}
          ConfirmationText={'OK'}
          description={
            <Box>
              <Typography variant='body1' sx={{ mb: 1 }}>
                {t('hospital_module.no_permission_view_patient')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('hospital_module.select_correct_hospital_or_contact_admin')}
              </Typography>
            </Box>
          }
          allowCancel={false}
        />
      )}
    </>
  )
}

export default PatientDetails
