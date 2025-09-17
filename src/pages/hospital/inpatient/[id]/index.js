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
const InpatientMedicalSummary = lazy(() => import('src/views/pages/hospital/inpatient/InpatientMedicalSummary'))
const ClinicalAssessment = lazy(() => import('src/components/hospital/inpatient/ClinicalAssessment'))
const ClinicalNotes = lazy(() => import('src/components/hospital/inpatient/ClinicalNotes'))
const Symptoms = lazy(() => import('src/components/hospital/inpatient/Symptoms'))
const InpatientSurgery = lazy(() => import('src/views/pages/hospital/inpatient/InpatientSurgery'))
const InpatientDischarge = lazy(() => import('src/components/hospital/discharge'))
const PrescriptionLayout = lazy(() => import('src/components/hospital/prescriptionMonitoring/PrescriptionLayout'))
const TreatmentLayout = lazy(() => import('src/components/hospital/TreatmentMonitoring/TreatmentLayout'))

const InpatientDetails = () => {
  const router = useRouter()
  const theme = useTheme()
  const { id, animal_id } = router.query

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [anchorEl, setAnchorEl] = useState(null)
  const [patientLoading, setPatientLoading] = useState(false)
  const [patientData, setPatientData] = useState(null)
  const [animalData, setAnimalData] = useState({})
  const [overviewData, setOverViewData] = useState({})

  const openMenu = Boolean(anchorEl)

  useEffect(() => {
    const getPatientInfo = async () => {
      setPatientLoading(true)
      try {
        await getPatientDetails(id).then(res => {
          if (res?.success === true) {
            setPatientData(res?.data)
            setAnimalData(res?.data?.animal_detail)
            setOverViewData({
              active_complaints_count: res?.data?.active_complaints_count,
              active_diagnosis_count: res?.data?.active_diagnosis_count,
              active_prescriptions_count: res?.data?.active_prescriptions_count,
              treatment_monitoring: res?.data?.treatment_monitoring,
              purpose_of_visit: res?.data?.purpose_of_visit,
              created_by_full_name: res?.data?.created_by_full_name,
              created_at: res?.data?.created_at,
              created_by_profile_pic: res?.data?.created_by_profile_pic
            })
            setPatientLoading(false)
          } else {
            setPatientData(null)
            setPatientLoading(false)
          }
        })
      } catch (error) {
        console.error('Cannot Fetch Patient Details', error)
        setPatientLoading(false)
      }
    }

    getPatientInfo()
  }, [id])

  const handleMenuOpen = event => {
    console.log(event.currentTarget)

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
      { label: 'Treatment Monitoring', value: 'treatmentMonitoring', component: TreatmentLayout },
      { label: 'Clinical Assessment', value: 'clinicalAssessment', component: ClinicalAssessment },
      { label: 'Clinical Notes', value: 'clinicalNotes', component: ClinicalNotes },
      { label: 'Symptoms', value: 'symptoms', component: Symptoms },
      { label: 'Surgery', value: 'surgery', component: InpatientSurgery },
      { label: 'Discharge', value: 'discharge', component: InpatientDischarge },
      { label: 'Prescription', value: 'prescriptionMonitoring', component: PrescriptionLayout }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)

  const drawerState = useDrawerState()

  // Memoize handlers to prevent child re-renders
  const handleTabChange = useCallback((event, newValue) => {
    setSelectedTab(newValue)
  }, [])

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

  // Memoize breadcrumbs to prevent unnecessary re-renders
  const breadcrumbs = useMemo(
    () => (
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ color: 'inherit' }}>Hospital</Typography>
        <Typography sx={{ color: 'inherit' }}>Patients</Typography>
        <Typography sx={{ color: 'inherit', cursor: 'pointer' }} onClick={handleBack}>
          Inpatient
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
      overviewData: overviewData
    }),
    [selectedTab, drawerState, id, overviewData]
  )

  return (
    <>
      <Box>
        {breadcrumbs}
        <PatientCard animalData={animalData} patientData={patientData} loading={patientLoading} />
        <Card sx={{ mt: 6, p: { xs: 3, md: 6 } }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size='large'
                edge='start'
                color='inherit'
                aria-label='menu'
                onClick={handleMenuOpen}
                sx={{ mb: 1 }}
              >
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
                      maxWidth: { xs: '70vw', sm: '40vw', md: '30vw' },
                      width: { xs: '70vw', sm: '40vw', md: '30vw' }
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
                    onClick={() => {
                      setSelectedTab(tab.value)
                      handleMenuClose()
                    }}
                  >
                    <Tooltip title={tab.label} arrow placement='top'>
                      <Typography
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVarient,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical'
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
