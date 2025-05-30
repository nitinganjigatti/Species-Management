import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import ClusterSites from 'src/components/housing/clusters/ClusterSites'
import ClusterSpecies from 'src/components/housing/clusters/ClusterSpecies'
import { getSpecificClusterAnalytics } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

const tabConfig = [
  { label: 'Sites', value: 'sites', component: ClusterSites },
  { label: 'Species', value: 'species', component: ClusterSpecies },
  //  { label: 'Incharges', value: 'Incharges', component: ClusterIncharges }
]

const ClusterDetails = () => {
  const router = useRouter()
  const { id } = router.query

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)

  const { data, isLoading, error } = useQuery({
    queryKey: ['cluster-detail-stats', id],
    queryFn: () =>
      getSpecificClusterAnalytics({
        cluster_id: id
      }),
    enabled: !!id
  })

  console.log('Cluster Details Data:', data)

  const handleTabChange = (event, newValue) => {
    // Find reset action for previous tab
    // const prevTab = tabConfig.find(tab => tab.value === selectedTab)
    // if (prevTab?.resetAction) {
    //   dispatch(prevTab.resetAction())
    // }

    setSelectedTab(newValue)
  }

  const handleHousingClick = () => {
    router.push('/housing/cluster')
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
          Cluster
        </Typography>
        <Typography color='text.primary'>Cluster Details</Typography>
      </Breadcrumbs>
      <InsightsCard
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
          <SelectedComponent />
        </Box>
      </Card>
    </Box>
  )
}

export default ClusterDetails
