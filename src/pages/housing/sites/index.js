import { Box, Breadcrumbs, Card, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import SiteListing from 'src/components/housing/SiteListing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import { getSiteAnalytics } from 'src/lib/api/housing'
import { useQuery } from '@tanstack/react-query'

const Sites = () => {
  const router = useRouter()

  const auth = useAuth()
  const zooId = auth?.userData?.user?.zoos[0]?.zoo_id

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-insights', zooId],
    queryFn: () => getSiteAnalytics(zooId),
    enabled: !!zooId
  })

  const handleHousingClick = () => {
    // router.push('/housing')
  }

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
          onInfoClick={{
            species: () => console.log('Species clicked'), 
            animals: () => console.log('Animals clicked'),
            sections: () => console.log('Sections clicked'),
            enclosures: () => console.log('Enclosures clicked')
          }}
        /> */}
        <InsightsCard
          data={data?.data}
          loading={isLoading}
          pageTitle={'All Site Insights'}
          isListingPage
          error={error}
          isAllSites
          sectionsCount={data?.data?.zoo_stats?.total_sections}
          animalCount={data?.data?.zoo_stats?.total_animals}
          speciesCount={data?.data?.zoo_stats?.total_species}
          enclosuresCount={data?.data?.zoo_stats?.total_enclosures}
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
