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

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-detail', id],
    queryFn: () =>
      getSpecificSiteAnalytics({
        site_id: id
      }),
    enabled: !!id
  })

  useEffect(() => {
    console.log('data', data)
  }, [data])

  const handleTabChange = (event, newValue) => {
    // Find reset action for previous tab
    // const prevTab = tabConfig.find(tab => tab.value === selectedTab)
    // if (prevTab?.resetAction) {
    //   dispatch(prevTab.resetAction())
    // }

    setSelectedTab(newValue)
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
      onClick: () => console.log('animals')
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
      onClick: () => console.log('enclosures')
    }
  ]

  const handleHousingClick = () => {
    router.back()
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  return (
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
        description={data?.data?.incharges?.[0]?.full_name}
        userName={data?.data?.incharges?.[0]?.role_name}
        userImage={data?.data?.incharges?.[0]?.user_profile_pic}
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
          <SelectedComponent />
        </Box>
      </Card>
    </Box>
  )
}

export default SiteDetails
