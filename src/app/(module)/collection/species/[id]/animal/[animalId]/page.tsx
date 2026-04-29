'use client'

import { Box, Card, Tab, Tabs } from '@mui/material'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import AnimalInsightsCard from 'src/views/utility/insights/AnimalInsightsCard'
import { getAnimalDetailsOverview } from 'src/lib/api/housing'
import Utility from 'src/utility'

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
  const animalId = params.animalId

  const [selectedTab, setSelectedTab] = useState('overview')
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const { data: overviewResponse, isLoading } = useQuery({
    queryKey: ['collection-animal-overview', animalId],
    queryFn: () => getAnimalDetailsOverview({ animal_id: Number(animalId) }),
    enabled: Boolean(animalId)
  })

  const ad = overviewResponse?.data?.animal_details
  const ed = overviewResponse?.data?.enclosure_details

  const animalDetails = ad ? {
    commonName: ad?.common_name,
    scientificName: ad?.complete_name,
    aid: ad?.animal_id,
    enclosure: ad?.user_enclosure_name,
    breed: ad?.breed_name,
    morph: ad?.morph_name,
    sex: ad?.sex,
    lifeStage: ad?.life_stage_name,
    accessionDate: Utility.formatDisplayDate(ad?.accession_date),
    birthDate: Utility.formatDisplayDate(ad?.birth_date),
    age: ad?.age,
    type: ad?.type,
    taxonomyId: ad?.taxonomy_id,
    taxonomy_id: ad?.taxonomy_id,
    contraceptionStatus: ad?.contraception_status,
    sexingType: ad?.sexing_type,
    collectionType: ad?.master_collection_type,
    organisation: ad?.organization_name,
    ownershipTerm: ad?.ownership_terms_label,
    localIdentifier: ad?.local_identifier_value,
    isAlive: ad?.is_alive,
    identifierName: ad?.local_identifier_name,
    isGrouped: Number(ad?.total_animal) > 1,
    in_transit: ad?.in_transit,
    animal_transfered: ad?.animal_transfered,
    institutes_label: ad?.institutes_label,
    is_necropsy: ad?.is_necropsy,
    is_deleted: ad?.is_deleted,
    is_egg_animal: ad?.is_egg_animal === 1 || ad?.is_egg_animal === '1',
    reproduction_type: ad?.reproduction_type,
    image: ad?.default_icon || ''
  } : {}

  const enclosureDetails = ed ? {
    enclusreId: ed?.user_enclosure_name,
    enclusreType: ed?.enclosure_type_name,
    sectionName: ed?.section_name,
    siteName: ed?.site_name
  } : {}

  const qrData = {
    imageUrl: ad?.default_icon,
    speciesName: ad?.complete_name,
    aid: ad?.animal_id,
    qrCodeUrl: ad?.animal_qr_image
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
          { title: animalDetails?.commonName || '', href: '#', active: true }
        ]}
      />

      {/* Animal Banner — reuses AnimalInsightsCard */}
      <AnimalInsightsCard
        isAnimalDetailsPage={true}
        headerDetails={animalDetails}
        animalDetails={animalDetails}
        isSpecies={false}
        isSpeciesDetails={false}
        isSpeciesListing={false}
        onAddNew={() => {}}
        onQrClick={() => setQrDialogOpen(true)}
        showQr={true}
        image={ad?.default_icon || ''}
        loading={isLoading}
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
          animalDetails={animalDetails}
          enclosureDetails={enclosureDetails}
          refType='animal'
          entityName={animalDetails?.commonName}
          animalData={animalDetails}
          animalId={Number(animalId)}
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
