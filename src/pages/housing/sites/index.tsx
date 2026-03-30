import { Box, Breadcrumbs, Card, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import SiteListing from 'src/components/housing/sites/SiteListing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import { getSiteAnalytics } from 'src/lib/api/housing'
import { useQuery } from '@tanstack/react-query'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import type { DrawerType, DrawerData } from 'src/types/housing'

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

const Sites: React.FC = () => {
  const router = useRouter()

  const [drawerType, setDrawerType] = useState<DrawerType>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [siteDrawer, setSiteDrawer] = useState<boolean>(false)

  const authData = useAuth()
  const insightsViewAccess = (authData as any)?.userData?.roles?.settings?.housing_view_insights
  const addSiteAccess = (authData as any)?.userData?.permission?.user_settings?.add_sites

  const handleEnclosureInsightClick = (): void => {
    setDrawerType('enclosures')
    setDrawerData({
      queryKey: 'insights-enclosures-sites-drawer',
      id: zooId,
      name: '',
      params: {
        ref_type: 'zoo',
        data_type: 'enclosure',
        ref_id: zooId
      }
    })
  }

  const handleAnimalInsightClick = (): void => {
    setDrawerType('insights-animals')
    setDrawerData({
      queryKey: 'insights-animals-sites-drawer',
      id: zooId,
      name: '',
      params: {
        ref_type: 'zoo',
        data_type: 'animal',
        ref_id: zooId
      }
    })
  }

  const auth = useAuth()
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-insights', zooId],
    queryFn: () => getSiteAnalytics(zooId),
    enabled: !!zooId
  })

  const handleHousingClick = (): void => {
    // router.push('/housing')
  }

  const handleButtonClick = (): void => {
    setSiteDrawer(true)
  }

  const statsData: StatItem[] = [
    {
      label: 'Species',
      value: data?.data?.zoo_stats?.total_species || 0,
      imagePath: '/images/housing/species.svg'
    },
    {
      label: 'Animals',
      value: data?.data?.zoo_stats?.total_animals || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAnimalInsightClick
    },
    {
      label: 'Sections',
      value: data?.data?.zoo_stats?.total_sections || 0,
      imagePath: '/images/housing/sections.svg'
    },
    {
      label: 'Enclosures',
      value: data?.data?.zoo_stats?.total_enclosures || 0,
      imagePath: '/images/housing/enclosures.svg',
      onClick: handleEnclosureInsightClick
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
          image={data?.data?.images?.[0]?.file}
          loading={isLoading}
          pageTitle={'All Site Insights'}
          isListingPage
          error={error as any}
          haveInsightsViewAccess={insightsViewAccess}
          statsData={statsData as any}
          zooName=""
          subtitle=""
          userName=""
          description=""
          userImage=""
          onCallClick={() => {}}
          onMessageClick={() => {}}
          actions={{
            onAddNew: addSiteAccess ? handleButtonClick : null
          }}
        />
        <Box sx={{ mt: 6 }}>
          <Card sx={{ p: { xs: 3, md: 5 } }}>
            <SiteListing
              drawerType={drawerType}
              setDrawerType={setDrawerType}
              drawerData={drawerData}
              setDrawerData={setDrawerData}
              siteDrawer={siteDrawer}
              setSiteDrawer={setSiteDrawer}
              totalAnimalsCount={data?.data?.zoo_stats?.total_animals || 0}
            />
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default enforceModuleAccess(Sites, 'enable_housing_in_web')
