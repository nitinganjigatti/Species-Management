import { Box, Breadcrumbs, Typography, Tabs, Tab, Card, useTheme } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

// Listing Components
import SpeciesListing from 'src/components/housing/sections/SpeciesListing'
import NotesListing from 'src/components/housing/sites/NotesListing'
import UsersListing from 'src/components/housing/sites/UsersListing'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import FoodWastageListing from 'src/components/housing/sites/FoodWastageListing'

import { useQuery } from '@tanstack/react-query'
import { getSectionAnalytics } from 'src/lib/api/housing'
import EnclosureListing from 'src/components/housing/sections/EnclosureListing'
import MediaListing from 'src/components/housing/sections/MediaListing'
import MortalityListing from 'src/components/housing/sections/MortalityListing'
import AnimalTreatmentListing from 'src/components/housing/sections/AnimalTreatmentListing'
import { useAuth } from 'src/hooks/useAuth'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import EnclosureDrawer from 'src/components/housing/utils/EnclosureDrawer'
import AddEnclosureDrawer from 'src/views/pages/housing/enclosures/AddEnclosureDrawer'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { EntityAssessment } from 'src/components/housing/common/assessment'

interface TabConfigItem {
  label: string
  value: string
  component: React.ComponentType<any>
}

interface DrawerData {
  queryKey: string
  id: string | undefined
  name?: string
  params: {
    ref_type?: string
    data_type?: string
    ref_id?: string | undefined
    site_id?: string | string[] | undefined
    section_id?: string | string[] | undefined
  }
}

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

const tabConfig: TabConfigItem[] = [
  { label: 'Enclosures', value: 'enclosures', component: EnclosureListing },
  { label: 'Species', value: 'species', component: SpeciesListing },
  { label: 'Media', value: 'media', component: MediaListing },
  { label: 'Assessment', value: 'assessment', component: EntityAssessment },
  { label: 'Mortality', value: 'mortality', component: MortalityListing },
  { label: 'Animals Under Treatment', value: 'animalTreatment', component: AnimalTreatmentListing },
  { label: 'Users', value: 'users', component: UsersListing },
  { label: 'Notes', value: 'notes', component: NotesListing },
  { label: 'Food Wastage', value: 'foodWastage', component: FoodWastageListing },
  { label: 'Incharges', value: 'incharges', component: InchargeListing }
]

