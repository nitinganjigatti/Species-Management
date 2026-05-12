'use client'

import { Box, Card, Tab, Tabs } from '@mui/material'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AuthContext } from 'src/context/AuthContext'
import { canAdd, canView } from 'src/utils/access'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import AddAnimalDrawer from 'src/components/collection/AddAnimalDrawer'
import SpeciesDrawer from 'src/components/housing/utils/SpeciesDrawer'
import { getSpeciesTaxonomyHierarchy } from 'src/lib/api/collection/species'

// Tab Components
import PopulationTab from 'src/components/collection/species-detail/PopulationTab'
import SitesTab from 'src/components/collection/species-detail/SitesTab'
import SectionsTab from 'src/components/collection/species-detail/SectionsTab'
import EnclosuresTab from 'src/components/collection/species-detail/EnclosuresTab'
import TaxonomyTab from 'src/components/collection/species-detail/TaxonomyTab'
import MortalityTab from 'src/components/collection/species-detail/MortalityTab'
import NecropsyTab from 'src/components/collection/species-detail/NecropsyTab'
import DietTab from 'src/components/collection/species-detail/DietTab'

interface TabConfigItem {
  label: string
  value: string
  component: React.ComponentType<any>
}

const SpeciesDetail: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useParams() as { id?: string }
  const id = params.id
  const authData = useContext(AuthContext) as any
  const animalRecordsAccess = authData?.userData?.roles?.settings?.collection_animal_records
  const animalRecordsLevel = authData?.userData?.roles?.settings?.collection_animal_record_access
  const canViewAnimal = canView(animalRecordsAccess)
  const canAddAnimal = canViewAnimal && canAdd(animalRecordsLevel)

  // Built inside the component so `t()` is in scope; memoised so the array identity is stable
  // across renders that don't change the locale. Label is the already-resolved string the Tab renders.
  const tabConfig: TabConfigItem[] = useMemo(
    () => [
      { label: t('species_module.tab_population'), value: 'population', component: PopulationTab },
      { label: t('species_module.tab_sites'), value: 'sites', component: SitesTab },
      { label: t('species_module.tab_sections'), value: 'sections', component: SectionsTab },
      { label: t('species_module.tab_enclosures'), value: 'enclosures', component: EnclosuresTab },
      { label: t('species_module.tab_taxonomy'), value: 'taxonomy', component: TaxonomyTab },
      { label: t('species_module.tab_mortality'), value: 'mortality', component: MortalityTab },
      { label: t('species_module.tab_necropsy'), value: 'necropsy', component: NecropsyTab },
      { label: t('species_module.tab_diet'), value: 'diet', component: DietTab }
    ],
    [t]
  )

  const [selectedTab, setSelectedTab] = useState('population')
  const [addAnimalDrawerOpen, setAddAnimalDrawerOpen] = useState(false)
  const [insightsFilterDate, setInsightsFilterDate] = useState({ startDate: new Date(), endDate: new Date() })
  const [speciesDrawerOpen, setSpeciesDrawerOpen] = useState(false)
  const [speciesDrawerTitle, setSpeciesDrawerTitle] = useState('')
  const [speciesDrawerData, setSpeciesDrawerData] = useState<any>(null)

  // Header info (name, scientific name) — derived from the taxonomy hierarchy endpoint, which is
  // the only existing per-species GET keyed by taxonomy_id.
  //
  // TODO: Once backend ships a dedicated `species-detail/{taxonomy_id}` endpoint, replace this with
  // it so we also get default_icon, animal_count, and the 4 insight stats from one call. For now
  // the stats stay 0 — better than fabricated numbers.
  const { data: hierarchyResponse, isLoading: speciesLoading } = useQuery({
    queryKey: ['species-detail-header', id],
    queryFn: () => getSpeciesTaxonomyHierarchy({ species_id: id as string }),
    enabled: Boolean(id)
  })

  const speciesData = useMemo(() => {
    const items = hierarchyResponse?.data || []
    // The species row is keyed by `rank_name === 'Species'`; fall back to matching `tsn` against the
    // route id so a backend rename of the rank label doesn't silently leave us with an empty header.
    const speciesItem =
      items.find(i => i?.rank_name === 'Species') || items.find(i => String(i?.tsn) === String(id))

    return {
      common_name: speciesItem?.common_name || speciesItem?.complete_name || '',
      scientific_name: speciesItem?.complete_name || '',
      default_icon: '',
      population: 0,
      natality: 0,
      accession: 0,
      external_transfer: 0,
      mortality: 0,
      animal_count: 0
    }
  }, [hierarchyResponse, id])

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

  const handleStatClick = (title: string, insightType: string) => {
    setSpeciesDrawerTitle(title)
    setSpeciesDrawerData({
      queryKey: `species-detail-${insightType}-species`,
      id: id,
      name: speciesData.common_name,
      params: { taxonomy_id: id, insight_type: insightType }
    })
    setSpeciesDrawerOpen(true)
  }

  // Banner data
  const populationCount =
    speciesData.population >= 1000 ? (speciesData.population / 1000).toFixed(1) + 'K' : String(speciesData.population)
  const populationText = `${t('species_module.population_till_date')} - ${populationCount}`

  const insightsStatsData = [
    {
      value: speciesData.natality,
      label: t('species_module.natality'),
      imagePath: '/images/housing/animals.svg',
      onClick: () => handleStatClick(t('species_module.natality'), 'natality')
    },
    {
      value: speciesData.accession,
      label: t('species_module.accession'),
      imagePath: '/images/housing/species.svg',
      onClick: () => handleStatClick(t('species_module.accession'), 'accession')
    },
    {
      value: speciesData.external_transfer,
      label: t('species_module.external_transfer'),
      imagePath: '/images/housing/sections.svg',
      onClick: () => handleStatClick(t('species_module.external_transfer'), 'external_transfer')
    },
    {
      value: speciesData.mortality,
      label: t('species_module.mortality'),
      imagePath: '/images/housing/enclosures.svg',
      onClick: () => handleStatClick(t('species_module.mortality'), 'mortality')
    }
  ]

  const handleInsightsDateChange = (start: Date, end: Date) => {
    setInsightsFilterDate({ startDate: start, endDate: end })
  }

  // Get selected tab component
  const selectedTabConfig = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selectedTabConfig?.component || (() => null)

  return (
    <>
      <Box>
        <DynamicBreadcrumbs
          sx={{ mb: 5 }}
          lastBreadcrumbLabel={speciesData.common_name || (speciesLoading ? t('species_module.loading') : '')}
        />

        {/* Species Insights Banner */}
        <InsightsCard
          data={speciesData}
          loading={speciesLoading}
          error={null as any}
          isListingPage
          titleLabel={t('species_module.species')}
          pageTitle={speciesData.common_name}
          subtitle={speciesData.scientific_name}
          image=''
          actions={{ onAddNew: canAddAnimal ? () => setAddAnimalDrawerOpen(true) : null }}
          addNewTooltip={t('species_module.add_animals')}
          addNewLabel={t('species_module.add_animals')}
          onCallClick={null as any}
          onMessageClick={null as any}
          zooName=''
          userName=''
          description=''
          userImage=''
          populationText={populationText as any}
          haveInsightsViewAccess
          statsData={insightsStatsData as any}
          onInsightsDateChange={handleInsightsDateChange as any}
          insightsFilterDates={insightsFilterDate as any}
        />

        {/* Tabs + Content */}
        {selectedTab === 'taxonomy' ? (
          <>
            <Card sx={{ mt: 6, p: { xs: 3, md: 5 }, pb: 0 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selectedTab} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
                  {tabConfig.map(tab => (
                    <Tab key={tab.value} label={tab.label} value={tab.value} />
                  ))}
                </Tabs>
              </Box>
            </Card>
            <Box sx={{ mt: 6 }}>
              <SelectedComponent
                speciesId={id}
                animalCount={speciesData.animal_count}
                speciesName={speciesData.common_name}
                scientificName={speciesData.scientific_name}
              />
            </Box>
          </>
        ) : (
          <Card sx={{ mt: 6, p: { xs: 3, md: 5 } }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <Tabs value={selectedTab} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
                {tabConfig.map(tab => (
                  <Tab key={tab.value} label={tab.label} value={tab.value} />
                ))}
              </Tabs>
            </Box>

            <SelectedComponent
              speciesId={id}
              animalCount={speciesData.animal_count}
              speciesName={speciesData.common_name}
              scientificName={speciesData.scientific_name}
            />
          </Card>
        )}
      </Box>

      {/* Add Animal Drawer */}
      <AddAnimalDrawer open={addAnimalDrawerOpen} onClose={() => setAddAnimalDrawerOpen(false)} />

      {/* Insights Species Drawer */}
      <SpeciesDrawer
        open={speciesDrawerOpen}
        onClose={() => {
          setSpeciesDrawerOpen(false)
          setSpeciesDrawerData(null)
        }}
        data={speciesDrawerData}
        title={speciesDrawerTitle}
      />
    </>
  )
}

export default SpeciesDetail
