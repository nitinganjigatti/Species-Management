'use client'

import { Box, Card, Tab, Tabs } from '@mui/material'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import AnimalInsightsCard from 'src/views/utility/insights/AnimalInsightsCard'

// Reuse existing housing animal components
import AnimalOverview from 'src/components/housing/animals/AnimalOverview'
import AnimalMedical from 'src/components/housing/animals/AnimalMedical'
import AnimalMedia from 'src/components/housing/animals/AnimalMedia'
import AnimalHistory from 'src/components/housing/animals/AnimalHistory'
import AnimalIncidents from 'src/components/housing/animals/AnimalIncidents'
import AnimalDiet from 'src/components/housing/animals/AnimalDiet'
import AnimalJournals from 'src/components/housing/animals/AnimalJournals'
import AnimalAssessment from 'src/components/housing/animals/AnimalAssessment'
import AnimalIdentifier from 'src/components/housing/animals/AnimalIdentifier'
import NotesListing from 'src/components/housing/sites/NotesListing'
import AnimalWeightCard from 'src/components/collection/species-detail/AnimalWeightCard'
import AnimalQRCard from 'src/views/pages/housing/animals/AnimalQRCard'

interface TabConfigItem {
  label: string
  value: string
  component: React.ComponentType<any>
}

// TODO: Replace with real API data — future API will be different from housing
const hardcodedAnimalData = {
  commonName: 'Macaw',
  scientificName: 'Somatogyrus somatogyrus',
  aid: '23423',
  breed: 'Macaw Breed 2',
  sex: 'Female',
  enclosure: 'ABC 23',
  morph: 'Morph 23',
  lifeStage: 'Undetermined',
  type: 'single',
  taxonomyId: '62356',
  taxonomy_id: '62356',
  accessionDate: '24 Apr 2025',
  birthDate: '24 Apr 2025',
  age: '1y 2m',
  contraceptionStatus: 'Active',
  sexingType: 'Physical & Screening',
  institutes_label: '-',
  collectionType: '-',
  organisation: 'ZSNYA',
  ownershipTerm: '-',
  localIdentifier: '-',
  microChip: '-',
  identifierName: '-',
  isAlive: '1',
  image: ''
}

const hardcodedEnclosureData = {
  enclusreId: 'ABC 23',
  enclusreType: 'Aviary',
  sectionName: '-',
  siteName: '-'
}

const allTabConfig: TabConfigItem[] = [
  { label: 'Overview', value: 'overview', component: AnimalOverview },
  { label: 'Medical', value: 'medical', component: AnimalMedical },
  { label: 'Incidents', value: 'incidents', component: AnimalIncidents },
  { label: 'Diet', value: 'diet', component: AnimalDiet },
  { label: 'Assessments', value: 'assessments', component: AnimalAssessment },
  { label: 'Journal', value: 'journal', component: AnimalJournals },
  { label: 'History', value: 'history', component: AnimalHistory },
  { label: 'Notes', value: 'notes', component: NotesListing },
  { label: 'Identifier', value: 'identifier', component: AnimalIdentifier },
  { label: 'Media', value: 'media', component: AnimalMedia }
]

const CollectionAnimalDetail: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useParams() as { id?: string; animalId?: string }
  const speciesId = params.id

  const [selectedTab, setSelectedTab] = useState('overview')
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  // TODO: Replace with real QR data from API
  const qrData = {
    imageUrl: hardcodedAnimalData.image,
    speciesName: hardcodedAnimalData.scientificName,
    aid: hardcodedAnimalData.aid,
    qrCodeUrl: ''
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
  }

  // Sync tab with URL
  useEffect(() => {
    router.replace(`${pathname}?tab=${selectedTab}`, { scroll: false })
  }, [selectedTab])

  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab) setSelectedTab(tab)
  }, [searchParams])

  const selected = allTabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => null)

  return (
    <Box>
      <DynamicBreadcrumbs
        sx={{ mb: 5 }}
        pageItems={[
          { title: 'Collection', href: '/collection/species' },
          { title: 'Species', href: '/collection/species' },
          { title: speciesId || '', href: `/collection/species/${speciesId}?tab=population` },
          { title: hardcodedAnimalData.commonName, href: '#', active: true }
        ]}
      />

      {/* Animal Banner — reuses AnimalInsightsCard */}
      <AnimalInsightsCard
        isAnimalDetailsPage={true}
        headerDetails={hardcodedAnimalData}
        animalDetails={hardcodedAnimalData}
        isSpecies={false}
        isSpeciesDetails={false}
        isSpeciesListing={false}
        onAddNew={() => {}}
        onQrClick={() => setQrDialogOpen(true)}
        showQr={true}
        image={hardcodedAnimalData.image}
        loading={false}
      />

      {/* Tabs + Content */}
      <Card sx={{ mt: 6, p: { xs: 3, md: 5 } }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={selectedTab} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
            {allTabConfig.map(tab => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </Tabs>
        </Box>

        {/* Selected Tab Content — passes data in same format as housing page */}
        <SelectedComponent
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          animalDetails={hardcodedAnimalData}
          enclosureDetails={hardcodedEnclosureData}
          refType='animal'
          entityName={hardcodedAnimalData.commonName}
          animalData={hardcodedAnimalData}
        />
      </Card>

      {/* Animal Weight — shown only on Overview tab, outside tabs card */}
      {selectedTab === 'overview' && <AnimalWeightCard />}

      {/* QR Code Dialog */}
      {qrDialogOpen && (
        <AnimalQRCard
          open={qrDialogOpen}
          handleClose={() => setQrDialogOpen(false)}
          speciesData={qrData as any}
        />
      )}
    </Box>
  )
}

export default CollectionAnimalDetail
