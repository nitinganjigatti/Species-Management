import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import ClinicalAssessment from 'src/views/pages/hospital/inpatient/ClinicalAssessment'
import InpatientMedicalSummary from 'src/views/pages/hospital/inpatient/InpatientMedicalSummary'
import InpatientOverview from 'src/views/pages/hospital/inpatient/InpatientOverview'
import InpatientSurgery from 'src/views/pages/hospital/inpatient/InpatientSurgery'
import InpatinetTreatmentMonitoring from 'src/views/pages/hospital/inpatient/InpatinetTreatmentMonitoring'
import Symptoms from 'src/views/pages/hospital/inpatient/Symptoms'
import PatientCard from 'src/views/pages/hospital/utility/PatientCard'

const InpatientDetails = () => {
  const router = useRouter()
  const theme = useTheme()

  const { id } = router.query

  const tabConfig = [
    { label: 'Overview', value: 'overview', component: InpatientOverview },
    { label: 'Medical Summary', value: 'medicalSummary', component: InpatientMedicalSummary },
    { label: 'Treatment Monitoring', value: 'treatmentMonitoring', component: InpatinetTreatmentMonitoring },
    { label: 'Symptoms', value: 'symptoms', component: Symptoms },
    { label: 'Clinical Assessment', value: 'clinicalAssessment', component: ClinicalAssessment },
    { label: 'Surgery', value: 'surgery', component: InpatientSurgery }
  ]

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)
  const [drawerType, setDrawerType] = useState(null)
  const [drawerData, setDrawerData] = useState(null)

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ color: 'inherit' }}>Patients</Typography>
          <Typography sx={{ color: 'inherit', cursor: 'pointer' }} onClick={() => router.back()}>
            Inpatient
          </Typography>
          <Typography sx={{ color: 'text.primary' }}>Details</Typography>
        </Breadcrumbs>
        <PatientCard />
        <Card sx={{ mt: 6, p: { xs: 3, md: 5 } }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
              {tabConfig.map(tab => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Box>
          <Box>
            <SelectedComponent
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              drawerType={drawerType}
              setDrawerType={setDrawerType}
              drawerData={drawerData}
              setDrawerData={setDrawerData}
            />
          </Box>
        </Card>
      </Box>
    </>
  )
}

export default InpatientDetails
