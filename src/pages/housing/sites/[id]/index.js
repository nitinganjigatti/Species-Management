import { Box, Breadcrumbs, Typography, Tabs, Tab, Card } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

// Listing Components
import SectionListing from 'src/components/housing/sites/sectionListing'
import SpeciesListing from 'src/components/housing/sites/speciesListing'
import MortalityListing from 'src/components/housing/sites/mortalityListing'
import AnimalTreatmentListing from 'src/components/housing/sites/AnimalTreatmentListing'
import MediaListing from 'src/components/housing/sites/MediaListing'

import { useQuery } from '@tanstack/react-query'
import { getSpecificSiteAnalytics } from 'src/lib/api/housing'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import EnclosureDrawer from 'src/components/housing/utils/EnclosureDrawer'
import { useAuth } from 'src/hooks/useAuth'
import AddSectionDrawer from 'src/views/pages/housing/section/AddSectionDrawer'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const tabConfig = [
  { label: 'Sections', value: 'sections', component: SectionListing },
  { label: 'Species', value: 'species', component: SpeciesListing },
  { label: 'Media', value: 'media', component: MediaListing },
  { label: 'Mortality', value: 'mortality', component: MortalityListing },
  {
    label: 'Animals Under Treatment',
    value: 'animalTreatment',
    component: AnimalTreatmentListing
  }
]

const SiteDetails = () => {
  const router = useRouter()
  const { id } = router.query
  const auth = useAuth()

  const insightsViewAccess = auth?.userData?.roles?.settings?.housing_view_insights
  const addSectionAccess = auth?.userData?.roles?.settings?.housing_add_section

  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)
  const [drawerType, setDrawerType] = useState(null)
  const [drawerData, setDrawerData] = useState(null)
  const [showAddSectionDrawer, setShowAddSectionDrawer] = useState(false)
  const [addSuccessCheck, setAddSuccessCheck] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-detail', id],
    queryFn: () =>
      getSpecificSiteAnalytics({
        site_id: id
      }),
    enabled: !!id
  })

  const handleTabChange = (event, newValue) => {
    // Find reset action for previous tab
    // const prevTab = tabConfig.find(tab => tab.value === selectedTab)
    // if (prevTab?.resetAction) {
    //   dispatch(prevTab.resetAction())
    // }

    setSelectedTab(newValue)
  }

  const handleEnclosureInsightClick = () => {
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

  const handleAmimalsInsightClick = () => {
    setDrawerType('animals')
    setDrawerData({
      queryKey: 'insights-animals-section-drawer',
      id: zooId,

      name: data?.data?.site_name,

      // image: params.row?.images?.[0]?.file,
      params: {
        site_id: id
      }
    })
  }

  const handleDrawerClose = () => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const statsData = [
    {
      label: 'Species',
      value: data?.data?.species_count || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: 'Animals',
      value: data?.data?.animal_count || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAmimalsInsightClick
    },
    {
      label: 'Sections',
      value: data?.data?.section_count || 0,
      imagePath: '/images/housing/sections.svg',
      onClick: () => setSelectedTab('sections')
    },

    {
      label: 'Enclosures',
      value: data?.data?.enclosure_count || 0,
      imagePath: '/images/housing/enclosures.svg',
      onClick: handleEnclosureInsightClick
    }
  ]

  const handleHousingClick = () => {
    router.back()
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  return (
    <>
      <Box>
        {/* Breadcrumb */}
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
            Site
          </Typography>
          <Typography color='text.primary'>Site Details</Typography>
        </Breadcrumbs>

        {/* Insights */}
        <InsightsCard
          data={data?.data}
          loading={isLoading}
          zooName={data?.data?.site_name}
          subtitle={data?.data?.site_description}
          userName={data?.data?.incharges?.[0]?.full_name}
          description={data?.data?.incharges?.[0]?.role_name}
          haveInsightsViewAccess={insightsViewAccess}
          userImage={data?.data?.incharges?.[0]?.user_profile_pic}
          actions={{
            onAddNew: addSectionAccess ? () => setShowAddSectionDrawer(true) : null
          }}
          onCallClick={() => {
            const phoneNumber = data?.data?.incharges?.[0]?.user_mobile_number || '' // Adjust path as needed
            if (phoneNumber) {
              // window.location.href = `tel:${phoneNumber}`
            } else {
              return
            }
          }}
          // onMessageClick={() => console.log('Message clicked')}
          error={error}
          statsData={statsData}
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
              addSuccessCheck={addSuccessCheck}
            />
          </Box>
        </Card>
        {drawerType === 'animals' && <AnimalDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
        {drawerType === 'enclosures' && (
          <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
        )}
      </Box>
      {showAddSectionDrawer && (
        <AddSectionDrawer
          open={showAddSectionDrawer}
          setShowAddSectionDrawer={setShowAddSectionDrawer}
          selectedSiteId={id}
          addSuccessCheck={addSuccessCheck}
          setAddSuccessCheck={setAddSuccessCheck}
        />
      )}
    </>
  )
}

export default enforceModuleAccess(SiteDetails, 'enable_housing_in_web')
