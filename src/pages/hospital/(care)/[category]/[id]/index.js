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
import { useQuery } from '@tanstack/react-query'

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

const InpatientDetails = () => {
  const router = useRouter()
  const theme = useTheme()
  const { category, id, animal_id, tab: urlTab } = router.query

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [anchorEl, setAnchorEl] = useState(null)

  const openMenu = Boolean(anchorEl)

  const updateUrlWithAdmittedDate = admittedDate => {
    const currentPath = router.pathname
    const currentQuery = { ...router.query }

    // Add or update animal_admitted_date
    const updatedQuery = {
      ...currentQuery,
      animal_admitted_date: admittedDate
    }

    // Replace URL with new query params, without refreshing the page
    router.replace(
      {
        pathname: currentPath,
        query: updatedQuery
      },
      undefined,
      { shallow: true }
    )
  }

  const {
    data: patientResponse,
    isLoading: patientLoading,
    refetch: refetchPatient,
    isError,
    error
  } = useQuery({
    queryKey: ['patientDetails', id],
    queryFn: () => getPatientDetails(id),
    enabled: !!id // only run when id exists
  })

  useEffect(() => {
    if (patientResponse?.data?.created_at) {
      const admittedDate = patientResponse.data.admitted_at
      console.log('✅ useEffect triggered - admittedDate:', admittedDate)
      updateUrlWithAdmittedDate(admittedDate)
    }
  }, [patientResponse?.data?.created_at])

  const patientData = patientResponse?.data
  const animalData = patientResponse?.data?.animal_detail || {}

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
        reason_for_admission: patientResponse.data?.reason_for_admission
      }
    : {}

  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

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
    [router]
  )

  // Handle menu item tab selection
  const handleMenuTabChange = useCallback(
    newValue => {
      setSelectedTab(newValue)
      handleMenuClose()

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
    [router]
  )

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // Memoize selected component to avoid recalculation
  const { SelectedComponent, selectedLabel } = useMemo(() => {
    const selected = tabConfig.find(tab => tab.value === selectedTab)

    return {
      SelectedComponent: selected?.component || (() => <Box>No component found</Box>),
      selectedLabel: selected?.label || 'Unknown'
    }
  }, [tabConfig, selectedTab])

  const categoryLabel =
    {
      inpatient: 'Inpatient',
      discharged: 'Discharge',
      followup: 'Follow-up',
      mortality: 'Mortality'
    }[category] || 'Inpatient'

  // Memoize breadcrumbs to prevent unnecessary re-renders
  const breadcrumbs = useMemo(
    () => (
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ color: 'inherit' }}>Hospital</Typography>
        <Typography sx={{ color: 'inherit' }}>Patients</Typography>
        <Typography sx={{ color: 'inherit', cursor: 'pointer' }} onClick={handleBack}>
          {categoryLabel}
        </Typography>
        <Typography sx={{ color: 'text.primary' }}>Details</Typography>
      </Breadcrumbs>
    ),
    [handleBack]
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
      patientId: id,
      hospitalCaseId: id,
      overviewData: overviewData,
      patientData: patientData,
      loading: patientLoading
    }),
    [selectedTab, drawerState, id, overviewData, patientData, patientLoading]
  )

  return (
    <>
      <Box>
        {breadcrumbs}
        <PatientCard
          animalData={animalData}
          patientData={patientData}
          loading={patientLoading}
          refetch={refetchPatient}
        />
        <Card sx={{ mt: 6, p: { xs: 3, md: 6 } }}>
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
    </>
  )
}

export default InpatientDetails
