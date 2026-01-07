import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography, Box, Tooltip } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useState, Suspense, lazy, useMemo, useCallback, useEffect } from 'react'
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
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import { useHospital } from 'src/context/HospitalContext'
import { getAnimalTotalHospitalVisits } from 'src/lib/api/hospital/inpatient'
import { getHospitalDetail } from 'src/lib/api/hospital/hospitalAnalytics'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { write } from 'src/lib/windows/utils'

const STORAGE_KEY = 'medical_record_data'

const useDrawerState = () => {
  const router = useRouter()

  const [drawerType, setDrawerType] = useState(null)
  const [drawerData, setDrawerData] = useState(null)

  const openDrawer = useCallback((type, data = null) => {
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
const InpatientOverview = lazy(() => import('src/views/pages/hospital/inpatient/InpatientOverview'))
const InpatientMedicalSummary = lazy(() => import('src/components/hospital/inpatient/InpatientMedicalSummary'))
const TreatmentLayout = lazy(() => import('src/components/hospital/TreatmentMonitoring/TreatmentLayout'))
const Symptoms = lazy(() => import('src/components/hospital/inpatient/Symptoms'))
const ClinicalAssessment = lazy(() => import('src/components/hospital/inpatient/ClinicalAssessment'))
const ClinicalNotes = lazy(() => import('src/components/hospital/inpatient/ClinicalNotes'))
const OtherTreatments = lazy(() => import('src/components/hospital/inpatient/OtherTreatments/index'))
const PrescriptionLayout = lazy(() => import('src/components/hospital/prescriptionMonitoring/PrescriptionLayout'))
const Anesthesia = lazy(() => import('src/components/hospital/inpatient/Anesthesia'))
const InpatientSurgery = lazy(() => import('src/views/pages/hospital/inpatient/InpatientSurgery'))
const InpatientDischarge = lazy(() => import('src/components/hospital/discharge'))

const PatientDetails = ({ category }) => {
  const router = useRouter()
  const theme = useTheme()

  const queryClient = useQueryClient()
  const { selectedHospital, updateSelectedHospital, updateHospitalStatus } = useHospital()
  const { data, updateState, resetState } = useDynamicStateContext()
  const medicalRecordData = data[STORAGE_KEY] || {}
  const medical_record_id = medicalRecordData?.medical_record_id
  const animal_id = medicalRecordData?.animal_id

  const { id, tab: urlTab } = router.query

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [anchorEl, setAnchorEl] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('checking')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const openMenu = Boolean(anchorEl)

  //Hospital Permission Checking
  const checkHospitalPermission = async hospitalId => {
    try {
      const response = await getHospitalDetail(hospitalId)

      if (response?.status && response?.data?.has_permission === 1) {
        setPermissionStatus('allowed')
      } else {
        setPermissionStatus('denied')
        setShowConfirmation(true)
      }
    } catch (error) {
      console.error('Permission check failed', error)
      setPermissionStatus('denied')
      setShowConfirmation(true)
    }
  }

  const handleAccessRestrictedConfirmation = () => {
    setShowConfirmation(false)
    updateSelectedHospital(null)
    write('selectedHospital', null)

    // updateHospitalStatus(null)

    // Invalidate ALL queries that start with 'hospitals-inpatient'
    queryClient.invalidateQueries(
      {
        queryKey: ['hospitals-listing-inpatient']
      },
      {
        type: 'all' // This will invalidate all queries with this prefix
      }
    )
    router.back()
  }

  useEffect(() => {
    if (!selectedHospital?.id) {
      setShowConfirmation(true)

      return
    }

    setPermissionStatus('checking')
    checkHospitalPermission(selectedHospital.id)
  }, [selectedHospital?.id])

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10
  })

  useEffect(() => {
    const { page = '1', limit = '10' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit)
    })
  }, [router.query])

  const {
    data: patientResponse,
    isLoading: patientLoading,
    refetch: refetchPatient,
    isError,
    error
  } = useQuery({
    queryKey: ['patientDetails', id],
    queryFn: () => getPatientDetails(id),
    enabled: permissionStatus === 'allowed' && !!id // only run when id exists and has hospital permission
  })

  // Initialize medical record data when patient details are loaded
  useEffect(() => {
    if (patientResponse?.data) {
      updateState(STORAGE_KEY, {
        ...medicalRecordData,
        animal_id: patientResponse.data?.animal_detail?.animal_id,
        medical_record_id: patientResponse.data?.medical_record_id,
        animal_admitted_date: patientResponse.data?.admitted_at,
        purpose_of_visit: patientResponse.data?.purpose_of_visit,
        discharge_at: patientResponse.data?.discharge_at,
        site_id: patientResponse?.data?.animal_detail?.site_id,
        hospital_case_id: patientResponse?.data?.hospital_case_id
      })
    }
  }, [patientResponse?.data])

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

  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const resolvedAnimalId = patientResponse?.data?.animal_detail?.animal_id

  const { data: hospitalVisit, isFetching: patientVisitFetching } = useQuery({
    queryKey: ['animal-total-hospital-visit', resolvedAnimalId, selectedHospital?.id, id, filters],
    queryFn: () =>
      getAnimalTotalHospitalVisits({
        page_no: filters.page,
        limit: filters.limit,
        animal_id: resolvedAnimalId,
        hospital_id: selectedHospital?.id,
        hospital_case_id: id
      }),

    enabled: permissionStatus === 'allowed' && Boolean(resolvedAnimalId && selectedHospital?.id && id),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })

  const totalVisitCount = hospitalVisit?.data?.total_records || 0

  // Lazy load all components

  const TabContentLoader = () => (
    <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px' flexDirection='column' gap={2}>
      <CircularProgress size={40} />
    </Box>
  )

  const tabConfig = useMemo(
    () => [
      { label: 'Overview', value: 'overview', component: InpatientOverview },
      { label: 'Medical Summary', value: 'medicalSummary', component: InpatientMedicalSummary },
      { label: 'Monitoring', value: 'treatmentMonitoring', component: TreatmentLayout },
      { label: 'Symptoms', value: 'symptoms', component: Symptoms },
      { label: 'Clinical Assessment', value: 'clinicalAssessment', component: ClinicalAssessment },
      { label: 'Clinical Notes', value: 'clinicalNotes', component: ClinicalNotes },
      { label: 'Other Treatments', value: 'otherTreatments', component: OtherTreatments },
      { label: 'Prescription', value: 'prescriptionMonitoring', component: PrescriptionLayout },
      { label: 'Anesthesia', value: 'anesthesia', component: Anesthesia },
      { label: 'Surgery', value: 'surgery', component: InpatientSurgery },
      { label: 'Discharge', value: 'discharge', component: InpatientDischarge }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)

  // Effect to handle URL tab parameter - set initial tab from URL
  useEffect(() => {
    if (urlTab) {
      // Find if the URL tab exists in our tabConfig
      const matchingTab = tabConfig.find(tab => tab.value === urlTab)
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
  const handleTabChange = useCallback(
    (event, newValue) => {
      setSelectedTab(newValue)

      const { discharge_tab, ...query } = router.query

      // Entering Discharge Tab
      if (newValue === 'discharge') {
        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...query,
              id: router.query.id,
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
      if (urlTab === 'discharge' && newValue !== 'discharge' && discharge_tab) {
        // Clear discharge-related  context data
        resetState('transfer_medicines')
        resetState('transfer_temp_medicines')
        resetState('enclosure_medicines')
        resetState('enclosure_temp_medicines')
        sessionStorage.removeItem('transfer_enclosure_form')

        const updated = { ...router.query }
        delete updated.discharge_tab

        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...updated,
              id: router.query.id,
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
            id: router.query.id,
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
    newValue => {
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
              id: router.query.id,
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
      if (urlTab === 'discharge' && newValue !== 'discharge' && discharge_tab) {
        // Clear discharge-related  context data
        resetState('transfer_medicines')
        resetState('transfer_temp_medicines')
        resetState('enclosure_medicines')
        resetState('enclosure_temp_medicines')
        sessionStorage.removeItem('transfer_enclosure_form')

        const updated = { ...router.query }
        delete updated.discharge_tab

        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...updated,
              id: router.query.id,
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
    router.push('/hospital/inpatient')
  }, [router])

  // Memoize selected component to avoid recalculation
  const { SelectedComponent, selectedLabel } = useMemo(() => {
    const selected = tabConfig.find(tab => tab.value === selectedTab)

    return {
      SelectedComponent: selected?.component || (() => <Box>No component found</Box>),
      selectedLabel: selected?.label || 'Unknown'
    }
  }, [tabConfig, selectedTab])

  // Memoize breadcrumbs to prevent unnecessary re-renders
  const breadcrumbs = useMemo(
    () => (
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ color: 'inherit' }}>Hospital</Typography>
        <Typography sx={{ color: 'inherit' }}>Patients</Typography>
        <Typography sx={{ color: 'inherit', cursor: 'pointer' }} onClick={handleBack}>
          {category}
        </Typography>
        <Typography sx={{ color: 'text.primary' }}>Details</Typography>
      </Breadcrumbs>
    ),
    [handleBack, category]
  )

  const tabElements = useMemo(
    () => tabConfig.map(tab => <Tab key={tab.value} label={tab.label} value={tab.value} />),
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
                  {tabConfig.map(tab => (
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
          <Typography
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
          </Typography>
        </Box>
      ) : null}

      {showConfirmation && (
        <ConfirmationDialog
          dialogBoxStatus={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          title={'Access Restricted'}
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
                You don't have permission to view this patient's details.
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Please contact your administrator or request access to proceed.
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
