'use client'

import { Box, Card, Tab, Tabs } from '@mui/material'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
import { ROUTES } from 'src/constants/routes'

interface TabConfigItem {
  label: string
  value: string
  component: React.ComponentType<any>
}

const CollectionAnimalDetail: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  // Built inside the component so `t()` is in scope; memoised so identity is stable across renders.
  const allTabConfig = useMemo<TabConfigItem[]>(
    () => [
      { label: t('species_module.tab_overview'), value: 'overview', component: AnimalOverview },
      { label: t('species_module.tab_medical'), value: 'medical', component: AnimalMedical },
      { label: t('species_module.tab_incidents'), value: 'incidents', component: AnimalIncidents },
      { label: t('species_module.tab_diet'), value: 'diet', component: AnimalDiet },
      { label: t('species_module.tab_assessments'), value: 'assessments', component: AnimalAssessment },
      { label: t('species_module.tab_journal'), value: 'journal', component: AnimalJournals },
      { label: t('species_module.tab_history'), value: 'history', component: AnimalHistory },
      { label: t('species_module.tab_notes'), value: 'notes', component: NotesListing },
      { label: t('species_module.tab_identifier'), value: 'identifier', component: AnimalIdentifier },
      { label: t('species_module.tab_media'), value: 'media', component: AnimalMedia }
    ],
    [t]
  )
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

  const animalDetails = ad
    ? {
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
      }
    : {}

  const enclosureDetails = ed
    ? {
        enclusreId: ed?.user_enclosure_name,
        enclusreType: ed?.enclosure_type_name,
        sectionName: ed?.section_name,
        siteName: ed?.site_name
      }
    : {}

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
          { title: t('species_module.collection'), href: ROUTES.collection.species },
          { title: t('species_module.species'), href: ROUTES.collection.species },
          {
            // Species name (e.g. "Lion") reads better than the raw taxonomy id ("135694").
            // Falls back to the id while the overview query is in flight so the segment isn't empty.
            title: animalDetails?.commonName || speciesId || '',
            href: speciesId ? `${ROUTES.collection.speciesDetail(speciesId)}?tab=population` : '#'
          },
          {
            // Animal-specific identifier so the last segment doesn't duplicate the species name above.
            // Prefer the local id the user assigned (e.g. tag / marking); fall back to "AID: <id>".
            title:
              animalDetails?.localIdentifier ||
              (animalDetails?.aid ? `${t('species_module.aid')}: ${animalDetails.aid}` : ''),
            href: '#',
            active: true
          }
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
        <AnimalQRCard open={qrDialogOpen} handleClose={() => setQrDialogOpen(false)} speciesData={qrData as any} />
      )}
    </Box>
  )
}

export default CollectionAnimalDetail
