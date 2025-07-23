import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import AnimalDiet from 'src/components/housing/animals/AnimalDiet'
import AnimalHistory from 'src/components/housing/animals/AnimalHistory'
import AnimalIdentifier from 'src/components/housing/animals/AnimalIdentifier'
import AnimalIncidents from 'src/components/housing/animals/AnimalIncidents'
import AnimalJournals from 'src/components/housing/animals/AnimalJournals'
import AnimalOverview from 'src/components/housing/animals/AnimalOverview'
import AnimalInsightsCard from 'src/views/utility/insights/AnimalInsightsCard'

const tabConfig = [
  { label: 'Overview', value: 'overview', component: AnimalOverview },
  { label: 'Incidents', value: 'incidents', component: AnimalIncidents },
  { label: 'Diet', value: 'diet', component: AnimalDiet },
  { label: 'Journal', value: 'journal', component: AnimalJournals },
  { label: 'History', value: 'history', component: AnimalHistory },
  { label: 'Identifier', value: 'identifier', component: AnimalIdentifier }
]

const animalHeaderDetails = {
  commonName: 'Macaw',
  scientificName: 'Somatogyrus somatogyrus',
  qrCodeUrl: 'abcd'
}

const AnimalDetais = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

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
          <Typography color='inherit' sx={{ cursor: 'pointer' }}>
            Animals
          </Typography>
          <Typography color='text.primary'>Animal Details</Typography>
        </Breadcrumbs>
        <AnimalInsightsCard isAnimalDetailsPage={true} headerDetails={animalHeaderDetails} showQr={true} />
        <Card sx={{ mt: 6, p: { xs: 3, md: 5 } }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
              {tabConfig.map(tab => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Box>
          {/* Selected Tab Content */}
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

export default AnimalDetais
