import { Box, Breadcrumbs, Card, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'
import { useAuth } from 'src/hooks/useAuth'
import SiteListing from 'src/components/housing/sites/SiteListing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import { getSiteAnalytics } from 'src/lib/api/housing'
import { useQuery } from '@tanstack/react-query'

const Sites = () => {
  const router = useRouter()

  const auth = useAuth()
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-insights', zooId],
    queryFn: () => getSiteAnalytics(zooId),
    enabled: !!zooId
  })

  const handleHousingClick = () => {
    // router.push('/housing')
  }

  const statsData = [
    {
      label: 'Species',
      value: data?.data?.zoo_stats?.total_species || 0,
      imagePath: '/images/housing/species.svg'
    },
    {
      label: 'Animals',
      value: data?.data?.zoo_stats?.total_animals || 0,
      imagePath: '/images/housing/animals.svg'
    },
    {
      label: 'Sections',
      value: data?.data?.zoo_stats?.total_sections || 0,
      imagePath: '/images/housing/sections.svg'
    },
    {
      label: 'Enclosures',
      value: data?.data?.zoo_stats?.total_enclosures || 0,
      imagePath: '/images/housing/enclosures.svg'
    }
  ]

  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
          Housing
        </Typography>

        <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
          Site List
        </Typography>
      </Breadcrumbs>
      <Box>
        {/* For testing with all the data */}

        {/* <InsightsCard
          data={data}
          loading={loading}
          error={error}
          zooName='Bannerghatta Zoo'
          subtitle='Bannerghatta Zoo'
          userName='Jordan Stevenson'
          description={'Description'}
          userImage={''}
          sectionsCount={data?.zoo_stats?.total_sections}
          animalCount={data?.zoo_stats?.total_animals}
          speciesCount={data?.zoo_stats?.total_species}
          enclosuresCount={data?.zoo_stats?.total_enclosures}
          actions={{
            onEdit: () => console.log('Edit'),
            onDelete: () => console.log('Delete'),
            onAddNew: () => console.log('Add new'),
            onTimeClick: () => console.log('Time clicked')
          }}
          onCallClick={() => console.log('Call clicked')}
          onMessageClick={() => console.log('Message clicked')}
          statasData={statsData}
        /> */}
        <InsightsCard
          data={data?.data}
          loading={isLoading}
          pageTitle={'All Site Insights'}
          isListingPage
          error={error}
          isAllSites
          statsData={statsData}
        />
        <Box sx={{ mt: 6 }}>
          <Card sx={{ p: { xs: 3, md: 5 } }}>
            <SiteListing />
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default React.memo(Sites)
