import { Box, Breadcrumbs, Typography, Tabs, Tab, Card } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

// Listing Components
import SpeciesListing from 'src/components/housing/sites/speciesListing'
import MortalityListing from 'src/components/housing/sites/mortalityListing'
import AnimalTreatmentListing from 'src/components/housing/sites/AnimalTreatmentListing'
import MediaListing from 'src/components/housing/sites/MediaListing'

import { useQuery } from '@tanstack/react-query'
import { getSpecificSiteAnalytics } from 'src/lib/api/housing'

const tabConfig = [
  { label: 'Species', value: 'species', component: SpeciesListing }, // TODO: Update component as it is copied from site detail
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
    setSelectedTab(newValue)
  }

  const handleHousingClick = () => {
    router.push('/housing/sites', {
        ...router.query,
    })
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
          section
        </Typography>
        <Typography color='text.primary'>Section Details</Typography>
      </Breadcrumbs>

      {/* Insights */}
      <InsightsCard
        data={data?.data}
        loading={isLoading}
        zooName={data?.data?.site_name}
        subtitle={data?.data?.site_description}
        description={data?.data?.incharges[0]?.full_name}
        userName={data?.data?.incharges[0]?.role_name}
        userImage={data?.data?.incharges[0]?.user_profile_pic}

        // actions={{
        //   onEdit: () => console.log('Edit'),
        //   onDelete: () => console.log('Delete'),
        //   onAddNew: () => console.log('Add new'),
        //   onTimeClick: () => console.log('Time clicked')
        // }}
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
        speciesCount={data?.data?.species_count || 0}
        animalCount={data?.data?.animal_count || 0}
        enclosuresCount={data?.data?.enclosure_count || 0}
        sectionsCount={data?.data?.section_count || 0}
        onInfoClick={{
          species: () => setSelectedTab('species'),
          animal: () => console.log('animal'),
          enclosures: () => console.log('enclosures'),
          sections: () => setSelectedTab('sections')
        }}
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

export default SectionDetails