const SectionDetails: React.FC = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query as { id?: string }

  const [selectedTab, setSelectedTab] = useState<string>(tabConfig[0].value)
  const [drawerType, setDrawerType] = useState<string | null>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [addEnclosureDrawerOpen, setAddEnclosureDrawerOpen] = useState<boolean>(false)
  const [refetchEnclosure, setRefechEnclosure] = useState<boolean>(false)
  const auth = useAuth()

  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights
  const addEnclosureAccess = (auth as any)?.userData?.roles?.settings?.housing_add_enclosure

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const { data, isLoading, error } = useQuery({
    queryKey: ['section-insights', id],
    queryFn: () =>
      getSectionAnalytics({
        section_id: +id!,
        zoo_id: zooId
      }),
    enabled: !!id && !!zooId
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setSelectedTab(newValue)
  }

  const handleEnclosureInsightClick = (): void => {
    setDrawerType('enclosures')
    setDrawerData({
      queryKey: 'insights-enclosures-section-drawer',
      id: zooId,

      // name: params.row?.site_name,
      // image: params.row?.images?.[0]?.file,
      params: {
        ref_type: 'zoo',
        data_type: 'enclosure',
        ref_id: zooId,
        site_id: id
      }
    })
  }

  const handleAmimalsInsightClick = (): void => {
    setDrawerType('animals-insights')
    setDrawerData({
      queryKey: 'insights-animals-section-drawer',
      id: zooId,

      name: data?.data?.section_name,

      // image: '/images/housing/section-animal.svg',
      params: {
        section_id: id
      }
    })
  }

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const statsData: StatItem[] = [
    {
      label: 'Species',
      value: data?.data?.total_species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: 'Animals',
      value: data?.data?.total_animals || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAmimalsInsightClick
    },

    // {
    //   label: 'Sections',
    //   value: data?.data?.section_count || 0,
    //   imagePath: '/images/housing/sections.svg',
    //   onClick: () => console.log('Sections')
    // },

    {
      label: 'Enclosures',
      value: data?.data?.total_enclosures || 0,
      imagePath: '/images/housing/enclosures.svg',
      onClick: () => setSelectedTab('enclosures')
    }
  ]

  const handleSectionListingClick = (): void => {
    router.back()
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  useEffect(() => {
    // Updating URL with tab parameter when tab changes
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: selectedTab }
      },
      undefined,
      { shallow: true }
    )
  }, [selectedTab])

  // To read the tab parameter on component mount
  useEffect(() => {
    if (router.query.tab) {
      setSelectedTab(router.query.tab as string)
    }
  }, [router.query.tab])

  // useEffect(() => {
  //   const tabFromQuery = router.query?.enclosureTab
  //   const isValidTab = tabConfig.some(tab => tab.value === tabFromQuery)
  //   if (isValidTab && selectedTab !== tabFromQuery) {
  //     setSelectedTab(tabFromQuery)
  //   }
  // }, [router.query?.enclosureTab])

  return (
    <>
      <Box>
        {/* Breadcrumb */}
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography onClick={() => router.back()} sx={{ color: theme.palette.text.secondary, cursor: 'pointer' }}>
            Section Listing
          </Typography>
          <Typography color={theme.palette.text.primary}>Section Details</Typography>
        </Breadcrumbs>

        {/* Insights */}
        <InsightsCard
          data={data?.data as any}
          loading={isLoading}
          zooName={(data?.data as any)?.section_name}
          image={(data?.data as any)?.images?.[0]?.file}
          subtitle=''
          userName={(data?.data as any)?.incharge_name}
          description=''
          userImage=''
          pageTitle='Section Details'
          actions={{
            onAddNew: addEnclosureAccess ? () => setAddEnclosureDrawerOpen(true) : null
          }}
          onCallClick={() => {
            const phoneNumber = (data?.data as any)?.incharge_phone_number || ''
            if (phoneNumber) {
              // window.location.href = `tel:${phoneNumber}`
            } else {
              return
            }
          }}
          onMessageClick={() => {
            const phoneNumber = (data?.data as any)?.incharge_phone_number || ''
            if (phoneNumber) {
              window.open(`sms:${phoneNumber}`)
            } else return
          }}
          haveInsightsViewAccess={insightsViewAccess}
          error={error}
          statsData={statsData as any}
        />

        {/* Tabs */}
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
              refetchEnclosure={refetchEnclosure}
              refType='section'
              entityName={(data?.data as any)?.section_name}
              entityImage={(data?.data as any)?.images?.[0]?.file}
              entityType='section'
              entityId={id || ''}
              entityDetails={data?.data}
            />
          </Box>
        </Card>
        {drawerType === 'animals-insights' && (
          <AnimalDrawer
            totalCount={(data?.data as any)?.total_animals}
            open={!!drawerData}
            onClose={handleDrawerClose}
            data={drawerData as any}
            defaultImage={'/images/housing/section-colored-icon.svg'}
          />
        )}
        {drawerType === 'enclosures' && (
          <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData as any} />
        )}
      </Box>
      {addEnclosureDrawerOpen && (
        <AddEnclosureDrawer
          open={addEnclosureDrawerOpen}
          setAddEnclosureDrawerOpen={setAddEnclosureDrawerOpen}
          sectionId={id ?? null}
          zooId={zooId}
          refetchEnclosure={refetchEnclosure}
          setRefechEnclosure={setRefechEnclosure}
        />
      )}
    </>
  )
}

export default enforceModuleAccess(SectionDetails, 'enable_housing_in_web')
