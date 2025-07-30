import { Box, Breadcrumbs, Typography, Tabs, Tab, Card } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

// Listing Components
import SpeciesListing from 'src/components/housing/sections/SpeciesListing'

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
import withModuleAccess from 'src/components/ProtectedRoute'

const tabConfig = [
  { label: 'Species', value: 'species', component: SpeciesListing }, // TODO: Update component as it is copied from site detail
  { label: 'Enclosures', value: 'enclosures', component: EnclosureListing },
  { label: 'Media', value: 'media', component: MediaListing }, // TODO: Update component as it is copied from site detail
  { label: 'Mortality', value: 'mortality', component: MortalityListing }, // TODO: Update component as it is copied from site detail
  {
    label: 'Animals Under Treatment',
    value: 'animalTreatment',
    component: AnimalTreatmentListing
  } // TODO: Update component as it is copied from site detail
]

const SectionDetails = () => {
  const router = useRouter()
  const { id } = router.query

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)
  const [drawerType, setDrawerType] = useState(null)
  const [drawerData, setDrawerData] = useState(null)
  const [addEnclosureDrawerOpen, setAddEnclosureDrawerOpen] = useState(false)
  const [refetchEnclosure, setRefechEnclosure] = useState(false)
  const auth = useAuth()

  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const { data, isLoading, error } = useQuery({
    queryKey: ['section-insights', id],
    queryFn: () =>
      getSectionAnalytics({
        section_id: +id,
        zoo_id: zooId
      }),
    enabled: !!id && !!zooId
  })

  const handleTabChange = (event, newValue) => {
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

      name: data?.data?.section_name,

      // image: params.row?.images?.[0]?.file,
      params: {
        section_id: id
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

  const handleSectionListingClick = () => {
    router.back()
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

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
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleSectionListingClick}>
            Section Listing
          </Typography>
          <Typography color='text.primary'>Section Details</Typography>
        </Breadcrumbs>

        {/* Insights */}
        <InsightsCard
          data={data?.data}
          loading={isLoading}
          zooName={data?.data?.section_name}
          // subtitle={data?.data?.site_description}
          userName={data?.data?.incharge_name}
          // description={data?.data?.incharges?.[0]?.full_name}
          // userImage={data?.data?.incharges?.[0]?.user_profile_pic}
          actions={{
            // onEdit: () => console.log('Edit'),
            // onDelete: () => console.log('Delete'),
            onAddNew: () => setAddEnclosureDrawerOpen(true)

            // onTimeClick: () => console.log('Time clicked')
          }}
          onCallClick={() => {
            const phoneNumber = data?.data?.incharge_phone_number || '' // Adjust path as needed
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
              refetchEnclosure={refetchEnclosure}
            />
          </Box>
        </Card>
        {drawerType === 'animals' && <AnimalDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
        {drawerType === 'enclosures' && (
          <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
        )}
      </Box>
      {addEnclosureDrawerOpen && (
        <AddEnclosureDrawer
          open={addEnclosureDrawerOpen}
          setAddEnclosureDrawerOpen={setAddEnclosureDrawerOpen}
          sectionId={id}
          zooId={zooId}
          refetchEnclosure={refetchEnclosure}
          setRefechEnclosure={setRefechEnclosure}
        />
      )}
    </>
  )
}

export default withModuleAccess(SectionDetails, 'enable_housing_in_web')
