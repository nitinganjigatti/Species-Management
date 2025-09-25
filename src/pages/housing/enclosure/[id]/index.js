import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import EnclosureWiseEnclosure from 'src/components/housing/enclosure/EnclosureWiseEnclosure'
import EnclosureWiseSpecies from 'src/components/housing/enclosure/EnclosureWiseSpecies'
import MediaListing from 'src/components/housing/enclosure/MediaListing'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { useAuth } from 'src/hooks/useAuth'
import { getEnclosureWiseStat } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

const EnclsouerDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [drawerType, setDrawerType] = useState(null)
  const [drawerData, setDrawerData] = useState(null)

  const auth = useAuth()
  const insightsViewAccess = auth?.userData?.roles?.settings?.housing_view_insights

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-detail', id],
    queryFn: () =>
      getEnclosureWiseStat({
        enclosure_id: id
      }),
    enabled: !!id
  })

  const tabConfig = [
    { label: 'Species', value: 'species', component: EnclosureWiseSpecies },
    { label: 'Media', value: 'media', component: MediaListing }
  ]

  if (data?.data?.total_sub_enclosure_count > 0) {
    tabConfig.push({
      label: 'Enclosures',
      value: 'enclosures',
      component: EnclosureWiseEnclosure
    })
  }

  useEffect(() => {
    if (!tabConfig.some(tab => tab.value === selectedTab)) {
      setSelectedTab(tabConfig[0].value)
    }
  }, [data])

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)

  const statsData = [
    {
      label: 'Species',
      value: data?.data?.total_species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: 'Animals',
      value: data?.data?.total_occupants || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: () => console.log('Animals')
    }
  ]

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const handleEnclosureListingClick = () => {
    router.back()
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  useEffect(() => {
    // Updating URL with tab parameter when tab changes
    router.push(
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
      setSelectedTab(router.query.tab)
    }
  }, [router.query.tab])

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={() => router.back()}>
            Enclosures
          </Typography>
          <Typography color='text.primary'>Enclosure Details</Typography>
        </Breadcrumbs>
        <InsightsCard
          data={data?.data}
          loading={isLoading}
          image={data?.data?.images?.[0]?.file}
          statsData={statsData}
          error={error}
          zooName={data?.data?.user_enclosure_name}
          subtitle={data?.data?.enclosure_desc}
          userName={data?.data?.incharge_name}
          haveInsightsViewAccess={insightsViewAccess}
          onCallClick={() => {
            const phoneNumber = data?.data?.incharge_phone_no || '' // Adjust path as needed
            if (phoneNumber) {
              // window.location.href = `tel:${phoneNumber}`
            } else {
              return
            }
          }}
        />
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
            />
          </Box>
        </Card>
      </Box>
    </>
  )
}

export default enforceModuleAccess(EnclsouerDetails, 'enable_housing_in_web')
