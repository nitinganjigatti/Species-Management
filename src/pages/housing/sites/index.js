import { Box, Breadcrumbs, Card, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import SiteListing from 'src/components/housing/sites/SiteListing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import { getSiteAnalytics } from 'src/lib/api/housing'
import { useQuery } from '@tanstack/react-query'
import { on } from 'geolocation'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { AuthContext } from 'src/context/AuthContext'

const Sites = () => {
  const router = useRouter()

  const [drawerType, setDrawerType] = useState(null)
  const [drawerData, setDrawerData] = useState(null)
  const [siteDrawer, setSiteDrawer] = useState(false)

  const authData = useAuth()
  const insightsViewAccess = authData?.userData?.roles?.settings?.housing_view_insights
  const addSiteAccess = authData?.userData?.permission?.user_settings?.add_sites

  const handleEnclosureInsightClick = () => {
    setDrawerType('enclosures')
    setDrawerData({
      queryKey: 'insights-enclosures-sites-drawer',

      id: zooId,

      // name: params.row?.site_name,
      // image: params.row?.images?.[0]?.file,
      params: {
        ref_type: 'zoo',
        data_type: 'enclosure',
        ref_id: zooId

        // site_id: params.row?.site_id
      }
    })
  }

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

  const handleButtonClick = () => {
    setSiteDrawer(true)
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
          loading={isLoading}
          pageTitle={'All Site Insights'}
          isListingPage
          error={error}
          isAllSites
          haveInsightsViewAccess={insightsViewAccess}
          statsData={statsData}
          actions={{
            onAddNew: addSiteAccess ? handleButtonClick : null
          }}

          // onAddNewClick={handleButtonClick}
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
            />
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default enforceModuleAccess(Sites, 'enable_housing_in_web')
