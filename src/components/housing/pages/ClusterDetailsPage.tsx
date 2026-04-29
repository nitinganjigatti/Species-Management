'use client'

import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClusterSites from 'src/components/housing/clusters/ClusterSites'
import ClusterSpecies from 'src/components/housing/clusters/ClusterSpecies'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import { useAuth } from 'src/hooks/useAuth'
import { getSpecificClusterAnalytics } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import AddCluster from 'src/views/pages/housing/AddCluster/AddCluster'
import { useRouter } from 'next/navigation'
import useTabSync from 'src/hooks/useTabSync'

interface ClusterDetailsPageProps {
  id: string
}

interface TabConfigItem {
  labelKey: string
  value: string
  component: React.ComponentType<any>
}

interface DrawerData {
  queryKey: string
  id: string | undefined
  name?: string
  params: {
    cluster_id?: string | undefined
  }
}

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

const tabConfig: TabConfigItem[] = [
  { labelKey: 'housing_module.sites', value: 'sites', component: ClusterSites },
  { labelKey: 'species', value: 'species', component: ClusterSpecies },
  { labelKey: 'housing_module.incharges', value: 'incharges', component: InchargeListing }
]

const ClusterDetailsPage: React.FC<ClusterDetailsPageProps> = ({ id }) => {
  const { t } = useTranslation()
  const router = useRouter()

  const auth = useAuth()

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  const manageClusterPermissionValue =
    (auth as any)?.userData?.permission?.user_settings?.manage_cluster_permission ||
    (auth as any)?.userData?.roles?.settings?.manage_cluster_permission

  const canEditCluster = manageClusterPermissionValue === 'EDIT' || manageClusterPermissionValue === 'DELETE'
  const canDeleteCluster = manageClusterPermissionValue === 'DELETE'

  const [selectedTab, setSelectedTab] = useTabSync(tabConfig[0].value)
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
    setSelectedTab(newValue)
  }

  const handleAmimalsInsightClick = (): void => {
    setDrawerType('animals-insights')
    setDrawerData({
      queryKey: 'insights-animals-cluster-details-drawer',
      id: zooId,

      name: data?.data?.cluster_name,

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
      label: t('species'),
      value: clusterStats?.species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: t('animals'),
      value: clusterStats?.animals || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAmimalsInsightClick
    },
    {
      label: t('housing_module.sites'),
      value: clusterStats?.sites || 0,
      imagePath: '/images/housing/Site.svg',
      onClick: () => setSelectedTab('sites')
    }
  ]

  const handleHousingClick = (): void => {
    router.back()
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>{t('no_component_found')}</Box>)

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
            {t('housing_module.cluster')}
          </Typography>
          <Typography color='text.primary'>{t('housing_module.cluster_details')}</Typography>
        </Breadcrumbs>
        <InsightsCard
          data={data?.data as any}
          loading={isLoading}
          zooName={(data?.data as any)?.cluster_name}
          image={(data?.data as any)?.images?.[0]?.file}
          userName={(data?.data as any)?.cluster_incharge}
          userImage={(data?.data as any)?.incharge_image}
          pageTitle={t('housing_module.cluster_details')}
          subtitle=''
          description=''
          error={error}
          haveInsightsViewAccess={insightsViewAccess}
          actions={{
            onEdit: canEditCluster ? () => setShowEditClusterDrawer(true) : null
          }}
          editTooltip={t('housing_module.edit_cluster') as string}
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
                <Tab key={tab.value} label={t(tab.labelKey)} value={tab.value} />
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

export default ClusterDetailsPage
