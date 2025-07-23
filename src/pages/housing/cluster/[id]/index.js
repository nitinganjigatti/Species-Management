import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import ClusterSites from 'src/components/housing/clusters/ClusterSites'
import ClusterSpecies from 'src/components/housing/clusters/ClusterSpecies'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import { useAuth } from 'src/hooks/useAuth'
import { getSpecificClusterAnalytics } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

const tabConfig = [
  { label: 'Sites', value: 'sites', component: ClusterSites },
  { label: 'Species', value: 'species', component: ClusterSpecies }

  //  { label: 'Incharges', value: 'Incharges', component: ClusterIncharges }
]

const ClusterDetails = () => {
  const router = useRouter()
  const { id } = router.query

  const auth = useAuth()

  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)
  const [drawerType, setDrawerType] = useState(null)
  const [drawerData, setDrawerData] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['cluster-detail-stats', id],
    queryFn: () =>
      getSpecificClusterAnalytics({
        cluster_id: id
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

  const handleAmimalsInsightClick = () => {
    setDrawerType('animals')
    setDrawerData({
      queryKey: 'insights-animals-cluster-details-drawer',
      id: zooId,

      name: data?.data?.cluster_name,

      // image: params.row?.images?.[0]?.file,
      params: {
        cluster_id: id
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
      value: data?.data?.cluster_stats?.species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: 'Animals',
      value: data?.data?.cluster_stats?.animals || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAmimalsInsightClick
    },
    {
      label: 'Sites',
      value: data?.data?.cluster_stats?.sites || 0,
      imagePath: '/images/housing/Site.svg',
      onClick: () => setSelectedTab('sites')
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
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
            Cluster
          </Typography>
          <Typography color='text.primary'>Cluster Details</Typography>
        </Breadcrumbs>
        {/* <InsightsCard
        data={data?.data}
        loading={isLoading}
        zooName={data?.data?.cluster_name}
        userName={data?.data?.cluster_incharge}
        // image={data?.data?.images[0]?.file && data?.data?.images[0]?.file}
        error={error}
        speciesCount={data?.data?.cluster_stats?.species}
        animalCount={data?.data?.cluster_stats?.animals}
        onCallClick={() => {
          const phoneNumber = data?.data?.incharge_mobile_no || ''
          if (phoneNumber) {
            // window.location.href = `tel:${phoneNumber}`
          } else {
            return
          }
        }}
        onInfoClick={{
          species: () => setSelectedTab('species'),
          sites: () => console.log('sites'),
          sections: () => console.log('sections')
        }}
      /> */}
        <InsightsCard
          data={data?.data}
          loading={isLoading}
          zooName={data?.data?.cluster_name}
          userName={data?.data?.cluster_incharge}
          error={error}
          onCallClick={() => {
            const phoneNumber = data?.data?.incharge_mobile_no || ''
            if (phoneNumber) {
              // window.location.href = `tel:${phoneNumber}`
            } else {
              return
            }
          }}
          statsData={statsData}
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
      {drawerType === 'animals' && <AnimalDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
    </>
  )
}

export default ClusterDetails
