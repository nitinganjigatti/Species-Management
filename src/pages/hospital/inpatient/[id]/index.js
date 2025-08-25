import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography, Box } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useState, Suspense, lazy, useMemo, useCallback } from 'react'
import PatientCard from 'src/views/pages/hospital/utility/PatientCard'
import CircularProgress from '@mui/material/CircularProgress'

const useDrawerState = () => {
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
const InpatientDischarge = lazy(() => import('src/views/pages/hospital/inpatient/InpatientDischarge'))
const PrescriptionLayout = lazy(() => import('src/components/hospital/prescriptionMonitoring/PrescriptionLayout'))

const InpatientDetails = () => {
  const router = useRouter()
  const theme = useTheme()

  const { id } = router.query

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
      patientId: id
    }),
    [selectedTab, drawerState, id]
  )

  return (
    <>
      <Box>
        {breadcrumbs}
        <PatientCard patientId={id} />
        <Card sx={{ mt: 6, p: { xs: 3, md: 6 } }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
