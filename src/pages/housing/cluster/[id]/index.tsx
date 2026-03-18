import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import ClusterSites from 'src/components/housing/clusters/ClusterSites'
import ClusterSpecies from 'src/components/housing/clusters/ClusterSpecies'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { useAuth } from 'src/hooks/useAuth'
import { getSpecificClusterAnalytics } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import AddCluster from 'src/views/pages/housing/AddCluster/AddCluster'

interface TabConfigItem {
  label: string
  value: string
  component: React.ComponentType<any>
}

interface DrawerData {
  queryKey: string
  id: string | undefined
  name?: string
  params: {
    cluster_id?: string | string[] | undefined
  }
}

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

const tabConfig: TabConfigItem[] = [
  { label: 'Sites', value: 'sites', component: ClusterSites },
  { label: 'Species', value: 'species', component: ClusterSpecies },
  { label: 'Incharges', value: 'incharges', component: InchargeListing }
]

const ClusterDetails: React.FC = () => {
  const router = useRouter()
  const { id } = router.query as { id?: string }

  const auth = useAuth()

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  // Permission check for edit/delete cluster - matches mobile: manage_cluster_permission
  // Mobile uses hierarchical permission values: "VIEW", "ADD", "EDIT", "DELETE"
  // - EDIT action requires permission value "EDIT" or "DELETE"
  // - DELETE action requires permission value "DELETE"
  const manageClusterPermissionValue =
    (auth as any)?.userData?.permission?.user_settings?.manage_cluster_permission ||
    (auth as any)?.userData?.roles?.settings?.manage_cluster_permission

  // Check if user can edit (permission is "EDIT" or "DELETE")
  const canEditCluster = manageClusterPermissionValue === 'EDIT' || manageClusterPermissionValue === 'DELETE'
  // Check if user can delete (permission is "DELETE")
  const canDeleteCluster = manageClusterPermissionValue === 'DELETE'

  const [selectedTab, setSelectedTab] = useState<string>(tabConfig[0].value)
  const [drawerType, setDrawerType] = useState<string | null>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [showEditClusterDrawer, setShowEditClusterDrawer] = useState<boolean>(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cluster-detail-stats', id],
    queryFn: () =>
      getSpecificClusterAnalytics({
        cluster_id: Number(id)
      }),
    enabled: !!id
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    // Find reset action for previous tab
    // const prevTab = tabConfig.find(tab => tab.value === selectedTab)
    // if (prevTab?.resetAction) {
    //   dispatch(prevTab.resetAction())
    // }

    setSelectedTab(newValue)
  }

  const handleAmimalsInsightClick = (): void => {
    setDrawerType('animals-insights')
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

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const clusterStats = (data?.data as any)?.cluster_stats

  const statsData: StatItem[] = [
    {
      label: 'Species',
      value: clusterStats?.species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: 'Animals',
      value: clusterStats?.animals || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAmimalsInsightClick
    },
    {
      label: 'Sites',
      value: clusterStats?.sites || 0,
      imagePath: '/images/housing/Site.svg',
      onClick: () => setSelectedTab('sites')
    }
  ]

  const handleHousingClick = (): void => {
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
      setSelectedTab(router.query.tab as string)
    }
  }, [router.query.tab])

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
          data={data?.data as any}
          loading={isLoading}
          zooName={(data?.data as any)?.cluster_name}
          image={(data?.data as any)?.images?.[0]?.file}
          userName={(data?.data as any)?.cluster_incharge}
          userImage={(data?.data as any)?.incharge_image}
          pageTitle='Cluster Details'
          subtitle=''
          description=''
          error={error}
          haveInsightsViewAccess={insightsViewAccess}
          actions={{
            onEdit: canEditCluster ? () => setShowEditClusterDrawer(true) : null
          }}
          editTooltip='Edit cluster'
          onCallClick={() => {
            const phoneNumber = (data?.data as any)?.incharge_mobile_no || ''
            if (phoneNumber) {
              window.location.href = `tel:${phoneNumber}`
            } else {
              return
            }
          }}
          onMessageClick={() => {
            const phoneNumber = (data?.data as any)?.incharge_mobile_no || ''
            if (phoneNumber) {
              window.open(`sms:${phoneNumber}`)
            } else return
          }}
          statsData={statsData as any}
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
              refType='cluster'
              onSiteAdded={refetch}
            />
          </Box>
        </Card>
      </Box>
      {drawerType === 'animals-insights' && (
        <AnimalDrawer
          totalCount={clusterStats?.animals}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData as any}
          defaultImage={'/images/housing/cluster-icon-colored.svg'}
        />
      )}
      {showEditClusterDrawer && (
        <AddCluster
          open={showEditClusterDrawer}
          setShowDrawer={setShowEditClusterDrawer}
          refetchCluster={refetch}
          clusterData={{
            cluster_id: Number(id),
            cluster_name: (data?.data as any)?.cluster_name,
            cluster_desc: (data?.data as any)?.cluster_desc,
            images: (data?.data as any)?.images
          }}
          canDelete={canDeleteCluster}
        />
      )}
    </>
  )
}

export default enforceModuleAccess(ClusterDetails, 'enable_housing_in_web')
